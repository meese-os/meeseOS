import React from "react";
import ReactDOM from "react-dom";
import DosPlayer from "./dos-player";
import "./games.scss";

function App() {
	const games = [
		{
			name: "Bomberman",
			description: "Bomberman is a tile-based, turn-based, 2D action-adventure game.",
			image: "bomberman.gif",
			bundle: "bomberman.jsdos",
		},
		{
			name: "Bureacracy",
			description: "You need to change your address. Good luck.",
			image: "bureaucracy.png",
			bundle: "bureaucracy.jsdos",
		},
		{
			name: "DOOM",
			description: "DOOM is a first-person shooter video game.",
			image: "doom.png",
			bundle: "doom.jsdos",
		},
		{
			name: "Grand Theft Auto",
			description: "Unlock your inner criminal.",
			image: "gta.png",
			bundle: "grand-theft-auto.jsdos",
		},
		{
			name: "Mortal Kombat",
			description: "Fight, win, repeat.",
			image: "mortal-kombat.png",
			bundle: "mortal-kombat.jsdos",
		},
		{
			// TODO: Make an issue on the JS-DOS repo to handle the quit button
			name: "Oregon Trail",
			description: "A game of adventure and discovery.",
			image: "oregon-trail.jpeg",
			bundle: "oregon-trail.jsdos",
		},
	];

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
