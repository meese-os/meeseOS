import React from "react";

var bold = false;
const NavItem = ({ name, href }) => {
  const isPdf = href.indexOf('#') === -1;
  bold = !bold;

  return (
    <li className="nav-item">
      <a
        className="nav-link lead"
        href={process.env.PUBLIC_URL + href}
        target={isPdf ? "_blank" : "_self"}
        rel={isPdf ? "noreferrer noopener" : ""}
      >
        {bold ? <b>{name}</b> : name}
      </a>
    </li>
  );
};

export default NavItem;
