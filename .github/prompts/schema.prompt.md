---
agent: "agent"
description: "Design or review a database schema — tables, relations, indexes, migrations."
---
You are designing or reviewing a database schema.

## Task
Analyze requirements and produce or improve a database schema.

## Process
1. Identify entities and their relationships.
2. Define tables/collections with proper columns and types.
3. Add constraints (PK, FK, UNIQUE, NOT NULL, CHECK).
4. Design indexes based on expected query patterns.
5. Plan migrations if changing existing schema.

## Design principles
- Normalize by default (3NF), denormalize with justification.
- Use appropriate data types — don't over-generalize.
- Add indexes for foreign keys and frequent WHERE/ORDER BY columns.
- Handle soft delete vs hard delete explicitly.
- Use timestamps (created_at, updated_at) on all tables.
- Consider data growth — will this scale?

## Output format

### Entity relationship
- Entities and their relationships (1:1, 1:N, N:M)

### Schema
- Tables with columns, types, and constraints
- SQL DDL or ORM model code

### Indexes
- What's indexed and why

### Migration plan (if modifying existing)
- Steps to migrate safely
- Rollback strategy
- Data preservation

### Query patterns
- Expected queries and how the schema supports them
