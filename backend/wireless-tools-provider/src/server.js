const wireless_tools = require("wireless-tools");

const request = (ns, name, ...args) => new Promise((resolve, reject) => {
	try {
		const finalArgs = [...args, (err, res) => {
			return err ? reject(err) : resolve(res);
		}];

		wireless_tools[ns][name](...finalArgs);
	} catch (e) {
		reject(e);
	}
});

class Subscription {
	constructor(handler, id, username) {
		this.handler = handler;
		this.id = id;
		this.username = username;

		this.ws = null;
		this.ns = null;
		this.method = null;
		this.args = [];
	}

	subscibe(ns, method, args) {
		this.ns = ns;
		this.method = method;
		this.args = args;
	}

	attach(ws) {
		this.ws = ws;
	}

	send(data) {
		this.handler.core.broadcastUser(
			this.username,
			"meeseOS/wireless-tools:subscription",
			this.id,
			data
		);
	}
}

class Subscriptions {
	constructor(core) {
		this.core = core;
		this.subscriptions = [];
		this.nextTickInterval = null;
	}

	destroy() {
		this.nextTickInterval = clearTimeout(this.nextTickInterval);
		this.subscriptions = [];
	}

	add(id, username, ns, method, args) {
		console.debug("@meeseOS/wireless-tools-provider", "Subscriptions#add", {
			id, username, ns, method, args
		});

		const subscription = new Subscription(this, id, username);
		subscription.subscibe(ns, method, args);
		this.subscriptions.push(subscription);

		return true;
	}

	remove(id) {
		console.debug("@meeseOS/wireless-tools-provider", "Subscriptions#remove", id);

		const foundIndex = this.subscriptions.findIndex((iter) => iter.id === id);
		if (foundIndex !== -1) {
			this.subscriptions.splice(foundIndex);

			return true;
		}

		return false;
	}

	attach(id, ws) {
		console.debug("@meeseOS/wireless-tools-provider", "Subscriptions#attach", id);

		ws.on("close", () => this.remove(id));
	}

	tick() {
		this.subscriptions.forEach((iter) => {
			request(iter.ns, iter.method, ...iter.args)
				.then(data => iter.send({ data }))
				.catch(error => iter.send({ error: error.toString() }));
		});

		this.nextTickInterval = setTimeout(() => this.tick(), 5000);
	}
}

class WirelessToolsServiceProvider {

	constructor(core, options = {}) {
		this.core = core;
		this.options = Object.assign({
			groups: ["admin"],
		}, options);

		this.subscriptions = new Subscriptions(core);
	}

	destroy() {
		this.subscriptions.destroy();
	}

	provides() {
		return [
			"meeseOS/wireless-tools"
		];
	}

	init() {
		const { routeAuthenticated } = this.core.make("meeseOS/express");

		routeAuthenticated("POST", "/api/wireless-tools/subscribe/:ns/:method", (req, res) => {
			const args = req.body.args || [];
			const id = req.body.id;
			const { ns, method } = req.params;
			const { username } = req.session.user;

			const success = this.subscriptions.add(id, username, ns, method, args);

			res.json({ success });
		});

		routeAuthenticated("POST", "/api/wireless-tools/unsubscribe/:uuid", (req, res) => {
			const success = this.subscriptions.remove(req.params.uuid);
			res.json({ success });
		});

		routeAuthenticated("POST", "/api/wireless-tools/:ns/:method", (req, res) => {
			const args = req.body.args || [];
			const { ns, method } = req.params;

			return request(ns, method, ...args)
				.then(result => res.json(result))
				.catch(error => {
					console.warn(error);
					res.status(400).json({ error: error.toString() });
				});
		}, this.options.groups);

		this.core.singleton("meeseOS/wireless-tools", () => wireless_tools);

		return Promise.resolve();
	}

	start() {
		this.core.on("meeseOS/wireless-tools:subscription:attach", (ws, id) => {
			this.subscriptions.attach(id, ws);
		});

		this.subscriptions.tick();
	}
}

module.exports = { WirelessToolsServiceProvider };
