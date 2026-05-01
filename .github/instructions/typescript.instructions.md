---
applyTo: "**/*.ts,**/*.tsx"
---
# TypeScript Instructions

## Language conventions
- Use strict TypeScript (`strict: true` in tsconfig).
- Prefer `interface` over `type` for object shapes unless union/intersection is needed.
- Use `unknown` instead of `any`. If `any` is unavoidable, add a comment explaining why.
- Prefer `const` over `let`. Never use `var`.
- Use explicit return types on exported functions and public methods.
- Prefer `readonly` properties and `ReadonlyArray` where mutation is not intended.

## Naming
- `PascalCase` for types, interfaces, enums, classes, components.
- `camelCase` for variables, functions, methods, parameters.
- `UPPER_SNAKE_CASE` for true constants.
- Prefix interfaces with context, not `I` (e.g., `UserService`, not `IUserService`).
- Boolean variables: `is*`, `has*`, `should*`, `can*`.

## Error handling
- Use typed error classes or discriminated unions for expected failures.
- Never catch and ignore errors silently.
- Prefer `Result<T, E>` patterns over throwing when the caller needs to handle failure.

## Async
- Always use `async/await` over raw Promises.
- Avoid fire-and-forget async calls — always handle or propagate errors.
- Be aware of unhandled rejection risks.

## Imports
- Use named imports. Avoid `import *`.
- Group imports: external libs → internal modules → relative paths.
- Use path aliases defined in tsconfig when available.

## Testing
- Use `describe` / `it` structure.
- Prefer `toEqual` for deep comparison, `toBe` for primitives.
- Mock at boundaries (HTTP, DB, file system), not internal modules.
