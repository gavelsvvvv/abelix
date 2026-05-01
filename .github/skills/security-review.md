# Security Review Skill

Reusable capability for performing security-focused code review.

## When to use
- Before releasing code that handles user input, auth, payments, or PII.
- Reviewing changes to authentication or authorization systems.
- Auditing third-party integrations.
- After dependency updates that may introduce vulnerabilities.

## Security review checklist

### Input handling
- [ ] All external inputs are validated at system boundaries.
- [ ] Input validation is allowlist-based, not blocklist-based.
- [ ] File paths are sanitized against traversal attacks.
- [ ] Uploaded files are validated for type, size, and content.
- [ ] Regex patterns are checked for ReDoS vulnerability.

### Injection prevention
- [ ] SQL queries use parameterized statements — never string concatenation.
- [ ] HTML output is properly escaped to prevent XSS.
- [ ] Command execution uses safe APIs, not shell interpolation.
- [ ] LDAP, XML, and template injection are prevented.
- [ ] Deserialization is restricted to trusted types.

### Authentication
- [ ] Passwords are hashed with bcrypt, scrypt, or argon2.
- [ ] Tokens have appropriate expiration times.
- [ ] Token refresh flow is secure.
- [ ] Multi-factor authentication is supported where required.
- [ ] Session management is secure (httponly, secure, samesite cookies).

### Authorization
- [ ] Authorization is checked at every access point, not just the UI.
- [ ] RBAC or ABAC is implemented consistently.
- [ ] No privilege escalation paths exist.
- [ ] Resource ownership is verified before access.
- [ ] Admin interfaces are properly protected.

### Secrets management
- [ ] No hardcoded secrets, tokens, or keys in source code.
- [ ] Secrets are loaded from environment or vault at runtime.
- [ ] API keys are scoped to minimum required permissions.
- [ ] Secrets are rotatable without code deployment.

### Data protection
- [ ] PII is encrypted at rest and in transit.
- [ ] Sensitive data is not logged.
- [ ] Data retention policies are implemented.
- [ ] Backup encryption is in place.

### Network & transport
- [ ] HTTPS is enforced everywhere.
- [ ] CORS policy is restrictive and correct.
- [ ] Internal service communication is authenticated.
- [ ] SSRF protection is in place for user-provided URLs.

## Severity classification
- **Critical** — Exploitable now, data breach risk → fix immediately.
- **High** — Exploitable with some effort → fix before release.
- **Medium** — Defense-in-depth issue → fix in next sprint.
- **Low** — Best practice improvement → add to backlog.
- **Info** — Observation, no immediate risk.

## Output template

```
## Scope
[What was reviewed]

## Findings
| # | Severity | Category | Description | Location | Recommendation |
|---|----------|----------|-------------|----------|----------------|
| 1 | Critical | Injection | ... | file:line | ... |

## Summary
[Overall security posture assessment]

## Recommendations
[Prioritized action items]
```
