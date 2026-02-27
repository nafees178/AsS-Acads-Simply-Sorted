import React, { useState } from 'react';
import { RefreshCw, Plus, FileText, Presentation, FileIcon, Link2, Upload } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { CourseTag } from '../components/shared/CourseTag';
import { PriorityBadge } from '../components/shared/PriorityBadge';
import { courses, studyMaterials, tasks } from '../data/mockData';

const fileIcons: Record<string, React.ReactNode> = {
    pdf: <FileText size={16} />,
    ppt: <Presentation size={16} />,
    slides: <Presentation size={16} />,
    doc: <FileIcon size={16} />,
    link: <Link2 size={16} />,
};

const Courses: React.FC = () => {
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('assignments');

    const selected = courses.find((c) => c.id === selectedCourse);
    const courseTasks = tasks.filter((t) => t.courseId === selectedCourse);
    const courseMaterials = studyMaterials.filter((m) => selected && m.courseName === selected.name);

    return (
        <div className="space-y-6">
            {/* Sync Status */}
            <Card hover={false} className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald animate-pulse" />
                    <span className="text-sm text-pure font-medium">Connected to Google Classroom</span>
                    <span className="text-xs text-slate">Last synced: 5 min ago</span>
                </div>
                <Button variant="secondary" size="sm">
                    <RefreshCw size={14} /> Sync Now
                </Button>
            </Card>

            <div className="flex gap-6">
                {/* Course Grid */}
                <div className={`grid gap-4 transition-all duration-300 ${selectedCourse ? 'grid-cols-1 lg:grid-cols-2 flex-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full'}`}>
                    {courses.map((course) => (
                        <Card key={course.id} onClick={() => setSelectedCourse(course.id)} className="relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: course.color }} />
                            <div className="pt-2">
                                <h3 className="font-[Outfit] text-base font-semibold text-pure">{course.name}</h3>
                                <p className="text-xs text-silver mt-0.5">{course.instructor}</p>
                                <div className="flex items-center gap-4 mt-3 text-xs text-slate">
                                    <span>{course.assignments} assignments</span>
                                    <span>{course.quizzes} quizzes</span>
                                    <span>{course.materials} materials</span>
                                </div>
                                <div className="flex items-center justify-between mt-4 gap-2">
                                    <div className="flex gap-2">
                                        <Button size="sm">View Materials</Button>
                                        <Button variant="secondary" size="sm"><Plus size={12} /> External</Button>
                                    </div>
                                    <div className="relative w-10 h-10">
                                        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="14" fill="none" stroke="#1E293B" strokeWidth="3" />
                                            <circle cx="18" cy="18" r="14" fill="none" stroke={course.color} strokeWidth="3"
                                                strokeDasharray={`${course.progress * 0.88} 88`} strokeLinecap="round" />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-silver">{course.progress}%</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Course Detail Panel */}
                {selectedCourse && selected && (
                    <div className="w-full lg:w-[40%] shrink-0">
                        <Card hover={false} className="sticky top-20">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-[Outfit] text-lg font-semibold text-pure">{selected.name}</h3>
                                <button onClick={() => setSelectedCourse(null)} className="text-slate hover:text-pure text-sm">Close</button>
                            </div>
                            <div className="flex gap-1 border-b border-edge mb-4">
                                {['assignments', 'materials', 'external'].map((tab) => (
                                    <button key={tab} onClick={() => setActiveTab(tab)}
                                        className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${activeTab === tab ? 'text-pure border-b-2 border-indigo' : 'text-silver hover:text-pure'}`}>
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            {activeTab === 'assignments' && (
                                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                    {courseTasks.length > 0 ? courseTasks.map((task) => (
                                        <div key={task.id} className="flex items-center justify-between p-3 rounded-[var(--radius-button)] bg-elevated/50">
                                            <div>
                                                <p className="text-sm text-pure">{task.title}</p>
                                                <p className="text-xs text-slate font-mono">{task.countdown}</p>
                                            </div>
                                            <PriorityBadge urgency={task.urgency} />
                                        </div>
                                    )) : <p className="text-sm text-slate">No assignments found.</p>}
                                </div>
                            )}
                            {activeTab === 'materials' && (
                                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                    {courseMaterials.map((mat) => (
                                        <div key={mat.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-button)] bg-elevated/50">
                                            <div className="text-teal">{fileIcons[mat.type]}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-pure truncate">{mat.name}</p>
                                                <p className="text-xs text-slate">{mat.pages} pages &middot; {mat.size}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {activeTab === 'external' && (
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-edge rounded-[var(--radius-card)] p-8 text-center">
                                        <Upload size={24} className="mx-auto text-slate mb-2" />
                                        <p className="text-sm text-silver">Drag and drop files here</p>
                                        <p className="text-xs text-slate mt-1">or click to browse</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Paste URL..." className="flex-1 px-3 py-2 bg-elevated rounded-[var(--radius-button)] border border-edge text-sm text-silver placeholder:text-slate focus:border-indigo focus:outline-none transition-colors" />
                                        <Button size="sm">Add</Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Courses;
