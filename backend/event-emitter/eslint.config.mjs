import config from "@meese-os/eslint-config";
import jestPlugin from "eslint-plugin-jest";

export default [
	...config,
	{
		ignores: ["__test__/"],
	},
	{
		plugins: {
			jest: jestPlugin,
		},
		rules: {
			...jestPlugin.configs.recommended.rules,
		},
	},
];
