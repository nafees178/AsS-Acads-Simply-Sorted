import React from 'react';
import { Bell, Mail, MessageSquare, Webhook, Volume2, X, Check } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { PriorityBadge } from '../components/shared/PriorityBadge';
import { notifications, courses } from '../data/mockData';

const milestones = ['2 days', '1 day', '12 hours', '6 hours', '3 hours', '1 hour'];

const Notifications: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Active Alerts */}
            <div className="space-y-3">
                <h3 className="font-[Outfit] text-lg font-semibold text-pure">Active Alerts</h3>
                {notifications.filter(n => !n.sent && n.urgency === 'critical').length === 0 && (
                    <Card hover={false} className="border-l-2 border-l-scarlet !p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-8 rounded-full bg-[#06B6D4]" />
                            <div>
                                <p className="text-sm font-medium text-pure">Organic Chemistry Lab Report</p>
                                <p className="text-xs font-mono text-scarlet">1d 14h remaining</p>
                            </div>
                            <PriorityBadge urgency="critical" />
                        </div>
                        <button className="text-slate hover:text-pure transition-colors"><X size={16} /></button>
                    </Card>
                )}
                <Card hover={false} className="border-l-2 border-l-amber !p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 rounded-full bg-[#F59E0B]" />
                        <div>
                            <p className="text-sm font-medium text-pure">Macroeconomics Quiz</p>
                            <p className="text-xs font-mono text-amber">2d 8h remaining</p>
                        </div>
                        <PriorityBadge urgency="approaching" />
                    </div>
                    <button className="text-slate hover:text-pure transition-colors"><X size={16} /></button>
                </Card>

                {/* Escalation Timeline */}
                <Card hover={false} className="!p-4">
                    <p className="text-xs font-medium text-silver mb-3">Urgency Escalation Timeline</p>
                    <div className="flex items-center gap-1">
                        {milestones.map((m, i) => (
                            <React.Fragment key={m}>
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`w-3 h-3 rounded-full ${i < 2 ? 'bg-emerald' : i === 2 ? 'bg-indigo animate-pulse ring-2 ring-indigo/30' : 'bg-elevated border border-edge'}`} />
                                    <span className="text-[9px] text-slate whitespace-nowrap">{m}</span>
                                </div>
                                {i < milestones.length - 1 && (
                                    <div className={`flex-1 h-px ${i < 2 ? 'bg-emerald' : 'bg-edge'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
                {/* Notification Timeline */}
                <div className="space-y-3">
                    <h3 className="font-[Outfit] text-lg font-semibold text-pure">Notification History</h3>
                    <div className="relative">
                        <div className="absolute left-3 top-0 bottom-0 w-px bg-edge" />
                        {notifications.map((notif) => (
                            <div key={notif.id} className="relative pl-8 pb-3">
                                <div className={`absolute left-1.5 top-2 w-3 h-3 rounded-full border-2 ${notif.sent ? 'border-emerald bg-emerald/30' : 'border-indigo bg-indigo/30'}`} />
                                <Card className={`!p-3 ${notif.sent ? 'opacity-60' : ''}`} hover={false}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {notif.sent && <Check size={12} className="text-emerald" />}
                                            <p className="text-sm text-pure">{notif.title}</p>
                                            <PriorityBadge urgency={notif.urgency} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {notif.channel === 'push' && <Bell size={12} className="text-slate" />}
                                            {notif.channel === 'email' && <Mail size={12} className="text-slate" />}
                                            {notif.channel === 'sms' && <MessageSquare size={12} className="text-slate" />}
                                            <span className="text-xs text-slate">{notif.time}</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Urgency Settings */}
                <div className="space-y-4">
                    <Card hover={false}>
                        <h3 className="font-[Outfit] text-base font-semibold text-pure mb-4">Notification Preferences</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-silver mb-2">Notification Schedule</p>
                                <div className="space-y-2">
                                    {milestones.map((m) => (
                                        <label key={m} className="flex items-center justify-between">
                                            <span className="text-sm text-silver">{m} before</span>
                                            <div className="relative">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-9 h-5 bg-elevated rounded-full peer-checked:bg-indigo transition-colors cursor-pointer" />
                                                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-pure rounded-full peer-checked:translate-x-4 transition-transform cursor-pointer" />
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t border-edge pt-4">
                                <p className="text-xs text-silver mb-2">Escalation Intensity</p>
                                <div className="flex gap-1">
                                    {['Calm', 'Standard', 'Intense', 'Maximum'].map((level, i) => (
                                        <button key={level} className={`flex-1 px-2 py-1.5 text-xs rounded-[var(--radius-button)] transition-colors ${i === 1 ? 'bg-indigo text-pure' : 'bg-elevated text-silver hover:text-pure'}`}>
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t border-edge pt-4">
                                <p className="text-xs text-silver mb-2">Delivery Channels</p>
                                <div className="space-y-2">
                                    {[{ icon: <Bell size={14} />, label: 'Push' }, { icon: <Mail size={14} />, label: 'Email' }, { icon: <MessageSquare size={14} />, label: 'SMS' }, { icon: <Webhook size={14} />, label: 'Webhook' }].map((ch) => (
                                        <label key={ch.label} className="flex items-center justify-between">
                                            <span className="flex items-center gap-2 text-sm text-silver">{ch.icon} {ch.label}</span>
                                            <div className="relative">
                                                <input type="checkbox" defaultChecked={ch.label !== 'Webhook'} className="sr-only peer" />
                                                <div className="w-9 h-5 bg-elevated rounded-full peer-checked:bg-indigo transition-colors cursor-pointer" />
                                                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-pure rounded-full peer-checked:translate-x-4 transition-transform cursor-pointer" />
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t border-edge pt-4">
                                <p className="text-xs text-silver mb-2">Sound</p>
                                <div className="flex gap-2">
                                    <select className="flex-1 px-3 py-2 bg-elevated rounded-[var(--radius-button)] border border-edge text-sm text-silver focus:border-indigo focus:outline-none">
                                        <option>Default Alert</option>
                                        <option>Gentle Chime</option>
                                        <option>Urgent Alarm</option>
                                    </select>
                                    <button className="p-2 bg-elevated rounded-[var(--radius-button)] text-silver hover:text-pure transition-colors"><Volume2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Per-Course Preferences */}
                    <Card hover={false}>
                        <h3 className="font-[Outfit] text-base font-semibold text-pure mb-3">Per-Course Preferences</h3>
                        <div className="space-y-2">
                            {courses.slice(0, 4).map((course) => (
                                <div key={course.id} className="flex items-center justify-between p-2 rounded-[var(--radius-button)] bg-elevated/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: course.color }} />
                                        <span className="text-sm text-silver">{course.name}</span>
                                    </div>
                                    <div className="relative">
                                        <input type="checkbox" defaultChecked className="sr-only peer" />
                                        <div className="w-9 h-5 bg-obsidian rounded-full peer-checked:bg-indigo transition-colors cursor-pointer" />
                                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-pure rounded-full peer-checked:translate-x-4 transition-transform cursor-pointer" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
