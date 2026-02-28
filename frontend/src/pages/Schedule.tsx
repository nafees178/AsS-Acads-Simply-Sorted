import React, { useState, useEffect } from 'react';
import { RotateCw, Loader2, CalendarDays, Clock } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// Show 6 AM to 11 PM (17 hours)
const hours = Array.from({ length: 17 }, (_, i) => i + 6);

const COLORS = ['#7C3AED', '#06B6D4', '#F59E0B', '#10B981', '#FF4D6A', '#3B82F6', '#E879F9', '#F97316'];
const getCourseColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
};

interface StudyBlock {
    day: number;       // 0=Mon, 1=Tue, ...
    start: number;     // Hour (e.g. 18.5 for 6:30 PM)
    duration: number;  // In hours
    title: string;
    color: string;
    courseName: string;
    dueDate: string;
}

/**
 * Scheduling algorithm:
 * - Weekdays (Mon-Fri): Only schedule between 6-7:59 AM and 6-10:59 PM.
 *   (8 AM - 6 PM is reserved for class/work, 11 PM - 6 AM is sleep.)
 * - Weekends (Sat-Sun): Only schedule between 7 AM - 10:59 PM.
 *   (11 PM - 7 AM is sleep.)
 * - Each task gets a 1.5-hour study slot.
 * - Tasks are sorted by deadline (earliest first).
 */
function generateSchedule(tasks: any[]): StudyBlock[] {
    const blocks: StudyBlock[] = [];
    const now = new Date();

    // Get start of the current week (Monday)
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    // Sort tasks by deadline
    const sorted = [...tasks].sort((a, b) => {
        const da = a.dueDate === 'No due date' ? '9999-12-31' : a.dueDate;
        const db = b.dueDate === 'No due date' ? '9999-12-31' : b.dueDate;
        return da.localeCompare(db);
    });

    // Define available slots for each day of the week
    // dayIndex: 0=Mon...6=Sun
    function getAvailableSlots(dayIndex: number): { start: number; end: number }[] {
        const isWeekday = dayIndex < 5;
        if (isWeekday) {
            return [
                { start: 6, end: 8 },     // Early morning: 6-8 AM
                { start: 18, end: 23 },    // Evening: 6-11 PM
            ];
        } else {
            return [
                { start: 7, end: 23 },     // Weekend: 7 AM - 11 PM
            ];
        }
    }

    // Track occupied slots per day as [start, end]
    const occupied: Map<number, { start: number; end: number }[]> = new Map();
    for (let d = 0; d < 7; d++) occupied.set(d, []);

    const SLOT_DURATION = 1.5; // hours

    for (const task of sorted) {
        let placed = false;

        for (let dayIdx = 0; dayIdx < 7 && !placed; dayIdx++) {
            const slots = getAvailableSlots(dayIdx);
            const dayOccupied = occupied.get(dayIdx)!;

            for (const slot of slots) {
                // Try to fit in this availability window
                let candidateStart = slot.start;

                while (candidateStart + SLOT_DURATION <= slot.end && !placed) {
                    const candidateEnd = candidateStart + SLOT_DURATION;

                    // Check for overlap with existing blocks
                    const overlaps = dayOccupied.some(
                        o => candidateStart < o.end && candidateEnd > o.start
                    );

                    if (!overlaps) {
                        blocks.push({
                            day: dayIdx,
                            start: candidateStart,
                            duration: SLOT_DURATION,
                            title: task.title,
                            color: task.courseColor || getCourseColor(task.courseId || task.id),
                            courseName: task.courseName || '',
                            dueDate: task.dueDate,
                        });
                        dayOccupied.push({ start: candidateStart, end: candidateEnd });
                        placed = true;
                    } else {
                        candidateStart += 0.5; // Advance by 30 mins
                    }
                }
            }
        }
    }

    return blocks;
}

