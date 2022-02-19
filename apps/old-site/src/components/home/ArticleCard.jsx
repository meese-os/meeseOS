import React, { useCallback, useEffect, useState } from "react";
import { articlesLength } from "../../editable-stuff/configurations.json";

const ArticleCard = ({ value, index }) => {
	const [created_at, setCreatedAt] = useState("0 mints");

	const handleCreatedTime = useCallback(
		(e) => {
			const date = new Date(value.createdAt);
			const nowdate = new Date();
			const diff = nowdate.getTime() - date.getTime();
			const hours = Math.trunc(diff / 1000 / 60 / 60);

			if (hours < 24) {
				if (hours < 1) return setCreatedAt("just now");
				const measurement = hours === 1 ? "hour" : "hours";
				return setCreatedAt(`${hours.toString()} ${measurement} ago`);
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
					"December",
				];
				const day = date.getDate();
				const monthIndex = date.getMonth();
				const year = date.getFullYear();

				return setCreatedAt(`${monthNames[monthIndex]} ${day}, ${year}`);
			}
		},
		[value.createdAt]
	);

	useEffect(() => handleCreatedTime(), [handleCreatedTime]);

	return (
		<div className={`col-md-6 ${index > articlesLength - 1 ? "d-none" : ""}`}>
			<div className="card shadow-lg p-3 mb-5 bg-white rounded">
				<div className="card-body">
					<a
						href={value.url}
						target=" _blank"
						className="text-dark text-decoration-none"
					>
						<h5 className="card-title d-inline-block mb-3">{value.title} </h5>
					</a>
					<img
						className="medium-image mb-2"
						src={value.imageUrl}
						alt="Article header"
					/>
					<p className="card-text">{value.description} </p>
					<a href={value.url} target=" _blank">
						Continue reading on{" "}
						{value.publicationName ? value.publicationName : "Medium"}...
					</a>
					<hr />
					<p className="card-text">
						<small className="text-muted float-right">{created_at}</small>
					</p>
				</div>
			</div>
		</div>
	);
};

export default ArticleCard;
