# Performance Audit Skill

Reusable capability for identifying and resolving performance issues.

## When to use
- Investigating slow endpoints, pages, or operations.
- Reviewing code changes that affect hot paths.
- Preparing for load testing or production scaling.
- Optimizing database queries or data access patterns.

## Performance review checklist

### Database & data access
- [ ] No N+1 query patterns — use eager loading or batch queries.
- [ ] Queries use appropriate indexes.
- [ ] Large result sets use pagination or streaming.
- [ ] Unnecessary data is not fetched (SELECT * → SELECT needed columns).
- [ ] Connection pooling is configured properly.
- [ ] Transactions are as short as possible.

### Memory
- [ ] No unbounded collections growing with input size.
- [ ] Large objects are streamed, not buffered entirely in memory.
- [ ] Caches have eviction policies and size limits.
- [ ] No memory leaks from event listeners, closures, or circular references.

### CPU
- [ ] No blocking operations on event loop / main thread.
- [ ] Expensive computations are offloaded to workers or background jobs.
- [ ] Regex patterns are not vulnerable to catastrophic backtracking.
- [ ] Sorting and searching use appropriate algorithms for the data size.

### Network & I/O
- [ ] External calls have timeouts configured.
- [ ] Parallel requests are used where dependencies allow.
- [ ] Response compression is enabled.
- [ ] Static assets have proper caching headers.
- [ ] Connection reuse is enabled for HTTP clients.

### Caching
- [ ] Frequently accessed, rarely changing data is cached.
- [ ] Cache keys are correct — no stale data bugs.
- [ ] Cache invalidation strategy is explicit.
- [ ] Cache stampede / thundering herd is prevented.

### Concurrency
- [ ] Thread pools / worker pools are properly sized.
- [ ] Lock contention is minimized.
- [ ] Async operations don't accidentally serialize.

## Profiling approach
1. Measure before optimizing — no premature optimization.
2. Identify the bottleneck (CPU, memory, I/O, network).
3. Fix the bottleneck with the simplest correct change.
4. Measure again to verify improvement.
5. Document the optimization rationale.

## Output template

```
## Scope
[What was profiled/reviewed]

## Findings
| # | Impact | Category | Description | Location | Recommendation |
|---|--------|----------|-------------|----------|----------------|
| 1 | High | N+1 query | ... | file:line | ... |

## Metrics
[Before/after measurements if available]

## Recommendations
[Prioritized optimizations]
```
