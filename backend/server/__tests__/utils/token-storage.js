const meeseOS = require("meeseOS");
const TokenStorage = require("../../src/utils/token-storage");

describe("TokenStorage", () => {
	/** @type {MeeseOS} */
	let core;
	/** @type {TokenStorage} */
	let tokenStorage;

	beforeAll(() =>
		meeseOS().then(async (c) => {
			core = c;
		})
	);

	afterAll(() => {
		if (core) {
			core.destroy();
		}
	});

	beforeEach(() => {
		tokenStorage = new TokenStorage(core, {
			databaseName: ":memory:",
			collectionName: "test-tokens",
			databaseOptions: {
				autoload: false,
			},
		});
	});

	afterEach(async () => {
		if (tokenStorage) {
			tokenStorage.destroy();
			tokenStorage = null;
		}
	});

	test("#constructor - should create instance with default options", () => {
		const storage = new TokenStorage(core);
		expect(storage).toBeDefined();
		expect(storage.core).toBe(core);
		expect(storage.options).toBeDefined();
		storage.destroy();
	});

	test("#constructor - should merge options with core configuration", () => {
		const customOptions = {
			databaseName: "custom-db",
			collectionName: "custom-collection",
		};
		const storage = new TokenStorage(core, customOptions);
		expect(storage.options.databaseName).toBe(customOptions.databaseName);
		expect(storage.options.collectionName).toBe(customOptions.collectionName);
		storage.destroy();
	});

	test("#init - should initialize with autoload disabled", async () => {
		await expect(tokenStorage.init()).resolves.toBeUndefined();
		expect(tokenStorage.db).toBeDefined();
		expect(tokenStorage.collection).toBeDefined();
		expect(tokenStorage.collection.name).toBe("test-tokens");
	});

	test("#init - should initialize with autoload enabled", async () => {
		const storage = new TokenStorage(core, {
			databaseName: ":memory:",
			collectionName: "test-tokens-autoload",
			databaseOptions: {
				autoload: true,
			},
		});

		await expect(storage.init()).resolves.toBeUndefined();
		expect(storage.db).toBeDefined();
		expect(storage.collection).toBeDefined();
		expect(storage.collection.name).toBe("test-tokens-autoload");
		storage.destroy();
	});

	test("#init - should call original autoload callback if provided", async () => {
		const callback = jest.fn();
		const storage = new TokenStorage(core, {
			databaseName: ":memory:",
			collectionName: "test-tokens-callback",
			databaseOptions: {
				autoload: true,
				autoloadCallback: callback,
			},
		});

		await storage.init();
		expect(callback).toHaveBeenCalled();
		storage.destroy();
	});

	test("#find - should return null for non-existent token", async () => {
		await tokenStorage.init();
		const result = tokenStorage.find("non-existent-token");
		expect(result).toBeNull();
	});

	test("#find - should return token if found", async () => {
		await tokenStorage.init();
		const testToken = "test-refresh-token-123";
		tokenStorage.create(testToken);
		const result = tokenStorage.find(testToken);
		expect(result).toBeDefined();
		expect(result.refreshToken).toBe(testToken);
		expect(result.timestamp).toBeDefined();
		expect(typeof result.timestamp).toBe("number");
	});

	test("#create - should add token with timestamp", async () => {
		await tokenStorage.init();
		const testToken = "new-refresh-token-456";
		const beforeTime = Date.now();
		tokenStorage.create(testToken);
		const afterTime = Date.now();
		const result = tokenStorage.find(testToken);
		expect(result).toBeDefined();
		expect(result.refreshToken).toBe(testToken);
		expect(result.timestamp).toBeGreaterThanOrEqual(beforeTime);
		expect(result.timestamp).toBeLessThanOrEqual(afterTime);
	});

	test("#create - should allow multiple tokens", async () => {
		await tokenStorage.init();
		const token1 = "token-1";
		const token2 = "token-2";
		const token3 = "token-3";
		tokenStorage.create(token1);
		tokenStorage.create(token2);
		tokenStorage.create(token3);
		expect(tokenStorage.find(token1)).toBeDefined();
		expect(tokenStorage.find(token2)).toBeDefined();
		expect(tokenStorage.find(token3)).toBeDefined();
	});

	test("#remove - should return false for non-existent token", async () => {
		await tokenStorage.init();
		const result = tokenStorage.remove("non-existent-token");
		expect(result).toBe(false);
	});

	test("#remove - should return true and remove existing token", async () => {
		await tokenStorage.init();
		const testToken = "token-to-remove";
		tokenStorage.create(testToken);
		expect(tokenStorage.find(testToken)).toBeDefined();
		const result = tokenStorage.remove(testToken);
		expect(result).toBe(true);
		expect(tokenStorage.find(testToken)).toBeNull();
	});

	test("#remove - should only remove specified token", async () => {
		await tokenStorage.init();
		const token1 = "token-keep-1";
		const token2 = "token-remove-2";
		const token3 = "token-keep-3";
		tokenStorage.create(token1);
		tokenStorage.create(token2);
		tokenStorage.create(token3);
		tokenStorage.remove(token2);
		expect(tokenStorage.find(token1)).toBeDefined();
		expect(tokenStorage.find(token2)).toBeNull();
		expect(tokenStorage.find(token3)).toBeDefined();
	});

	test("#destroy - should close database", async () => {
		await tokenStorage.init();
		const closeSpy = jest.spyOn(tokenStorage.db, "close");
		tokenStorage.destroy();
		expect(closeSpy).toHaveBeenCalled();
		closeSpy.mockRestore();
	});

	test("integration - full token lifecycle", async () => {
		await tokenStorage.init();
		const testToken = "lifecycle-token";
		// Create
		tokenStorage.create(testToken);
		expect(tokenStorage.find(testToken)).toBeDefined();
		// Remove
		const removed = tokenStorage.remove(testToken);
		expect(removed).toBe(true);
		expect(tokenStorage.find(testToken)).toBeNull();
		// Try to remove again (should return false)
		const removedAgain = tokenStorage.remove(testToken);
		expect(removedAgain).toBe(false);
	});

	test("integration - multiple operations on same collection", async () => {
		await tokenStorage.init();
		const tokens = ["token-a", "token-b", "token-c"];
		// Create all
		tokens.forEach((token) => tokenStorage.create(token));
		// Verify all exist
		tokens.forEach((token) => {
			expect(tokenStorage.find(token)).toBeDefined();
		});
		// Remove middle one
		tokenStorage.remove("token-b");
		// Verify only middle one is gone
		expect(tokenStorage.find("token-a")).toBeDefined();
		expect(tokenStorage.find("token-b")).toBeNull();
		expect(tokenStorage.find("token-c")).toBeDefined();
	});
});

