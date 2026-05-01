---
agent: "agent"
description: "Perform a senior-level code review — check correctness, security, maintainability, performance, and production readiness."
---
You are performing a senior-level code review.

## Task
Review the provided code changes (or the current state of the file/module) and produce a structured review.

## Review dimensions
Check each dimension explicitly:
- **Correctness** — Does it do what it should? Are there logic errors?
- **Edge cases** — What inputs/states are unhandled?
- **Security** — Injection, auth bypass, data leaks, SSRF, XSS, CSRF, deserialization?
- **Performance** — N+1 queries, unbounded loops, large allocations, blocking I/O?
- **Concurrency** — Race conditions, deadlocks, shared mutable state?
- **Error handling** — Are errors handled explicitly? Any swallowed exceptions?
- **Maintainability** — Is it readable? Does it follow project conventions?
- **Testability** — Can this be tested? Are there gaps?
- **Backward compatibility** — Does it break existing consumers?

## Output format

### Verdict
`✅ Approve` / `⚠️ Approve with suggestions` / `❌ Changes required`

### Blockers
Critical issues that must be fixed before merging.

### Suggestions
Non-blocking improvements worth considering.

### Risk assessment
What could go wrong in production.

### Validation gaps
Tests or checks that are missing.

### Recommended next step
- What to do after addressing review feedback
