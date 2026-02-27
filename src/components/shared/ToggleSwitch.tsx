import React from 'react';

interface ToggleSwitchProps {
    readonly checked: boolean;
    readonly onChange: (checked: boolean) => void;
    readonly label?: string;
    readonly icon?: React.ReactNode;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label, icon }) => {
    return (
        <label className="flex items-center justify-between cursor-pointer group">
            {(label || icon) && (
                <span className="flex items-center gap-2 text-sm text-silver group-hover:text-pure transition-colors">
                    {icon} {label}
                </span>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`toggle-track ${checked ? 'toggle-track-active' : ''}`}
            >
                <span className={`toggle-thumb ${checked ? 'toggle-thumb-active' : ''}`} />
            </button>
        </label>
    );
};

export default ToggleSwitch;
