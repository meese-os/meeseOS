import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useWindowSize } from "@react-hook/window-size/throttled";
import ProjectCard from "./ProjectCard";
import {
  gitHubUsername,
  gitHubQuery,
  projectsLength,
} from "../../editable-stuff/configurations.json";

const Project = () => {
  const [recentProjects, setRecentProjectsArray] = useState([]);
  const [popularProjects, setPopularProjectsArray] = useState([]);
  const [width] = useWindowSize({ fps: 60 });

  const getGitHubData = useCallback((e) => {
    const headers = {
      auth: {
        username: gitHubUsername,
        password: process.env.REACT_APP_OAUTH_TOKEN
      }
    }

    let data;
    axios
      .get("https://api.github.com/users/" + gitHubUsername + gitHubQuery, headers)
      .then(response => {
        data = response.data;
        setRecentProjectsArray(response.data.slice(0, projectsLength))
      })
      .catch(error => console.error(error.message))
      .finally(() => {
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
