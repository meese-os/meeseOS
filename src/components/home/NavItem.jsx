import React from "react";

const NavItem = ({ name, href }) => {
  // TODO: Re-implement the bolding if I can find a way to handle
  // the article item being deleted, or find a more creative way to do it
  const isPdf = href.indexOf("#") === -1;

  return (
    <li className="nav-item">
      <a
        className="nav-link lead"
        href={process.env.PUBLIC_URL + href}
        target={isPdf ? "_blank" : "_self"}
        rel={isPdf ? "noreferrer noopener" : ""}
      >
        <b>{name}</b>
      </a>
    </li>
  );
};

export default NavItem;
