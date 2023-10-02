import React, { useEffect, useState } from "react";
import { FirstName, showResume } from "../editable-stuff/configurations.json";
import NavItem from "./home/NavItem";
import Pdf from "../editable-stuff/resume.pdf";

const Navbar = () => {
	const [isTop, setIsTop] = useState(true);
	useEffect(() => {
		document.addEventListener("scroll", () => {
			const istop = window.scrollY < 200;
			if (istop !== isTop) setIsTop(istop);
		});
	}, [isTop]);

	return (
		<nav
			className={`navbar navbar-expand-md fixed-top navbar-light ${
				isTop ? "bg-transparent" : "bg-gradient"
			} `}
		>
			<a className="navbar-brand ms-2" href={"#home"}>
				{`<${FirstName} />`}
			</a>
			<button
				className="navbar-toggler me-3"
				type="button"
				data-bs-toggle="collapse"
				data-bs-target="#navbarToggler"
				aria-controls="navbarToggler"
				aria-expanded="false"
				aria-label="Toggle navigation"
			>
				<span className="navbar-toggler-icon" />
			</button>

			<div className="collapse navbar-collapse" id="navbarToggler">
				<ul className="navbar-nav mr-auto ms-2 mt-2 mt-lg-0">
					<NavItem name="About" href="#aboutme" />
					<NavItem name="Articles" href="#articles" />
					<NavItem name="Popular" href="#popularProjects" />
					<NavItem name="Recent" href="#recentProjects" />
					{showResume && <NavItem name="Resume" href={Pdf} />}
				</ul>
			</div>
		</nav>
	);
};

export default Navbar;
