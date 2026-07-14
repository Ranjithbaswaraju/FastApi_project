/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
        '5xl': '3840px', // 4K displays
      },
      maxWidth: {
        '8xl': '1920px',
        '9xl': '2560px',
        '10xl': '3840px',
      }
    },
  },
  plugins: [],
}
