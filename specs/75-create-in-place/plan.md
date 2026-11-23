# Plan: The create command sets up the repo it is run in

## Technical context

- `cli/create.mjs`: `--name` joins the value flags; positionals are refused. Target = `path.resolve(--dir ?? cwd)`; name defaults to its basename. The clone goes to `mkdtemp(os.tmpdir())`; its `.git` is dropped; the target is checked (missing, empty, or a clean git work tree via `git status --porcelain --untracked-files=all -- .`), the files that will be replaced are listed by walking the clone, and `cpSync` copies it in. Outside a work tree, `git init` and `symbolic-ref HEAD refs/heads/main`; inside one with no commit, the same `symbolic-ref`.
- `REFUSAL_LINE`'s `--name` → `<name>` mapping goes: create takes `--name` now.
- `cli/create.test.mjs`, `cli/create-branch.test.mjs`: the helpers pass `--dir <tmp>/sample-system` and `--name` where a test names the system; new cases for the current folder, kept history and branch, a dirty repo, an untracked file, a non-empty non-repo folder, a positional argument, a nested `--dir` in a repo, and the replaced-files line.
- `.github/workflows/init-check.yml`: the create run passes `--dir "$RUNNER_TEMP/created-system"`.
- `README.md`, `docs/architecture.md`, `docs/testing.md`, the skill's step 0 wording ("starts a new history").

## Surfaces touched

- `cli/create.mjs`, its two tests, `init-check.yml` (job name and triggers unchanged: no ruleset change), the docs above.
- `cost` — none.
