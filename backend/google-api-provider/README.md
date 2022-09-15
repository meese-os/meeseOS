# meeseOS Google API Provider

This is the Google API Provider for meeseOS.

## Installation

```bash
npm install @meeseOS/google-api-provider
```

In your client bootstrap file (`src/client/index.js`):

```javascript
import { GapiServiceProvider } from "@meeseOS/google-api-provider";

meeseOS.register(GapiServiceProvider, {
  args: {
    enabled: true,
    src: "https://accounts.google.com/gsi/client",

    // You have to define these
    client: {
      api_key: "",
      client_id: "",
      scope: []
    }
  }
});
```

## Usage

For example in an application:

```javascript
const meeseOSgapi = core.make("meeseOS/gapi").create();
meeseOSgapi.on("signed-in", () => console.log("You were signed in"));
meeseOSgapi.on("signed-out", () => console.log("You were signed out"));

meeseOSgapi.login().then(gapi => {
  // Do whatever
});

proc.on("destroy", () => meeseOSgapi.destroy());
```
