import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, CheckCircle, Sparkles, ChevronDown, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { StatCard } from '../components/shared/StatCard';
import { PriorityBadge } from '../components/shared/PriorityBadge';
import { CourseTag } from '../components/shared/CourseTag';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const urgencyDot: Record<string, string> = {
    critical: 'bg-scarlet',
    approaching: 'bg-amber',
    ontrack: 'bg-emerald',
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

const Dashboard: React.FC = () => {
    const { userId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<any[]>([]);
    const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
    const [stats, setStats] = useState({
        coursesSynced: 0,
        upcomingDeadlines: 0,
        tasksCompleted: 0,
        aiContentReady: 0,
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                const coursesRes = await api.getCourses(userId);
                const coursesList = coursesRes.courses || [];

                let allTasks: any[] = [];
                let allEvents: any[] = [];

                // Fetch assignments for all courses in parallel
                const assignmentPromises = coursesList.map((course: any) =>
                    api.getAssignments(userId, course.id)
                        .then(res => ({ course, assignments: res.assignments || [] }))
                        .catch(err => {
                            console.error(`Failed fetching assignments for ${course.name}`, err);
                            return { course, assignments: [] };
                        })
                );

                const results = await Promise.all(assignmentPromises);

                results.forEach(({ course, assignments }) => {
                    const color = getCourseColor(course.id);

                    assignments.forEach((a: any) => {
                        const dueDateStr = formatGoogleDate(a.due_date);

                        allTasks.push({
                            id: a.id,
                            title: a.title,
                            courseId: course.id,
                            courseName: course.name || 'Untitled Course',
                            courseColor: color,
                            dueDate: dueDateStr,
                            countdown: dueDateStr,
                            urgency: 'approaching',
                            completed: false,
                            materials: a.materials || []
                        });

                        allEvents.push({
                            id: `evt-${a.id}`,
                            title: a.title,
                            type: 'assignment',
                            courseColor: color,
                            courseName: course.name || 'Untitled Course',
                            date: dueDateStr,
                            countdown: dueDateStr
                        });
                    });
                });

                setTasks(allTasks);
                setTimelineEvents(allEvents.slice(0, 10)); // Limit to 10

                setStats({
                    coursesSynced: coursesList.length,
                    upcomingDeadlines: allTasks.length,
                    tasksCompleted: 0,
                    aiContentReady: 0,
                });

            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [userId]);

    const displayUserId = userId ? userId.split('_')[0] : 'Guest';

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <Card hover={false} className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo/10 to-teal/10 pointer-events-none" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <h2 className="font-[Outfit] text-2xl font-semibold text-pure">Good evening, {displayUserId}</h2>
                        <p className="text-silver mt-1">{stats.upcomingDeadlines} deadlines approaching this week</p>
                    </div>
                    <div className="hidden sm:block w-48">
                        <div className="flex items-center justify-between text-xs text-silver mb-1">
                            <span>Weekly Progress</span>
                            <span className="text-emerald font-mono">0%</span>
                        </div>
                        <div className="h-2 bg-elevated rounded-full overflow-hidden">
                            <div className="h-full bg-emerald rounded-full transition-all duration-500" style={{ width: '0%' }} />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Courses Synced" value={stats.coursesSynced} icon={<BookOpen size={20} />} accentColor="#06B6D4" />
                <StatCard label="Upcoming Deadlines" value={stats.upcomingDeadlines} icon={<Clock size={20} />} accentColor="#FF4D6A" />
                <StatCard label="Tasks Completed" value={`${stats.tasksCompleted}%`} icon={<CheckCircle size={20} />} accentColor="#10B981" />
                <StatCard label="AI Content Ready" value={stats.aiContentReady} icon={<Sparkles size={20} />} accentColor="#7C3AED" />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Priority To-Do List */}
                <div className="lg:col-span-3 space-y-3">
                    <h3 className="font-[Outfit] text-lg font-semibold text-pure">Priority To-Do</h3>

                    {loading ? (
                        <Card className="!p-12 border-dashed border-edge/50">
                            <div className="flex flex-col items-center justify-center text-center">
                                <Loader2 className="w-8 h-8 text-teal animate-spin mb-3" />
                                <p className="text-slate text-sm">Syncing assignments from all your courses...</p>
                            </div>
                        </Card>
                    ) : tasks.length === 0 ? (
                        <Card className="!p-8 text-center text-slate">
                            No assignments found.
                        </Card>
                    ) : (
                        tasks.map((task) => (
                            <Card key={task.id} className="!p-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${urgencyDot[task.urgency]}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium text-pure">
                                                {task.title}
                                            </span>
                                            <CourseTag name={task.courseName} color={task.courseColor} />
                                            <PriorityBadge urgency={task.urgency} />
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-xs font-mono text-slate">{task.countdown}</span>
                                            <button className="text-xs text-teal hover:text-pure flex items-center gap-1 transition-colors">
                                                <ChevronDown size={12} /> {task.materials?.length || 0} materials
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Upcoming Timeline */}
                <div className="lg:col-span-2 space-y-3">
                    <h3 className="font-[Outfit] text-lg font-semibold text-pure">Upcoming Timeline</h3>
                    <div className="relative">
                        {loading && <div className="absolute inset-0 bg-obsidian/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg"><Loader2 className="w-6 h-6 text-teal animate-spin" /></div>}
                        <div className="absolute left-3 top-0 bottom-0 w-px bg-edge" />

                        {timelineEvents.length === 0 && !loading && (
                            <div className="pl-8 text-sm text-slate py-4">No upcoming events.</div>
                        )}

                        {timelineEvents.map((event) => (
                            <div key={event.id} className="relative pl-8 pb-4">
                                <div className="absolute left-1.5 top-2 w-3 h-3 rounded-full border-2"
                                    style={{ borderColor: event.courseColor, backgroundColor: `${event.courseColor}30` }} />
                                <Card className="!p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-pure truncate w-[200px]">{event.title}</p>
                                            <p className="text-xs text-silver mt-0.5">{event.courseName}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-silver">{event.date}</p>
                                            <p className="text-xs font-mono text-slate">{event.countdown}</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Urgency Banner */}
            {!loading && tasks.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-40">
                    <div className="glass border-t border-scarlet/30 bg-scarlet/5 px-6 py-3">
                        <div className="mx-auto max-w-[1440px] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={18} className="text-scarlet animate-pulse" />
                                <span className="text-sm text-pure font-medium truncate max-w-[200px] lg:max-w-md">{tasks[0]?.title}</span>
                                <PriorityBadge urgency="approaching" />
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-mono text-scarlet">{tasks[0]?.countdown} remaining</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
