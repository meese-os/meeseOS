
// Methods OS.js server requires
module.exports = (core, proc) => ({

  // When server initializes
  init: async () => {
    // HTTP Route example (see index.js)
    core.app.post(proc.resource('/test'), (req, res) => {
      res.json({hello: 'World'});
    });

    // WebSocket Route example (see index.js)
    core.app.ws(proc.resource('/socket'), (ws, req) => {
      ws.send('Hello World');
    });
  },

  // When server starts
  start: () => {},

  // When server goes down
  destroy: () => {},

  // When using an internally bound websocket, messages comes here
  onmessage: (ws, respond, args) => {
    respond('Pong');
  }
});
