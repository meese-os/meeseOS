import config from "@meese-os/eslint-config";
import jestPlugin from "eslint-plugin-jest";

export default [
	...config,
	{
		files: ["**/__tests__/**", "**/__mocks__/**", "**/*.test.js"],
		plugins: {
			jest: jestPlugin,
		},
		languageOptions: {
			globals: {
				describe: "readonly",
				test: "readonly",
				expect: "readonly",
				it: "readonly",
				beforeAll: "readonly",
				afterAll: "readonly",
				beforeEach: "readonly",
				afterEach: "readonly",
				jest: "readonly",
			},
		},
		rules: {
			...jestPlugin.configs.recommended.rules,
		},
	},
];
