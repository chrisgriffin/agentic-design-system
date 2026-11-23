# Spec: A created system says how to put it on GitHub, and an agent can run its setup skill

**Issue**: [#73](https://github.com/chrisgriffin/agentic-design-system/issues/73)

## Overview

The create command leaves a green copy with no remote. Its `docs/releasing.md` says there are no manual steps, though the copy has no GitHub repo, no `develop`, no Pages source, no `RELEASE_PR_TOKEN` and no ruleset. Its setup skill loads only in a session opened inside the copy, and it asks every question even when the owner's request already answered it.

## User scenarios

- An agent asked to build a design system runs the create command from its own folder; the closing line names the skill's file, so it reads that and follows it without a new session.
- The owner's request already said what the system is for and its accent color; the skill takes those answers and asks only the rest.
- After setup, the owner reads `docs/releasing.md` and finds the one-time GitHub steps, with the exact check names the ruleset requires.

## Functional requirements

- FR-001: `docs/releasing.md` has a one-time setup section: create the repo, push `main`, branch `develop` from it, set Pages to deploy from GitHub Actions, add `RELEASE_PR_TOKEN`, and a ruleset on `main` and `develop` requiring each pull-request check by name.
- FR-002: A test fails when a check that section names is not a pull-request job of a workflow a copy keeps, or when such a job is missing from it.
- FR-003: The create command's closing line names `.claude/skills/setup-system/SKILL.md` for a session opened elsewhere; a test fails when that path does not exist.
- FR-004: The skill takes answers the owner already gave and asks only what is left, and its summary points the owner at the setup section of `docs/releasing.md`.
- FR-005: `CLAUDE.md`'s job-name coupling names `docs/releasing.md` beside the ruleset.

## Success criteria

- [ ] `docs/releasing.md` lists the one-time GitHub setup a copy needs (repo, `main` and `develop`, Pages from Actions, `RELEASE_PR_TOKEN`, a ruleset requiring each pull-request check by name), and a test fails when a check it names is not a pull-request job a copy keeps, or a copy's pull-request check is missing from it.
- [ ] The create command's closing line names the skill's file, for a session opened outside the copy, and a test fails when that file does not exist.
- [ ] The setup skill uses answers the owner already gave instead of asking again, and ends by pointing the owner at the GitHub setup in `docs/releasing.md`.
- [ ] **Runnable:** `node --test cli/*.test.mjs` exits 0 with `# fail 0`.

## Out of scope

- Creating the GitHub repo from the create command: it is an account action, the owner's to take.
- The 48 review findings a fresh copy reports: [#35](https://github.com/chrisgriffin/agentic-design-system/issues/35).
