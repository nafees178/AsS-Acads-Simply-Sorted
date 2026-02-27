import React from 'react';

interface CardProps {
    readonly children: React.ReactNode;
    readonly className?: string;
    readonly hover?: boolean;
    readonly onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = true, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`glass rounded-[var(--radius-card)] p-6 glow-card transition-all duration-250 ${hover ? 'hover:-translate-y-0.5 hover:border-indigo/20 cursor-pointer' : ''
                } ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;
