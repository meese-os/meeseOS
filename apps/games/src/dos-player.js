import React, { useEffect, useRef, useState } from "react";
import { DosPlayer as Instance } from "js-dos";

export default function DosPlayer(props) {
	const rootRef = useRef(HTMLDivElement);
	const [dos, setDos] = useState(Instance);

	useEffect(() => {
		if (rootRef === null || rootRef.current === null) return;

		const root = rootRef.current;
		const config = { style: "none" };
		const instance = Dos(root, config);
		setDos(instance);

		return () => { instance.stop(); };
	}, [rootRef]);

	useEffect(() => {
		if (!dos) return;

		emulators.pathPrefix = "apps/games/js-dos/";
		dos.run(props.bundleUrl);
	}, [dos, props.bundleUrl]);

	// TODO: Intentional handling of the "quit" event
	return <div ref={rootRef} style={{ width: "100%", height: "100%" }}></div>;
}
