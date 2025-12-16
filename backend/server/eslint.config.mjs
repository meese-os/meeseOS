import config from "@meese-os/eslint-config";
import jestPlugin from "eslint-plugin-jest";

export default [
	...config,
	{
		plugins: {
			jest: jestPlugin,
		},
		rules: {
			...jestPlugin.configs.recommended.rules,
		},
		overrides: [
			{
				files: ["**/__tests__/**", "**/__mocks__/**", "**/*.test.js"],
				env: {
					jest: true,
				},
			},
		],
	},
];
