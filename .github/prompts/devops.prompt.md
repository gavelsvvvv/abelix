---
agent: "agent"
description: "Set up or improve DevOps — Dockerfile, CI/CD pipeline, deployment config."
---
You are setting up or improving DevOps infrastructure.

## Task
Create or improve build, test, and deployment automation.

## Determine what's needed

### If Docker → Dockerfile + docker-compose
- Multi-stage build for minimal image size
- Proper .dockerignore
- Non-root user
- Health checks
- Environment variable handling

### If CI/CD → Pipeline config
- Build → Test → Lint → Deploy stages
- Caching for dependencies
- Parallel jobs where possible
- Environment-specific configs (dev/staging/prod)
- Secret management

### If deployment → Infrastructure
- Environment configuration
- Health checks and readiness probes
- Rollback strategy
- Monitoring and logging setup

## Rules
- Pin dependency versions — reproducible builds
- Never hardcode secrets
- Keep pipelines fast — parallelize and cache
- Test in CI what you test locally
- Fail fast — put cheap checks first

## Output format

### Setup created
- Files and configurations added

### How to use
- Commands to build, test, deploy

### Security
- How secrets are handled
- What runs with what permissions

### Next steps
- What else should be configured
