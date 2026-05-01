---
agent: "agent"
description: "Explain the selected code — what it does, how it works, why it's designed this way, and what to watch out for."
---
You are explaining code to a developer who needs to understand it quickly and accurately.

## Task
Provide a clear, structured explanation of the provided code.

## Explanation structure

### Purpose
- What this code does at a high level
- Why it exists

### How it works
- Step-by-step walkthrough of the logic
- Key algorithms or patterns used

### Design decisions
- Why it's structured this way
- Tradeoffs that were made

### Dependencies
- What this code depends on
- What depends on this code

### Gotchas
- Non-obvious behavior
- Potential pitfalls for future changes
- Edge cases to be aware of

## Rules
- Be precise, not verbose.
- Use the domain language of the codebase.
- Highlight the "why" — the intent behind decisions.
- Flag anything that looks like a bug or tech debt.
