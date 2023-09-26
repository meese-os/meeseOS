const myAdapter = (_core, _config) => ({
	async login(values) {
		// You can transform the form values from login here if you want
		return values;
	},

	async logout() {
		// And perform special operations on logout
		return true;
	},

	async register(_values) {
		throw new Error("Registration not available");
	},
});

export default myAdapter;
