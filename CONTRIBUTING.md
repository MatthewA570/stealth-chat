# Contributing

Thank you for taking an interest in Stealth Chat. Focused bug fixes, documentation improvements, and interface refinements are welcome.

## Before you start

- Search the existing issues and pull requests before opening a duplicate.
- Keep changes scoped to one clear problem.
- Do not commit API keys, generated bundles, virtual environments, or local editor files.
- For larger behavior or architecture changes, open an issue first so the approach can be discussed.

## Local workflow

Follow the [development guide](docs/DEVELOPMENT.md) to install dependencies and build the sidecar. Create a branch, make the change, and run the checks relevant to your work:

```bash
npm run lint --prefix client
npm run build --prefix client
cargo check --manifest-path src-tauri/Cargo.toml
python -m py_compile server/main.py
```

There is not yet an automated test suite, so include manual verification for changes that affect runtime behavior. Do not use a real secret in screenshots, fixtures, logs, or pull-request text.

## Project conventions

- Keep the UI behavior consistent with the macOS desktop target and check both narrow and standard window sizes.
- Preserve accessibility labels and visible keyboard focus when adding controls.
- Keep frontend model entries in `client/src/App.tsx` aligned with the backend map in `server/main.py`.
- Rebuild and exercise the PyInstaller sidecar after changing Python imports or dependencies.
- Update the README or `docs/` when setup steps, limitations, security behavior, or architecture changes.

## Pull requests

A useful pull request includes:

- a short explanation of the problem and the chosen solution;
- the commands and manual scenarios used to verify it;
- screenshots or a recording for visible interface changes; and
- any remaining limitations or follow-up work.

By contributing, you confirm that you have the right to submit the work. This repository currently has no software license; maintainers should add one before accepting external code contributions or distributing releases.
