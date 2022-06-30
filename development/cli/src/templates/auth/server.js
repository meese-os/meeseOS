module.exports = (core, config) => ({
	async login(req, res) {
		const { username } = req.body;

		return {
			username,
			groups: ["admin"],
		};
	},

	async logout(req, res) {
		return true;
	},

	async register(req, res) {
		throw new Error("Registration not available");
	},
});
