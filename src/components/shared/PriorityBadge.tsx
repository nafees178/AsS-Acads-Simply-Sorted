import React from 'react';

interface PriorityBadgeProps {
    readonly urgency: 'critical' | 'approaching' | 'ontrack';
}

const config = {
    critical: { label: 'Critical', bg: 'bg-scarlet/15', text: 'text-scarlet' },
    approaching: { label: 'Approaching', bg: 'bg-amber/15', text: 'text-amber' },
    ontrack: { label: 'On Track', bg: 'bg-emerald/15', text: 'text-emerald' },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ urgency }) => {
    const { label, bg, text } = config[urgency];
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-pill)] text-xs font-medium ${bg} ${text}`}>
            {label}
        </span>
    );
};

export default PriorityBadge;
