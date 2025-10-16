# Data Model: Update README and Remove SQLite Support

**Feature**: 019-update-readme-md
**Date**: 2025-01-15

## Overview

This feature primarily involves code deletion and documentation updates. The data model remains largely unchanged as PostgreSQL and SQLite shared the same interfaces.

## Configuration Changes

### DatabaseConfig Interface

**Current State**:
```typescript
interface DatabaseConfig {
  type: 'sqlite' | 'postgresql' | 'mysql' | 'mongodb';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  connectionString?: string;
  filePath?: string; // For SQLite - TO BE REMOVED
  storage?: StorageConfig;
}
```

**Updated State**:
```typescript
interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'mongodb'; // Removed 'sqlite'
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  connectionString?: string;
  // filePath removed - was SQLite-specific
  storage?: StorageConfig;
}
```

**Validation Rules**:
- type MUST be 'postgresql', 'mysql', or 'mongodb'
- If type is 'postgresql': REQUIRE either connectionString OR (host, database, username, password)
- filePath is no longer accepted

## Unchanged Entities

These entities remain identical as they were database-agnostic:

### JobRecord
```typescript
interface JobRecord {
  id?: number;
  title: string;
  company: string;
  location: string;
  status: 'interested' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  url?: string;
  notes?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  qualifications?: string;
  appliedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  files?: JobFileRecord[];
  statusHistory?: StatusHistoryRecord[];
}
```

### JobFileRecord
```typescript
interface JobFileRecord {
  id: number;
  jobId: number;
  filename: string;
  originalName: string;
  fileSize?: number;
  mimeType?: string;
  filePath?: string;
  fileType?: string;
  uploadedAt: string;
}
```

### StatusHistoryRecord
```typescript
interface StatusHistoryRecord {
  id: number;
  jobId: number;
  status: string;
  changedAt: string;
  operator?: string;
  note?: string;
}
```

## State Transitions

No state transition changes - database connection flow remains:

```
[Configuration Input] → [Validation] → [Connection Attempt] → [Success/Failure]

Previous States:
- SQLite: Config → SQLiteService.initialize() → Success
- PostgreSQL: Config → PostgreSQLService.connect() → Success

New States:
- PostgreSQL: Config → PostgreSQLService.connect() → Success
- SQLite: Config → ERROR: "Unsupported database type"
```

## API Contract Changes

### POST /api/database/test

**Request** (unchanged structure, restricted values):
```json
{
  "type": "postgresql",  // ✅ Valid
  "connectionString": "postgresql://..."
}

{
  "type": "sqlite",  // ❌ Now invalid - must return error
  "filePath": "./data.db"
}
```

**Response**:
```json
// For valid (PostgreSQL)
{
  "connected": true,
  "tablesInitialized": true
}

// For invalid (SQLite attempt)
{
  "connected": false,
  "error": "Unsupported database type: sqlite. Please use PostgreSQL or Supabase."
}
```

### POST /api/database/initialize

**Request** (same restrictions as /test):
- type must be 'postgresql', 'mysql', or 'mongodb'
- SQLite config rejected

**Response**:
- Success: Same as before
- SQLite attempt: Error with helpful message

## Service Layer Changes

### ConnectionPoolManager

**Removed**:
- SQLiteService imports
- SQLite connection branches
- SQLite pool management

**Retained**:
- PostgreSQLService (unchanged)
- Connection pooling for PostgreSQL
- Error handling for unsupported types

### DatabaseManager

**Removed**:
- SQLiteService instance variable
- SQLite initialization logic
- SQLite-specific method calls

**Retained**:
- PostgreSQLService integration
- All CRUD operations (unchanged)
- Connection management

## Type System Updates

### Removed Types
- References to `sql.js` types
- SQLiteService exports
- SQLite-specific configuration options

### Retained Types
All business logic types remain unchanged as they were database-agnostic.

## Migration Notes

**Breaking Change**: Users with SQLite configurations will receive errors

**Migration Path**:
1. User attempts SQLite connection
2. System returns error: "SQLite no longer supported. Please use PostgreSQL."
3. User updates configuration to PostgreSQL/Supabase
4. Documentation provides setup guide

**No Data Migration Required**: SQLite was never used in production

## Validation Rules

### Configuration Validation

**New Rules**:
1. Database type MUST NOT be 'sqlite'
2. If 'sqlite' provided: Return error with migration instructions
3. Frontend MUST NOT show SQLite as option

**Existing Rules** (unchanged):
1. PostgreSQL requires valid connection string OR credentials
2. SSL is optional
3. Storage configuration is independent of database type

## File Structure Impact

### Files to Delete
- `platform/core/src/backend/database/sqlite-service.ts`

### Files to Modify
- `platform/core/src/backend/database/connection-pool-manager.ts` - Remove SQLite branches
- `platform/core/src/backend/database/database-manager.ts` - Remove SQLite logic
- `platform/core/src/backend/database/postgresql-service.ts` - Fix imports
- `platform/core/src/backend/api/database.ts` - Add SQLite rejection
- `platform/core/src/backend/middleware/database-config.ts` - Update validation
- `platform/core/package.json` - Remove sql.js dependency

### Files to Check (may not need changes)
- `platform/core/src/backend/database/data-mapper.ts` - Verify no SQLite dependencies
- `platform/core/src/backend/database/type-mappers.ts` - Verify no SQLite dependencies
- `platform/core/src/backend/database/config-persistence.ts` - Verify no SQLite dependencies

## README Updates

### Sections Requiring Data Model Alignment

**Database Configuration** section must match updated DatabaseConfig interface:
- Remove SQLite examples
- Remove filePath parameter references
- Update type enum documentation

**Tech Stack** section must reflect single database:
- "Database: PostgreSQL/Supabase" (not "with SQL.js fallback")

## Summary

**Data Model Changes**: Minimal - only DatabaseConfig type restriction
**Breaking Changes**: SQLite configuration no longer accepted
**Backwards Compatibility**: PostgreSQL operations unchanged
**Migration Complexity**: Low - configuration update only, no data migration

---
**Phase 1 Complete**: Data model documented
