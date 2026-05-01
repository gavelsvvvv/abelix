---
applyTo: "**/*.js,**/*.jsx,**/*.mjs,**/*.cjs"
---
# JavaScript Instructions

## Language conventions
- Use modern ES2020+ syntax.
- Prefer `const` over `let`. Never use `var`.
- Use arrow functions for callbacks and lambdas.
- Use template literals over string concatenation.
- Use optional chaining (`?.`) and nullish coalescing (`??`).
- Use destructuring for objects and arrays when it improves readability.

## Naming
- `camelCase` for variables, functions, methods.
- `PascalCase` for classes and React components.
- `UPPER_SNAKE_CASE` for true constants.
- Boolean variables: `is*`, `has*`, `should*`, `can*`.

## Error handling
- Always handle promise rejections.
- Use `try/catch` with `async/await`.
- Prefer custom Error subclasses for domain errors.
- Never catch errors silently.

## Modules
- Use ES modules (`import`/`export`) over CommonJS (`require`/`module.exports`) unless the project convention dictates otherwise.
- Use named exports. Avoid default exports when the module has multiple exports.

## Async
- Use `async/await` over `.then()` chains.
- Use `Promise.all` / `Promise.allSettled` for concurrent work.
- Avoid callback-based APIs — wrap in Promises if needed.

## Testing
- Use the project's established test runner (Jest, Vitest, Mocha).
- Structure tests with `describe` / `it`.
- Mock external dependencies at boundaries.
- Test behavior, not implementation.

## Code quality
- Use ESLint with project config.
- Use Prettier for formatting.
- No `console.log` in production code — use a proper logger.
