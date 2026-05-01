---
applyTo: "**/*.rs"
---
# Rust Instructions

## Language conventions
- Follow Rust 2021 edition idioms.
- Use `clippy` lints — treat warnings as errors in CI.
- Prefer owned types in public APIs, borrowed types internally.
- Use `Result<T, E>` for fallible operations. Avoid `unwrap()` in production code.
- Use `?` operator for error propagation.
- Prefer `impl Trait` in function signatures for simplicity.

## Naming
- `snake_case` for functions, variables, methods, modules, crates.
- `PascalCase` for types, traits, enums, structs.
- `UPPER_SNAKE_CASE` for constants and statics.
- Lifetime names: short and descriptive (`'a`, `'ctx`).

## Error handling
- Use `thiserror` for library error types, `anyhow` for application errors.
- Never use `panic!` for expected failure paths.
- Prefer typed errors over string errors.
- Use `Option<T>` instead of sentinel values.

## Memory and safety
- Minimize `unsafe` blocks — justify each one with a `// SAFETY:` comment.
- Prefer stack allocation over heap when sizes are known.
- Use `Arc`/`Rc` only when shared ownership is truly needed.
- Use `Cow<'_, T>` for flexible ownership in APIs.

## Async
- Use `tokio` or `async-std` as specified by the project.
- Avoid blocking calls inside async contexts.
- Use `tokio::spawn` for concurrent tasks with proper error handling.

## Testing
- Use `#[cfg(test)]` modules in the same file.
- Use `#[test]` for unit tests, `tests/` directory for integration tests.
- Use `assert_eq!`, `assert_ne!`, `assert!` with descriptive messages.
- Use `proptest` or `quickcheck` for property-based testing when appropriate.

## Dependencies
- Minimize dependency surface.
- Pin major versions in `Cargo.toml`.
- Run `cargo audit` for security vulnerabilities.
