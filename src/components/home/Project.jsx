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

const Project = () => {
  const [width, height] = useWindowSize({ fps: 60 });
  const [projectsArray, setProjectsArray] = useState([]);

  // TODO: Add support for most popular projects section with sort=stars
  const handleRequest = useCallback((e) => {
    axios
      .get(gitHubLink + gitHubUsername + gitHubQuery)
      .then((response) => {
        // handle success
        // console.log(response.data.slice(0, 4));
        return setProjectsArray(response.data.slice(0, projectsLength));
      })
      .catch(error => console.error(error.message))
      .finally(() => {
        // always executed
      });
  }, []);

  useEffect(() => {
    handleRequest();
  }, [handleRequest]);

  return (
    <div id="projects" className="jumbotron jumbotron-fluid bg-transparent m-0">
      {projectsArray.length && (
        <div className="container container-fluid p-5">
          <h1 className={`display-4 pb-${width < 1200 ? "6" : "5"}`}>{projectHeading}</h1>
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
