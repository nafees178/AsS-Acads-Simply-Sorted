import React from 'react';

interface PriorityBadgeProps {
    readonly urgency: string;
}

const config: Record<string, { label: string, bg: string, text: string }> = {
    critical: { label: 'Critical', bg: 'bg-scarlet/15', text: 'text-scarlet' },
    approaching: { label: 'Approaching', bg: 'bg-amber/15', text: 'text-amber' },
    ontrack: { label: 'On Track', bg: 'bg-emerald/15', text: 'text-emerald' },
    completed: { label: 'Completed', bg: 'bg-emerald/15', text: 'text-emerald' },
    incomplete: { label: 'Incomplete', bg: 'bg-scarlet/15', text: 'text-scarlet' },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ urgency }) => {
    const badge = config[urgency?.toLowerCase()] || config.approaching;
    const { label, bg, text } = badge;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-pill)] text-xs font-medium ${bg} ${text}`}>
            {label}
        </span>
    );
};

export default PriorityBadge;
