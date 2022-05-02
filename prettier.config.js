module.exports = {
  useTabs: true,
  tabWidth: 2,
  singleQuote: false,
  jsxSingleQuote: false,
  trailingComma: "es5",
  overrides: [
    {
      files: ["*.json", "prettier.config.js"],
      options: {
        useTabs: false,
      },
    },
  ],
};
