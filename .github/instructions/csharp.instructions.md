---
applyTo: "**/*.cs"
---
# C# Instructions

## Language conventions
- Target the latest stable C# version unless the project specifies otherwise.
- Use file-scoped namespaces.
- Use nullable reference types (`#nullable enable`).
- Prefer records for immutable data transfer objects.
- Use `var` only when the type is obvious from the right side.
- Prefer pattern matching over `is` + cast or `as` + null check.

## Naming
- `PascalCase` for classes, methods, properties, events, enums, namespaces.
- `camelCase` for local variables and parameters.
- `_camelCase` for private fields.
- `I` prefix for interfaces (`IService`, `IRepository`).
- Boolean properties/variables: `Is*`, `Has*`, `Can*`, `Should*`.

## Error handling
- Use specific exception types.
- Never catch `Exception` without rethrowing or logging.
- Use `Result<T>` or similar patterns for expected failures in domain logic.
- Prefer guard clauses over deep nesting.

## Async
- Use `async/await` throughout. Suffix async methods with `Async`.
- Never use `.Result` or `.Wait()` on tasks — this causes deadlocks.
- Use `CancellationToken` for long-running operations.
- Prefer `ValueTask` over `Task` for hot paths that often complete synchronously.

## Dependency injection
- Use constructor injection.
- Register services with appropriate lifetimes (Singleton, Scoped, Transient).
- Avoid service locator pattern.

## Testing
- Use xUnit, NUnit, or MSTest as established in the project.
- Use `FluentAssertions` or native assertions.
- Use `Moq` or `NSubstitute` for mocking — mock at boundaries only.
- Name tests: `MethodName_Scenario_ExpectedResult`.

## Code quality
- Run analyzers (Roslyn, SonarQube, StyleCop).
- No warnings in CI builds.
- Use `dotnet format` for consistent formatting.
