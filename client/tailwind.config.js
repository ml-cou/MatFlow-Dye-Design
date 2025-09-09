/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        p1: "#0A4D68",
        p2: "#088395",
        p3: "#05BFDB",
        p4: "#00FFCA",
        text: "#0f1419",
        bg: "#ffffff",
        "primary-btn": "#00ba7c",
        "secondary-btn": "#f2f2f2",
        "danger-btn":"		#ff0505",
        accent: "#7fdcbd",
      },
      fontFamily: {
        titillium: ["Titillium Web", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
