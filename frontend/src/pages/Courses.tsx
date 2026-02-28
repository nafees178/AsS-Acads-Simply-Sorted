import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, FileText, Presentation, FileIcon, Link2, Upload, Loader2 } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { PriorityBadge } from '../components/shared/PriorityBadge';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const fileIcons: Record<string, React.ReactNode> = {
    pdf: <FileText size={16} />,
    ppt: <Presentation size={16} />,
    slides: <Presentation size={16} />,
    doc: <FileIcon size={16} />,
    link: <Link2 size={16} />,
};

const colors = ['#06B6D4', '#7C3AED', '#F59E0B', '#10B981', '#FF4D6A', '#3B82F6'];
const getCourseColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const formatGoogleDate = (dateObj: any) => {
    if (!dateObj || !dateObj.year) return 'No due date';
    return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
};

const Courses: React.FC = () => {
    const { userId } = useAuth();
    const [coursesList, setCoursesList] = useState<any[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);

    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [courseTasks, setCourseTasks] = useState<any[]>([]);
    const [courseMaterials, setCourseMaterials] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [activeTab, setActiveTab] = useState('assignments');

    const fetchCourses = async () => {
        if (!userId) return;
        try {
            setLoadingCourses(true);
            const data = await api.getCourses(userId);
            const mapped = (data.courses || []).map((c: any) => ({
                id: c.id,
                name: c.name || 'Untitled Course',
                instructor: c.section || 'Google Classroom',
                color: getCourseColor(c.id),
                assignments: 0,
                quizzes: 0,
                materials: 0,
                progress: 0
            }));
            setCoursesList(mapped);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingCourses(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [userId]);

    const fetchCourseDetails = async (courseId: string) => {
        if (!userId) return;
        try {
            setLoadingDetails(true);
            const [assignmentsRes, materialsRes] = await Promise.allSettled([
                api.getAssignments(userId, courseId),
                api.getMaterials(userId, courseId)
            ]);

            if (assignmentsRes.status === 'fulfilled') {
                const mappedTasks = (assignmentsRes.value.assignments || []).map((a: any) => ({
                    id: a.id,
                    title: a.title,
                    dueDate: formatGoogleDate(a.due_date),
                    countdown: formatGoogleDate(a.due_date),
                    urgency: 'approaching'
                }));
                setCourseTasks(mappedTasks);
            }

            if (materialsRes.status === 'fulfilled') {
                const mappedMaterials = (materialsRes.value.materials || []).map((m: any) => ({
                    id: m.id,
                    name: m.title,
                    type: m.title?.toLowerCase().includes('pdf') ? 'pdf' : 'link',
                    pages: 1,
                    size: 'Unknown'
                }));
                setCourseMaterials(mappedMaterials);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        if (selectedCourse) {
            fetchCourseDetails(selectedCourse);
        }
    }, [selectedCourse]);

    const selected = coursesList.find((c) => c.id === selectedCourse);

    return (
        <div className="space-y-6">
            {/* Sync Status */}
            <Card hover={false} className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald animate-pulse" />
                    <span className="text-sm text-pure font-medium">Connected to Google Classroom</span>
                    <span className="text-xs text-slate">Live Sync Output</span>
                </div>
                <Button variant="secondary" size="sm" onClick={fetchCourses} disabled={loadingCourses}>
                    {loadingCourses ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw size={14} />}
                    Sync Now
                </Button>
            </Card>

            <div className="flex gap-6">
                {/* Course Grid */}
                <div className={`grid gap-4 transition-all duration-300 ${selectedCourse ? 'grid-cols-1 lg:grid-cols-2 flex-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full'}`}>
                    {loadingCourses ? (
                        <div className="col-span-full flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-teal animate-spin" />
                        </div>
                    ) : coursesList.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <p className="text-silver">No courses found in Google Classroom.</p>
                        </div>
                    ) : coursesList.map((course) => (
                        <Card key={course.id} onClick={() => setSelectedCourse(course.id)} className="relative overflow-hidden cursor-pointer hover:border-teal/50 transition-colors">
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: course.color }} />
                            <div className="pt-2">
                                <h3 className="font-[Outfit] text-base font-semibold text-pure">{course.name}</h3>
                                <p className="text-xs text-silver mt-0.5">{course.instructor}</p>
                                <div className="flex items-center gap-4 mt-3 text-xs text-slate">
                                    <span>Google Classroom</span>
                                </div>
                                <div className="flex items-center justify-between mt-4 gap-2">
                                    <div className="flex gap-2">
                                        <Button size="sm">View Materials</Button>
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
                                {['assignments', 'materials'].map((tab) => (
                                    <button key={tab} onClick={() => setActiveTab(tab)}
                                        className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${activeTab === tab ? 'text-pure border-b-2 border-indigo' : 'text-silver hover:text-pure'}`}>
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {loadingDetails ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-6 h-6 text-teal animate-spin" />
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'assignments' && (
                                        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                            {courseTasks.length > 0 ? courseTasks.map((task) => (
                                                <div key={task.id} className="flex items-center justify-between p-3 rounded-[var(--radius-button)] bg-elevated/50">
                                                    <div>
                                                        <p className="text-sm text-pure truncate max-w-[200px]">{task.title}</p>
                                                        <p className="text-xs text-slate font-mono">{task.countdown}</p>
                                                    </div>
                                                    <PriorityBadge urgency={task.urgency} />
                                                </div>
                                            )) : <p className="text-sm text-slate">No assignments found in Classroom.</p>}
                                        </div>
                                    )}
                                    {activeTab === 'materials' && (
                                        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                            {courseMaterials.length > 0 ? courseMaterials.map((mat) => (
                                                <div key={mat.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-button)] bg-elevated/50">
                                                    <div className="text-teal">{fileIcons[mat.type] || fileIcons.link}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-pure truncate">{mat.name}</p>
                                                    </div>
                                                </div>
                                            )) : <p className="text-sm text-slate">No materials found in Classroom.</p>}
                                        </div>
                                    )}
                                </>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Courses;
