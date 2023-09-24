module.exports = {
	extends: "stylelint-config-standard",
	plugins: ["stylelint-scss"],
	rules: {
		"selector-class-pattern": /^[A-Za-z-_]+$/,
		"selector-id-pattern": /^[A-Za-z-_]+$/,
		"at-rule-no-unknown": [
			true,
			{
				ignoreAtRules: ["extend", "mixin", "include", "each", "use"],
			},
		],
		"function-no-unknown": [
			true,
			{
				ignoreFunctions: ["color.adjust"],
			},
		],
		"font-family-no-missing-generic-family-keyword": [
			true,
			{
				ignoreFontFamilies: ["FontAwesome", "Terminal"],
			},
		],
		"indentation": "tab",
	},
};
