const myAdapter = (core, options) => ({
	// Create your own request here with 'values' settings
	 save(values) {
		return true;
	},

	// Create your own request here and return settings
	 load() {
		return {};
	},
});

export default myAdapter;
