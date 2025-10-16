# Research: Update README and Remove SQLite Support

**Date**: 2025-01-15
**Feature**: 019-update-readme-md

## Executive Summary

This document captures the research findings for removing SQLite support and updating documentation to reflect the current PostgreSQL-only architecture.

## Current State Analysis

### Database Architecture
**Decision**: PostgreSQL is the sole production database
**Rationale**:
- Codebase analysis shows PostgreSQL service is actively used
- Supabase integration (PostgreSQL-based) is implemented
- SQLite was prototyped but never reached production
- sql.js dependency exists but is not actively used in runtime

**Evidence from Codebase**:
- `sqlite-service.ts` exists (802 lines) but is referenced only in connection manager
- PostgreSQL service is the default and production-ready implementation
- Database configuration UI likely offers SQLite as option (needs verification)

### SQLite References Inventory

**Files containing SQLite code** (9 files identified):
1. `platform/core/src/backend/database/sqlite-service.ts` - Full SQLite implementation (DELETE)
2. `platform/core/src/backend/database/connection-pool-manager.ts` - Connection logic (MODIFY)
3. `platform/core/src/backend/database/database-manager.ts` - Database abstraction (MODIFY)
4. `platform/core/src/backend/database/data-mapper.ts` - Type mappings (CHECK)
5. `platform/core/src/backend/database/type-mappers.ts` - Type conversions (CHECK)
6. `platform/core/src/backend/database/config-persistence.ts` - Config storage (CHECK)
7. `platform/core/src/backend/database/postgresql-service.ts` - PostgreSQL imports SQLite types (MODIFY)
8. `platform/core/src/backend/middleware/database-config.ts` - Config validation (MODIFY)
9. `platform/core/src/backend/api/database.ts` - API endpoints (MODIFY)

**Dependencies**:
- `sql.js` package (v1.13.0) in package.json (REMOVE)

### README Analysis

**Current State**:
- README lists SQL.js (Browser SQLite) as supported database
- Documentation includes setup instructions for SQLite
- Tech stack mentions "SQL.js fallback"
- Quick start suggests SQLite as no-setup option

**Required Updates**:
- Remove SQL.js/SQLite mentions from all sections
- Update database setup to PostgreSQL/Supabase only
- Revise quick start to reflect PostgreSQL requirement
- Update tech stack description
- Remove "no setup required" claims (PostgreSQL needs configuration)

## Technical Decisions

### Removal Strategy

**Decision**: Incremental removal with verification steps
**Rationale**: Minimize risk of breaking PostgreSQL functionality
**Approach**:
1. Remove sql.js dependency from package.json
2. Delete sqlite-service.ts file
3. Remove SQLite branches from connection managers
4. Clean up type definitions and imports
5. Update API endpoints to reject SQLite config
6. Verify PostgreSQL operations still work
7. Update README documentation

**Alternatives Considered**:
- ❌ Keep SQLite as "community option" → Adds maintenance burden
- ❌ Abstract database further → Over-engineering for single database
- ✅ Single PostgreSQL path → Simpler, clearer codebase

### Data Model Changes

**Decision**: No data model changes required
**Rationale**: PostgreSQL and SQLite shared same JobRecord interface
**Impact**: Type definitions remain mostly unchanged, only imports need cleanup

**Key Entities** (unchanged):
- JobRecord - job application data
- JobFileRecord - file attachments
- StatusHistoryRecord - status change tracking
- DatabaseConfig - connection settings (will remove SQLite fields)

### Configuration Interface Updates

**Decision**: Remove 'sqlite' from type enum, keep structure otherwise
**Rationale**: Minimal breaking change to configuration system

**Before**:
```typescript
type: 'sqlite' | 'postgresql' | 'mysql' | 'mongodb'
```

**After**:
```typescript
type: 'postgresql' | 'mysql' | 'mongodb'
```

Note: mysql and mongodb may also be unused but out of scope for this feature

### Frontend Changes

**Decision**: Remove SQLite option from database configuration UI
**Rationale**: Users should not see non-functional options

**Changes Required**:
- Database selection dropdown (if exists)
- Configuration form validation
- Connection test UI flows

## Risk Assessment

### Potential Issues

1. **Type Imports**: PostgreSQL service imports SQLite types
   - Risk: Build errors after sqlite-service deletion
   - Mitigation: Extract shared types to common file first

