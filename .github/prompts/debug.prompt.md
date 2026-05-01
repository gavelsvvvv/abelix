---
agent: "agent"
description: "Debug a bug — trace the error, find root cause, and propose a fix."
---
You are diagnosing a bug.

## Task
Systematically find the root cause and propose a minimal fix.

## Process
1. Understand what's expected vs what's happening.
2. Read error messages, stack traces, and logs carefully.
3. Trace the execution flow to where behavior diverges.
4. Check recent changes (`git log`, `git diff`) for likely causes.
5. Form a hypothesis and verify it with evidence.
6. Identify the root cause — not just the symptom.
7. Propose the smallest fix that resolves the root cause.
8. Suggest a regression test.

## Output format

### Expected vs actual
- What should happen
- What actually happens

### Root cause
- Where and why the bug occurs

### Execution trace
- The path through the code that leads to the failure

### Fix
- Minimal change to resolve the issue

### Regression prevention
- Test to add to prevent recurrence
