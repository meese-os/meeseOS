import React, { useState } from "react";

const Footer = () => {
  const [bgStyle] = useState({ backgroundColor: "#f5f5f5" });

  return (
    <footer style={bgStyle} className="mt-auto py-3 text-center">
      {/*<strong> &copy; {new Date().getFullYear()} </strong>*/}
      <a
        className="text-dark"
        target="_blank"
        rel="noopener"
        href="https://github.com/ajmeese7/aaronmeese.com"
        aria-label="Website Code"
      >
        <i className="fas fa-code"></i>
      </a>{" "}
      with <i className="fas fa-heart"></i> by{" "}
      <a
        className="badge badge-dark"
        target="_blank"
        rel="noopener"
        href="https://github.com/ajmeese7"
        aria-label="My GitHub"
      >
        Aaron Meese
      </a>{" "}
      using <i className="fab fa-react"></i>
      <p>
        <small className="text-muted">
          {" "}
          Project code is open source. Feel free to fork and make your own
          version.
        </small>
      </p>
    </footer>
  );
};

export default Footer;
