import { useRef } from "react";
import { createRoot } from "react-dom/client";
import DosPlayer from "./dos-player";
import "./games.scss";
const games = require("./games.json");

function App({ pid }) {
	const gameRootRef = useRef(null);

	return <>
		<div id="gamesContainer">
			{games.map((game, index) =>
				<div className="gameCard" key={index}>
					<h1>{game.name}</h1>
					<img src={`apps/games/images/${game.image}`} alt={`${game.name} logo`} />
					<p className="description">{game.description}</p>

					<button className="playButton" onClick={() => {
						const gameElem = document.getElementById(`pid_${pid}_game`);

						// Clean up previous root if it exists
						if (gameRootRef.current) {
							gameRootRef.current.unmount();
							gameRootRef.current = null;
						}

						// Create new root and render the game
						// IDEA: Render this in another separate window?
						// proc.createWindow...
						gameRootRef.current = createRoot(gameElem);
						gameRootRef.current.render(
							<DosPlayer bundleUrl={`apps/games/dos-files/${game.bundle}`} />
						);

						// Show the game
						gameElem.style.display = "block";
					}}>
						Play
					</button>
				</div>
			)}
		</div>

		{/* IDEA: Build a custom UI with https://js-dos.com/v7/build/docs/ui-components/ */}
		<div id={`pid_${pid}_game`} className="game-window" />
	</>;
}

export default App;
