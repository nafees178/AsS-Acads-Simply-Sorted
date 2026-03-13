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

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

import sys
from pathlib import Path

# Need to be able to import config from the parent app folder
APP_DIR = Path(__file__).resolve().parent.parent
if str(APP_DIR) not in sys.path:
    sys.path.append(str(APP_DIR))
    
import config

# ── Router Setup ──────────────────────────────────────────────────────────
router = APIRouter()

# ── Database Setup ────────────────────────────────────────────────────────
from database import get_vector_db
import asyncio

async def _get_db():
    return await get_vector_db()

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
    document_ids: list[str] | None = []
    user_id: str | None = None


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
def _run_generation(job_id: str, topic: str, user_id: str = None, document_ids: list[str] = None):
    """Run the full video generation pipeline in the background and persist to DB."""
    
    # helper to save job state to DB
    def save_state(job_data):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        db = loop.run_until_complete(get_vector_db())
        loop.run_until_complete(db.save_video_job(job_data))
        loop.close()

    job = {
        "job_id": job_id,
        "user_id": user_id,
        "topic": topic,
        "status": "queued",
        "progress": "Initializing generation...",
        "created_at": datetime.utcnow().isoformat(),
        "scenes": None,
        "output_dir": None,
        "final_video": None,
        "error": None
    }
    save_state(job)

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
            _detect_composition_ids,
        )
        from tts_generator import generate_scene_narrations

        system_prompt = _get_system_prompt()
        client = GeminiClient()
        agent = VideoAgent(system_prompt=system_prompt, client=client)

        # Step -1: If topic is empty, generate one from selected documents
        if not topic.strip() and document_ids and user_id:
            job["progress"] = "Analyzing selected materials to generate a topic..."
            save_state(job)
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                db = loop.run_until_complete(get_vector_db())
                # Get document summaries from database
                doc_summaries = []
                for doc_id in document_ids[:5]:  # Cap at 5 docs
                    doc_info = loop.run_until_complete(db.get_document_info(doc_id))
                    if doc_info and doc_info.get("summary"):
                        doc_summaries.append(f"[{doc_info['filename']}]: {doc_info['summary']}")
                loop.close()

                if doc_summaries:
                    combined = "\n\n".join(doc_summaries)
                    # Use the combined summaries as the topic for scene planning
                    topic = combined[:5000]  # Use as rich context
                    job["progress"] = "Topic generated from materials. Continuing..."
                else:
                    topic = "Educational Overview"
                    job["progress"] = "No summaries found. Using generic topic."
                save_state(job)
            except Exception as e:
                print(f"Failed to generate topic from materials: {e}")
                topic = "Educational Overview"

        # Step 0: Summarize long text into a short title
        if len(topic) > 50:
            job["progress"] = "Summarizing input text into a title..."
            save_state(job)
            try:
                summary_prompt = "Generate a descriptive, engaging title (8-12 words) for an educational video about the following text. The title should clearly convey the subject matter. Respond ONLY with the title without any quotes or markdown.\n\nText:\n" + topic[:5000]
                short_title = client.generate(
                    system_prompt="You are a helpful assistant that creates descriptive video titles. Always respond with 8-12 words.",
                    user_prompt=summary_prompt,
                    temperature=0.7,
                    max_tokens=50,
                ).strip()
                short_title = short_title.strip('"\'')
                if short_title:
                    job["topic"] = short_title
                    save_state(job)
            except Exception as e:
                print(f"Failed to summarize topic: {e}")

        # Step 1: Plan scenes
        job["status"] = "planning"
        job["progress"] = "Planning scenes with context..."
        save_state(job)

        # Retrieve context if documents are selected
        context = ""
        if document_ids and user_id:
            try:
                from document_processor import DocumentProcessor
                doc_processor = DocumentProcessor()
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                embedding = loop.run_until_complete(doc_processor.get_embedding_async(topic))
                db = loop.run_until_complete(get_vector_db())
                search_results = loop.run_until_complete(db.search_similar(user_id, embedding.tolist(), top_k=10))
                # Filter by document_ids
                valid_results = [r for r in search_results if r['document_id'] in document_ids]
                if valid_results:
                    context = "\n\n".join([f"[{r['filename']}]: {r['content']}" for r in valid_results])
                    job["progress"] = "Context retrieved. Planning scenes..."
                else:
                    job["progress"] = "No matching context found. Using generic planning..."
                save_state(job)
                loop.close()
            except Exception as e:
                print(f"Context retrieval failed: {e}")

        result = agent.generate_video(topic, context=context)

        job["scenes"] = [
            {"index": s["index"], "title": s["title"], "engine": s["engine"]}
            for s in result["scenes"]
        ]
        job["progress"] = f"Planned {len(result['scenes'])} scenes"
        save_state(job)

        # Step 2: Save files
        job["status"] = "generating"
        job["progress"] = "Saving generated code..."
        output_dir = create_output_dir(job["topic"])
        job["output_dir"] = str(output_dir.resolve())
        save_state(job)

        save_scene_plan(output_dir, result["scene_plan"])
        if result["manim_code"]:
            save_manim_code(output_dir, result["manim_code"])
        if result["root_tsx"] and result["comp_tsx"]:
            save_remotion_files(output_dir, result["root_tsx"], result["comp_tsx"])

        # Step 3: Render clips
        job["status"] = "rendering"
        job["progress"] = "Rendering scene clips..."
        save_state(job)
        rendered_clips = {}

        if result["manim_scenes"]:
            job["progress"] = f"Rendering {len(result['manim_scenes'])} Manim scenes..."
            save_state(job)
            manim_clips, failed_manim = render_manim_scenes(
                output_dir, result["manim_scenes"],
            )
            rendered_clips.update(manim_clips)

            # Fallback: generate & render Remotion for any failed Manim scenes
            if failed_manim:
                job["progress"] = f"{len(failed_manim)} Manim scene(s) failed — falling back to Remotion..."
                save_state(job)
                for failed_scene, error_text in failed_manim:
                    try:
                        fallback = agent.generate_remotion_fallback(
                            result["scene_plan"], failed_scene, error_text
                        )
                        if fallback:
                            root_tsx, comp_tsx = fallback
                            save_remotion_files(output_dir, root_tsx, comp_tsx)

                            # Detect actual composition IDs from the newly written Root.tsx
                            remotion_src = output_dir / "remotion"
                            root_file = remotion_src / "Root.tsx"
                            if root_file.exists():
                                actual_ids = _detect_composition_ids(root_file)
                                if actual_ids:
                                    # Use the first available composition ID for this fallback
                                    failed_scene["comp_id"] = actual_ids[0]
                                    print(f"      Using detected composition ID: {actual_ids[0]}")

                            fallback_clip = render_remotion_scenes(
                                output_dir, [failed_scene]
                            )
                            rendered_clips.update(fallback_clip)
                            failed_scene["engine"] = "REMOTION"
                    except Exception as e:
                        print(f"Scene {failed_scene['index']} Remotion fallback failed: {e}")

        if result["remotion_scenes"]:
            job["progress"] = f"Rendering {len(result['remotion_scenes'])} Remotion scenes..."
            save_state(job)
            remotion_clips = render_remotion_scenes(
                output_dir, result["remotion_scenes"],
            )
            rendered_clips.update(remotion_clips)

        job["progress"] = f"Rendered {len(rendered_clips)}/{len(result['scenes'])} clips"
        save_state(job)

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
            save_state(job)
            try:
                narration_audio = generate_scene_narrations(
                    result["scenes"], narration_scripts, output_dir
                )
            except Exception as e:
                print(f"TTS generation failed: {e}")
                pass

        # Step 5: Merge
        job["status"] = "merging"
        job["progress"] = "Merging clips into final video..."
        save_state(job)
        final_video = merge_clips(output_dir, result["scenes"], rendered_clips, narration_audio)

        # Done
        job["status"] = "complete"
        if final_video and final_video.exists():
            job["final_video"] = str(final_video.resolve())
            size_mb = final_video.stat().st_size / (1024 * 1024)
            job["progress"] = f"Complete! Final video: {size_mb:.1f} MB"
        else:
            job["progress"] = f"Complete with {len(rendered_clips)} clips (merge may have failed)"
        save_state(job)

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["progress"] = f"Failed: {e}"
        save_state(job)
        traceback.print_exc()


