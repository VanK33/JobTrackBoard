# Contract: Build Process

## Purpose
Verify build process completes successfully on Render.com deployment platform.

## Command
```bash
npm run build
```

## Expected Behavior

### Build Steps (Must All Succeed)
1. **Install dependencies**: `npm install`
2. **Type-check**: `npm run type-check` (via precheck hook if configured)
3. **Build backend**: `npm run build:backend`
   - Copy TypeScript files to dist/backend/
   - Copy shared utilities to dist/shared/
4. **Build frontend**: `npm run build:frontend`
   - Vite build process
   - Output to dist/frontend/

### Success Criteria
- Exit code: 0
- Output files present:
  - `dist/backend/index.ts`
  - `dist/backend/api/*.ts`
  - `dist/backend/database/*.ts`
  - `dist/shared/**/*`
  - `dist/frontend/index.html`
  - `dist/frontend/assets/**/*`

### Error Conditions (Must Not Occur)

#### Build Failure at Type-Check
```
npm error Lifecycle script `build` failed with error
npm error code 1
npm error command failed
npm error command sh -c npm run build:backend && npm run build:frontend
```
**Root Cause**: TypeScript errors blocking build
**Resolution**: Fix all type errors first

#### Build Failure at Vite
```
npm error Lifecycle script `build:frontend` failed with error
npm error code 1
npm error command sh -c vite build
```
**Root Cause**: Frontend compilation errors (often caused by backend type errors propagating)
**Resolution**: Ensure backend types compile first

## Contract Test
```typescript
// tests/contract/build.test.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);
const DIST_DIR = join(__dirname, '../../platform/core/dist');

describe('Build Process Contract', () => {
  it('should complete build without errors', async () => {
    const { stderr } = await execAsync('npm run build');

    expect(stderr).not.toMatch(/npm error/);
    expect(stderr).not.toMatch(/failed with error/);
  }, 120000); // 2min timeout

  it('should generate backend artifacts', () => {
    expect(existsSync(join(DIST_DIR, 'backend/index.ts'))).toBe(true);
    expect(existsSync(join(DIST_DIR, 'backend/api'))).toBe(true);
    expect(existsSync(join(DIST_DIR, 'backend/database'))).toBe(true);
  });

  it('should generate frontend artifacts', () => {
    expect(existsSync(join(DIST_DIR, 'frontend/index.html'))).toBe(true);
    expect(existsSync(join(DIST_DIR, 'frontend/assets'))).toBe(true);
  });
});
```

## Dependencies
- Node.js 18+
- npm workspaces configured
- Vite 5
- TypeScript 5.9.2

## Performance
- **Current**: Build fails at type-check stage (time to failure: ~30s)
- **Target**: Complete build in <2 minutes
- **Render.com Constraint**: 10-minute build timeout

---

**Contract Status**: Blocked by TypeScript errors. Unblocks deployment when passing.
