import React, { useState, useEffect } from "react";
import NavItem from "./home/NavItem";
import {
  FirstName,
  showResume
} from "../editable-stuff/configurations.json";
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
      className={`navbar navbar-expand-lg fixed-top navbar-light ${
        isTop ? "bg-transparent" : "bg-gradient"
      } `}
    >
      <a className="navbar-brand" href={process.env.PUBLIC_URL + "#home"}>
        {`<${FirstName} />`}
      </a>
      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarToggler"
        aria-controls="navbarToggler"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarToggler">
        <ul className="navbar-nav mr-auto mt-2 mt-lg-0">
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
