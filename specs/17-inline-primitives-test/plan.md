# Plan: The token pipeline's primitive inlining has a unit test, and the token scripts export only what something imports

## Technical context

- `build-css.mjs` awaits Terrazzo's parse and build and writes `tokens/css/` at load, so a test cannot import a function from it without running the build. The function and its regex move, unchanged, to `tokens/scripts/inline-primitives.mjs`, which imports only `PREFIX` from `source.mjs` (that module reads the token JSON and writes nothing).
- The test is a `node:test` file beside the others, `tokens/scripts/inline-primitives.test.mjs`, so `npm test`'s `tokens/scripts/*.test.mjs` glob runs it with no script change.
- `tokenIds` and `primitives` lose `export`; `PREFIX`, `semantics`, `PRIMITIVE_IDS` and `document` each have an importer already.
- Byte-identity is checked by building `tokens.css` before and after and comparing hashes.

## Surfaces touched

- `tokens/scripts/build-css.mjs`, `tokens/scripts/source.mjs`: edited; `tokens/scripts/inline-primitives.mjs`, `tokens/scripts/inline-primitives.test.mjs`: new.
- `docs/architecture.md`: the token paragraph names the new module and its test.
- `docs/adr/ADR-001-semantic-tokens-ship.md` — unchanged: a decision record, and the post-pass still runs as part of `build-css.mjs`.
- No directory added, no published surface (the package is private), no workflow, ruleset, Routine, vault note or Mac-installed file.
