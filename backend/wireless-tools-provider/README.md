# meeseOS wireless-tools Service Provider

This provider simply binds https://github.com/bakerface/wireless-tools to the internal API.

## Installation

```bash
npm install @meeseOS/wireless-tools-provider
```

In your initialization scripts:

```javascript
// Client index.js file
import { WirelessToolsServiceProvider } from "@meeseOS/wireless-tools-provider";
meeseOS.register(WirelessToolsServiceProvider);

// Server index.js file
const { WirelessToolsServiceProvider } = require("@meeseOS/wireless-tools-provider/src/server.js");
meeseOS.register(WirelessToolsServiceProvider);
```

## Configuration

By default the server provider is set up to only allow users with the `admin` group to access this feature.

You can change this by adding options:

```javascript
const {WirelessToolsServiceProvider} = require("@meeseOS/wireless-tools-provider/src/server.js");
meeseOS.register(WirelessToolsServiceProvider, {
  args: {
    groups: ["other-group"]
  }
});
```

## API

Simply use `core.make("meeseOS/wireless-tools").call("namespace", "method", ...args)` and you will get a `Promise<any, Error>`.

You can also add subscriptions for these calls over websockets so that you get data on a regular interval:

```javascript
// Subscribe
core.make("meeseOS/wireless-tools")
  .subscribe("ifconfig", "status")
  .then(subscription => {
    // Attach a callback to get data when server pushes it out
    subscription.bind(data => {
      console.log(data)
    });

    // Unsubscribe when you're done
    subscription.unsubscribe();
  });
```

You can see namespaces, method names and the return data in the wireless-tools documentation.

## Features

- Uses 1:1 function signatures (except promise instead of callback)
- Support for subscriptions over websocket
- Wifi connection settings via tray icon

## TODO

- [ ] Finish wifi tray icon
- [ ] Add support for custom intervals on subscriptions
- [ ] Add support for subscription emit only when data has changed
