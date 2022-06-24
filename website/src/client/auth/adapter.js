module.exports = (core, config) => ({
	async login(values) {
		// You can transform the form values from login here if you want
		return values;
	},

	async logout() {
		// And perform special operations on logout
		return true;
	}
});
