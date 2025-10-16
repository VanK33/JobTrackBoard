# Database API Contract Changes

**Feature**: 019-update-readme-md
**Date**: 2025-01-15

## Contract Summary

This document defines the expected behavior changes for database-related API endpoints after SQLite removal.

## POST /api/database/test

### Purpose
Test database connection with provided configuration.

### Request Contract

**Headers**:
```
Content-Type: application/json
```

**Body**:
```typescript
{
  type: "postgresql" | "mysql" | "mongodb",  // CHANGED: removed "sqlite"
  connectionString?: string,
  host?: string,
  port?: number,
  database?: string,
  username?: string,
  password?: string,
  ssl?: boolean
}
```

**Validation Rules**:
1. `type` is REQUIRED
2. `type` MUST be one of: "postgresql", "mysql", "mongodb"
3. `type` MUST NOT be "sqlite" (returns 400 error)
4. Either `connectionString` OR (`host`, `database`, `username`, `password`) REQUIRED for postgresql

### Response Contract

**Success (200)**:
```json
{
  "connected": true,
  "tablesInitialized": boolean
}
```

**SQLite Rejection (400)** - NEW:
```json
{
  "connected": false,
  "error": "Unsupported database type: sqlite. SQLite is no longer supported. Please use PostgreSQL or Supabase. See README for setup instructions."
}
```

**Connection Failure (200)** - Note: Still returns 200, but connected=false:
```json
{
  "connected": false,
  "error": "Connection error message"
}
```

### Test Cases

**Test 1: Valid PostgreSQL Configuration**
```json
Request:
{
  "type": "postgresql",
  "connectionString": "postgresql://user:pass@localhost:5432/jobtrack"
}

Expected Response: 200
{
  "connected": true,
  "tablesInitialized": true
}
```

**Test 2: SQLite Rejection**
```json
Request:
{
  "type": "sqlite",
  "filePath": "./data.db"
}

Expected Response: 400
{
  "connected": false,
  "error": "Unsupported database type: sqlite. SQLite is no longer supported. Please use PostgreSQL or Supabase. See README for setup instructions."
}
```

**Test 3: Invalid PostgreSQL Connection**
```json
Request:
{
  "type": "postgresql",
  "connectionString": "postgresql://baduser:badpass@localhost:5432/baddb"
}

Expected Response: 200 (but connected=false)
{
  "connected": false,
  "error": "password authentication failed for user \"baduser\""
}
```

## POST /api/database/initialize

### Purpose
Initialize database schema (create tables).

### Request Contract

**Headers**:
```
Content-Type: application/json
```

**Body**: Same as /test endpoint
```typescript
{
  type: "postgresql" | "mysql" | "mongodb",  // CHANGED: removed "sqlite"
  connectionString?: string,
  // ... other fields same as /test
}
```

**Validation Rules**: Same as /test endpoint

### Response Contract

**Success (200)**:
```json
{
  "success": true,
  "message": "Database initialized successfully"
}
```

**SQLite Rejection (400)** - NEW:
```json
{
  "success": false,
  "error": "Unsupported database type: sqlite. SQLite is no longer supported. Please use PostgreSQL or Supabase. See README for setup instructions."
}
```

**Initialization Failure (500)**:
```json
{
  "success": false,
  "error": "Failed to initialize database: {error details}"
}
```

### Test Cases

**Test 1: Initialize PostgreSQL**
```json
Request:
{
  "type": "postgresql",
  "connectionString": "postgresql://user:pass@localhost:5432/jobtrack"
}

Expected Response: 200
{
  "success": true,
  "message": "Database initialized successfully"
}
```

**Test 2: Reject SQLite Initialization**
```json
Request:
{
  "type": "sqlite",
  "filePath": "./data.db"
}

Expected Response: 400
{
  "success": false,
  "error": "Unsupported database type: sqlite..."
}
```

## Breaking Changes Summary

### Removed
- Support for `type: "sqlite"` in all database endpoints
- `filePath` parameter (SQLite-specific)
- SQLite connection handling

### Added
- Explicit error message for SQLite attempts
- User-friendly migration guidance in error messages

### Unchanged
- PostgreSQL connection flow
- Response structure (except new error cases)
- All other database types (mysql, mongodb)
- Job CRUD endpoints (not affected)

## Migration Guide for API Clients

**If using SQLite**:
```typescript
// OLD (no longer works)
const config = {
  type: "sqlite",
  filePath: "./data.db"
};

// NEW (required)
const config = {
  type: "postgresql",
  connectionString: process.env.DATABASE_URL
};
```

**If using PostgreSQL**: No changes required

---
**Contract Definition Complete**: Database API changes documented
