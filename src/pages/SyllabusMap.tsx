import React, { useState } from 'react';
import { Search, Play, Plus, Download, BookOpen, ChevronRight, ChevronDown, FileText, Presentation, Link2, Zap, Sparkles, ClipboardList, GraduationCap, HelpCircle } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { CourseTag } from '../components/shared/CourseTag';
import { assessments } from '../data/mockData';

const coverageColors = {
    covered: { bg: 'bg-emerald/15', text: 'text-emerald', label: 'Fully Covered', border: 'border-emerald/40' },
    partial: { bg: 'bg-amber/15', text: 'text-amber', label: 'Partially Covered', border: 'border-amber/40' },
    uncovered: { bg: 'bg-scarlet/15', text: 'text-scarlet', label: 'Not Covered', border: 'border-scarlet/40' },
};

const difficultyConfig = {
    easy: { bg: 'bg-emerald/10', text: 'text-emerald', label: 'Easy' },
    medium: { bg: 'bg-amber/10', text: 'text-amber', label: 'Medium' },
    hard: { bg: 'bg-scarlet/10', text: 'text-scarlet', label: 'Hard' },
};

const typeIcons = {
    exam: <GraduationCap size={14} />,
    quiz: <HelpCircle size={14} />,
    assignment: <ClipboardList size={14} />,
};

const matTypeIcons: Record<string, React.ReactNode> = {
    slides: <Presentation size={12} />, pdf: <FileText size={12} />, ppt: <Presentation size={12} />, link: <Link2 size={12} />,
};

