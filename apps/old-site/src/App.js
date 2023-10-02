import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import React from "react";

import { showNavigationbar } from "./editable-stuff/configurations.json";
import "./App.css";
import AboutMe from "./components/home/AboutMe";
import Articles from "./components/home/Articles";
import Footer from "./components/Footer";
import MainBody from "./components/home/MainBody";
import Navbar from "./components/Navbar";
import Project from "./components/home/Project";

/**
 * Creates the old site application.
 * @param {Application} proc MeeseOS Application instance reference
 * @returns {React.JSX.Element}
 */
const App = ({ proc }) => <>
	{showNavigationbar && <Navbar />}
	<MainBody />
	<AboutMe />
	<Articles />
	<Project proc={proc} />
	<Footer />
</>;

export default App;
