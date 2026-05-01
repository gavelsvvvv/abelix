# API Audit Skill

Reusable capability for auditing API design, security, and reliability.

## When to use
- Reviewing REST, GraphQL, or gRPC API design.
- Security audit of API endpoints.
- Checking API consistency and contract stability.
- Preparing for public API release.

## API design review

### Consistency
- [ ] Naming conventions are consistent across all endpoints.
- [ ] HTTP methods are used correctly (GET=read, POST=create, PUT=replace, PATCH=update, DELETE=remove).
- [ ] Response formats are consistent (envelope structure, error format).
- [ ] Pagination is consistent across list endpoints.
- [ ] Sorting and filtering follow a common pattern.

### Versioning
- [ ] API versioning strategy exists (URL path, header, query param).
- [ ] Breaking changes are avoided in minor versions.
- [ ] Deprecation policy is documented.

### Error handling
- [ ] Error responses include structured error codes (not just HTTP status).
- [ ] Error messages are helpful but don't leak internals.
- [ ] 4xx vs 5xx distinction is correct.
- [ ] Validation errors return field-level details.

## Security audit

### Authentication & authorization
- [ ] All endpoints require authentication unless explicitly public.
- [ ] Authorization checks are per-resource, not just per-endpoint.
- [ ] Tokens are validated properly (expiration, audience, issuer).
- [ ] No sensitive data in URL parameters or logs.

### Input validation
- [ ] All inputs are validated and sanitized.
- [ ] File uploads are restricted (type, size, count).
- [ ] JSON/XML parsing is protected against bombs and deeply nested payloads.
- [ ] SQL injection, XSS, and command injection are prevented.

### Rate limiting & abuse prevention
- [ ] Rate limiting is implemented per-user and per-IP.
- [ ] Expensive operations have stricter limits.
- [ ] CORS policy is correctly configured.
- [ ] CSRF protection is in place for state-changing operations.

## Reliability

### Idempotency
- [ ] POST/PUT operations support idempotency keys where appropriate.
- [ ] Retries are safe for all mutating endpoints.

### Timeouts & resilience
- [ ] Downstream calls have timeouts.
- [ ] Circuit breakers are in place for critical dependencies.
- [ ] Graceful degradation is implemented where possible.

### Observability
- [ ] Request/response logging is in place (without sensitive data).
- [ ] Metrics are collected (latency, error rate, throughput).
- [ ] Distributed tracing is supported (trace ID propagation).
- [ ] Health check endpoints exist.

## Output template

```
## API overview
[Endpoints reviewed, stack, protocol]

## Design issues
[Inconsistencies, naming, structure]

## Security findings
[Vulnerabilities, missing controls]

## Reliability concerns
[Missing timeouts, no idempotency, no circuit breakers]

## Recommendations
[Prioritized fixes: critical → nice-to-have]
```
