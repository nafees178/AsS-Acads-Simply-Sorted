import React from 'react';

interface CourseTagProps {
    readonly name: string;
    readonly color: string;
}

export const CourseTag: React.FC<CourseTagProps> = ({ name, color }) => {
    return (
        <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-pill)] text-xs font-medium"
            style={{ backgroundColor: `${color}26`, color: color }}
        >
            {name}
        </span>
    );
};

export default CourseTag;
