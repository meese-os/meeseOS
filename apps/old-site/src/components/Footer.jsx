import React from "react";
import { FirstName, LastName } from "../editable-stuff/configurations.json";

const Footer = () =>
	<footer style={{ backgroundColor: "#f5f5f5" }} className="mt-auto py-3 text-center">
		{/* <strong> &copy; {new Date().getFullYear()} </strong> */}
		<a
			className="text-dark"
			target="_blank"
			rel="noopener noreferrer"
			href="https://github.com/meese-os/meeseOS/tree/master/apps/old-site"
			aria-label="Website Code"
		>
			<i className="fas fa-code" />
		</a>{" "}
		with <i className="fas fa-heart" /> by{" "}
		<a
			className="badge bg-dark"
			target="_blank"
			rel="noopener noreferrer"
			href="https://github.com/ajmeese7"
			aria-label="My GitHub"
		>
			{FirstName} {LastName}
		</a>{" "}
		using <i className="fab fa-react" />
		<p>
			<small className="text-muted">
				{" "}
				Project code is open source. Feel free to fork and make your own
				version.
			</small>
		</p>
	</footer>;

export default Footer;
