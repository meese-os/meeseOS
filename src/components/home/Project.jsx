import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import ProjectCard from "./ProjectCard";
import {
  projectHeading,
  gitHubLink,
  gitHubUsername,
  gitHubQuery,
  projectsLength,
} from "../../editable-stuff/configurations.json";
import { useWindowSize } from "@react-hook/window-size/throttled";
require('dotenv').config();

const Project = () => {
  const [width] = useWindowSize({ fps: 60 });
  const [projectsArray, setProjectsArray] = useState([]);

  // TODO: Add support for most popular projects section with sort=stars
  const handleRequest = useCallback((e) => {
    // TODO: Find an alternative for GitHub pages, since these
    // values will not be available and the rate limit still applies
    const headers = {
      auth: {
        username: process.env.GH_USERNAME,
        password: process.env.OAUTH_TOKEN
      }
    }

    axios
      .get(gitHubLink + gitHubUsername + gitHubQuery, headers)
      .then((response) => setProjectsArray(response.data.slice(0, projectsLength)))
      .catch(error => console.error(error.message))
      .finally(() => {});
  }, []);

  useEffect(() => handleRequest(), [handleRequest]);

  return (
    <div id="projects" className="jumbotron jumbotron-fluid bg-transparent m-0">
      {projectsArray.length && (
        <div className="container container-fluid p-5">
          <h1 className={`display-4 pb-${width < 1200 ? "6" : "5"}`} style={{marginBottom: "17.5px"}}>{projectHeading}</h1>
          <div className="row">
            {projectsArray.map((project) => (
              <ProjectCard key={project.id} id={project.id} value={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Project;
