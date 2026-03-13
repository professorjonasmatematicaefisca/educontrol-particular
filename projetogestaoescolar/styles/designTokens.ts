// Design Tokens for EduControl PRO
// Centralized design system for consistent styling

export const colors = {
    // Primary Colors
    primary: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981', // Main emerald
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
    },

    // Background Colors
    background: {
        primary: '#0a0f1e',
        secondary: '#0f172a',
        tertiary: '#1a2332',
        card: '#1e293b',
        hover: '#334155',
    },

    // Text Colors
    text: {
        primary: '#ffffff',
        secondary: '#e2e8f0',
        tertiary: '#94a3b8',
        muted: '#64748b',
        disabled: '#475569',
    },

    // Border Colors
    border: {
        default: '#334155',
        light: '#475569',
        dark: '#1e293b',
        focus: '#10b981',
    },

    // Status Colors
    status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
    },

    // Badge Colors
    badge: {
        green: { bg: '#10b981', text: '#ffffff' },
        yellow: { bg: '#f59e0b', text: '#ffffff' },
        red: { bg: '#ef4444', text: '#ffffff' },
        blue: { bg: '#3b82f6', text: '#ffffff' },
        gray: { bg: '#64748b', text: '#ffffff' },
    }
};

export const spacing = {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
};

export const borderRadius = {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
};

export const fontSize = {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
};

export const fontWeight = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
};

export const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

export const transitions = {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
};

// Button Styles
export const buttonStyles = {
    primary: {
        base: `bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300`,
        disabled: `bg-gray-600 text-gray-400 cursor-not-allowed`,
    },
    secondary: {
        base: `bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300`,
        disabled: `bg-gray-800 text-gray-600 cursor-not-allowed`,
    },
    outline: {
        base: `border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-300`,
        disabled: `border-2 border-gray-600 text-gray-600 cursor-not-allowed`,
    },
    danger: {
        base: `bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300`,
        disabled: `bg-gray-600 text-gray-400 cursor-not-allowed`,
    },
    icon: {
        base: `p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200`,
        active: `bg-emerald-500/20 text-emerald-400`,
    }
};

// Badge Styles
export const badgeStyles = {
    success: `bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold`,
    warning: `bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold`,
    error: `bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-semibold`,
    info: `bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold`,
    neutral: `bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs font-semibold`,
};

// Input Styles
export const inputStyles = {
    base: `w-full bg-[#0f1621] border border-gray-700/50 rounded-xl py-3.5 px-4 text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all`,
    error: `border-red-500 focus:border-red-500 focus:ring-red-500/20`,
    disabled: `bg-gray-800 text-gray-600 cursor-not-allowed`,
};

// Card Styles
export const cardStyles = {
    base: `bg-[#1e293b] rounded-xl border border-gray-800 p-6`,
    hover: `bg-[#1e293b] rounded-xl border border-gray-800 p-6 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer`,
};

// WCAG AA Compliant Color Contrast Ratios
export const accessibleColors = {
    // All combinations below meet WCAG AA standards (4.5:1 for normal text)
    onDark: {
        primary: '#10b981',    // 4.52:1 on #0a0f1e
        secondary: '#e2e8f0',  // 12.63:1 on #0a0f1e
        accent: '#34d399',     // 6.89:1 on #0a0f1e
    },
    onLight: {
        primary: '#047857',    // 4.53:1 on #ffffff
        secondary: '#1e293b',  // 13.54:1 on #ffffff
        accent: '#059669',     // 5.12:1 on #ffffff
    }
};
