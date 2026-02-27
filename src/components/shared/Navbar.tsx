import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bell, Moon } from 'lucide-react';
import { navItems } from '../../data/mockData';

interface NavbarProps {
    readonly notificationCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ notificationCount = 3 }) => {
    const location = useLocation();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass">
            <div className="mx-auto max-w-[1440px] px-6 flex items-center justify-between h-16">
                <div className="flex items-center gap-8">
                    <h1 className="font-[Outfit] font-semibold text-lg bg-gradient-to-r from-indigo to-teal bg-clip-text text-transparent">
                        AsS
                    </h1>
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={() => {
                                    const isActive = location.pathname === item.path;
                                    return `px-3 py-2 text-sm font-medium rounded-[var(--radius-button)] transition-colors duration-150 ${isActive
                                            ? 'text-pure border-b-2 border-indigo'
                                            : 'text-silver hover:text-pure'
                                        }`;
                                }}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="relative p-2 rounded-[var(--radius-button)] text-silver hover:text-pure transition-colors">
                        <Bell size={20} />
                        {notificationCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-scarlet text-pure text-[10px] font-bold rounded-full flex items-center justify-center">
                                {notificationCount}
                            </span>
                        )}
                    </button>
                    <button className="p-2 rounded-[var(--radius-button)] text-silver hover:text-pure transition-colors">
                        <Moon size={20} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-indigo/30 border border-indigo/50 flex items-center justify-center text-xs font-semibold text-pure">
                        N
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
