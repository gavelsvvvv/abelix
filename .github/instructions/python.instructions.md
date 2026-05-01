---
applyTo: "**/*.py"
---
# Python Instructions

## Language conventions
- Target Python 3.10+ unless the project specifies otherwise.
- Use type hints for all function signatures and public module-level variables.
- Prefer `dataclasses` or `pydantic` models over plain dicts for structured data.
- Use `pathlib.Path` instead of `os.path` for file system operations.
- Prefer f-strings over `.format()` or `%` formatting.

## Naming
- `snake_case` for functions, variables, methods, modules.
- `PascalCase` for classes.
- `UPPER_SNAKE_CASE` for module-level constants.
- Prefix private attributes with `_`. Avoid `__` name-mangling unless necessary.

## Error handling
- Use specific exception types, not bare `except`.
- Never `except Exception: pass`.
- Use custom exception classes for domain errors.
- Use `contextlib` for resource management when `with` is not enough.

## Imports
- Group: stdlib → third-party → local.
- Use absolute imports. Avoid relative imports outside of packages.
- Never use `from module import *`.

## Async
- Use `asyncio` with `async/await` for I/O-bound work.
- Avoid mixing sync and async code without explicit bridges.
- Use `asyncio.TaskGroup` (3.11+) or `asyncio.gather` for concurrent tasks.

## Testing
- Use `pytest` as the default test runner.
- Use fixtures for setup, not `setUp`/`tearDown` methods.
- Use `pytest.raises` for exception testing.
- Use `pytest.mark.parametrize` for data-driven tests.
- Prefer `unittest.mock.patch` at boundaries, not internals.

## Dependencies
- Pin versions in `requirements.txt` or use `pyproject.toml` with locked deps.
- Prefer virtual environments (`venv`, `poetry`, `uv`).

## Code quality
- Run `ruff` or `flake8` for linting.
- Run `mypy` or `pyright` for type checking.
- Format with `black` or `ruff format`.
