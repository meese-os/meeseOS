import React, { useEffect, useRef, useState } from "react";
import { DosPlayer as Instance } from "js-dos";

export default function DosPlayer(props) {
	const rootRef = useRef(HTMLDivElement);
	const [dos, setDos] = useState(Instance);

	// TODO: Capture all of these logs in the console and place them
	// under a collapsable section like Core::start()
	// https://stackoverflow.com/a/54595675/6456163
	// https://stackoverflow.com/a/52410353/6456163
	useEffect(() => {
		if (rootRef === null || rootRef.current === null) return;

		const root = rootRef.current;
		const config = {
			style: "hidden",
			noSideBar: true,
			noSocialLinks: true,
			onExit: () => {
				document.getElementById("game").style.display = "none";
			}
		};

		const instance = Dos(root, config);
		setDos(instance);

		return () => { instance.stop(); };
	}, [rootRef]);

	useEffect(() => {
		if (!dos) return;

		emulators.pathPrefix = "apps/games/js-dos/";
		dos.run(props.bundleUrl);
	}, [dos, props.bundleUrl]);

	return <div ref={rootRef} style={{ width: "100%", height: "100%" }}></div>;
}
