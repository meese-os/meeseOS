import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  aboutHeading,
  aboutDescription,
  showInstaProfilePic,
  instaLink,
  instaUsername,
  instaQuery,
} from "../../editable-stuff/configurations.json";
import { useWindowSize } from "@react-hook/window-size/throttled";
{/*import Pdf from "../../editable-stuff/resume.pdf";*/}

const AboutMe = () => {
  const [instaProfilePic, setInstaProfilePic] = useState("");
  const [showInsta, setShowInsta] = useState(showInstaProfilePic);
  const [width] = useWindowSize({ fps: 60 });
  {/*const [resumeURL] = useState(Pdf);*/}

  useEffect(() => {
    if (showInsta) handleRequest();
  }, [showInsta]);

  const handleRequest = (e) => {
    axios
      .get(instaLink + instaUsername + instaQuery)
      .then((response) =>
        setInstaProfilePic(
          response.data.graphql.user.profile_pic_url_hd
        )
      )
      .catch((error) => {
        // handle error
        setShowInsta(false);
        return console.error(error.message);
      })
      .finally(() => {
        // always executed
      });
  };

  return (
    <div id="aboutme" className="jumbotron jumbotron-fluid m-0">
      <div className="container container-fluid p-5">
        <div className="row">
          {showInsta && (
            <div className="col-5 d-none d-lg-block align-self-center">
              <img
                className="border border-secondary rounded-circle"
                src={instaProfilePic}
                alt="profilepicture"
              />
            </div>
          )}
          <div className={`col-lg-${showInsta ? "7" : "12"}`}>
            <h1 className="display-4 mb-5 text-center">{aboutHeading}</h1>
            <p className={`lead text-${width < 1200 ? "center" : "justify"}`}>{aboutDescription}</p>
            {/*resumeURL && (
              <p className="lead text-center">
                <a
                  className="btn btn-outline-dark btn-lg"
                  href={Pdf}
                  target="_blank"
                  rel="noreferrer noopener"
                  role="button"
                  aria-label="Resume/CV"
                >
                  Resume
                </a>
              </p>
            )*/}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutMe;