2. **Database Manager**: Has conditional SQLite logic
   - Risk: Dead code branches remain
   - Mitigation: Remove entire SQLite branches, not just disable

3. **Connection Pool Manager**: References SQLiteService
   - Risk: Runtime errors if SQLite config sent
   - Mitigation: Add explicit error for unsupported database types

4. **Frontend Config**: Unknown if SQLite UI exists
   - Risk: Orphaned UI elements
   - Mitigation: Search frontend for database type selection

### Breaking Changes

**Decision**: This is a breaking change for anyone using SQLite
**Rationale**: SQLite was never production-ready, acceptable to remove

**Migration Path**:
- Users must migrate to PostgreSQL/Supabase
- Document in README that SQLite is no longer supported
- Provide PostgreSQL setup guide

## Performance Considerations

**Decision**: No performance impact expected
**Rationale**:
- Removing unused code reduces bundle size
- PostgreSQL performance unchanged
- No runtime overhead from removed branches

**Benefits**:
- Smaller dependency tree (no sql.js binary)
- Faster TypeScript compilation (fewer types)
- Clearer code paths (no conditional database logic)

## Testing Strategy

**Decision**: Verify PostgreSQL functionality unchanged
**Rationale**: Main risk is accidentally breaking PostgreSQL

**Test Cases**:
1. PostgreSQL connection establishment
2. CRUD operations on jobs
3. File upload/download
4. Status history tracking
5. Database initialization
6. Configuration persistence

**Verification Steps**:
1. Build succeeds without errors
2. TypeScript compilation passes
3. npm run dev works
4. Can connect to PostgreSQL
5. All existing features work
6. No SQLite references in grep search

## Documentation Updates

### README Sections to Modify

1. **Tech Stack** (line 18-23)
   - Remove: "SQL.js fallback"
   - Update: "Database: PostgreSQL/Supabase only"

2. **Database Setup** (line 46-55)
   - Remove: SQL.js option and no-setup claim
   - Emphasize: PostgreSQL required for development

3. **Database Configuration** (line 116-134)
   - Remove: SQL.js section entirely
   - Keep: PostgreSQL and Supabase sections

4. **Current Status** (line 221-248)
   - Update: Remove "Multi-database support" from completed features
   - Update: Clarify "PostgreSQL/Supabase support" instead

### New Documentation Needed

**Decision**: Add PostgreSQL setup guide
**Rationale**: Removing SQLite "easy option" requires better PostgreSQL docs

**Content**:
- Local PostgreSQL installation guide
- Docker Compose example for development
- Supabase quick start alternative
- Connection string examples
- Common troubleshooting

## Alternatives Considered

### Option 1: Keep SQLite as community feature
**Pros**: Backwards compatibility, local dev option
**Cons**: Maintenance burden, unused code, confusing docs
**Decision**: Rejected - not worth complexity

### Option 2: Abstract database layer further
**Pros**: Could add databases easier later
**Cons**: Over-engineering for single database
**Decision**: Rejected - YAGNI principle

### Option 3: Remove all database references, make pluggable
**Pros**: Maximum flexibility
**Cons**: Massive refactor, breaks existing code
**Decision**: Rejected - out of scope

### Option 4: Keep SQLite code but mark deprecated
**Pros**: Gradual migration path
**Cons**: Still requires maintenance
**Decision**: Rejected - clean break is better

## Implementation Notes

### Critical Path
1. Extract shared types from sqlite-service.ts to common file
2. Update postgresql-service.ts imports to use common types
3. Delete sqlite-service.ts
4. Remove sql.js from package.json
5. Update connection-pool-manager.ts
6. Update database-manager.ts
7. Update API endpoints
8. Update frontend (if SQLite UI exists)
9. Verify build and tests pass
10. Update README

### Out of Scope
- Removing mysql/mongodb references (not actively used either)
- Adding new database options
- Database migration tooling
- Advanced PostgreSQL features

## Conclusion

**Recommendation**: Proceed with SQLite removal as specified
**Confidence**: High - clear removal path, low risk to PostgreSQL
**Timeline**: 2-3 hours for code changes, 1 hour for README updates

All research questions resolved. Ready for Phase 1 design.

---
**Research Complete**: 2025-01-15
