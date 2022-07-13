/*
 * For more information about authentication adapters, visit:
 * - https://manual.aaronmeese.com/tutorial/auth/
 * - https://manual.aaronmeese.com/guide/auth/
 * - https://manual.aaronmeese.com/development/
 */

const { readFileSync } = require("fs");
const { resolve } = require("path");
const { parse } = require("dotenv");

// https://stackoverflow.com/a/72708267/6456163
const authInfo = parse(readFileSync(resolve(__dirname, ".env")));

module.exports = (core, config) => ({
	async login(req, res) {
		const { username, password } = req.body;

		// The guest user's credentials will be passed automatically
		// when the "Login as Guest" button is clicked
		if (username === "guest" && password === "guest") {
			return {
				username,
				groups: ["guest"],
			};
		}

		// For the server administrator, give them the "admin" group;
		// this will need to be modified if you want multiple administrators
		if (authInfo["ADMIN_USERNAME"] === username && authInfo[username] === password) {
			return {
				username,
				groups: ["admin"],
			};
		}

		// For general users, give them the "user" group
		if (authInfo[username] === password) {
			return {
				username,
				groups: ["user"],
			};
		}

		// IDEA: Some kind of web3 integration here
		// IDEA: Add other providers here, like social login

		// Default deny if no match
		return false;
	},

	async logout(req, res) {
		return true;
	},

	async register(req, res) {
		throw new Error("Registration not available");
	},
});
