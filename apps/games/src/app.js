import ReactDOM from "react-dom";
import DosPlayer from "./dos-player";
import "./games.scss";
const games = require("./games.json");

function App({ pid }) {
	return <>
		<div id="gamesContainer">
			{games.map((game, index) =>
				<div className="gameCard" key={index}>
					<h1>{game.name}</h1>
					<img src={`apps/games/images/${game.image}`} alt={`${game.name} logo`} />
					<p className="description">{game.description}</p>

					<button className="playButton" onClick={() => {
						const gameElem = document.getElementById(`pid_${pid}_game`);

						// Render the game
						ReactDOM.render(
							// IDEA: Render this in another separate window?
								// proc.createWindow...
							<DosPlayer bundleUrl={`apps/games/dos-files/${game.bundle}`} />,
							gameElem
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
	</>
}

export default App;
