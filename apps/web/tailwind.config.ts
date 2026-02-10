import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ruins of the Future palette
        background: '#05060b',
        foreground: '#e8e6e3',
        
        // Primary colors
        gold: {
          DEFAULT: '#d4a853',
          light: '#e5c06d',
          dark: '#b8903d',
        },
        
        // Drift accent colors
        drift: {
          teal: '#4ea5d9',
          purple: '#8b7ab8',
          blue: '#6a92c7',
        },
        
        // Neutral grays (void)
        void: {
          50: '#f5f5f6',
          100: '#e8e8ea',
          200: '#d1d1d4',
          300: '#b0b0b6',
          400: '#8a8a92',
          500: '#6e6e77',
          600: '#5a5a63',
          700: '#4c4c53',
          800: '#414147',
          900: '#39393e',
          950: '#05060b',
        },
        
        // Semantic colors
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#f87171',
        
        // Legacy shadcn colors (keep for compatibility)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      
      fontFamily: {
        display: ['var(--font-cinzel)', 'serif'],
        body: ['var(--font-space-grotesk)', 'sans-serif'],
        ui: ['var(--font-rajdhani)', 'sans-serif'],
      },
      
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 8s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'drift': 'drift 20s ease-in-out infinite',
        'ambient': 'ambient 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(10px, 10px)' },
          '50%': { transform: 'translate(-5px, 20px)' },
          '75%': { transform: 'translate(-15px, 5px)' },
        },
        ambient: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      
      backgroundImage: {
        'starfield': 'radial-gradient(circle at 20% 50%, rgba(78, 165, 217, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 122, 184, 0.15) 0%, transparent 50%)',
        'gold-gradient': 'linear-gradient(135deg, #d4a853 0%, #e5c06d 100%)',
        'drift-gradient': 'linear-gradient(135deg, #4ea5d9 0%, #8b7ab8 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
