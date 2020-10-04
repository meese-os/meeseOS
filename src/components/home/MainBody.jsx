import React, { useState } from "react";
import Typist from "react-typist";
import 'react-typist/dist/Typist.css';
import '../../lettercrap';
import { useWindowSize } from "@react-hook/window-size/throttled";
import {
  FirstName,
  MiddleName,
  LastName,
  LetterCrap,
  descWords,
  icons,
} from "../../editable-stuff/configurations.json";

const MainBody = () => {
  const [width] = useWindowSize({ fps: 60 });
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

  return (
    <div
      id="home"
      className="title jumbotron jumbotron-fluid bg-transparent bgstyle text-light min-vh-100 d-flex align-content-center align-items-center flex-wrap m-0"
    >
      <div id="stars"></div>
      <div className="container container-fluid text-center">
        <h1 className="display-1" style={{lineHeight: "1.1"}}>
          <div
            className={`${LetterCrap && width > 1200 ? "" : "d-none"}`}
            data-lettercrap-text={FirstName + " " + LastName}
            data-lettercrap-aspect-ratio='0.3'
          ></div>
          {(!LetterCrap || width < 1200) && (
            FirstName + " " + MiddleName + " " + LastName
          )}
        </h1>
        <TypistContent />
        <div className="p-5">
          {icons && icons.map((icon) => (
            <a
              key={icon.id}
              target="_blank"
              rel="noopener noreferrer"
              href={icon.url}
              aria-label={`My ${icon.image.split("-")[1]}`}
            >
              <i
                className={`fab ${icon.image} fa-3x ${hoverstatus[icon.id]}`}
                onMouseOver={() => toggleHover({ icon, event: "enter" })}
                onMouseOut={() => toggleHover({ icon, event: "leave" })}
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

// NOTE: Typist breaks when resizing the screen now. Why?
const TypistContent = () => {
  let lastWord = descWords.pop();
  return (
    <Typist className="lead" cursor={{ hideWhenDone: false }}>
      const {LastName.toLowerCase()} ={" "}
      {descWords.map((word, index) => (
        <p key={index} style={{ display: "inline" }}>
          "{word}";
          <Typist.Backspace count={word.length + 3} delay={1000} />
        </p>
      ))}
      "{lastWord}";
    </Typist>
  );
}

export default MainBody;
