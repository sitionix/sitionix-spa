const path = require("node:path");

module.exports = {
  plugins: {
    "@tailwindcss/postcss": {
      config: path.resolve(__dirname, "./tailwind.config.ts"),
    },
    autoprefixer: {},
  },
};
