import {
	FirstName,
	LastName,
	descWords,
	icons,
} from "../../editable-stuff/configurations.json";
import React, { useEffect, useState } from "react";
import Typical from "react-typical";
import { createLettercrap } from "../../../lettercrap";

const MainBody = () => {
	const [hoverstatus, setHoverstatus] = useState(
		new Array(icons.length).fill("socialicons")
	);

	const toggleHover = (data) => {
		const newhoverStatus = [...hoverstatus];

		if (data.event === "enter") {
			newhoverStatus[data.icon.id] = "socialiconshover";
			return setHoverstatus(newhoverStatus);
		} else if (data.event === "leave") {
			newhoverStatus[data.icon.id] = "socialicons";
			return setHoverstatus(newhoverStatus);
		}
	};

	// Runs after the render, so the DOM elements are available
	useEffect(() => {
		createLettercrap();
	}, []);

	return (
		<div
			id="home"
			className="title jumbotron jumbotron-fluid bg-transparent bgstyle text-light min-vh-100 d-flex align-content-center align-items-center flex-wrap m-0"
		>
			<div id="stars" />
			<div className="container container-fluid text-center">
				<h1 className="display-1" style={{ lineHeight: "1.1" }}>
					<div
						className="lettercrap"
						// TODO: Display this all the time, just resize the font and line height to make it prettier
						data-lettercrap-text={FirstName + " " + LastName}
						data-lettercrap-aspect-ratio="0.3"
					/>
				</h1>
				<TypingAnimation />
				<div className="p-5" id="socialIcons">
					{icons &&
						icons.map((icon) => (
							<a
								key={icon.id}
								target="_blank"
								rel="noopener noreferrer"
								href={icon.url}
								aria-label={`My ${icon.image.split("-")[1]}`}
							>
								<i
									className={`fab ${icon.image} fa-3x ${hoverstatus[icon.id]}`}
									onMouseOver={function () {
										toggleHover({ icon, event: "enter" });
									}}
									onMouseOut={function () {
										toggleHover({ icon, event: "leave" });
									}}
								/>
							</a>
						))}
				</div>
				<a
					className="btn btn-outline-light btn-lg"
					href="#aboutme"
					role="button"
					aria-label="Learn more about me"
				>
					More about me
				</a>
			</div>
		</div>
	);
};

// https://stackoverflow.com/a/55387306/6456163
const interleave = (arr, thing) =>
	[].concat(...arr.map((n) => [n, thing])).slice(0, -1);
const lastName = LastName.toLowerCase();
const phrases = descWords.map((x) => "let " + lastName + " = '" + x + "';");
const typingArray = interleave(phrases, 1750);

// https://github.com/catalinmiron/react-typical/issues/6#issuecomment-667327923
const TypingAnimation = React.memo(
	() => {
		return (
			<Typical wrapper="p" steps={typingArray} loop={1} className="lead" />
		);
	},
	(props, prevProp) => true
); // The unused props prevent re-rendering

export default MainBody;
