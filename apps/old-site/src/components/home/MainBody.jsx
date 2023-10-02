import {
	FirstName,
	LastName,
	descWords,
	icons,
} from "../../editable-stuff/configurations.json";
import React, { useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import { createLettercrap } from "../../../lettercrap";

const MainBody = () => {
	/**
	 * Combines the phrases and the delays into a single array.
	 * @link https://stackoverflow.com/a/55387306/6456163
	 * @param {string[]} phrases The phrases to be typed out
	 * @param {number} delay The delay between each phrase
	 * @returns {(string|number)[]} The combined array of strings and numbers
	 */
	const interleave = (phrases, delay) =>
		[].concat(...phrases.map((n) => [n, delay])).slice(0, -1);

	const lastName = LastName.toLowerCase();
	const phrases = descWords.map((phrase) => `let ${lastName} = '${phrase}';`);
	const typingArray = interleave(phrases, 1750);

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
						// TODO: Resize the font and line height to make it prettier on different screen sizes
						data-lettercrap-text={`${FirstName} ${LastName}`}
						data-lettercrap-aspect-ratio="0.3"
					/>
				</h1>

				<TypeAnimation wrapper="p" sequence={typingArray} repeat={Infinity} className="lead" />

				<div className="p-5" id="socialIcons">
					{icons?.map((icon) => (
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
									onFocus={function () {
										toggleHover({ icon, event: "enter" });
									}}
									onMouseOut={function () {
										toggleHover({ icon, event: "leave" });
									}}
									onBlur={function () {
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

export default MainBody;
