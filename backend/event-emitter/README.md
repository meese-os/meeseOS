# MeeseOS EventEmitter

This is a EventEmitter implementation for MeeseOS.

## API

```javascript
on("event-name", () => {}); // Fired every time event is emitted
once("event-name", () => {}); // Fires only once and is forgotten
off("event-name", () => {}); // Removes listener
off("event-name"); // Removes all listeners of this type
off(); // Removes all listeners

on("event-name", () => {}, { persist: true }); // Will not be removed unless forced
off("event-name", () => {}, true); // Force removal
```
