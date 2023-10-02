import React, { useEffect, useState } from "react";
import {
	gitHubQuery,
	projectsLength,
} from "../../editable-stuff/configurations.json";
import { useWindowSize } from "@react-hook/window-size/throttled";
import ProjectCard from "./ProjectCard";

/**
 * Creates the Projects section of the Home page.
 * @param {Application} proc MeeseOS Application instance reference
 * @returns {React.JSX.Element}
 */
const Project = ({ proc }) => {
	const [recentProjects, setRecentProjectsArray] = useState([]);
	const [popularProjects, setPopularProjectsArray] = useState([]);
	const [width] = useWindowSize({ fps: 60 });

	async function getGitHubData() {
		const res = await proc.request("/github_data", {
			method: "post",
			body: { gitHubQuery, projectsLength },
		});

		if (res.error) {
			console.error(res.error);
			setRecentProjectsArray([]);
			setPopularProjectsArray([]);
		} else {
			setRecentProjectsArray(res.recent);
			setPopularProjectsArray(res.popular);
		}
	}

	useEffect(() => {
		getGitHubData();
	}, []);

	return (
		<div id="projects" className="jumbotron jumbotron-fluid bg-transparent m-0">
			{popularProjects.length ? (
				<div
					id="popularProjects"
					className={`container container-fluid p-${width > 560 ? "5" : "4"}`}
				>
					<h1 className="display-4 pb-4">Most Popular Projects</h1>
					<div className="row">
						{popularProjects.map((project, index) => (
							<ProjectCard
								key={project.id}
								id={project.id}
								value={project}
								index={index}
								proc={proc}
							/>
						))}
					</div>
				</div>
			) : <></>}

			{/* NOTE: When a project is starred, it will show as recently updated with the old date */}
			{recentProjects.length ? (
				<div
					id="recentProjects"
					className={`container container-fluid p-${width > 560 ? "5" : "4"}`}
				>
					<h1 className="display-4 pb-4">Recently Updated Projects</h1>
					<div className="row row-cols-1 row-cols-md-6">
						{recentProjects.map((project, index) => (
							<ProjectCard
								key={project.id}
								id={project.id}
								value={project}
								index={index}
								proc={proc}
							/>
						))}
					</div>
				</div>
			) : <></>}
		</div>
	);
};

export default Project;
