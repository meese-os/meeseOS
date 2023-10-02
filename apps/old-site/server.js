const axios = require("axios");
const path = require("path");
require("dotenv").config({
	path: path.resolve(__dirname, ".env"),
	override: true,
});

/**
 * Add routes for the application.
 * @param {Core} core MeeseOS Core instance reference
 * @param {Application} proc MeeseOS Application instance reference
 */
const init = async (core, proc) => {
	const { app } = core;
	const github_headers = {
		auth: {
			username: process.env.GH_USERNAME,
			password: process.env.GH_PAT,
		},
	};

	app.post(proc.resource("/language_data"), async (req, res) => {
		const languages_url = req.body.languages_url;

		axios
			.get(languages_url, github_headers)
			.then((response) => res.json(response.data))
			.catch((error) => {
				console.error(error.message);
				res.json({ error: error.message });
			});
	});

	app.post(proc.resource("/github_data"), async (req, res) => {
		const gitHubQuery = req.body.gitHubQuery;
		const projectsLength = req.body.projectsLength;

		axios
			.get(`https://api.github.com/users/${process.env.GH_USERNAME}${gitHubQuery}`, github_headers)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				console.error(error.message);
				res.json({ error: error.message });
			})
			.then((data) => {
				if (!data) {
					console.error("No data returned from GitHub");
					res.json({ error: "No data returned from GitHub" });
				}

				// Sort by most popular projects
				const popular = data.sort((a, b) =>
					a.stargazers_count > b.stargazers_count ? -1 : 1
				);

				res.json({
					popular: popular.slice(0, projectsLength),
					recent: data.slice(0, projectsLength),
				});
			});
	});
};

/**
 * The server module for the application.
 * @param {Core} core MeeseOS Core instance reference
 * @param @param {Application} proc MeeseOS Application instance reference
 * @returns {Object} The server module
 */
module.exports = (core, proc) => ({
	init: () => init(core, proc),
});
