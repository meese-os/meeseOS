import React from "react";
import PropTypes from "prop-types";

// TODO: Make the page scroll to the href instead of jerking
const NavItem = ({ name, href }) => {
	// TODO: Re-implement the bolding if I can find a way to handle
	// the article item being deleted, or find a more creative way to do it
	const isPdf = href.indexOf("#") === -1;

	return (
		<li className="nav-item">
			<a
				className="nav-link lead"
				// TODO: Test for PDF
				href={href}
				target={isPdf ? "_blank" : "_self"}
				rel={isPdf ? "noreferrer noopener" : ""}
			>
				<b>{name}</b>
			</a>
		</li>
	);
};
NavItem.propTypes = {
	name: PropTypes.string.isRequired,
	href: PropTypes.string.isRequired,
};

export default NavItem;
