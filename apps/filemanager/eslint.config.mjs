import config from "@meese-os/eslint-config";

export default [
	...config,
	{
		files: ["__tests__/**/*.js"],
		languageOptions: {
			globals: {
				describe: "readonly",
				expect: "readonly",
				jest: "readonly",
				test: "readonly",
			},
		},
	},
];