const SyllabusMap: React.FC = () => {
    const [selectedTopic, setSelectedTopic] = useState<string | null>('t1');
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [assessmentType, setAssessmentType] = useState('all');
    const [expandedAssessments, setExpandedAssessments] = useState<string[]>(['1', '3', '4']);
    const [viewMode, setViewMode] = useState<'topics' | 'questions'>('topics');

    const allTopics = assessments.flatMap((a) => a.topics);
    const activeTopic = allTopics.find((t) => t.id === selectedTopic);

    const filteredAssessments = assessments.filter((a) =>
        assessmentType === 'all' ? true : a.type === assessmentType.slice(0, -1)
    );

    const toggleExpand = (id: string) => {
        setExpandedAssessments((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
    };

    const activeQuestion = selectedQuestion
        ? assessments.flatMap((a) => a.questions || []).find((q) => q.id === selectedQuestion)
        : null;

    const totalCoverage = Math.round(assessments.reduce((sum, a) => sum + a.coveragePercent, 0) / assessments.length);

    return (
        <div className="space-y-6">
            {/* Assessment Selector Bar */}
            <Card hover={false} className="flex items-center justify-between flex-wrap gap-4 p-4!">
                <div className="flex items-center gap-3 flex-wrap">
                    <select defaultValue="all-courses">
                        <option value="all-courses">All Courses</option>
                        <option>Organic Chemistry</option>
                        <option>Linear Algebra</option>
                        <option>Macroeconomics</option>
                    </select>
                    <div className="flex gap-1">
                        {['all', 'exams', 'quizzes', 'assignments'].map((type) => (
                            <button key={type} onClick={() => setAssessmentType(type)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-pill capitalize transition-all ${assessmentType === type ? 'bg-indigo text-pure' : 'bg-elevated text-silver hover:text-pure'}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1 ml-2">
                        <button onClick={() => setViewMode('topics')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-pill transition-all ${viewMode === 'topics' ? 'bg-teal/20 text-teal' : 'bg-elevated text-silver hover:text-pure'}`}>
                            By Topics
                        </button>
                        <button onClick={() => setViewMode('questions')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-pill transition-all ${viewMode === 'questions' ? 'bg-teal/20 text-teal' : 'bg-elevated text-silver hover:text-pure'}`}>
                            By Questions
                        </button>
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate" />
                        <input type="text" placeholder="Search topics or questions..." className="pl-8 pr-3 py-1.5 w-56" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-silver">Overall Coverage:</span>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-24 bg-elevated rounded-full overflow-hidden">
                            <div className="h-full bg-emerald rounded-full transition-all duration-500" style={{ width: `${totalCoverage}%` }} />
                        </div>
                        <span className="text-xs font-mono text-emerald">{totalCoverage}%</span>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
                {/* Syllabus Breakdown */}
                <div className="space-y-4">
                    {filteredAssessments.map((assessment) => (
                        <Card key={assessment.id} hover={false}>
                            {/* Assessment Header */}
                            <button onClick={() => toggleExpand(assessment.id)} className="w-full flex items-center justify-between mb-1 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="text-teal">{typeIcons[assessment.type]}</span>
                                    <h3 className="font-[Outfit] text-base font-semibold text-pure">{assessment.name}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-pill font-medium bg-elevated text-silver capitalize`}>
                                        {assessment.type}
                                    </span>
                                    <CourseTag name={assessment.courseName} color={assessment.courseColor} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-20 bg-elevated rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald rounded-full" style={{ width: `${assessment.coveragePercent}%` }} />
                                        </div>
                                        <span className="text-xs font-mono text-silver">{assessment.coveragePercent}%</span>
                                    </div>
                                    <span className="text-xs text-slate">Due: {assessment.dueDate}</span>
                                    {expandedAssessments.includes(assessment.id) ? <ChevronDown size={16} className="text-slate" /> : <ChevronRight size={16} className="text-slate" />}
                                </div>
                            </button>

                            {expandedAssessments.includes(assessment.id) && (
                                <div className="mt-3 space-y-2">
                                    {/* Topics View */}
                                    {viewMode === 'topics' && assessment.topics.map((topic) => (
                                        <div key={topic.id}
                                            onClick={() => { setSelectedTopic(topic.id); setSelectedQuestion(null); }}
                                            className={`p-3 rounded-button bg-elevated/50 cursor-pointer transition-all hover:bg-elevated border-l-2 ${coverageColors[topic.coverage].border} ${selectedTopic === topic.id ? 'ring-1 ring-indigo' : ''}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-pure">{topic.name}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-pill font-medium ${coverageColors[topic.coverage].bg} ${coverageColors[topic.coverage].text}`}>
                                                        {coverageColors[topic.coverage].label}
                                                    </span>
                                                </div>
                                            </div>
                                            {topic.materials.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {topic.materials.map((mat, i) => (
                                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-obsidian/50 rounded text-[10px] text-silver border border-edge/50">
                                                            {matTypeIcons[mat.type]} {mat.name} <span className="text-slate">{mat.pages}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                {topic.animated ? (
                                                    <Button variant="ghost" size="sm" className="text-emerald!"><Play size={12} /> View Animation</Button>
                                                ) : (
                                                    <Button variant="secondary" size="sm"><Play size={12} /> Animate Topic</Button>
                                                )}
                                                <Button variant="ghost" size="sm"><Plus size={12} /> Add Material</Button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Questions View */}
                                    {viewMode === 'questions' && assessment.questions && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 px-1 pb-1 border-b border-edge/50">
                                                <span className="text-xs text-slate font-medium">
                                                    {assessment.questions.length} questions &middot;{' '}
                                                    {assessment.questions.reduce((s, q) => s + q.marks, 0)} marks total &middot;{' '}
                                                    {assessment.questions.filter((q) => q.contentGenerated).length}/{assessment.questions.length} content generated
                                                </span>
                                            </div>
                                            {assessment.questions.map((q) => (
                                                <div key={q.id}
                                                    onClick={() => { setSelectedQuestion(q.id); setSelectedTopic(q.topicId); }}
                                                    className={`p-3 rounded-button bg-elevated/50 cursor-pointer transition-all hover:bg-elevated ${selectedQuestion === q.id ? 'ring-1 ring-indigo' : ''}`}>
                                                    <div className="flex items-start gap-3">
                                                        {/* Question number bubble */}
                                                        <div className="w-7 h-7 rounded-full bg-indigo/15 text-indigo flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                            {q.number}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-pure leading-relaxed">{q.text}</p>
                                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                                <CourseTag name={q.topicName} color={assessment.courseColor} />
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-pill font-medium ${difficultyConfig[q.difficulty].bg} ${difficultyConfig[q.difficulty].text}`}>
                                                                    {difficultyConfig[q.difficulty].label}
                                                                </span>
                                                                <span className="text-[10px] text-slate font-mono">{q.marks} marks</span>
                                                            </div>
                                                            {/* Mapped Materials */}
                                                            {q.materials.length > 0 && (
                                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                                    {q.materials.map((mat, i) => (
                                                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-obsidian/50 rounded text-[10px] text-silver border border-edge/50">
                                                                            {matTypeIcons[mat.type]} {mat.name} <span className="text-slate">{mat.pages}</span>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {q.materials.length === 0 && (
                                                                <p className="text-[10px] text-scarlet/70 mt-1.5">No materials mapped for this question</p>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                {q.contentGenerated ? (
                                                                    <Button variant="ghost" size="sm" className="text-emerald!"><Play size={12} /> View Content</Button>
                                                                ) : (
                                                                    <Button variant="secondary" size="sm"><Sparkles size={12} /> Generate Content</Button>
                                                                )}
                                                                <Button variant="ghost" size="sm"><Plus size={12} /> Map Material</Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Fallback for questions view on non-assignment assessments */}
                                    {viewMode === 'questions' && !assessment.questions && (
                                        <div className="text-center py-6">
                                            <ClipboardList size={24} className="mx-auto text-slate mb-2" />
                                            <p className="text-xs text-slate">Questions not available for this {assessment.type}.</p>
                                            <p className="text-[10px] text-slate/60 mt-0.5">Switch to Topics view to see syllabus coverage.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>

                {/* Material Preview Panel */}
                <div className="space-y-4">
                    <Card hover={false} className="sticky top-20">
                        {/* Show question detail if a question is selected */}
                        {activeQuestion ? (
                            <>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo/15 text-indigo flex items-center justify-center text-sm font-bold shrink-0">
                                        Q{activeQuestion.number}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-pure leading-snug">{activeQuestion.text}</h3>
                                        <p className="text-xs text-slate mt-0.5">
                                            {activeQuestion.topicName} &middot; {activeQuestion.marks} marks &middot; {difficultyConfig[activeQuestion.difficulty].label}
                                        </p>
                                    </div>
                                </div>
                                {/* Material Preview */}
                                {activeQuestion.materials.length > 0 ? (
                                    <>
                                        <div className="text-xs text-silver mb-2 font-medium">Mapped Study Material</div>
                                        {activeQuestion.materials.map((mat, i) => (
                                            <div key={i} className="mb-3">
                                                <div className="flex items-center gap-1.5 text-xs text-pure mb-1.5">
                                                    {matTypeIcons[mat.type]} <span>{mat.name}</span> <span className="text-slate">{mat.pages}</span>
                                                </div>
                                                {/* Preview Area */}
                                                <div className="aspect-[4/3] bg-elevated rounded-button flex items-center justify-center border border-edge">
                                                    <div className="text-center">
                                                        <BookOpen size={28} className="mx-auto text-slate mb-2" />
                                                        <p className="text-xs text-slate">Slide Preview</p>
                                                        <p className="text-[10px] text-slate/60 mt-0.5">{mat.pages}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {/* Page filmstrip */}
                                        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
                                            {Array.from({ length: 8 }, (_, i) => (
                                                <div key={i} className={`w-12 h-9 rounded shrink-0 flex items-center justify-center text-[8px] ${i >= 1 && i <= 4 ? 'bg-indigo/20 border-2 border-indigo text-pure' : 'bg-elevated border border-edge text-slate'
                                                    }`}>
                                                    {i + 5}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {activeQuestion.contentGenerated ? (
                                                <Button className="w-full"><Play size={14} /> View Generated Content</Button>
                                            ) : (
                                                <Button className="w-full"><Sparkles size={14} /> Generate Content for Q{activeQuestion.number}</Button>
                                            )}
                                            <Button variant="secondary" className="w-full"><Download size={14} /> Add to Study Plan</Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <FileText size={28} className="mx-auto text-slate mb-2" />
                                        <p className="text-sm text-slate">No materials mapped</p>
                                        <p className="text-[10px] text-slate/60 mt-0.5">Map study materials to this question to generate content</p>
                                        <Button variant="secondary" size="sm" className="mt-3"><Plus size={12} /> Map Material</Button>
                                    </div>
                                )}
                            </>
                        ) : activeTopic && activeTopic.materials.length > 0 ? (
                            <>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-pure">{activeTopic.materials[0].name}</h3>
                                        <p className="text-xs text-slate mt-0.5">{activeTopic.materials[0].type.toUpperCase()} &middot; {activeTopic.materials[0].pages}</p>
                                    </div>
                                </div>
                                <div className="aspect-[4/3] bg-elevated rounded-button flex items-center justify-center mb-3 border border-edge">
                                    <div className="text-center">
                                        <BookOpen size={32} className="mx-auto text-slate mb-2" />
                                        <p className="text-xs text-slate">Slide Preview</p>
                                        <p className="text-[10px] text-slate/60 mt-0.5">Page 14 of 32</p>
                                    </div>
                                </div>
                                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
                                    {Array.from({ length: 8 }, (_, i) => (
                                        <div key={i} className={`w-12 h-9 rounded shrink-0 flex items-center justify-center text-[8px] ${i >= 2 && i <= 5 ? 'bg-indigo/20 border-2 border-indigo text-pure' : 'bg-elevated border border-edge text-slate'
                                            }`}>
                                            {i + 12}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button className="w-full"><Zap size={14} /> Animate Selected Pages</Button>
                                    <Button variant="secondary" className="w-full"><Download size={14} /> Add to Study Plan</Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <BookOpen size={32} className="mx-auto text-slate mb-2" />
                                <p className="text-sm text-slate">Select a topic or question to preview materials</p>
                            </div>
                        )}
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default SyllabusMap;
