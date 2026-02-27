import React from 'react';
import { BookOpen, Clock, CheckCircle, Sparkles, ChevronDown, AlertTriangle } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { StatCard } from '../components/shared/StatCard';
import { PriorityBadge } from '../components/shared/PriorityBadge';
import { CourseTag } from '../components/shared/CourseTag';
import { dashboardStats, tasks, timelineEvents } from '../data/mockData';

const urgencyDot: Record<string, string> = {
    critical: 'bg-scarlet',
    approaching: 'bg-amber',
    ontrack: 'bg-emerald',
};

const Dashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <Card hover={false} className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo/10 to-teal/10 pointer-events-none" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <h2 className="font-[Outfit] text-2xl font-semibold text-pure">Good evening, Nafees</h2>
                        <p className="text-silver mt-1">3 deadlines approaching this week</p>
                    </div>
                    <div className="hidden sm:block w-48">
                        <div className="flex items-center justify-between text-xs text-silver mb-1">
                            <span>Weekly Progress</span>
                            <span className="text-emerald font-mono">72%</span>
                        </div>
                        <div className="h-2 bg-elevated rounded-full overflow-hidden">
                            <div className="h-full bg-emerald rounded-full transition-all duration-500" style={{ width: '72%' }} />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Courses Synced" value={dashboardStats.coursesSynced} icon={<BookOpen size={20} />} accentColor="#06B6D4" />
                <StatCard label="Upcoming Deadlines" value={dashboardStats.upcomingDeadlines} icon={<Clock size={20} />} accentColor="#FF4D6A" />
                <StatCard label="Tasks Completed" value={`${dashboardStats.tasksCompleted}%`} icon={<CheckCircle size={20} />} accentColor="#10B981" />
                <StatCard label="AI Content Ready" value={dashboardStats.aiContentReady} icon={<Sparkles size={20} />} accentColor="#7C3AED" />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Priority To-Do List */}
                <div className="lg:col-span-3 space-y-3">
                    <h3 className="font-[Outfit] text-lg font-semibold text-pure">Priority To-Do</h3>
                    {tasks.map((task) => (
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
                                            <ChevronDown size={12} /> {task.materials.length} materials
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Upcoming Timeline */}
                <div className="lg:col-span-2 space-y-3">
                    <h3 className="font-[Outfit] text-lg font-semibold text-pure">Upcoming 7 Days</h3>
                    <div className="relative">
                        <div className="absolute left-3 top-0 bottom-0 w-px bg-edge" />
                        {timelineEvents.map((event) => (
                            <div key={event.id} className="relative pl-8 pb-4">
                                <div className="absolute left-1.5 top-2 w-3 h-3 rounded-full border-2"
                                    style={{ borderColor: event.courseColor, backgroundColor: `${event.courseColor}30` }} />
                                <Card className="!p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-pure">{event.title}</p>
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
            <div className="fixed bottom-0 left-0 right-0 z-40">
                <div className="glass border-t border-scarlet/30 bg-scarlet/5 px-6 py-3">
                    <div className="mx-auto max-w-[1440px] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={18} className="text-scarlet animate-pulse" />
                            <span className="text-sm text-pure font-medium">Organic Chemistry Lab Report</span>
                            <PriorityBadge urgency="critical" />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-mono text-scarlet">1d 14h remaining</span>
                            <span className="text-xs text-slate">Next: 12h, 6h, 3h, 1h</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
