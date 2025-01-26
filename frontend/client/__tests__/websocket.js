import Websocket from "../src/websocket.js";

const createSocket = (options = {}) => new Websocket("Test", "ws://null", options);

describe("Websocket", () => {
	test("Should open connection", async () => {
		const ws = createSocket();
		const onopen = jest.fn();
		ws.on("open", onopen);
		ws.open();

		// Use a Promise to wait for the asynchronous `open` event
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(onopen).toHaveBeenCalled();
	});

	test("Should send message", () => {
		const ws = createSocket();

		// Mock `state` to handle `messages`
		ws.state = { messages: [] };
		ws.send = jest.fn((message) => ws.state.messages.push(message));

		const message = { foo: "bar" };
		ws.send(message);

		expect(ws.state.messages).toEqual([message]);
	});

	test("Should close", () => {
		const ws = createSocket();
		const onclose = jest.fn();
		ws.on("close", onclose);
		ws.close();

		expect(onclose).toHaveBeenCalled();
	});
});
