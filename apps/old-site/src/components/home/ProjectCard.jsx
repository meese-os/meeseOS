import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

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
				<div className="card-body">
					<a
						href={svn_url}
						target=" _blank"
						className="text-dark text-decoration-none"
					>
						<h5 className="card-title d-inline-block">{name} </h5>
					</a>
					<p className="card-text">{description} </p>
					<hr />
					<Languages value={languages_url} svn_url={svn_url} />
					<p className="card-text d-flex justify-content-between">
						<a
							href={svn_url + "/stargazers"}
							target=" _blank"
							className="text-dark text-decoration-none"
						>
							<span className="text-dark card-link mr-4">
								<i className="fab fa-github" /> Stars{" "}
								<span className="badge badge-dark">{stargazers_count}</span>
							</span>
						</a>
						<small className="text-muted">Updated {updated_at}</small>
					</p>
				</div>
			</div>
		</div>
	);
};

const Languages = ({ value, svn_url }) => {
	const [data, setData] = useState([]);

	const getLanguages = useCallback((e) => {
		axios
			.get(value, {
				auth: {
					username: process.env.GH_USERNAME,
					password: process.env.GH_PAT
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
			{array.map((language) => (
				<a
					key={language}
					className="badge badge-light card-link mr-2 mb-1 ml-0"
					href={svn_url + `/search?l=${language}`}
					target=" _blank"
				>
					{language}: {Math.trunc((data[language] / total_count) * 1000) / 10}%
				</a>
			))}
		</div>
	);
};

export default ProjectCard;
