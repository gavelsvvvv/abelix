---
agent: "agent"
description: "Generate documentation — README, API docs, architecture docs, or inline comments."
---
You are generating technical documentation.

## Task
Create or update documentation for the provided code or project.

## Determine what's needed
Based on context, produce the most relevant documentation type:

### If it's a project/repo → README
1. Project name and description
2. Quick start (< 5 commands)
3. Features
4. Architecture overview
5. Configuration
6. Development setup
7. Testing
8. Deployment
9. Contributing
10. License

### If it's an API → API documentation
- Endpoints with methods, paths, params, body, responses
- Authentication requirements
- Error codes and formats
- Examples with curl/fetch

### If it's a module/class → Code documentation
- Purpose and responsibility
- Public API with types
- Usage examples
- Dependencies and side effects

### If it's a decision → ADR (Architecture Decision Record)
- Title, date, status
- Context and problem
- Decision
- Consequences

## Rules
- Write for someone who has no context
- Lead with "why", then "what", then "how"
- Include runnable examples
- Keep it concise — no fluff
