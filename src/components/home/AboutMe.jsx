import React, { useState, useEffect } from "react";
import axios from "axios";
import { useWindowSize } from "@react-hook/window-size/throttled";
import {
  aboutHeading,
  aboutDescription,
  showInstaProfilePic,
  instaUsername,
  instaQuery,
  fallbackPicture,
  showResume,
} from "../../editable-stuff/configurations.json";
import Pdf from "../../editable-stuff/resume.pdf";

const AboutMe = () => {
  const [instaProfilePic, setInstaProfilePic] = useState("");
  const [showInsta, setShowInsta] = useState(showInstaProfilePic);
  const [width] = useWindowSize({ fps: 60 });

  useEffect(() => {
    if (showInsta) getProfilePicture();
  }, [showInsta]);

  const getProfilePicture = (e) => {
    axios
      .get("https://www.instagram.com/" + instaUsername + instaQuery)
      .then((response) =>
        setInstaProfilePic(
          response.data.graphql.user.profile_pic_url_hd
        )
      )
      .catch((error) => {
        setShowInsta(false);
        return console.error(error.message);
      })
      .finally(() => {});
  };

  const profilePic = 
    <img
      className="border border-secondary rounded-circle w-100"
      src={instaProfilePic || fallbackPicture}
      alt="profilepicture"
    />;

  return (
    <div id="aboutme" className="jumbotron jumbotron-fluid m-0 pb-0">
      <div className="container container-fluid p-5">
        <div className="row">
          <div className="col-5 d-none d-lg-block align-self-center">
            {profilePic}
          </div>
          <div className="col-lg-7">
            <h1 className="display-4 mb-lg-5 text-center">{aboutHeading}</h1>
            <div className="col-7 col-md-5 d-block d-lg-none mx-auto my-4">
              {profilePic}
            </div>
            <p className={`lead text-${width < 992 ? "center" : "justify"}`}>{aboutDescription}</p>
            
            {showResume && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutMe;
