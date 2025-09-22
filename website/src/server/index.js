/**
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-Present, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

//
// This is the server bootstrapping script.
// This is where you can register service providers or set up
// your libraries etc.
//
// https://manual.aaronmeese.com/guide/provider/
// https://manual.aaronmeese.com/install/
// https://manual.aaronmeese.com/resource/official/
//

// TODO: Deploy the manual to the website

const {
	Core,
	CoreServiceProvider,
	PackageServiceProvider,
	VFSServiceProvider,
	TokenStorageServiceProvider,
	TokenFactoryServiceProvider,
	AuthServiceProvider,
	SettingsServiceProvider,
} = require("@meese-os/server");
const { WirelessToolsServiceProvider } = require("@meese-os/wireless-tools-provider/src/server.js");

const config = require("./config.js");
const meeseOS = new Core(config, {});
const customAdapter = require("./auth/adapter.js");

meeseOS.register(CoreServiceProvider, { before: true });
meeseOS.register(PackageServiceProvider);
meeseOS.register(VFSServiceProvider);
meeseOS.register(TokenStorageServiceProvider);
meeseOS.register(TokenFactoryServiceProvider);
meeseOS.register(AuthServiceProvider, {
	args: {
		adapter: customAdapter,
		// config: {},
	},
});
meeseOS.register(SettingsServiceProvider);
meeseOS.register(WirelessToolsServiceProvider);

const shutdown = (signal) => (error) => {
	if (error instanceof Error) {
		console.error(error);
	}

	meeseOS.destroy(() => process.exit(signal));
};

process.on("SIGTERM", shutdown(0));
process.on("SIGINT", shutdown(0));
process.on("exit", shutdown(0));

meeseOS.boot().catch(shutdown(1));
