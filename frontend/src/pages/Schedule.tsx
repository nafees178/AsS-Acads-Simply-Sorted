import React, { useState } from 'react';
import { RotateCw, Focus, Filter } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { PriorityBadge } from '../components/shared/PriorityBadge';
import { CourseTag } from '../components/shared/CourseTag';
import { tasks } from '../data/mockData';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 15 }, (_, i) => i + 8);

const studyBlocks = [
    { day: 0, start: 9, duration: 2, title: 'Linear Algebra', color: '#7C3AED' },
    { day: 0, start: 14, duration: 1.5, title: 'Organic Chemistry', color: '#06B6D4' },
    { day: 1, start: 10, duration: 2, title: 'Macroeconomics', color: '#F59E0B' },
    { day: 1, start: 15, duration: 1, title: 'Physics II', color: '#3B82F6' },
    { day: 2, start: 9, duration: 1.5, title: 'Data Structures', color: '#10B981' },
    { day: 2, start: 13, duration: 2, title: 'World History', color: '#FF4D6A' },
    { day: 3, start: 11, duration: 2, title: 'Linear Algebra', color: '#7C3AED' },
    { day: 3, start: 16, duration: 1.5, title: 'Organic Chemistry', color: '#06B6D4' },
    { day: 4, start: 9, duration: 2, title: 'Data Structures', color: '#10B981' },
    { day: 4, start: 14, duration: 1, title: 'Macroeconomics', color: '#F59E0B' },
];

const Schedule: React.FC = () => {
    const [view, setView] = useState<'day' | 'week' | 'month'>('week');

    return (
        <div className="space-y-6">
            {/* Controls Bar */}
            <Card hover={false} className="flex items-center justify-between flex-wrap gap-4 !p-4">
                <div className="flex items-center gap-2">
                    {(['day', 'week', 'month'] as const).map((v) => (
                        <button key={v} onClick={() => setView(v)}
                            className={`px-4 py-1.5 text-xs font-medium rounded-[var(--radius-pill)] capitalize transition-all ${view === v ? 'bg-indigo text-pure' : 'bg-elevated text-silver hover:text-pure'}`}>
                            {v}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <Button size="sm"><RotateCw size={14} /> Regenerate</Button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-elevated rounded-[var(--radius-button)] text-silver hover:text-pure transition-colors">
                        <Filter size={12} /> Filter
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-elevated rounded-[var(--radius-button)] text-silver hover:text-pure transition-colors">
                        <Focus size={12} /> Focus Mode
                    </button>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                {/* Weekly Calendar */}
                <Card hover={false} className="overflow-x-auto !p-4">
                    <div className="min-w-[700px]">
                        {/* Day headers */}
                        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-0 mb-1">
                            <div />
                            {days.map((day) => (
                                <div key={day} className="text-center text-xs font-medium text-silver py-2">{day}</div>
                            ))}
                        </div>
                        {/* Time grid */}
                        <div className="relative grid grid-cols-[60px_repeat(7,1fr)] gap-0">
                            {hours.map((hour) => (
                                <React.Fragment key={hour}>
                                    <div className="h-12 flex items-start justify-end pr-2 text-[10px] text-slate -mt-1.5">{hour}:00</div>
                                    {days.map((_, di) => (
                                        <div key={di} className="h-12 border-t border-edge/30" />
                                    ))}
                                </React.Fragment>
                            ))}
                            {/* Study blocks */}
                            {studyBlocks.map((block, idx) => (
                                <div key={idx}
                                    className="absolute rounded-lg text-xs font-medium text-pure px-2 py-1 overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                                    style={{
                                        left: `calc(60px + ${block.day} * ((100% - 60px) / 7))`,
                                        width: `calc((100% - 60px) / 7 - 4px)`,
                                        top: `${(block.start - 8) * 48}px`,
                                        height: `${block.duration * 48 - 4}px`,
                                        backgroundColor: `${block.color}30`,
                                        borderLeft: `3px solid ${block.color}`,
                                    }}>
                                    {block.title}
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Priority Queue Sidebar */}
                <div className="space-y-3">
                    <h3 className="font-[Outfit] text-lg font-semibold text-pure">Priority Queue</h3>
                    {tasks.filter(t => !t.completed).map((task) => (
                        <Card key={task.id} className="!p-3" hover>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-pure">{task.title}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <CourseTag name={task.courseName} color={task.courseColor} />
                                        <PriorityBadge urgency={task.urgency} />
                                    </div>
                                    <p className="text-xs font-mono text-slate mt-1.5">{task.countdown}</p>
                                </div>
                            </div>
                            <Button size="sm" className="mt-2 w-full">Start Now</Button>
                        </Card>
                    ))}
                    {/* AI Recommendations */}
                    <Card hover={false} className="!p-3 border-l-2 border-l-teal">
                        <p className="text-xs font-medium text-teal mb-2">AI Recommendation</p>
                        <p className="text-xs text-silver">Study Linear Algebra before Physics — prerequisite material in slides 3 and 7.</p>
                        <p className="text-xs text-silver mt-1.5">This exam covers lectures 5, 8, and 12.</p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Schedule;
