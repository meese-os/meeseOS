module.exports = function(api) {
	api.cache(() => process.env.NODE_ENV === "production");

	return {
		presets: ["@babel/preset-env"],
		// https://github.com/webpack/webpack/issues/4039#issuecomment-274094298
		// plugins: ["@babel/plugin-transform-runtime"]
	};
};
