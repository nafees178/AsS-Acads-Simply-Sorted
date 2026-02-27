import React from 'react';

interface ButtonProps {
    readonly children: React.ReactNode;
    readonly variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    readonly size?: 'sm' | 'md' | 'lg';
    readonly className?: string;
    readonly onClick?: () => void;
    readonly disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children, variant = 'primary', size = 'md', className = '', onClick, disabled = false,
}) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-button)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-indigo text-pure hover:bg-indigo-light hover:glow-indigo',
        secondary: 'bg-transparent border border-indigo text-indigo hover:bg-indigo/10',
        danger: 'bg-scarlet text-pure hover:glow-scarlet',
        ghost: 'bg-transparent text-teal hover:text-pure',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
            {children}
        </button>
    );
};

export default Button;
