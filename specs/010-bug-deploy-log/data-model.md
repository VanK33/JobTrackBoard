# Data Model: Type System Architecture

## Overview
This is a **bugfix**, not a feature requiring new data models. This document describes the existing type system that needs correction.

## Entities

### Job (Application Layer)
**Purpose**: Represents a job application in application code (services, API, frontend)

**Fields**:
- `id`: `string | number | undefined` - Polymorphic identifier (string for Supabase, number for SQLite)
- `company`: `string` - Company name
- `position`: `string` - Job title
- `status`: `JobStatus` - Application status (see enum below)
- `description`: `string | undefined` - Job description
- `requirements`: `string[] | undefined` - List of requirements (array format)
- `salary`: `string | undefined` - Salary information
- `location`: `string | undefined` - Job location
- `url`: `string | undefined` - Application URL
- `appliedAt`: `Date | undefined` - Application date
- `rejectedAt`: `Date | undefined` - Rejection date
- `createdAt`: `Date` - Record creation timestamp
- `updatedAt`: `Date` - Last update timestamp

**Validation Rules** (from spec requirements):
- FR-002: Must maintain type consistency between layers
- FR-004: Must support both PostgreSQL and SQLite identifier formats

---

### JobRecord (Database Layer)
**Purpose**: Represents a job application as stored in database (SQLite/PostgreSQL)

**Fields**: Same as Job except:
- `id`: `number | undefined` - Always numeric in database
- `requirements`: `string | undefined` - JSON string or newline-delimited (storage format)

**Key Difference**: Storage-optimized format with serialized requirements

---

### JobStatus (Enum)
**Purpose**: Valid application status values

**Values**:
```typescript
type JobStatus =
  | "applied"      // Application submitted
  | "interviewing" // In interview process
  | "interested"   // Marked as interesting
  | "offered"      // Offer received
  | "rejected"     // Application rejected
```

**Validation Rules**:
- FR-002: Must be consistent across database and application layers
- Database may have legacy values (`"screening"`, `"interview"`) that must map to canonical values

---

### DatabaseConfig
**Purpose**: Session-based database connection configuration

**Fields**:
- `type`: `"supabase" | "sqlite"` - Database type
- `supabaseUrl`: `string | undefined` - Supabase project URL
- `supabaseKey`: `string | undefined` - Supabase API key
- Additional connection parameters per type

**State Transitions**: Session-based, sent with each request via `x-database-config` header

---

## Relationships

```
Job (Application) ←→ JobRecord (Storage)
     ↑                    ↑
     |                    |
  Mapper Functions (data-mapper.ts)
     |
     ↓
  Database Services
  ├── SQLiteService
  └── PostgreSQLService
```

**Mapping Rules**:
1. `Job.requirements` (string[]) ↔ `JobRecord.requirements` (string)
   - Serialize: `array.join('\n')` when writing to database
   - Deserialize: `string.split('\n')` when reading from database

2. `Job.id` (string | number) ↔ `JobRecord.id` (number)
   - Supabase UUIDs stored as string in Job layer
   - SQLite auto-increment stored as number

3. Status value normalization:
   - Map legacy `"screening"` → `"interviewing"`
   - Map legacy `"interview"` → `"interviewing"`

---

## Type Safety Requirements

### Current Issues (to be fixed)
1. **Interface Mismatch**: Job/JobRecord types not properly distinguished
2. **Error Handling**: Catch blocks use `unknown` type without guards
3. **Null Safety**: PostgreSQL `rowCount` can be null
4. **Index Operations**: Dynamic property access needs explicit typing

### Design Principles (from research)
1. **Layer Separation**: Maintain distinct types for storage vs application
2. **Explicit Mapping**: Use typed mapper functions between layers
3. **Type Guards**: Use `instanceof Error` for error handling
4. **Null Checks**: Explicit checks for nullable PostgreSQL values

---

## No Schema Changes Required
This bugfix maintains existing database schemas:
- SQLite: Same table structure
- PostgreSQL: Same table structure
- Supabase: Same table structure

Only TypeScript type definitions change, not runtime data structures.

---

**Data Model Status**: Existing types documented, no new entities required for bugfix.
