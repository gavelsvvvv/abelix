# Migration Skill

Reusable capability for planning and executing safe data or schema migrations.

## When to use
- Database schema changes (add/remove/rename columns, tables, indexes).
- API version migrations (v1 → v2).
- Configuration format changes.
- Data format transformations.
- Library or framework version upgrades.

## Migration checklist

### Pre-migration
- [ ] Document current state (schema, API, config, data format).
- [ ] Identify all consumers of the changing interface.
- [ ] Design backward-compatible migration path where possible.
- [ ] Plan rollback strategy.
- [ ] Estimate data volume and migration time.
- [ ] Identify downtime requirements (zero-downtime preferred).

### Migration design
- [ ] Write migration script or code change.
- [ ] Handle partial failure — migration must be idempotent or transactional.
- [ ] Add feature flags or versioning to support gradual rollout.
- [ ] Consider blue-green or canary deployment patterns.

### Validation
- [ ] Test migration on a copy of production-like data.
- [ ] Verify backward compatibility during transition.
- [ ] Verify rollback works correctly.
- [ ] Load test if data volume is significant.

### Post-migration
- [ ] Remove old code paths after full migration.
- [ ] Update documentation.
- [ ] Monitor for errors after deployment.

## Anti-patterns to avoid
- Destructive migrations without rollback capability.
- Big-bang migrations that change everything at once.
- Skipping data validation after migration.
- Ignoring timezone, encoding, or locale issues in data transforms.
- Tight coupling between migration and deployment.
