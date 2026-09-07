/**
 * Standardized color palette for donation flow
 * Ensures consistent styling across all donation pages
 */

export const DONATION_COLORS = {
  // Primary brand color - Green (used throughout donation flow)
  primary: {
    main: '#16a34a',        // Green-600
    light: '#dcfce7',       // Green-50
    lighter: 'rgba(22, 163, 74, 0.08)',
    lightest: 'rgba(22, 163, 74, 0.04)',
  },

  // Success states - Emerald green
  success: {
    main: '#10b981',        // Emerald-600
    light: '#d1fae5',       // Emerald-50
  },

  // Warning/Info
  warning: {
    main: '#f59e0b',        // Amber-500
    light: '#fef3c7',       // Amber-50
  },

  // Neutral/Text colors
  text: {
    primary: '#111827',     // Gray-900
    secondary: '#6b7280',   // Gray-500
    tertiary: '#9ca3af',    // Gray-400
    muted: '#d1d5db',       // Gray-300
  },

  // Backgrounds
  background: {
    light: '#f9fafb',       // Gray-50
    card: '#ffffff',        // White
    hover: '#f3f4f6',       // Gray-100
  },

  // Borders
  border: {
    light: '#e5e7eb',       // Gray-200
    lighter: '#f3f4f6',     // Gray-100
  },
} as const

/**
 * Icon styling configuration
 */
export const DONATION_ICON_SIZES = {
  container: {
    small: 'h-12 w-12',     // 48px
    medium: 'h-16 w-16',    // 64px
    large: 'h-20 w-20',     // 80px
  },
  icon: {
    small: 'h-6 w-6',       // 24px
    medium: 'h-8 w-8',      // 32px
    large: 'h-12 w-12',     // 48px
  },
} as const

/**
 * Tailwind class combinations for hero sections
 * Ensures consistency across all pages
 */
export const DONATION_HERO_VARIANTS = {
  green: {
    container: 'bg-green-100',
    icon: 'text-green-600',
  },
  emerald: {
    container: 'bg-emerald-100',
    icon: 'text-emerald-600',
  },
} as const
