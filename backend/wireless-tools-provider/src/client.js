import { v4 as uuidv4 } from "uuid";

class Subscription {
	constructor(handler) {
		this.handler = handler;
		this.callback = () => {};
		this.id = uuidv4().replace(/-/g, "");
	}

	subscribe(ns, method, ...args) {
		return this.handler.core
			.request(`/api/wireless-tools/subscribe/${ns}/${method}`, {
				method: "POST",
				body: { id: this.id, args },
			}, "json")
			.then(() => this.handler.add(this));
	}

	unsubscribe() {
		return this.handler.core
			.request(`/api/wireless-tools/unsubscribe/${this.id}`, {
				method: "POST"
			}, "json")
			.then(() => this.handler.remove(this));
	}

	bind(cb) {
		this.callback = cb;
	}
}

class Subscriptions {
	constructor(core) {
		this.core = core;
		this.subscriptions = [];
		this.started = false;
	}

	/**
	 * Starts provider
	 * @returns {Promise<undefined>|null}
	 */
	start() {
		if (this.started) return;

		console.debug("@meese-os/wireless-tools-provider", "Subscriptions#start");

		this.started = true;

		this.core.on("meeseOS/wireless-tools:subscription", (id, data) => {
			this.emit(id, data);
		});
	}

	add(subscription) {
		console.debug("@meese-os/wireless-tools-provider", "Subscriptions#add", subscription);

		this.subscriptions.push(subscription);

		this.core.ws.send(JSON.stringify({
			name: "meeseOS/wireless-tools:subscription:attach",
			params: [subscription.id]
		}));
	}

	create(ns, method, ...args) {
		console.debug("@meese-os/wireless-tools-provider", "Subscriptions#create", {
			ns, method, args
		});

		const subscription = new Subscription(this);

		return subscription.subscribe(ns, method, ...args)
			.then(() => {
				this.subscriptions.push(subscription);

				return subscription;
			});
	}

	remove(subscription) {
		console.debug("@meese-os/wireless-tools-provider", "Subscriptions#remove", subscription);

		const foundIndex = this.subscriptions
			.findIndex((iter) => iter.id === subscription.id);

		if (foundIndex !== -1) {
			this.subscriptions.splice(foundIndex, 1);
		}
	}

	clear() {
		this.subscription.forEach((iter) => iter.unsubscribe());
		this.subscriptions = [];
	}

	emit(id, data) {
		const found = this.subscriptions
			.find((iter) => iter.id === id);

		if (found) {
			found.callback(data);
		}
	}
}

class WifiTrayIcon {
	constructor(core) {
		this.core = core;
		this.tray = null;
	}

	destroy() {
		if (this.tray) {
			this.tray = this.tray.destroy();
		}
	}

	start() {
		if (this.core.has("meeseOS/tray") && this.core.has("meeseOS/theme")) {
			this.tray = this.core.make("meeseOS/tray").create(
				{
					icon: this.core.make("meeseOS/theme").icon("network-wireless"),
				},
				(ev) => this.createWifiContextMenu(ev)
			);
		}
	}

	createWifiContextMenu(ev) {
		this.core.make("meeseOS/contextmenu", {
			position: ev,
			menu: [{
				label: "Connection information",
				items: [{
					label: "foo"
				}]
			}, {
				label: "Connect to AP"
			}, {
				label: "Mode"
			}, {
				separator: true
			}, {
				label: "Disconnect"
			}]
		});
	}
}

export class WirelessToolsServiceProvider {
	/**
	 * Create new instance.
	 * @param {Core} core MeeseOS Core instance reference
	 * @param {Object} [options={}] Arguments
	 */
	constructor(core, options = {}) {
		this.core = core;
		this.options = {
			wifiTray: false,
			...options,
		};

		this.tray = new WifiTrayIcon(core);
		this.subscriptions = new Subscriptions(core);
	}

	/**
	 * A list of services this provider can create.
	 * @returns {String[]}
	 */
	static provides() {
		return ["meeseOS/wireless-tools"];
	}

	/**
	 * Destroys provider.
	 */
	destroy() {
		this.subscriptions.clear();
		this.tray.destroy();
	}

	/**
	 * Initializes provider.
	 * @returns {Promise<void>}
	 */
	init() {
		this.core.singleton("meeseOS/wireless-tools", () => ({
			call: (ns, method, ...args) => this.callApi(ns, method, ...args),
			subscribe: (ns, method, ...args) => this.subscriptions.create(ns, method, ...args)
		}));

		return Promise.resolve();
	}

	/**
	 * Starts provider.
	 * @returns {Promise<undefined>}
	 */
	start() {
		// This is disabled by default because it currently has no functioning
		// functionality. It is here for future use.
		// this.tray.start();

		this.subscriptions.start();
	}

	callApi(ns, method, ...args) {
		console.debug("@meese-os/wireless-tools-provider", "callApi", ns, method, args);

		return this.core
			.request(`/api/wireless-tools/${ns}/${method}`, {
				method: "POST",
				body: { args }
			}, "json");
	}
}
