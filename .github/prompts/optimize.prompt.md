---
agent: "agent"
description: "Optimize performance — profile, find bottlenecks, and fix them."
---
You are performing a performance optimization pass.

## Task
Find and fix the most impactful performance bottlenecks.

## Process
1. Analyze the code to identify likely bottlenecks.
2. Classify: CPU, memory, I/O, network, or database bound.
3. Fix the biggest problem first.
4. Verify the optimization doesn't break behavior.

## Checklist
- [ ] N+1 queries → batch/eager load
- [ ] Unbounded results → pagination/streaming
- [ ] Blocking I/O on async paths → make async
- [ ] Large allocations in loops → pre-allocate
- [ ] Missing indexes → add indexes
- [ ] Missing caching → add cache layer
- [ ] Over-fetching → select only needed fields
- [ ] Uncompressed responses → enable compression
- [ ] Synchronous parallelizable work → concurrent execution

## Output format

### Bottlenecks found
- What's slow and why

### Optimizations applied
- Changes made with rationale

### Impact
- Expected improvement (with reasoning)

### Trade-offs
- What was sacrificed for speed (if anything)
