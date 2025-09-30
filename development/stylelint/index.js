module.exports = {
	extends: "stylelint-config-standard-scss",
	plugins: ["@stylistic/stylelint-plugin"],
	rules: {
		"selector-class-pattern": /^[A-Za-z-_]+$/,
		"selector-id-pattern": /^[A-Za-z-_]+$/,
		"font-family-no-missing-generic-family-keyword": [
			true,
			{
				ignoreFontFamilies: ["FontAwesome", "Terminal"],
			},
		],
		"@stylistic/indentation": "tab",
		"declaration-property-value-no-unknown": null,
		"function-no-unknown": null,
	},
};
