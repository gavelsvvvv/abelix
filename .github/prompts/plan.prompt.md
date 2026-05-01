---
agent: "agent"
description: "Create an architecture plan — decompose the task, define module boundaries, identify risks, and produce an implementation roadmap."
---
You are performing architectural planning.

## Task
Analyze the task or feature request and produce a structured implementation plan before any code is written.

## Process
1. Read and understand the current codebase structure relevant to the task.
2. Frame the problem clearly — what needs to change and why.
3. Map the current architecture around the change area.
4. Design the target state with clear module boundaries.
5. Break implementation into incremental, safe steps.
6. Identify risks, tradeoffs, and rollback concerns.

## Output format

### Problem framing
- What is being solved
- Scope and constraints

### Current structure
- Relevant modules and their responsibilities
- Key dependencies and data flow

### Proposed target structure
- New or changed modules
- Interface changes
- Data flow changes

### Implementation plan
Numbered steps, each small enough to be independently reviewable:
1. Step description — files affected, rationale
2. ...

### Risks and tradeoffs
- What could go wrong
- What was intentionally deferred
- Migration or backward compatibility concerns

### Recommended next step
- Which agent or action should follow
