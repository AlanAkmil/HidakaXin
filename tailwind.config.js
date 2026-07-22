/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#f6f6f8',
          card: '#ffffff',
          soft: '#f0eff3'
        },
        ink: {
          DEFAULT: '#18181b',
          soft: '#5b5b63',
          faint: '#9a9aa2'
        },
        accent: {
          DEFAULT: '#ff5a36',
          50: '#fff1ec',
          600: '#e6491f'
        },
        gold: {
          DEFAULT: '#f2a900',
          soft: '#fff3d6'
        },
        violet: {
          DEFAULT: '#7c5cff',
          soft: '#efeaff'
        },
        line: '#e7e6ea'
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)']
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(-14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-up': 'fade-up 420ms cubic-bezier(.16,1,.3,1) forwards'
      },
      boxShadow: {
        card: '0 1px 2px rgba(24,24,27,0.04), 0 8px 20px -12px rgba(24,24,27,0.12)',
        nav: '0 8px 30px -8px rgba(24,24,27,0.18)'
      }
    }
  },
  plugins: []
};