# ── API Routes ─────────────────────────────────────────────────────────

@router.get("/")
async def root():
    """Health check."""
    db = await _get_db()
    all_jobs = await db.list_video_jobs()
    active_jobs = [j for j in all_jobs if j["status"] not in ("complete", "failed")]
    
    return {
        "service": "Hybrid Video Generator",
        "status": "running",
        "version": "1.0.0",
        "active_jobs": len(active_jobs),
    }


@router.post("/generate", response_model=JobStatus)
async def generate_video(request: GenerateRequest, background_tasks: BackgroundTasks):
    """
    Start a video generation job.
    """
    job_id = str(uuid.uuid4())
    
    # Trigger background task
    background_tasks.add_task(_run_generation, job_id, request.topic, request.user_id, request.document_ids)

    return JobStatus(
        job_id=job_id,
        topic=request.topic,
        status="queued",
        progress="Added to queue...",
        created_at=datetime.utcnow().isoformat()
    )


@router.get("/status/{job_id}", response_model=JobStatus)
async def get_status(job_id: str):
    """Check the status of a generation job."""
    db = await _get_db()
    job = await db.get_video_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

    # Adapt DB row to JobStatus model
    return JobStatus(**job)


@router.get("/jobs", response_model=list[JobStatus])
async def list_jobs(user_id: str = None):
    """List all video generation jobs."""
    db = await _get_db()
    jobs_list = await db.list_video_jobs(user_id)
    return [JobStatus(**j) for j in jobs_list]


@router.get("/download/{job_id}")
async def download_video(job_id: str):
    """Download the final merged video for a completed job."""
    db = await _get_db()
    job = await db.get_video_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

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


@router.get("/download/{job_id}/{filename}")
async def download_file(job_id: str, filename: str):
    """Download a specific file from a job's output directory."""
    db = await _get_db()
    job = await db.get_video_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

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


@router.get("/files/{job_id}")
async def list_files(job_id: str):
    """List all files in a job's output directory."""
    db = await _get_db()
    job = await db.get_video_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")

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



