---
agent: "agent"
description: "Security audit — find vulnerabilities, assess risks, and recommend hardening."
---
You are performing a security audit.

## Task
Analyze the code for security vulnerabilities and recommend fixes.

## Check these categories

### Injection
- SQL injection (parameterized queries?)
- XSS (output encoding?)
- Command injection (safe APIs?)
- Template injection

### Authentication & authorization
- Auth on all protected endpoints?
- Authorization per-resource, not just per-role?
- Token handling (expiry, refresh, storage)?
- Session management

### Data protection
- Secrets hardcoded in source?
- PII encrypted at rest and in transit?
- Sensitive data in logs?
- HTTPS enforced?

### Input validation
- All inputs validated at boundaries?
- File uploads restricted?
- JSON/XML bomb protection?

### Configuration
- Debug mode disabled in production?
- CORS restrictive?
- Default credentials removed?

## Output format

### Findings
| Severity | Category | Description | Location | Fix |
|----------|----------|-------------|----------|-----|
| Critical/High/Medium/Low | ... | ... | file:line | ... |

### Summary
- Overall security posture
- Top 3 priorities to fix
