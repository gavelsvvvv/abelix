---
agent: "agent"
description: "Generate tests for the selected code — cover happy paths, edge cases, error paths, and regressions."
---
You are generating tests for the provided code.

## Task
Create comprehensive tests that protect against regressions and verify correctness.

## Process
1. Analyze the code to identify critical behaviors and edge cases.
2. Determine the right test level: unit, integration, or contract.
3. Follow existing test conventions in the project.
4. Write tests that express behavior, not implementation details.

## Coverage targets
- ✅ Happy path — the primary success scenario.
- ✅ Edge cases — boundary values, empty inputs, nulls, large inputs.
- ✅ Error paths — invalid inputs, failures, timeouts, exceptions.
- ✅ Regression cases — bugs that were fixed (if known from context).

## Rules
- Use the project's established test framework and patterns.
- Avoid unnecessary mocking — mock at boundaries only.
- Keep tests readable and self-documenting.
- Each test should test one behavior.
- Use descriptive test names that explain the scenario.

## Output format

### Test strategy
- What is being tested and at what level

### Tests created
- List of tests with descriptions

### Coverage
- What behaviors are now protected

### Gaps
- What remains untested and why

### Validation
- Whether the tests pass and any issues found
