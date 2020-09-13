import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import ProjectCard from "./ProjectCard";
import {
  gitHubUsername,
  gitHubQuery,
  projectsLength,
} from "../../editable-stuff/configurations.json";
require('dotenv').config();

const Project = () => {
  const [recentProjects, setRecentProjectsArray] = useState([]);
  const [popularProjects, setPopularProjectsArray] = useState([]);

  const getGitHubData = useCallback((e) => {
    // TODO: Find an alternative for GitHub pages, since these
    // values will not be available and the rate limit still applies
    const headers = {
      auth: {
        username: process.env.GH_USERNAME,
        password: process.env.OAUTH_TOKEN
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
      {/* TODO: Add static content for if the rate limit is exceeded */}
      {popularProjects.length && (
        <div className="container container-fluid p-5">
          <h1 className="display-4 pb-4">Most Popular Projects</h1>
          <div className="row">
            {popularProjects.map((project, index) => (
              <ProjectCard key={project.id} id={project.id} value={project} index={index} />
            ))}
          </div>
        </div>
      )}

      {recentProjects.length && (
        <div className="container container-fluid p-5">
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
