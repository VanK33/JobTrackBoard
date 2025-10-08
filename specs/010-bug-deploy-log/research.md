# Research: TypeScript Compilation Errors

## Overview
64 TypeScript errors blocking deployment build. Analysis of error patterns and root causes.

## Error Categories

### 1. Job/JobRecord Interface Mismatches (15 errors)
**Location**: `platform/core/src/backend/database/database-manager.ts`

**Problem**:
- `JobRecord` uses `requirements: string | undefined` (database storage format)
- `Job` uses `requirements: string[] | undefined` (application format)
- `Job.id` can be `string | number | undefined`
- `JobRecord.id` is `number | undefined`

**Root Cause**: Type definitions don't match across data layers (storage vs application)

**Decision**: Unify type definitions through explicit mapping functions
**Rationale**: Maintains separation between storage and application layers while providing type safety
**Alternatives Considered**:
- Merge Job/JobRecord into single type (rejected: loses layer separation)
- Use type assertions (rejected: defeats type safety purpose)

---

### 2. Unknown Error Types (36 errors)
**Locations**:
- `modules/job-tracker-basic/src/backend/index.ts` (30 errors)
- `platform/core/src/backend/database/*.ts` (6 errors)

**Problem**: `catch (error)` blocks treat `error` as `unknown` in strict mode

**Example**:
```typescript
catch (error) {
  console.error('Failed:', error.message); // TS18046: 'error' is of type 'unknown'
}
```

**Decision**: Use type guards to narrow error types
**Rationale**: Explicit error handling improves runtime safety and clarity
**Alternatives Considered**:
- Disable `useUnknownInCatchVariables` (rejected: weakens type safety)
- Cast to `any` (rejected: defeats strict mode)

**Pattern**:
```typescript
catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Failed:', message);
}
```

---

### 3. Missing Type Definitions (1 error)
**Location**: `platform/core/src/backend/database/sqlite-service.ts:5`

**Problem**: `sql.js` module lacks TypeScript declarations
```
TS7016: Could not find a declaration file for module 'sql.js'
```

**Decision**: Install `@types/sql.js` package
**Rationale**: Official type definitions available in DefinitelyTyped
**Alternatives Considered**:
- Write custom `.d.ts` file (rejected: maintenance burden)
- Suppress error with `// @ts-ignore` (rejected: hides real type issues)

---

### 4. Implicit Any in Index Operations (4 errors)
**Locations**:
- `platform/core/src/backend/database/data-mapper.ts` (2 errors)
- `modules/job-tracker-basic/src/backend/index.ts` (2 errors)

**Problem**: Dynamic property access without explicit typing
```typescript
mappedJob[dbField] = jobData[appField]; // TS7053: Element implicitly has 'any' type
```

**Decision**: Use explicit type assertions with Record<string, unknown>
**Rationale**: Preserves dynamic mapping while maintaining type safety
**Alternatives Considered**:
- Disable `noImplicitAny` (rejected: core TypeScript safety feature)
- Enumerate all fields explicitly (rejected: loses mapping flexibility)

---

### 5. API Route Type Assertions (3 errors)
**Location**: `platform/core/src/backend/api/jobs.ts`

**Problem**: Service layer returns arrays but empty arrays default to `never[]`
```typescript
const filteredJobs = await service.filterJobs(query);
res.json(filteredJobs); // TS2345: Argument of type 'any' is not assignable to parameter of type 'never'
```

**Decision**: Add explicit return type annotations to service methods
**Rationale**: Clarifies contract between API and service layers
**Alternatives Considered**:
- Type assertion at call site (rejected: masks real type errors)

---

### 6. Null Safety Issues (2 errors)
**Location**: `platform/core/src/backend/database/postgresql-service.ts`

**Problem**: `result.rowCount` can be `null` in PostgreSQL queries
```typescript
if (result.rowCount > 0) { // TS18047: 'result.rowCount' is possibly 'null'
```

**Decision**: Explicit null checks before comparison
**Rationale**: PostgreSQL driver correctly types rowCount as nullable
**Alternatives Considered**:
- Optional chaining `result.rowCount ?? 0` (accepted as equivalent solution)

---

### 7. Missing Router Method (1 error)
**Location**: `modules/job-tracker-basic/src/backend/index.ts:117`

**Problem**: `router.patch()` called but ModuleRouter doesn't implement PATCH method
```
TS2339: Property 'patch' does not exist on type 'ModuleRouter'
```

**Decision**: Add `patch()` method to ModuleRouter class
**Rationale**: REST convention requires PATCH support for partial updates
**Alternatives Considered**:
- Use PUT instead (rejected: semantically incorrect for partial updates)

---

### 8. Stats Service Method Missing (1 error)
**Location**: `platform/core/src/backend/api/stats.ts:16`

**Problem**: `getStats()` method exists on SQLiteService but not PostgreSQLService
```
TS2339: Property 'getStats' does not exist on type 'PostgreSQLService'
```

**Decision**: Implement `getStats()` in PostgreSQLService
**Rationale**: Service interface must be consistent across implementations
**Alternatives Considered**:
- Type assertion (rejected: runtime will fail if method missing)

---

### 9. Status Enum Mismatch (1 error)
**Location**: `platform/core/src/backend/database/data-mapper.ts:63`

**Problem**: Database status value `"screening"` not in Job type union
```typescript
type JobStatus = "applied" | "interviewing" | "interested" | "offered" | "rejected";
// But database has: "screening", "interview"
```

**Decision**: Align status values between database and application types
**Rationale**: Single source of truth for valid status values prevents runtime inconsistencies
**Alternatives Considered**:
- Map at runtime (implemented: ensures data integrity)

---

## Implementation Strategy

### Priority Order
1. **Install missing types** (@types/sql.js) - Quick win
2. **Fix error handling** - Largest category (36 errors)
3. **Align Job/JobRecord types** - Core data model issue
4. **Add missing methods** (patch, getStats) - Interface completeness
5. **Fix null safety** - PostgreSQL-specific
6. **Resolve index operations** - Type safety in mappers
7. **Align status enums** - Data consistency

### Testing Approach
After each category fix:
```bash
npm run type-check
```

Verify zero errors before proceeding to next category.

### Backward Compatibility
All fixes maintain existing API contracts:
- No changes to endpoint signatures
- No changes to database schema
- Service interfaces remain consistent

---

## Dependencies
- **@types/sql.js**: Type definitions for sql.js library
- **TypeScript 5.9.2**: Already installed, strict mode enabled
- **tsconfig.json**: Current configuration is correct, no changes needed

## Performance Impact
- **Compilation**: Type fixes may slightly increase compile time (marginal)
- **Runtime**: No runtime impact (types erased after compilation)
- **Bundle size**: No change (types don't affect output)

## Risks
- **Low Risk**: All fixes are type-level corrections, no runtime logic changes
- **Mitigation**: Type-check after each category to catch cascading errors early

---

**Research Complete**: All error categories analyzed, solutions identified, implementation path clear.
