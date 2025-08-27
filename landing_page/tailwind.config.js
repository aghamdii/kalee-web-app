/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'kalee-primary': '#16A34A',
        'kalee-secondary': '#0EA5E9',
      },
    },
  },
  plugins: [],
  // Enable RTL support
  corePlugins: {
    // Enable direction variants
    preflight: true,
  },
  // Add custom RTL utilities
  future: {
    respectDefaultRingColorOpacity: {
      respectDefaultRingColorOpacity: true
    }
  }
}