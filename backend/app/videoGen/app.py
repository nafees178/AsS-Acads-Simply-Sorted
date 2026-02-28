"""
FastAPI App — REST API for the Hybrid Video Generator.

Routes:
    POST /generate        — Start a video generation job (async)
    GET  /status/{job_id} — Check status of a generation job
    GET  /jobs            — List all jobs
    GET  /download/{job_id} — Download the final video
    GET  /download/{job_id}/{filename} — Download a specific file

Run with:
    python app.py
"""

import uuid
import threading
import traceback
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import sys
from pathlib import Path

# Explicit sys.path injection for standalone execution resilience
APP_DIR = Path(__file__).resolve().parent.parent
if str(APP_DIR) not in sys.path:
    sys.path.append(str(APP_DIR))

import config

# ── App Setup ──────────────────────────────────────────────────────────
app = FastAPI(
    title="Hybrid Video Generator API",
    description="Generate educational videos using Manim + Remotion with AI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paths ──────────────────────────────────────────────────────────────
PROJECT_DIR = config.VIDEO_GEN_DIR
SKILLS_DIR = config.VIDEO_SKILLS_DIR
REMOTION_PROMPT = PROJECT_DIR / "RemotionSystemPrompt.txt"
OUTPUT_DIR = config.VIDEO_OUTPUT_DIR

# ── In-memory job store ────────────────────────────────────────────────
jobs: dict[str, dict] = {}


# ── Request / Response Models ──────────────────────────────────────────
class GenerateRequest(BaseModel):
    topic: str


class JobStatus(BaseModel):
    job_id: str
    topic: str
    status: str          # "queued", "planning", "generating", "rendering", "tts", "merging", "complete", "failed"
    progress: str        # Human-readable progress message
    created_at: str
    scenes: list[dict] | None = None
    output_dir: str | None = None
    final_video: str | None = None
    error: str | None = None


# ── Lazy-loaded resources ──────────────────────────────────────────────
_system_prompt: str | None = None
_lock = threading.Lock()


def _get_system_prompt() -> str:
    """Load and cache the system prompt (only once)."""
    global _system_prompt
    if _system_prompt is None:
        with _lock:
            if _system_prompt is None:
                from knowledge_loader import (
                    load_manim_knowledge,
                    load_remotion_knowledge,
                    build_system_prompt,
                )
                manim_knowledge = load_manim_knowledge(SKILLS_DIR)
                remotion_knowledge = load_remotion_knowledge(REMOTION_PROMPT)
                _system_prompt = build_system_prompt(manim_knowledge, remotion_knowledge)
    return _system_prompt


# ── Background video generation ────────────────────────────────────────
def _run_generation(job_id: str, topic: str):
    """Run the full video generation pipeline in the background."""
    job = jobs[job_id]

    try:
        from grok_client import GeminiClient
        from video_agent import VideoAgent
        from output_manager import (
            create_output_dir,
            save_scene_plan,
            save_manim_code,
            save_remotion_files,
            render_manim_scenes,
            render_remotion_scenes,
            merge_clips,
        )
        from tts_generator import generate_scene_narrations

        system_prompt = _get_system_prompt()
        client = GeminiClient()
        agent = VideoAgent(system_prompt=system_prompt, client=client)

        # Step 0: Summarize long text into a short title
        if len(topic) > 50:
            job["progress"] = "Summarizing input text into a title..."
            try:
                summary_prompt = "Generate a catchy, concise title (maximum 5 words) for a video about the following text. Respond ONLY with the title without any quotes or markdown.\n\nText:\n" + topic[:5000]
                short_title = client.generate(
                    system_prompt="You are a helpful assistant that summarizes text into short titles.",
                    user_prompt=summary_prompt,
                    temperature=0.7,
                    max_tokens=20,
                ).strip()
                # Clean up quotes if the model responded with them
                short_title = short_title.strip('"\'')
                if short_title:
                    job["topic"] = short_title
            except Exception as e:
                print(f"Failed to summarize topic: {e}")
                pass

        # Step 1: Plan scenes
        job["status"] = "planning"
        job["progress"] = "Planning scenes with engine selection..."
        result = agent.generate_video(topic)

        job["scenes"] = [
            {"index": s["index"], "title": s["title"], "engine": s["engine"]}
            for s in result["scenes"]
        ]
        job["progress"] = f"Planned {len(result['scenes'])} scenes"

        # Step 2: Save files
        job["status"] = "generating"
        job["progress"] = "Saving generated code..."
        output_dir = create_output_dir(job["topic"])
        job["output_dir"] = str(output_dir.resolve())

        save_scene_plan(output_dir, result["scene_plan"])
        if result["manim_code"]:
            save_manim_code(output_dir, result["manim_code"])
        if result["root_tsx"] and result["comp_tsx"]:
            save_remotion_files(output_dir, result["root_tsx"], result["comp_tsx"])

        # Step 3: Render clips
        job["status"] = "rendering"
        job["progress"] = "Rendering scene clips..."
        rendered_clips = {}

        if result["manim_scenes"]:
            job["progress"] = f"Rendering {len(result['manim_scenes'])} Manim scenes..."
            manim_clips = render_manim_scenes(
                output_dir, result["manim_scenes"],
                fix_callback=agent.fix_manim_code,
            )
            rendered_clips.update(manim_clips)

        if result["remotion_scenes"]:
            job["progress"] = f"Rendering {len(result['remotion_scenes'])} Remotion scenes..."
            remotion_clips = render_remotion_scenes(
                output_dir, result["remotion_scenes"],
            )
            rendered_clips.update(remotion_clips)

        job["progress"] = f"Rendered {len(rendered_clips)}/{len(result['scenes'])} clips"

        # Step 4: TTS narration
        narration_audio = {}
        narration_scripts = {
            s["index"]: s["narration"]
            for s in result["scenes"]
            if s.get("narration")
        }

        if narration_scripts:
            job["status"] = "tts"
            job["progress"] = f"Generating {len(narration_scripts)} narrations..."
            try:
                narration_audio = generate_scene_narrations(
                    result["scenes"], narration_scripts, output_dir
                )
            except Exception:
                pass  # TTS failure is non-fatal

        # Step 5: Merge
        job["status"] = "merging"
        job["progress"] = "Merging clips into final video..."
        final_video = merge_clips(output_dir, result["scenes"], rendered_clips, narration_audio)

        # Done
        job["status"] = "complete"
        if final_video and final_video.exists():
            job["final_video"] = str(final_video.resolve())
            size_mb = final_video.stat().st_size / (1024 * 1024)
            job["progress"] = f"Complete! Final video: {size_mb:.1f} MB"
        else:
            job["progress"] = f"Complete with {len(rendered_clips)} clips (merge may have failed)"

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["progress"] = f"Failed: {e}"
        traceback.print_exc()


# ── API Routes ─────────────────────────────────────────────────────────

@app.get("/")
async def root():
    """Health check."""
    return {
        "service": "Hybrid Video Generator",
        "status": "running",
        "version": "1.0.0",
        "active_jobs": len([j for j in jobs.values() if j["status"] not in ("complete", "failed")]),
    }


@app.post("/generate", response_model=JobStatus)
async def generate_video(request: GenerateRequest):
    """
    Start a video generation job.

    The generation runs in the background. Use /status/{job_id} to check progress.
    """
    job_id = str(uuid.uuid4())[:8]
    now = datetime.now().isoformat()

    display_topic = request.topic
    if len(display_topic) > 50:
        display_topic = display_topic[:47] + "..."

    job = {
        "job_id": job_id,
        "topic": display_topic,
        "status": "queued",
        "progress": "Job queued, starting soon...",
        "created_at": now,
        "scenes": None,
        "output_dir": None,
        "final_video": None,
        "error": None,
    }
    jobs[job_id] = job

    # Start generation in background thread
    thread = threading.Thread(target=_run_generation, args=(job_id, request.topic), daemon=True)
    thread.start()

    return JobStatus(**job)


@app.get("/status/{job_id}", response_model=JobStatus)
async def get_status(job_id: str):
    """Get the current status of a generation job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return JobStatus(**jobs[job_id])


@app.get("/jobs")
async def list_jobs():
    """List all generation jobs."""
    return [
        {
            "job_id": j["job_id"],
            "topic": j["topic"],
            "status": j["status"],
            "progress": j["progress"],
            "created_at": j["created_at"],
        }
        for j in sorted(jobs.values(), key=lambda x: x["created_at"], reverse=True)
    ]


@app.get("/download/{job_id}")
async def download_video(job_id: str):
    """Download the final merged video for a completed job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

    job = jobs[job_id]
    if job["status"] != "complete":
        raise HTTPException(status_code=400, detail=f"Job not complete (status: {job['status']})")

    if not job["final_video"]:
        raise HTTPException(status_code=404, detail="No final video available")

    video_path = Path(job["final_video"])
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found on disk")

    return FileResponse(
        path=str(video_path),
        media_type="video/mp4",
        filename=f"{job['topic'].replace(' ', '_')}.mp4",
    )


@app.get("/download/{job_id}/{filename}")
async def download_file(job_id: str, filename: str):
    """Download a specific file from a job's output directory."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

    job = jobs[job_id]
    if not job["output_dir"]:
        raise HTTPException(status_code=400, detail="No output directory yet")

    # Search for file in output dir (including subdirectories)
    output_dir = Path(job["output_dir"])
    matches = list(output_dir.rglob(filename))
    if not matches:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found")

    file_path = matches[0]

    # Determine media type
    suffix = file_path.suffix.lower()
    media_types = {
        ".mp4": "video/mp4",
        ".wav": "audio/wav",
        ".py": "text/plain",
        ".tsx": "text/plain",
        ".md": "text/markdown",
        ".txt": "text/plain",
    }

    return FileResponse(
        path=str(file_path),
        media_type=media_types.get(suffix, "application/octet-stream"),
        filename=filename,
    )


@app.get("/files/{job_id}")
async def list_files(job_id: str):
    """List all files in a job's output directory."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

    job = jobs[job_id]
    if not job["output_dir"]:
        raise HTTPException(status_code=400, detail="No output directory yet")

    output_dir = Path(job["output_dir"])
    if not output_dir.exists():
        return {"files": []}

    files = []
    for f in sorted(output_dir.rglob("*")):
        if f.is_file():
            rel_path = f.relative_to(output_dir)
            files.append({
                "path": str(rel_path),
                "size": f.stat().st_size,
                "download_url": f"/download/{job_id}/{f.name}",
            })

    return {"files": files}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_includes=["app.py", "video_agent.py", "output_manager.py",
                         "knowledge_loader.py", "grok_client.py", "tts_generator.py"],
        reload_dirs=["."],
    )
