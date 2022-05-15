module.exports = {
  useTabs: true,
  tabWidth: 2,
  singleQuote: false,
  jsxSingleQuote: false,
  semi: true,
  trailingComma: "es5",
  overrides: [
    {
      files: ["*.json", "prettier.config.js"],
      options: {
        useTabs: false,
        singleQuote: false,
        semi: true,
      },
    },
  ],
};
