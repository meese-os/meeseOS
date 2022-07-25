import React from "react";
import ReactDOM from "react-dom";
import DosPlayer from "./dos-player";
import "./games.scss";
const games = require("./games.json");

function App({ pid }) {
	// TODO: Figure out how to make this PID useful

	return <>
		<div id="gamesContainer">
			{games.map((game, index) =>
				<div className="gameCard" key={index}>
					<h1>{game.name}</h1>
					<img src={`apps/games/images/${game.image}`} />
					<p className="description">{game.description}</p>
					<button className="playButton" onClick={() => {
						// Render the game
						ReactDOM.render(
							// IDEA: Render this in another separate window?
								// proc.createWindow...
							<DosPlayer bundleUrl={`apps/games/dos-files/${game.bundle}`} />,
							document.getElementById("game")
						);

						// Show the game
						document.getElementById("game").style.display = "block";
					}}>Play</button>
				</div>
			)}
		</div>

		{/* IDEA: Build a custom UI with https://js-dos.com/v7/build/docs/ui-components/ */}
		<div id="game"></div>
	</>
}

export default App;
