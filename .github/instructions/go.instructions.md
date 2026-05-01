---
applyTo: "**/*.go"
---
# Go Instructions

## Language conventions
- Follow standard Go idioms and `Effective Go` guidelines.
- Use `gofmt` / `goimports` formatting — no exceptions.
- Prefer short, focused functions.
- Use named return values only when they improve documentation.
- Prefer value receivers unless the method mutates state or the struct is large.

## Naming
- `PascalCase` for exported identifiers.
- `camelCase` for unexported identifiers.
- Short, descriptive variable names (especially loop vars and receivers).
- Interface names: single-method interfaces use `-er` suffix (`Reader`, `Writer`, `Handler`).
- Package names: short, lowercase, singular. No underscores.

## Error handling
- Always check errors. Never use `_` to discard errors unless explicitly justified.
- Use `fmt.Errorf` with `%w` for error wrapping.
- Prefer sentinel errors or custom error types for domain errors.
- Return errors, don't panic — reserve `panic` for truly unrecoverable situations.

## Concurrency
- Use goroutines with care — always ensure cleanup.
- Use `context.Context` for cancellation and timeouts.
- Use `sync.WaitGroup`, channels, or `errgroup` for coordination.
- Avoid shared mutable state — communicate via channels.

## Testing
- Use standard `testing` package.
- Use table-driven tests for parametric coverage.
- Use `testify` assertions if the project already uses them.
- Use `httptest` for HTTP handler tests.
- Name test files `*_test.go` in the same package.

## Dependencies
- Use Go modules (`go.mod`).
- Minimize external dependencies.
- Run `go mod tidy` after dependency changes.

## Code quality
- Run `go vet` and `staticcheck`.
- Ensure no lint warnings in CI.
