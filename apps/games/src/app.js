import React from "react";
import DosPlayer from "./dos-player";

// TODO: Add in a GUI menu for selecting the game to play
function App() {
	return (
		<DosPlayer bundleUrl="apps/games/dos-files/oregon-trail.jsdos" />
	);
}

export default App;
