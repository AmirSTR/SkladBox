/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAF7',
        ink: '#0F172A',
        muted: '#6B7280',
        teal: {
          50: '#EAF8F6',
          100: '#D6F0ED',
          600: '#0F8F83',
          700: '#08786F',
        },
        amber: {
          50: '#FFF7E8',
          100: '#FEECCB',
          600: '#D97706',
        },
        danger: {
          50: '#FDECEC',
          100: '#FAD7D7',
          600: '#DC2626',
        },
      },
      boxShadow: {
        soft: '0 14px 45px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
