---
agent: "agent"
description: "Design or review an API — endpoints, contracts, errors, versioning."
---
You are designing or reviewing an API.

## Task
Create or improve an API design with proper contracts and conventions.

## Process
1. Identify resources and their relationships.
2. Define endpoints with HTTP methods.
3. Design request/response schemas.
4. Define error handling strategy.
5. Plan versioning approach.

## REST conventions
- Resources are plural nouns: `/users`, `/orders`
- HTTP verbs: GET=read, POST=create, PUT=replace, PATCH=update, DELETE=remove
- Proper status codes: 200, 201, 204, 400, 401, 403, 404, 409, 422, 500
- Consistent error format with error code, message, and field-level details
- Pagination: cursor-based or offset-based, consistent across endpoints
- Filtering: query params with clear naming
- Sorting: `?sort=field:asc,field2:desc`

## Output format

### Resources
- Resource hierarchy and relationships

### Endpoints
| Method | Path | Description | Auth | Request | Response |
|--------|------|-------------|------|---------|----------|
| GET | /users | List users | Yes | query params | paginated list |

### Error format
- Standard error response structure

### Versioning
- Strategy and migration path

### Security
- Auth requirements per endpoint
- Rate limiting strategy
