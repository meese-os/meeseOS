module.exports = (core, config) => ({
	login(req, res) {
		const { username } = req.body;

		return {
			username,
			groups: ["admin"],
		};
	},

	logout(req, res) {
		return true;
	},

	register(req, res) {
		throw new Error("Registration not available");
	},
});
