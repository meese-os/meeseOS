# @meese-os/zork

Z-machine interpreter service for the meeseOS terminal, built to run on Deno
Deploy.

## Why this exists

The terminal used to SSH into a jailed user on a self-hosted box and run `frotz`
there. This replaces that with a hosted interpreter so the site no longer needs
a server to maintain, while keeping the story files off the client.

## Design constraints

- **Story files never reach the browser.** A `.z3` file is trivially readable
  with `strings`, so any design that ships one to the client gives away its
  contents. The interpreter has to run server-side.
- **No filesystem.** Deno Deploy has none. emglken does not expose the
  Emscripten filesystem either, so `Dialog.read()` is the only seam for handing
  the interpreter a story file. `MemoryDialog` supplies it from memory.
- **One session per request.** Each session is a separate WebAssembly instance
  with its own linear memory, so concurrent players cannot observe each other. A
  pure-JavaScript interpreter was tried first and rejected: its Glk layer keeps
  non-reentrant module-level state, which breaks as soon as two sessions share
  an isolate.

## Session state

There is no autosave hook in emglken, so `snapshot()` drives the Z-machine's own
SAVE opcode and captures the Quetzal bytes the interpreter writes through the
dialog. `resume()` feeds those bytes back and drives RESTORE. That makes a
session fully reconstructible from a byte array, which is what lets the service
stay stateless and avoid a key-value store entirely.

Two things that are easy to get wrong:

- Bytes handed to `Dialog.write()` are views into the interpreter's WebAssembly
  heap, which it keeps reusing. They must be copied on the way in, or the save
  silently decays into "corrupted save file or not a save file at all".
- Restoring makes bocfel replay the entire transcript. The player has already
  seen it, so it is stripped before the output is returned.

## Session tokens

`state.ts` seals a snapshot into an opaque token the player carries between
turns. AES-GCM is authenticated, so one operation covers both requirements: the
save data is unreadable, and any edit is rejected rather than silently honoured.
Reading it would leak the game's internals; forging it would let a player put
the session into a state they had not played their way to.

The version and expiry travel in the clear but are authenticated as additional
data, so neither can be edited without invalidating the token. Bumping `VERSION`
invalidates everything in circulation, which is how an incompatible change to
the envelope gets rolled out.

State is gzipped before sealing, which matters more than it sounds: Quetzal
saves compress by 45% at the start of a game and around 65% once it is underway.
Uncompressed tokens cross the 4 KiB cookie ceiling within twenty moves;
compressed they sit near 2 KiB regardless of how long the session runs.
Compression happens before encryption, because ciphertext does not compress.
That leaves token length correlated with how far the game has progressed, which
the player already knows, so it discloses nothing they do not have.

A player can replay an older token to rewind their own session. That is
deliberate: it is indistinguishable from the SAVE and RESTORE the game already
offers.

## HTTP API

One endpoint, one turn per request. `POST` a JSON body:

```json
{
	"token": "<from the previous response, omit to start>",
	"command": "north"
}
```

and get back:

```json
{
	"token": "<send this with the next command>",
	"output": "North of House...",
	"status": "North of House    Score: 0"
}
```

Omit `command` to receive only the opening text.

A token the service did not issue, or one that has been edited, returns `401`.
Malformed or oversized input returns `400`.

## Deployment

Deno Deploy has no filesystem, so a story cannot be read from disk in
production.

| Variable              | Purpose                                                                       |
| --------------------- | ----------------------------------------------------------------------------- |
| `ZORK_STATE_KEY`      | **Required.** Base64 key for sealing tokens; make one with `deno task keygen` |
| `ZORK_ALLOWED_ORIGIN` | Origin permitted to call the service. Defaults to `*`                         |
| `PORT`                | Listen port. Defaults to `8080`                                               |

Story settings are read from variables named after the configured id, so the
deployment is configuration rather than code:

| Variable             | Purpose                                                      |
| -------------------- | ------------------------------------------------------------ |
| `ZORK1_STORY_BASE64` | Story file inlined as base64                                 |
| `ZORK1_STORY_URL`    | Story fetched once at startup                                |
| `ZORK1_STORY_AUTH`   | `Authorization` header for that fetch, if the URL is private |
| `ZORK1_STORY`        | Path on disk. Development only                               |

Inline a story with `base64 -w0 story.z3`. Startup fails naming the exact
variables when a story is not configured.

Rotating `ZORK_STATE_KEY` invalidates every session in flight, since a token can
only be opened by the key that sealed it.

## Story files

The story files are not redistributable and are deliberately absent from this
repository. Supply one at test time:

```bash
ZORK_STORY=/path/to/story.z3 deno task test
```

Tests that need a story file are skipped when `ZORK_STORY` is unset, so the
suite still runs in CI without it.

## Tasks

```bash
deno task test    # run the suite
deno task check   # typecheck
deno task serve   # run the service locally
deno task keygen  # print a fresh sealing key
deno lint
deno fmt
```