const Schedule: React.FC = () => {
    const { userId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [studyBlocks, setStudyBlocks] = useState<StudyBlock[]>([]);
    const [taskCount, setTaskCount] = useState(0);

    const fetchAndSchedule = async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        try {
            const coursesRes = await api.getCourses(userId);
            const coursesList = coursesRes.courses || [];

            let allTasks: any[] = [];

            const assignmentPromises = coursesList.map((course: any) =>
                api.getAssignments(userId, course.id)
                    .then((res: any) => ({ course, assignments: res.assignments || [] }))
                    .catch(() => ({ course, assignments: [] }))
            );

            const results = await Promise.all(assignmentPromises);

            results.forEach(({ course, assignments }: any) => {
                const color = getCourseColor(course.id);
                assignments.forEach((a: any) => {
                    const state = a.state?.toLowerCase() || 'approaching';
                    if (state === 'completed') return; // Skip completed

                    const dueDateStr = a.due_date
                        ? `${a.due_date.year}-${String(a.due_date.month).padStart(2, '0')}-${String(a.due_date.day).padStart(2, '0')}`
                        : 'No due date';

                    allTasks.push({
                        id: a.id,
                        title: a.title,
                        courseId: course.id,
                        courseName: course.name || 'Untitled Course',
                        courseColor: color,
                        dueDate: dueDateStr,
                    });
                });
            });

            setTaskCount(allTasks.length);
            const blocks = generateSchedule(allTasks);
            setStudyBlocks(blocks);
        } catch (err) {
            console.error("Schedule fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAndSchedule();
    }, [userId]);

    return (
        <div className="space-y-6">
            {/* Header with stats and regenerate */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <CalendarDays size={22} className="text-teal" />
                    <h2 className="font-[Outfit] text-xl font-semibold text-pure">Weekly Schedule</h2>
                    <span className="text-xs text-silver bg-elevated px-2.5 py-1 rounded-full">{taskCount} tasks scheduled</span>
                </div>
                <Button size="sm" onClick={fetchAndSchedule}>
                    <RotateCw size={14} /> Regenerate
                </Button>
            </div>

            {loading ? (
                <Card className="p-12! border-dashed border-edge/50">
                    <div className="flex flex-col items-center justify-center text-center">
                        <Loader2 className="w-8 h-8 text-teal animate-spin mb-3" />
                        <p className="text-slate text-sm">Building your optimized schedule from deadlines...</p>
                    </div>
                </Card>
            ) : (
                <Card hover={false} className="overflow-x-auto !p-4">
                    {/* Legend: Time Constraints */}
                    <div className="flex items-center gap-4 mb-4 text-[10px] text-slate">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-scarlet/20 border border-scarlet/30" />
                            <span>Class/Work (8AM–6PM weekdays)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-indigo/20 border border-indigo/30" />
                            <span>Sleep (11PM–6AM)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={10} className="text-teal" />
                            <span>1.5h study blocks auto-generated</span>
                        </div>
                    </div>

                    <div className="min-w-[700px]">
                        {/* Day headers */}
                        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-0 mb-1">
                            <div />
                            {days.map((day, idx) => (
                                <div key={day} className={`text-center text-xs font-medium py-2 ${idx < 5 ? 'text-silver' : 'text-teal'}`}>
                                    {day}
                                    {idx >= 5 && <span className="block text-[9px] text-teal/60">Weekend</span>}
                                </div>
                            ))}
                        </div>
                        {/* Time grid */}
                        <div className="relative grid grid-cols-[60px_repeat(7,1fr)] gap-0">
                            {hours.map((hour) => (
                                <React.Fragment key={hour}>
                                    <div className="h-12 flex items-start justify-end pr-2 text-[10px] text-slate -mt-1.5">
                                        {hour}:00
                                    </div>
                                    {days.map((_, di) => {
                                        const isWeekday = di < 5;
                                        const isClassHours = isWeekday && hour >= 8 && hour < 18;
                                        const isSleepHours = hour >= 23 || hour < 6 || (!isWeekday && hour < 7);
                                        return (
                                            <div key={di}
                                                className={`h-12 border-t border-edge/30 ${isClassHours ? 'bg-scarlet/[0.04]' :
                                                    isSleepHours ? 'bg-indigo/[0.04]' : ''
                                                    }`}
                                            />
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                            {/* Study blocks */}
                            {studyBlocks.map((block, idx) => (
                                <div key={idx}
                                    className="absolute rounded-lg text-xs font-medium text-pure px-2 py-1 overflow-hidden cursor-pointer hover:brightness-125 transition-all group"
                                    style={{
                                        left: `calc(60px + ${block.day} * ((100% - 60px) / 7))`,
                                        width: `calc((100% - 60px) / 7 - 4px)`,
                                        top: `${(block.start - 6) * 48}px`,
                                        height: `${block.duration * 48 - 4}px`,
                                        backgroundColor: `${block.color}25`,
                                        borderLeft: `3px solid ${block.color}`,
                                    }}>
                                    <div className="truncate font-semibold text-[11px]">{block.title}</div>
                                    <div className="text-[9px] opacity-70 truncate">{block.courseName}</div>
                                    {/* Tooltip on hover */}
                                    <div className="hidden group-hover:block absolute left-full top-0 ml-2 z-50 p-2 rounded-lg bg-obsidian border border-edge shadow-xl text-xs whitespace-nowrap">
                                        <p className="font-semibold text-pure">{block.title}</p>
                                        <p className="text-silver">{block.courseName}</p>
                                        <p className="text-slate mt-1">Due: {block.dueDate}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {studyBlocks.length === 0 && (
                        <div className="text-center py-12 text-slate">
                            <CalendarDays size={32} className="mx-auto mb-3 text-slate/50" />
                            <p className="text-sm">No upcoming tasks to schedule.</p>
                            <p className="text-xs mt-1">Sync your Google Classroom to populate your schedule.</p>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default Schedule;
