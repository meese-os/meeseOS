import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
require('dotenv').config();

const ProjectCard = ({ value, index }) => {
  const [updated_at, setUpdatedAt] = useState("0 mints");

  const handleUpdateTime = useCallback(
    (e) => {
      const date = new Date(value.pushed_at);
      const nowdate = new Date();
      const diff = nowdate.getTime() - date.getTime();
      const hours = Math.trunc(diff / 1000 / 60 / 60);

      if (hours < 24) {
        if (hours < 1) return setUpdatedAt("just now");
        let measurement = hours === 1 ? "hour" : "hours";
        return setUpdatedAt(`${hours.toString()} ${measurement} ago`);
      } else {
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December"
        ];
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();

        return setUpdatedAt(`on ${day} ${monthNames[monthIndex]} ${year}`);
      }
    },
    [value.pushed_at]
  );

  useEffect(() => handleUpdateTime(), [handleUpdateTime]);

  const { name, description, svn_url, stargazers_count, languages_url } = value;
  return (
    <div className={`col-md-6 ${index > 1 ? "d-none d-lg-block" : ""}`}>
      {/* ^sets only two repo cards to display per section on screens smaller than 992px */}
      <div className="card shadow-lg p-3 mb-5 bg-white rounded">
        {/* <img src="" className="card-img-top" alt="..." /> */}
        <div className="card-body">
          <h5 className="card-title">{name} </h5>
          <p className="card-text">{description} </p>
          <a
            href={`${svn_url}/archive/master.zip`}
            className="btn btn-outline-secondary mr-3 d-none d-lg-inline-block"
          >
            <i className="fab fa-github" /> Clone Project
          </a>
          <a
            href={svn_url}
            target=" _blank"
            className="btn btn-outline-secondary"
          >
            <i className="fab fa-github" /> Repo
          </a>
          <hr />
          <Language value={languages_url} />
          <p className="card-text">
            <span className="text-dark card-link mr-4">
              <i className="fab fa-github" /> Stars{" "}
              <span className="badge badge-dark">{stargazers_count}</span>
            </span>
            <small className="text-muted">Updated {updated_at}</small>
          </p>
        </div>
      </div>
    </div>
  );
};

const Language = ({ value }) => {
  const [data, setData] = useState([]);

  const getLanguages = useCallback((e) => {
    axios
      .get(value, {
        auth: {
          username: process.env.GH_USERNAME,
          password: process.env.OAUTH_TOKEN
        }
      })
      .then(response => setData(response.data))
      .catch(error => console.error(error.message))
      .finally(() => {});
  }, [value]);

  useEffect(() => getLanguages(), [getLanguages]);

  const array = [];
  let total_count = 0;
  for (let index in data) {
    array.push(index);
    total_count += data[index];
  }

  if (!array.length) return null;
  return (
    <div className="pb-3">
      Languages:{" "}
      {array.map((language, index) => (
        <p key={language} className={`badge badge-light card-link ${index > 0 ? "ml-2" : ""}`}>
          {language}: {Math.trunc((data[language] / total_count) * 1000) / 10}%
        </p>
      ))}
    </div>
  );
};

export default ProjectCard;
