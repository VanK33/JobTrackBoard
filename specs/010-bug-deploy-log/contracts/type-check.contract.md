# Contract: TypeScript Type-Check

## Purpose
Verify all TypeScript files compile without errors in strict mode.

## Command
```bash
npm run type-check
```

## Expected Behavior

### Success Criteria
- Exit code: 0
- Output: No error messages
- All 64 existing errors resolved

### Error Patterns (Must Not Appear)

#### TS18046: Unknown Error Type
```
error TS18046: 'error' is of type 'unknown'
```
**Resolution**: Use type guards (`instanceof Error`)

#### TS7016: Missing Type Declaration
```
error TS7016: Could not find a declaration file for module 'sql.js'
```
**Resolution**: Install @types/sql.js

#### TS2322/TS2345: Type Mismatch
```
error TS2322: Type 'JobRecord' is not assignable to type 'Job'
error TS2345: Argument of type 'Partial<Job>' is not assignable to parameter of type 'Partial<JobRecord>'
```
**Resolution**: Use explicit mapper functions

#### TS18047: Null Safety
```
error TS18047: 'result.rowCount' is possibly 'null'
```
**Resolution**: Null checks before comparison

#### TS7053: Implicit Any Index
```
error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type
```
**Resolution**: Explicit type annotations with Record<string, unknown>

#### TS2339: Missing Property
```
error TS2339: Property 'patch' does not exist on type 'ModuleRouter'
error TS2339: Property 'getStats' does not exist on type 'PostgreSQLService'
```
**Resolution**: Implement missing methods

## Contract Test
```typescript
// tests/contract/type-check.test.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('TypeScript Type-Check Contract', () => {
  it('should compile all TypeScript files without errors', async () => {
    const { stdout, stderr } = await execAsync('npm run type-check');

    // Should exit without errors
    expect(stderr).not.toMatch(/error TS/);

    // Verify no specific error patterns
    expect(stderr).not.toMatch(/TS18046/); // Unknown error type
    expect(stderr).not.toMatch(/TS7016/);  // Missing declaration
    expect(stderr).not.toMatch(/TS2322|TS2345/); // Type mismatch
    expect(stderr).not.toMatch(/TS18047/); // Null safety
    expect(stderr).not.toMatch(/TS7053/);  // Implicit any
    expect(stderr).not.toMatch(/TS2339/);  // Missing property
  }, 30000); // 30s timeout
});
```

## Dependencies
- TypeScript 5.9.2
- tsconfig.json with strict mode
- All @types/* packages installed

## Performance
- **Baseline**: Current build fails at type-check stage
- **Target**: Type-check completes in <10 seconds
- **Constraint**: Zero errors blocking deployment

---

**Contract Status**: This test must pass before deployment succeeds.
