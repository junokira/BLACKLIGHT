export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./**/*.{js,jsx,ts,tsx}",
    "./blacklight-*.jsx",
  ],
  theme: {
    extend: {
      colors: {
        sage: "#BFC1A6",
        sageDeep: "#7B7D66",
        sageInk: "#2B2D23",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderWidth: {
        3: '3px',
        4: '4px',
      },
    },
  },
  plugins: [],
}


