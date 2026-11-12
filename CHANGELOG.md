# Changelog

Entries start with the first release; `release-pr.yml` writes each one from
the Conventional Commits since the previous tag.

## 0.1.0 (2026-11-12)

### Features

* **agent:** the docked design-delta skill and hook, guard hooks, a scaffold script and CLAUDE.md ([c478f20](https://github.com/chrisgriffin/agentic-design-system/commit/c478f20ef568f766d272874abc53db19a9f45aeb))
* **components:** badge, button and card with contracts, stories, tests and Code Connect stubs ([2f4ab67](https://github.com/chrisgriffin/agentic-design-system/commit/2f4ab67e2925dc3b28767b11de0e4eb6229f4a18))
* **fleet:** the release, sync, mention and gate stubs, the docs, and a changelog ([a7b6d55](https://github.com/chrisgriffin/agentic-design-system/commit/a7b6d552dfab113f08bcd8a9ed990b1cd2ef1427))
* **init:** scripts/init.mjs turns a copy into a named system, and a check proves it on every PR ([b4b6303](https://github.com/chrisgriffin/agentic-design-system/commit/b4b63035c4ca10a15b1ae087b8395e524e506c91))
* **storybook:** Tokens and Design Drift pages, a check stub, and a Pages deploy ([e5549e3](https://github.com/chrisgriffin/agentic-design-system/commit/e5549e30cb3023c55de94a454b5387daa7cde480))
* **tokens:** a DTCG source built by Terrazzo into prefixed CSS, with a manifest ([97596fb](https://github.com/chrisgriffin/agentic-design-system/commit/97596fb4b5be392d0d2092824984f7064b5a6330))

### Bug Fixes

* **a11y:** find expectNoViolations calls with the TypeScript parser ([3cc8b34](https://github.com/chrisgriffin/agentic-design-system/commit/3cc8b348c3b4a18b46cd2b891d975c59f28861e4))
* **ci:** word the fleet stubs' headers so a --fleet copy needs no scrub ([d2c2953](https://github.com/chrisgriffin/agentic-design-system/commit/d2c2953e4b96c1e97b4dc746683dc1563fe39f97))
* **deps:** lock the nested yaml-to-momoa design-delta's parser wants, so npm ci on Node 22 installs ([e322b12](https://github.com/chrisgriffin/agentic-design-system/commit/e322b1221d48420a7594dfd6363baf88bf1dd013))
* **deps:** restore the lock npm 10 reads ([03386a5](https://github.com/chrisgriffin/agentic-design-system/commit/03386a5f14cd3048dcc332769940723213d0481e))
* **init:** drop the init-only doc passages from a copy and assert they are gone ([6c79a68](https://github.com/chrisgriffin/agentic-design-system/commit/6c79a681c9ecd31de4f89f7467418af59831eb97))
* **init:** say the init script exists and drop a swap that matches nothing ([be6374e](https://github.com/chrisgriffin/agentic-design-system/commit/be6374e1639936815f9d2ba81da27f6eebb842a8))
* **test:** name the token test files, since node --test on Node 22 takes no directory ([313e638](https://github.com/chrisgriffin/agentic-design-system/commit/313e63892365e39200abdb5a7b22fb167444bf80))
* **tokens:** refuse every form of a dangling primitive reference ([6604594](https://github.com/chrisgriffin/agentic-design-system/commit/6604594f861981d38c6bf8445336937867d3a434))
* **tokens:** resolve primitive aliases through the chain and refuse a cycle ([8e6c123](https://github.com/chrisgriffin/agentic-design-system/commit/8e6c12308f89f126c056b7e889f413cc19429bf7))

### Documentation

* **fleet:** say what the agent layer, the tests and .design-delta/ hold today ([0349834](https://github.com/chrisgriffin/agentic-design-system/commit/034983422fe9118c28d9a882c8d25c5d2d06d2be))
* **init:** name the init check in testing.md and the script in architecture.md ([be94132](https://github.com/chrisgriffin/agentic-design-system/commit/be94132088102876d3deb8dc5089f57e39976ee3))
* keep CLAUDE.md's CI paragraph under the 400-character line cap ([8d0b94d](https://github.com/chrisgriffin/agentic-design-system/commit/8d0b94d98d4974eb43170ced1408caa20b587432))
* limit the no-git-access claim to the engine ([ace6274](https://github.com/chrisgriffin/agentic-design-system/commit/ace627479b1ca7db4f88b9fb2c745aad197a6b79))
* scope the Storybook-build passages to this checkout ([2755ea4](https://github.com/chrisgriffin/agentic-design-system/commit/2755ea44b419ef0aec95ed2b95680783f9b0d7d9))
* **spec:** A component folder with no test file fails npm test ([6d515da](https://github.com/chrisgriffin/agentic-design-system/commit/6d515da32b2a729ff06b068525f116c94ddb7eb0))
* **spec:** a component test that never runs the accessibility assertion fails npm test ([c3a1c62](https://github.com/chrisgriffin/agentic-design-system/commit/c3a1c62cfb5a16eccdbdb9724144ec5d6ca0d58e))
* **spec:** a pull request builds the Storybook once, not twice ([9e07634](https://github.com/chrisgriffin/agentic-design-system/commit/9e07634c8f06ac64d5e4f8a23dd1521805a46052))
* **spec:** a runnable line that is red today, not one that already passes ([66dbec9](https://github.com/chrisgriffin/agentic-design-system/commit/66dbec9c743ef73ed934a68e3ecba8a2a0837d1f))
* **spec:** agent layer, the docked skill and hook, guard hooks, scaffold script and rulebook ([55046f4](https://github.com/chrisgriffin/agentic-design-system/commit/55046f4173638c174b493ff071d95c4cb759723c))
* **spec:** an init script turns a fresh copy of the template into a named design system ([9d3fdec](https://github.com/chrisgriffin/agentic-design-system/commit/9d3fdecf0cb6c06917274e9a72797c93cacc5e9f))
* **spec:** Button's tests show it works from the keyboard alone ([cbfa49d](https://github.com/chrisgriffin/agentic-design-system/commit/cbfa49d92cfd716ee8dd52e887afe242da444c57))
* **spec:** components, badge, button and card with contracts, verified by design-delta ([1fed41e](https://github.com/chrisgriffin/agentic-design-system/commit/1fed41e9a06dc09cd45bd3287c38bb9210f378e4))
* **spec:** fleet files, the remaining workflow stubs, docs, changelog and the first release ([332b2e8](https://github.com/chrisgriffin/agentic-design-system/commit/332b2e876557511d6d677d05a0c94138a2136d43))
* **spec:** keep operator vocabulary out of a public repo's committed files ([4a31f72](https://github.com/chrisgriffin/agentic-design-system/commit/4a31f7235e548b10be9fd0006fb697dbb21ea022))
* **spec:** pin the design-delta engine so a clone installs the same one ([94ec9e1](https://github.com/chrisgriffin/agentic-design-system/commit/94ec9e1287bf76ad9a458d458b0d4368830c977d))
* **spec:** record CHK034 as resolved by [#29](https://github.com/chrisgriffin/agentic-design-system/issues/29) ([a0a9cf3](https://github.com/chrisgriffin/agentic-design-system/commit/a0a9cf3486a198deab03bb6d8e1b019f2186b408))
* **spec:** reviewer checklist, and say the engine's content may move ([1229eca](https://github.com/chrisgriffin/agentic-design-system/commit/1229ecafb6e274f83506eed6688dddcd06e68955))
* **spec:** Storybook with Tokens and Design Drift pages, published to GitHub Pages ([71b18dc](https://github.com/chrisgriffin/agentic-design-system/commit/71b18dca63c4e1feda901b8465d8c2cc19d5e763))
* **spec:** take the engine from the npm registry instead of a git pin ([b47067b](https://github.com/chrisgriffin/agentic-design-system/commit/b47067b5ccff9dcc766e97ef9d625b040316b3f4))
* **spec:** the gate asserts accessibility, not just a Storybook panel ([80f1e4b](https://github.com/chrisgriffin/agentic-design-system/commit/80f1e4bf48f8f867f2d9cec508e1d6b9a548cb97))
* **spec:** the README says scripts/init.mjs exists, and init.mjs drops a dead swap ([1d7357b](https://github.com/chrisgriffin/agentic-design-system/commit/1d7357b19bf2f783ee3217794be5565ebe098e06))
* **spec:** the reviewer checklist, answered, and the helper moved out of components/ ([0d4a02e](https://github.com/chrisgriffin/agentic-design-system/commit/0d4a02ec0f77f8bf3b9be2afd6f44931ca2abbfc))
* **spec:** the token pipeline's primitive inlining has a unit test ([d0925e2](https://github.com/chrisgriffin/agentic-design-system/commit/d0925e2646879a04080cf69f2d72af3e6e4d3a59))
* **spec:** tokens, a DTCG source built by Terrazzo into prefixed CSS ([eca047e](https://github.com/chrisgriffin/agentic-design-system/commit/eca047e29c99e2d5e2bdb251cae587117ac9bd55))
* the README's verify chain no longer ends with build-storybook ([0b556c7](https://github.com/chrisgriffin/agentic-design-system/commit/0b556c79825d9a5bf6e6b4f4ae213e96eeae53f9))
* **tokens:** name inline-primitives test in docs/testing.md and fix its error prefix ([021b9aa](https://github.com/chrisgriffin/agentic-design-system/commit/021b9aac78a3d971d853afe1b119d86514e51223))

### Build System

* **deps:** take the design-delta engine from the npm registry ([60e5cb2](https://github.com/chrisgriffin/agentic-design-system/commit/60e5cb2406955479ccb64a452f2b66ff52083c97))
