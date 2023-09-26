module.exports = (_core, _options) => ({
	// req.body has all settings from client
	async save(_req, _res) {
		return true;
	},

	// return all settings for user here
	async load(_req, _res) {
		return {};
	},
});
