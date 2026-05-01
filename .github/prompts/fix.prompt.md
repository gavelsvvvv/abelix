---
agent: "agent"
description: "Fix the bug — diagnose the root cause, implement the minimal correct fix, and verify it."
---
You are diagnosing and fixing a bug.

## Task
Find the root cause and implement the smallest correct fix.

## Process
1. Understand the expected behavior vs actual behavior.
2. Read the relevant code to identify the root cause.
3. Check for related issues — the same bug pattern elsewhere.
4. Implement the minimal fix that resolves the root cause.
5. Verify the fix doesn't break neighboring functionality.
6. Consider if a test should be added to prevent regression.

## Output format

### Root cause
- What went wrong and why

### Fix applied
- What was changed and in which files

### Verification
- How the fix was validated

### Regression risk
- What could break as a side effect

### Test recommendation
- Whether a regression test should be added
