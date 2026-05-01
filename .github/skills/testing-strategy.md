# Testing Strategy Skill

Reusable capability for designing comprehensive test strategies.

## When to use
- Setting up test infrastructure for a new project.
- Adding test coverage to an existing codebase.
- Reviewing test strategy for completeness.
- After significant refactoring or feature additions.

## Test pyramid

### Unit tests (base — most tests here)
- Test individual functions, methods, classes in isolation.
- Fast execution (milliseconds).
- No external dependencies (DB, network, file system).
- Mock at boundaries only.

### Integration tests (middle layer)
- Test interaction between modules or services.
- May use real databases (testcontainers, in-memory DBs).
- Test API contracts between services.
- Medium execution time (seconds).

### End-to-end tests (top — fewest tests here)
- Test complete user flows through the system.
- Use real infrastructure or close approximations.
- Slow execution (minutes).
- Focus on critical happy paths only.

## Coverage strategy

### What to always test
- Public API contracts.
- Business logic and domain rules.
- Error handling and edge cases.
- Security-sensitive paths (auth, authorization, input validation).
- Data transformations and serialization.

### What to skip
- Third-party library internals.
- Simple getters/setters with no logic.
- Framework boilerplate.
- UI layout details (test behavior instead).

## Test quality checklist
- [ ] Tests are deterministic — no flaky tests.
- [ ] Tests are independent — no order dependency.
- [ ] Tests are fast — slow tests get skipped.
- [ ] Tests are readable — each test tells a story.
- [ ] Tests use descriptive names — `should_reject_expired_token`.
- [ ] Tests cover the failure mode, not just the happy path.
- [ ] Mocks are minimal — over-mocking hides real bugs.

## Anti-patterns
- Testing implementation details instead of behavior.
- Copy-paste test code instead of using helpers/fixtures.
- Ignoring flaky tests instead of fixing them.
- 100% coverage as a goal instead of meaningful coverage.
- Mocking everything including the thing under test.
