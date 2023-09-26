module.exports = (_core, _config) => ({
	login(req, _res) {
		const { username } = req.body;

		return {
			username,
			groups: ["admin"],
		};
	},

	logout(_req, _res) {
		return true;
	},

	register(_req, _res) {
		throw new Error("Registration not available");
	},
});
