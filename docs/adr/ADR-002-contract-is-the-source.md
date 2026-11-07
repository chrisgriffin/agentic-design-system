---
status: accepted
date: 2026-11-07
---

# ADR-002: A component is one directory, and its contract is the source of truth

## Context

A design system maintained by agents drifts in one direction: the code stops matching the design, one prop or one literal at a time, and nothing says so until a person looks. The design-delta engine compares a per-component contract against the code and, once a design file is set, against the design; it needs each component in one place with one contract beside it. Two layouts were on the table: contracts in a `contracts/` tree mirroring `components/`, or the contract in the component's own directory.

## Decision

`components/<name>/` holds everything that is the component, and only that: the code, the CSS Module, the story, the test, the Code Connect file, the contract and the index. `design-delta.json` names `components` as both the components and the contracts directory. The contract declares the props, the anatomy and the token bindings; the code and the stylesheet conform to it, and `npm run drift:verify`, in `npm run verify` and in a post-edit hook, fails when they do not. A composed part (`card-header`) is a second contract in the parent's directory, conforming against its own file.

## Consequences

Scaffolding is one directory copied (`npm run scaffold -- <name>`), review is one directory read, and the engine finds a contract by the component's name with no mapping. A design-only axis lives in the contract as `code: none`, so a prop the design has and the code must not carry is a finding, not a convention. The price is that a contract has no home until its component exists; the scaffold script drafts it from the component's props for that reason.
