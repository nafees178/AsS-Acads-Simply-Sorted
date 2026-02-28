import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, Presentation, FileIcon, CheckCircle, Play, Download, Share2, Trash2, Loader2, Upload } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { useAuth } from '../context/AuthContext';
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
    const { userId } = useAuth();
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [isFetchingDocs, setIsFetchingDocs] = useState(false);

    // Video Generation State
    const [topicInput, setTopicInput] = useState(() => {
        return localStorage.getItem('activeVideoTopic') || '';
    });
    const [currentJobId, setCurrentJobId] = useState<string | null>(() => {
        return localStorage.getItem('activeVideoJobId');
    });
    const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(() => {
        const saved = localStorage.getItem('activeVideoSteps');
        return saved ? JSON.parse(saved) : initialPipelineSteps;
    });
    const [isGenerating, setIsGenerating] = useState(!!localStorage.getItem('activeVideoJobId'));
    const [error, setError] = useState<string | null>(null);

    const [generatedVideos, setGeneratedVideos] = useState<any[]>([]);

    const toggleMaterial = (id: string) => {
        setSelectedMaterials((prev) => {
            const isRemoving = prev.includes(id);
            const newSelection = isRemoving ? prev.filter((m) => m !== id) : [...prev, id];

            // Auto-populate topic from selected document summaries
            const selectedDocs = documents.filter(d => newSelection.includes(d.document_id));
            if (selectedDocs.length > 0) {
                const combinedSummary = selectedDocs
                    .map(d => d.summary ? `[${d.filename}]: ${d.summary}` : '')
                    .filter(Boolean)
                    .join('\n\n');
                if (combinedSummary) {
                    setTopicInput(combinedSummary);
                }
            } else {
                // All deselected — clear the auto-populated topic
                setTopicInput('');
            }

            return newSelection;
        });
    };

    useEffect(() => {
        const fetchDocs = async () => {
            if (!userId) return;
            setIsFetchingDocs(true);
            try {
                const res = await api.getDocuments(userId);
                setDocuments(res.documents || []);
            } catch (err) {
                console.error("Failed to fetch docs", err);
            } finally {
                setIsFetchingDocs(false);
            }
        };

        const fetchVideos = async () => {
            if (!userId) return;
            try {
                const jobs = await api.getVideos(userId);
                const videos = jobs
                    .filter((j: any) => j.status === 'complete')
                    .map((j: any) => ({
                        id: j.job_id,
                        title: j.topic,
                        sourceMaterial: 'AI Generated',
                        duration: '01:15',
                        createdDate: new Date(j.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        thumbnail: '',
                        url: `${api.API_BASE_URL}/video/download/${j.job_id}`
                    }));
                setGeneratedVideos(videos);
            } catch (err) {
                console.error("Failed to fetch videos", err);
            }
        };

        fetchDocs();
        fetchVideos();
    }, [userId]);

    const handleGenerate = async () => {
        const topic = topicInput.trim();

        // Require either a topic OR selected materials
        if (!topic && selectedMaterials.length === 0) {
            setError('Please enter a prompt or select source materials.');
            return;
        }

        localStorage.setItem('activeVideoTopic', topic);

        try {
            setIsGenerating(true);
            setError(null);

            // Set first step active
            const startSteps = initialPipelineSteps.map(s =>
                s.id === 1 ? { ...s, status: 'active' as const } : { ...s, status: 'pending' as const }
            );
            setPipelineSteps(startSteps);
            localStorage.setItem('activeVideoSteps', JSON.stringify(startSteps));

            const result = await api.generateVideo(topic, selectedMaterials, userId);
            setCurrentJobId(result.job_id);
            localStorage.setItem('activeVideoJobId', result.job_id);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error starting generation');
            setIsGenerating(false);
            setPipelineSteps(initialPipelineSteps);
            localStorage.removeItem('activeVideoSteps');
        }
    };

    // Effect to sync pipelineSteps to localStorage across changes
    useEffect(() => {
        if (isGenerating) {
            localStorage.setItem('activeVideoSteps', JSON.stringify(pipelineSteps));
        }
    }, [pipelineSteps, isGenerating]);

    // Effect to sync topicInput to localStorage
    useEffect(() => {
        localStorage.setItem('activeVideoTopic', topicInput);
    }, [topicInput]);

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

                    if (status.status === 'complete' || status.status === 'completed') {
                        return newSteps.map(s => ({ ...s, status: 'complete' }));
                    }

                    return newSteps;
                });

                if (status.status === 'complete' || status.status === 'completed') {
                    if (interval) clearInterval(interval);
                    setIsGenerating(false);
                    setCurrentJobId(null);
                    localStorage.removeItem('activeVideoJobId');
                    localStorage.removeItem('activeVideoSteps');

                    // Add new video to list if not already there
                    setGeneratedVideos(prev => {
                        if (prev.find(v => v.id === status.job_id)) return prev;
                        return [{
                            id: status.job_id,
                            title: status.topic,
                            sourceMaterial: 'AI Generated',
                            duration: '01:15',
                            createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            thumbnail: '',
                            url: `${api.API_BASE_URL}/video/download/${status.job_id}`
                        }, ...prev];
                    });

                } else if (status.status === 'failed') {
                    if (interval) clearInterval(interval);
                    setError(status.error || 'Generation failed');
                    setIsGenerating(false);
                    setCurrentJobId(null);
                    localStorage.removeItem('activeVideoJobId');
                    localStorage.removeItem('activeVideoSteps');
                }

            } catch (err) {
                console.error("Failed to poll status", err);
                // If it's a 404, the job might be gone
                setError("Generation session expired or lost. Please try again.");
                setIsGenerating(false);
                setCurrentJobId(null);
                localStorage.removeItem('activeVideoJobId');
                localStorage.removeItem('activeVideoSteps');
                if (interval) clearInterval(interval);
            }
        };

        if (currentJobId) {
            pollStatus(); // Initial check
            interval = setInterval(pollStatus, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [currentJobId, userId]);

    return (
        <div className="space-y-6">
            {/* Hero Header */}
            <Card hover={false} className="text-center py-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-indigo/5 via-teal/5 to-indigo/5 pointer-events-none" />
                <div className="relative">
                    <h2 className="font-[Outfit] text-3xl font-bold text-pure">Transform Your Notes Into Animated Lessons</h2>
                    <p className="text-silver mt-2 max-w-xl mx-auto">AI extracts key concepts from your slides and PDFs, then generates animated content with voiceover</p>

                    <div className="max-w-md mx-auto mt-8 flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-elevated border border-edge rounded-button px-4 py-2 text-sm text-pure focus:outline-none focus:border-indigo"
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
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-[Outfit] text-lg font-semibold text-pure">Select Source Materials</h3>
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !userId) return;
                                try {
                                    setIsFetchingDocs(true);
                                    await api.uploadDocument(file, userId);
                                    const res = await api.getDocuments(userId);
                                    setDocuments(res.documents || []);
                                } catch (err) {
                                    console.error("Upload failed", err);
                                } finally {
                                    setIsFetchingDocs(false);
                                }
                            }}
                        />
                        <span className="text-sm text-teal hover:text-pure transition-colors flex items-center gap-1">
                            <Upload size={16} /> Upload New
                        </span>
                    </label>
                </div>

                {isFetchingDocs ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-teal animate-spin" />
                    </div>
                ) : documents.length === 0 ? (
                    <Card className="p-8! text-center text-slate">
                        No materials available yet. Upload a document or sync from Classroom.
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc) => {
                            const isSelected = selectedMaterials.includes(doc.document_id);
                            const fileExt = doc.filename.split('.').pop()?.toLowerCase() || 'txt';
                            const iconExt = ['pdf', 'ppt', 'pptx', 'doc', 'docx'].includes(fileExt) ?
                                (fileExt === 'pptx' ? 'ppt' : fileExt === 'docx' ? 'doc' : fileExt) : 'txt';

                            return (
                                <Card
                                    key={doc.document_id}
                                    onClick={() => toggleMaterial(doc.document_id)}
                                    className={`p-4! cursor-pointer transition-all ${isSelected ? 'ring-2 ring-indigo bg-indigo/5' : 'hover:border-indigo/30'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input type="checkbox" checked={isSelected} readOnly className="mt-1 w-4 h-4 accent-indigo rounded cursor-pointer" />
                                        <div className="text-teal shrink-0 mt-0.5">{fileIcons[iconExt] || <FileText size={20} />}</div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium text-pure wrap-break-word line-clamp-2" title={doc.filename}>{doc.filename}</p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`${api.API_BASE_URL}/documents/download/${doc.document_id}`, '_blank');
                                                    }}
                                                    className="p-1 rounded hover:bg-edge text-slate hover:text-teal transition-colors shrink-0"
                                                    title="Download Document"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 mb-2">
                                                <span className="text-xs text-slate">{new Date(doc.created_at).toLocaleDateString()}</span>
                                                <span className="text-xs text-slate">&middot;</span>
                                                <span className="text-xs text-slate">{doc.chunks} chunks</span>
                                            </div>
                                            {doc.summary && (
                                                <div className="mt-2 p-2 rounded bg-elevated/50 border border-edge/50">
                                                    <p className="text-xs text-silver line-clamp-3 leading-relaxed" title={doc.summary}>
                                                        {doc.summary}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Generated Content Library */}
            <div>
                <h3 className="font-[Outfit] text-lg font-semibold text-pure mb-3">Generated Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedVideos.map((video) => (
                        <Card key={video.id} className="p-0! overflow-hidden">
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
                                    <button className="p-1.5 rounded-button text-silver hover:text-pure bg-elevated transition-colors"><Download size={14} /></button>
                                    <button className="p-1.5 rounded-button text-silver hover:text-pure bg-elevated transition-colors"><Share2 size={14} /></button>
                                    <button className="p-1.5 rounded-button text-silver hover:text-scarlet bg-elevated transition-colors ml-auto"><Trash2 size={14} /></button>
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
