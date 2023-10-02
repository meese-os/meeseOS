module.exports = (core, proc) => {
	const { routeAuthenticated } = core.make("meeseOS/express");

	return {
		/** When server initializes */
		async init() {
			// HTTP Route example (see index.js)
			routeAuthenticated("POST", proc.resource("/test"), (_req, res) => {
				res.json({ hello: "World" });
			});

			// WebSocket Route example (see index.js)
			// NOTE: This creates a new connection. You can use a core bound socket instead
			core.app.ws(proc.resource("/socket"), (ws, _req) => {
				ws.send("Hello World");
			});
		},

		/** When server starts */
		async start() { /* noop */ },

		/** When server goes down */
		destroy() { /* noop */ },

		/** When using an internally bound websocket, messages comes here */
		onmessage(_ws, respond, _args) {
			respond("Pong");
		},
	};
};
