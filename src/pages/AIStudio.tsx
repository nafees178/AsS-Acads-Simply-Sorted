import React, { useState } from 'react';
import { Sparkles, FileText, Presentation, FileIcon, CheckCircle, Play, Download, Share2, Trash2 } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { CourseTag } from '../components/shared/CourseTag';
import { studyMaterials, videoContent, pipelineSteps } from '../data/mockData';

const fileIcons: Record<string, React.ReactNode> = {
    pdf: <FileText size={20} />, ppt: <Presentation size={20} />, slides: <Presentation size={20} />,
    doc: <FileIcon size={20} />,
};

const AIStudio: React.FC = () => {
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [showPipeline, setShowPipeline] = useState(false);

    const toggleMaterial = (id: string) => {
        setSelectedMaterials((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
    };

    return (
        <div className="space-y-6">
            {/* Hero Header */}
            <Card hover={false} className="text-center py-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo/5 via-teal/5 to-indigo/5 pointer-events-none" />
                <div className="relative">
                    <h2 className="font-[Outfit] text-3xl font-bold text-pure">Transform Your Notes Into Animated Lessons</h2>
                    <p className="text-silver mt-2 max-w-xl mx-auto">AI extracts key concepts from your slides and PDFs, then generates animated content with voiceover</p>
                    <Button size="lg" className="mt-6" onClick={() => setShowPipeline(true)}>
                        <Sparkles size={16} /> Generate New Content
                    </Button>
                </div>
            </Card>

            {/* Source Material Selector */}
            <div>
                <h3 className="font-[Outfit] text-lg font-semibold text-pure mb-3">Select Source Materials</h3>
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

            {/* Pipeline Visualizer */}
            {showPipeline && (
                <Card hover={false}>
                    <h3 className="font-[Outfit] text-lg font-semibold text-pure mb-4">Generation Pipeline</h3>
                    <div className="flex items-center justify-between gap-2">
                        {pipelineSteps.map((step, idx) => (
                            <React.Fragment key={step.id}>
                                <div className="flex flex-col items-center gap-2 flex-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${step.status === 'complete' ? 'bg-emerald/20 text-emerald' :
                                            step.status === 'active' ? 'bg-indigo/20 text-indigo animate-pulse' :
                                                'bg-elevated text-slate'
                                        }`}>
                                        {step.status === 'complete' ? <CheckCircle size={18} /> : step.id}
                                    </div>
                                    <span className={`text-[10px] text-center ${step.status === 'active' ? 'text-indigo font-medium' : 'text-slate'}`}>
                                        {step.label}
                                    </span>
                                    {step.status === 'active' && (
                                        <div className="w-full h-1 bg-elevated rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo rounded-full w-3/5 animate-pulse" />
                                        </div>
                                    )}
                                </div>
                                {idx < pipelineSteps.length - 1 && (
                                    <div className={`h-px flex-1 max-w-8 ${step.status === 'complete' ? 'bg-emerald' : 'bg-edge'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </Card>
            )}

            {/* Generated Content Library */}
            <div>
                <h3 className="font-[Outfit] text-lg font-semibold text-pure mb-3">Generated Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videoContent.map((video) => (
                        <Card key={video.id} className="!p-0 overflow-hidden">
                            <div className="relative h-40 bg-elevated flex items-center justify-center group">
                                <div className="w-14 h-14 rounded-full bg-obsidian/80 flex items-center justify-center group-hover:bg-indigo/80 transition-colors cursor-pointer">
                                    <Play size={24} className="text-pure ml-1" />
                                </div>
                                <span className="absolute bottom-2 right-2 text-xs font-mono bg-obsidian/80 text-pure px-1.5 py-0.5 rounded">{video.duration}</span>
                            </div>
                            <div className="p-4">
                                <p className="text-sm font-medium text-pure">{video.title}</p>
                                <p className="text-xs text-slate mt-0.5">{video.sourceMaterial} &middot; {video.createdDate}</p>
                                <div className="flex items-center gap-2 mt-3">
                                    <Button size="sm"><Play size={12} /> Play</Button>
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
