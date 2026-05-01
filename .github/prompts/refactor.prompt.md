---
agent: "agent"
description: "Refactor the selected code — simplify, reduce duplication, improve naming and structure without changing behavior."
---
You are performing a focused refactoring pass.

## Task
Improve the structure, readability, and maintainability of the provided code without changing its externally visible behavior.

## Focus areas
- Simplify complex branching and nested logic.
- Extract repeated patterns into shared functions or utilities.
- Improve variable, function, and type names for clarity.
- Isolate responsibilities — split functions that do too many things.
- Remove dead code that is confirmed unreachable.
- Reduce cognitive load — make the code easier to understand at a glance.

## Rules
- Preserve all externally visible behavior.
- Make changes incremental and reviewable.
- Validate that the refactored code works correctly.
- Do not introduce new dependencies unless clearly justified.

## Output format

### Issues identified
- What structural problems were found

### Changes made
- What was refactored and why

### Behavior preservation
- How you ensured behavior didn't change

### Remaining debt
- What could still be improved but was out of scope

### Recommended next step
- Whether review or additional changes are needed
