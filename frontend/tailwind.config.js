/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: '#c8aa6e',
        'gold-hover': '#e5c17e',
        'dark-blue': '#010a13',
        'medium-blue': '#091428',
        'bright-blue': '#0096ff',
        'text-color': '#f0e6d2',
        'border-color': '#1e2328',
        'win': '#284748',
        'win-border': '#00ccff',
        'loss': '#59343b',
        'loss-border': '#ff4655',
        'input-bg': '#1e2328',
        'input-border': '#3c3c3c',
        'medal-killer': '#ffcc00',
        'medal-feeder': '#ff4655',
        'medal-assist': '#00ccff',
        'medal-farm': '#00ff99',
        'medal-destructor': '#ff9900',
        'medal-firstblood': '#8b0000',
        'medal-immortal': '#e0e0e0',
        'medal-visionary': '#9b30ff',
        'medal-carry': '#ff4500',
        'team-blue': '#3498DB',
        'team-red': '#E74C3C',
        'pool-yellow': '#F1C40F',
        'pool-blue': '#3498DB',
        'pool-red': '#E74C3C',
        'pool-green': '#2ECC71',
        'pool-orange': '#E67E22',
        'pool-purple': '#9B59B6',
        'pool-pink': '#FF69B4',
        'pool-aquamarine': '#7FFFD4',
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
        mono: ['monospace'],
      },
      backgroundImage: {
        'pentakill': 'linear-gradient(45deg, #ff0000, #ffcc00)',
      }
    },
  },
  plugins: [],
}
