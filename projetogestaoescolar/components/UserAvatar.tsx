import React from 'react';

interface UserAvatarProps {
    name: string;
    photoUrl?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    ring?: boolean;
}

const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name: string) => {
    if (!name) return 'bg-gray-500';
    const colors = [
        'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500',
        'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500',
        'bg-orange-500', 'bg-cyan-500', 'bg-rose-500', 'bg-violet-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
    name,
    photoUrl,
    size = 'md',
    className = '',
    ring = true
}) => {
    const sizeClasses = {
        'xs': 'w-6 h-6 text-[10px]',
        'sm': 'w-8 h-8 text-xs',
        'md': 'w-10 h-10 text-sm',
        'lg': 'w-12 h-12 text-base',
        'xl': 'w-16 h-16 text-xl'
    };

    const baseClasses = `rounded-full flex items-center justify-center text-white font-bold object-cover shrink-0 transition-all duration-300 hover:scale-105`;
    const ringClasses = ring ? 'ring-2 ring-gray-800' : '';

    if (photoUrl && photoUrl.trim() !== '') {
        return (
            <img
                src={photoUrl}
                alt={name}
                className={`${baseClasses} ${sizeClasses[size]} ${ringClasses} ${className}`}
                onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = `${baseClasses} ${sizeClasses[size]} ${ringClasses} ${getAvatarColor(name)} ${className}`;
                        fallback.innerText = getInitials(name);
                        parent.appendChild(fallback);
                    }
                }}
            />
        );
    }

    return (
        <div className={`${baseClasses} ${sizeClasses[size]} ${ringClasses} ${getAvatarColor(name)} ${className}`}>
            {getInitials(name)}
        </div>
    );
};
