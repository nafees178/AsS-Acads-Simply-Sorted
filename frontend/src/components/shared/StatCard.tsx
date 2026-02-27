import React from 'react';
import { Card } from './Card';

interface StatCardProps {
    readonly label: string;
    readonly value: string | number;
    readonly icon: React.ReactNode;
    readonly accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accentColor }) => {
    return (
        <Card hover={false} className="flex items-center gap-4">
            <div
                className="w-12 h-12 rounded-[var(--radius-button)] flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: accentColor ? `${accentColor}20` : 'rgba(124,58,237,0.15)', color: accentColor || '#7C3AED' }}
            >
                {icon}
            </div>
            <div>
                <p className="text-2xl font-semibold text-pure font-[Outfit]">{value}</p>
                <p className="text-xs text-silver">{label}</p>
            </div>
        </Card>
    );
};

export default StatCard;
