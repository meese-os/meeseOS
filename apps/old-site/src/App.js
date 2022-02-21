
import { BrowserRouter, Route } from "react-router-dom";
import { showNavigationbar } from "./editable-stuff/configurations.json";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "./App.css";
import React from "react";

import AboutMe from "./components/home/AboutMe";
import Articles from "./components/home/Articles";
import Footer from "./components/Footer";
import MainBody from "./components/home/MainBody";
import Navbar from "./components/Navbar";
import Project from "./components/home/Project";

const Home = () => {
	return (
		<>
			<MainBody />
			<AboutMe />
			<Articles />
			<Project />
		</>
	);
};

const App = () => (
	<BrowserRouter basename={process.env.PUBLIC_URL + "/"}>
		{showNavigationbar && <Navbar />}
		<Route path="/" exact component={Home} />
		<Footer />
	</BrowserRouter>
);

export default App;
