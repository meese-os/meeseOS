module.exports = (core, config) => ({
	 login(values) {
		// You can transform the form values from login here if you want
		return values;
	},

	 logout() {
		// And perform special operations on logout
		return true;
	}
});
