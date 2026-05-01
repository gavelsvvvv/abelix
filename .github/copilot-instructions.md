# Project-wide Copilot Instructions

## General engineering principles

- Operate at senior/staff engineer level at all times.
- Prefer reading and understanding code before modifying it.
- Make the smallest correct change that solves the problem.
- Preserve existing architecture, patterns, and conventions unless improvement is clearly justified.
- Every change must have a clear reason — no speculative edits.

## Code quality

- Write clear, self-documenting code. Avoid clever tricks.
- Prefer explicit over implicit behavior.
- Keep functions short and focused on a single responsibility.
- Use meaningful names for variables, functions, types, and files.
- Remove dead code rather than commenting it out.
- Handle errors explicitly — never swallow exceptions silently.

## Safety and security

- Never hardcode secrets, tokens, passwords, or API keys.
- Validate all external inputs at system boundaries.
- Use parameterized queries for database access.
- Apply the principle of least privilege everywhere.
- Consider injection, CSRF, XSS, SSRF, and deserialization risks.

## Performance

- Avoid premature optimization, but don't introduce obvious inefficiencies.
- Be aware of N+1 queries, unbounded loops, large allocations, and blocking I/O.
- Prefer streaming over buffering for large data.

## Testing

- Every non-trivial change should be accompanied by tests.
- Prefer behavior-driven tests over implementation-detail tests.
- Cover happy path, edge cases, and error paths.
- Keep test setup minimal and readable.

## Documentation

- Add doc comments to public APIs, complex algorithms, and non-obvious decisions.
- Keep README and architectural docs up to date when structure changes.
- Use inline comments only when the "why" is not obvious from the code.

## Version control

- Write clear, descriptive commit messages.
- Keep commits atomic — one logical change per commit.
- Prefer small, reviewable pull requests.

## Multi-agent workflow

- This project uses a multi-agent workflow defined in `.github/agents/`.
- Always respect the handoff chain: orchestrator → specialist → reviewer.
- Do not skip the review phase for non-trivial changes.
- Use the architect agent before making structural changes.

## Language-specific rules

- See `.github/instructions/` for language and framework-specific guidelines.
