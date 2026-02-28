import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, Presentation, FileIcon, CheckCircle, Play, Download, Share2, Trash2, Loader2 } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { CourseTag } from '../components/shared/CourseTag';
import { studyMaterials, videoContent } from '../data/mockData';
import { api } from '../services/api';

const fileIcons: Record<string, React.ReactNode> = {
    pdf: <FileText size={20} />, ppt: <Presentation size={20} />, slides: <Presentation size={20} />,
    doc: <FileIcon size={20} />,
};

interface PipelineStep {
    id: number;
    label: string;
    status: 'pending' | 'active' | 'complete';
}

const initialPipelineSteps: PipelineStep[] = [
    { id: 1, label: 'Planning Scenes', status: 'pending' },
    { id: 2, label: 'Generating Animations', status: 'pending' },
    { id: 3, label: 'Adding Voiceover', status: 'pending' },
    { id: 4, label: 'Rendering Details', status: 'pending' },
    { id: 5, label: 'Finalizing', status: 'pending' },
];

const AIStudio: React.FC = () => {
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

    // Video Generation State
    const [topicInput, setTopicInput] = useState('');
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [pipelineSteps, setPipelineSteps] = useState(initialPipelineSteps);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [generatedVideos, setGeneratedVideos] = useState<any[]>(videoContent);

    const toggleMaterial = (id: string) => {
        setSelectedMaterials((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
    };

    const handleGenerate = async () => {
        const topic = topicInput.trim() || 'Software Engineering Architecture';

        try {
            setIsGenerating(true);
            setError(null);

            // Set first step active
            setPipelineSteps(steps => steps.map(s =>
                s.id === 1 ? { ...s, status: 'active' } : { ...s, status: 'pending' }
            ));

            const res = await api.generateVideo(topic);
            setCurrentJobId(res.job_id);

        } catch (err: any) {
            setError(err.message || "Failed to start generation");
            setIsGenerating(false);
            setPipelineSteps(initialPipelineSteps);
        }
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        const pollStatus = async () => {
            if (!currentJobId) return;

            try {
                const status = await api.getVideoStatus(currentJobId);

                // Update Pipeline UI based on the backend progress text
                const progText = status.progress.toLowerCase();

                setPipelineSteps(steps => {
                    const newSteps = [...steps];

                    if (progText.includes('queued') || progText.includes('planning')) {
                        newSteps[0].status = 'active';
                    } else if (progText.includes('generating code') || progText.includes('manim')) {
                        newSteps[0].status = 'complete';
                        newSteps[1].status = 'active';
                    } else if (progText.includes('narration') || progText.includes('tts')) {
                        newSteps[0].status = 'complete';
                        newSteps[1].status = 'complete';
                        newSteps[2].status = 'active';
                    } else if (progText.includes('rendering') || progText.includes('remotion')) {
                        newSteps[0].status = 'complete';
                        newSteps[1].status = 'complete';
                        newSteps[2].status = 'complete';
                        newSteps[3].status = 'active';
                    } else if (progText.includes('merging') || progText.includes('ffmpeg')) {
                        newSteps[0].status = 'complete';
                        newSteps[1].status = 'complete';
                        newSteps[2].status = 'complete';
                        newSteps[3].status = 'complete';
                        newSteps[4].status = 'active';
                    }

                    if (status.status === 'completed') {
                        return newSteps.map(s => ({ ...s, status: 'complete' }));
                    } else if (status.status === 'failed') {
                        // Keep current state but stop polling
                    }

                    return newSteps;
                });

                if (status.status === 'completed') {
                    clearInterval(interval);
                    setIsGenerating(false);
                    setCurrentJobId(null);

                    // Add new video to list
                    setGeneratedVideos(prev => [{
                        id: status.job_id,
                        title: status.topic,
                        sourceMaterial: 'AI Generated',
                        duration: '01:15',
                        createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        thumbnail: '',
                        url: `http://localhost:8000/video/download/${status.job_id}`
                    }, ...prev]);

                } else if (status.status === 'failed') {
                    clearInterval(interval);
                    setError(status.error || 'Generation failed');
                    setIsGenerating(false);
                    setCurrentJobId(null);
                }

            } catch (err) {
                console.error("Failed to poll status", err);
            }
        };

        if (currentJobId) {
            pollStatus(); // Initial check
            interval = setInterval(pollStatus, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [currentJobId]);

    return (
        <div className="space-y-6">
            {/* Hero Header */}
            <Card hover={false} className="text-center py-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo/5 via-teal/5 to-indigo/5 pointer-events-none" />
                <div className="relative">
                    <h2 className="font-[Outfit] text-3xl font-bold text-pure">Transform Your Notes Into Animated Lessons</h2>
                    <p className="text-silver mt-2 max-w-xl mx-auto">AI extracts key concepts from your slides and PDFs, then generates animated content with voiceover</p>

                    <div className="max-w-md mx-auto mt-8 flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-elevated border border-edge rounded-[var(--radius-button)] px-4 py-2 text-sm text-pure focus:outline-none focus:border-indigo"
                            placeholder="Prompt: e.g. Explain Python variables..."
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            disabled={isGenerating}
                        />
                        <Button onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles size={16} />}
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                    </div>
                    {error && <p className="text-sm text-scarlet mt-3">{error}</p>}
                </div>
            </Card>

            {/* Pipeline Visualizer (Only show when generating or recently finished) */}
            {(isGenerating || pipelineSteps.some(s => s.status === 'complete')) && (
                <Card hover={false}>
                    <h3 className="font-[Outfit] text-lg font-semibold text-pure mb-4">Generation Pipeline</h3>
                    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
                        {pipelineSteps.map((step, idx) => (
                            <React.Fragment key={step.id}>
                                <div className="flex flex-col items-center gap-2 flex-1 min-w-[80px]">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold 
                                        ${step.status === 'complete' ? 'bg-emerald/20 text-emerald' :
                                            step.status === 'active' ? 'bg-indigo/20 text-indigo animate-pulse ring-2 ring-indigo/50' :
                                                'bg-elevated text-slate'
                                        }`}>
                                        {step.status === 'complete' ? <CheckCircle size={18} /> : step.id}
                                    </div>
                                    <span className={`text-[10px] text-center whitespace-nowrap ${step.status === 'active' ? 'text-indigo font-medium' : 'text-slate'}`}>
                                        {step.label}
                                    </span>
                                </div>
                                {idx < pipelineSteps.length - 1 && (
                                    <div className={`h-px flex-1 min-w-[30px] ${step.status === 'complete' ? 'bg-emerald' : 'bg-edge'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </Card>
            )}

            {/* Source Material Selector */}
            <div>
                <h3 className="font-[Outfit] text-lg font-semibold text-pure mb-3">Or Select Source Materials to Learn From</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {studyMaterials.map((mat) => (
                        <Card key={mat.id} onClick={() => toggleMaterial(mat.id)} className={`!p-4 ${selectedMaterials.includes(mat.id) ? 'ring-2 ring-indigo' : ''}`}>
                            <div className="flex items-start gap-3">
                                <input type="checkbox" checked={selectedMaterials.includes(mat.id)} readOnly className="mt-1 w-4 h-4 accent-indigo rounded" />
                                <div className="text-teal shrink-0">{fileIcons[mat.type]}</div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-pure truncate">{mat.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <CourseTag name={mat.courseName} color={mat.courseColor} />
                                        <span className="text-xs text-slate">{mat.pages} pages</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Generated Content Library */}
            <div>
                <h3 className="font-[Outfit] text-lg font-semibold text-pure mb-3">Generated Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedVideos.map((video) => (
                        <Card key={video.id} className="!p-0 overflow-hidden">
                            <div className="relative h-40 bg-elevated flex items-center justify-center group overflow-hidden">
                                {video.url ? (
                                    <video
                                        src={video.url}
                                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                                        controls
                                    />
                                ) : (
                                    <>
                                        <div className="w-14 h-14 rounded-full bg-obsidian/80 flex items-center justify-center group-hover:bg-indigo/80 transition-colors cursor-pointer">
                                            <Play size={24} className="text-pure ml-1" />
                                        </div>
                                        <span className="absolute bottom-2 right-2 text-xs font-mono bg-obsidian/80 text-pure px-1.5 py-0.5 rounded">{video.duration}</span>
                                    </>
                                )}
                            </div>
                            <div className="p-4">
                                <p className="text-sm font-medium text-pure truncate" title={video.title}>{video.title}</p>
                                <p className="text-xs text-slate mt-0.5">{video.sourceMaterial} &middot; {video.createdDate}</p>
                                <div className="flex items-center gap-2 mt-3">
                                    {video.url ? (
                                        <a href={video.url} target="_blank" rel="noreferrer" className="flex-1">
                                            <Button size="sm" className="w-full">Open Video</Button>
                                        </a>
                                    ) : (
                                        <Button size="sm"><Play size={12} /> Play</Button>
                                    )}
                                    <button className="p-1.5 rounded-[var(--radius-button)] text-silver hover:text-pure bg-elevated transition-colors"><Download size={14} /></button>
                                    <button className="p-1.5 rounded-[var(--radius-button)] text-silver hover:text-pure bg-elevated transition-colors"><Share2 size={14} /></button>
                                    <button className="p-1.5 rounded-[var(--radius-button)] text-silver hover:text-scarlet bg-elevated transition-colors ml-auto"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AIStudio;
