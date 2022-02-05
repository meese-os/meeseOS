import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useWindowSize } from "@react-hook/window-size/throttled";
import ProjectCard from "./ProjectCard";
import {
	gitHubQuery,
	projectsLength,
} from "../../editable-stuff/configurations.json";

const Project = () => {
	const [recentProjects, setRecentProjectsArray] = useState([]);
	const [popularProjects, setPopularProjectsArray] = useState([]);
	const [width] = useWindowSize({ fps: 60 });

	const getGitHubData = useCallback((e) => {
		// TODO: Do this server-side, hide the PAT from users;
			// maybe https://medium.com/swlh/keeping-env-variables-private-in-react-app-fa44a9b33c31 ?
		const headers = {
			auth: {
				username: process.env.GH_USERNAME,
				password: process.env.GH_PAT
			}
		}

		axios
			.get("https://api.github.com/users/" + process.env.GH_USERNAME + gitHubQuery, headers)
			.then(response => {
				setRecentProjectsArray(response.data.slice(0, projectsLength));
				return response.data;
			})
			.catch(error => console.error(error.message))
			.then((data) => {
				// TODO: Handle this more elegantly, like displaying an error message
				if (!data) return;

				// Sort by most popular projects
				let popular = data.sort((a, b) => (a.stargazers_count > b.stargazers_count) ? -1 : 1);
				setPopularProjectsArray(popular.slice(0, projectsLength));
			});
	}, []);

	useEffect(() => getGitHubData(), [getGitHubData]);

	return (
		<div id="projects" className="jumbotron jumbotron-fluid bg-transparent m-0">
			{popularProjects.length && (
				<div id="popularProjects" className={`container container-fluid p-${width > 560 ? "5" : "4"}`}>
					<h1 className="display-4 pb-4">Most Popular Projects</h1>
					<div className="row">
						{popularProjects.map((project, index) => (
							<ProjectCard key={project.id} id={project.id} value={project} index={index} />
						))}
					</div>
				</div>
			)}

			{/* NOTE: When a project is starred, it will show as recently updated with the old date */}
			{recentProjects.length && (
				<div id="recentProjects" className={`container container-fluid p-${width > 560 ? "5" : "4"}`}>
					<h1 className="display-4 pb-4">Recently Updated Projects</h1>
					<div className="row">
						{recentProjects.map((project, index) => (
							<ProjectCard key={project.id} id={project.id} value={project} index={index} />
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default Project;
