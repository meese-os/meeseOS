const myAdapter = (_core, _options) => ({
	// Create your own request here with 'values' settings
	save(_values) {
		return true;
	},

	// Create your own request here and return settings
	load() {
		return {};
	},
});

export default myAdapter;
