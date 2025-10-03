# Refactoring Verification Quickstart

**Date**: 2025-10-02
**Purpose**: Quick verification checklist for each migration stage

---

## General Verification Pattern

After EACH stage, run this verification sequence:

```bash
# 1. Type check
npm run type-check

# 2. Start backend
npm run dev:backend
# Wait for "Backend server running on port 3000"

# 3. In new terminal: Start frontend
npm run dev:frontend
# Wait for "Local: http://localhost:5174"

# 4. Test key functionality
# (See stage-specific tests below)

# 5. Stop servers (Ctrl+C in each terminal)

# 6. If all tests pass: Commit and push
git add .
git commit -m "..."
git push origin 001-monorepo-refactor-project
```

---

## Stage 0: Foundation

### Quick Verification
```bash
# Verify directories exist
ls -la .runtime/
ls -la dist/

# Verify app still runs (no changes to code yet)
npm run dev:backend &
BACKEND_PID=$!
sleep 3
curl http://localhost:3000/health
kill $BACKEND_PID

# Should return health status (same as before)
```

### Expected Outcome
- New directories created
- Application runs unchanged
- No errors in console

---

## Stage 1: Runtime Directories

### Quick Verification
```bash
# Start backend
npm run dev:backend &
BACKEND_PID=$!
sleep 3

# Test file paths are resolved correctly
# Check logs for path output
curl http://localhost:3000/health | jq

# If app has file upload endpoint, test it:
echo "test content" > /tmp/test-upload.txt
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/tmp/test-upload.txt"

# Verify file is in new location
ls -la .runtime/temp-uploads/

# Cleanup
kill $BACKEND_PID
rm /tmp/test-upload.txt
```

### Expected Outcome
- Runtime directories at `.runtime/*` contain files
- Old directories (`platform/core/temp-uploads/`, etc.) deleted
- File operations work correctly
- No path resolution errors in logs

### Rollback If Needed
```bash
git reset --hard HEAD~1
git push -f origin 001-monorepo-refactor-project
```

---

## Stage 2: Backend Database Layer

### Quick Verification
```bash
# Type check first
npm run type-check
# Should have no errors

# Start backend
npm run dev:backend &
BACKEND_PID=$!
sleep 3

# Test database connectivity
curl http://localhost:3000/health
# Should show database status

# Test database operations
curl http://localhost:3000/api/jobs
# Should return jobs (or empty array)

curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"company":"Test","position":"Developer","status":"interested"}'
# Should create job

# Cleanup
kill $BACKEND_PID
```

### Expected Outcome
- Database services work from new location
- All database operations succeed
- Imports updated correctly
- No module resolution errors

---

## Stage 3: Backend API Routes

### Quick Verification
```bash
# Type check
npm run type-check

# Start backend
npm run dev:backend &
BACKEND_PID=$!
sleep 3

# Test all API endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/jobs
curl http://localhost:3000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

curl http://localhost:3000/api/modules
curl http://localhost:3000/api/platform/info

# All should return appropriate responses
kill $BACKEND_PID
```

### Expected Outcome
- All API endpoints respond correctly
- Routes extracted to separate files
- `platform.ts` (now `app.ts`) uses routers
- Functionality unchanged

---

## Stage 4: Frontend Organization

### Quick Verification
```bash
# Type check
npm run type-check

# Start frontend
npm run dev:frontend &
FRONTEND_PID=$!
sleep 5

# Open in browser
open http://localhost:5174

# Manual checks:
# - App loads without errors
# - Navigate to different pages
# - Check browser console for import errors
# - Verify all components render

# Kill frontend
kill $FRONTEND_PID
```

### Expected Outcome
- Frontend builds and runs
- No 404 errors for modules
- Pages render correctly
- Browser console clean (no import errors)
- All navigation works

### Browser Checklist
- [ ] Home page loads
- [ ] Jobs dashboard loads
- [ ] Module store loads
- [ ] Workspace loads
- [ ] No console errors
- [ ] All components visible

---

## Stage 5: Backend Entry Point

### Quick Verification
```bash
# Test new entry point
npm run dev:backend &
BACKEND_PID=$!
sleep 3

# Test all endpoints still work
curl http://localhost:3000/health
curl http://localhost:3000/api/jobs

# Verify old entry points are removed
test ! -f platform/core/src/backend/index-simple.ts && echo "✓ index-simple.ts removed"
test -f platform/core/src/backend/app.ts && echo "✓ app.ts exists"
test -f platform/core/src/backend/index.ts && echo "✓ index.ts exists"

kill $BACKEND_PID
```

### Expected Outcome
- New entry point works
- Old files removed
- Application functionality unchanged
- Cleaner codebase

---

## Stage 6: Unified Entry Point

### Quick Verification
```bash
# Test unified dev command
npm run dev &
DEV_PID=$!
sleep 5

# Both backend and frontend should start
# Check both are accessible
curl http://localhost:3000/health
curl http://localhost:5174

# Open frontend in browser
open http://localhost:5174

# Verify frontend can call backend API
# (Check network tab in browser DevTools)

# Cleanup
kill $DEV_PID
```

### Production Build Test
```bash
# Clean previous builds
rm -rf dist/

# Build for production
npm run build

# Verify build outputs
test -d dist/backend && echo "✓ Backend built"
test -d dist/frontend && echo "✓ Frontend built"
test -f dist/backend/index.js && echo "✓ Backend entry exists"
test -f dist/frontend/index.html && echo "✓ Frontend index exists"

# Test production start
NODE_ENV=production npm start &
PROD_PID=$!
sleep 5

# Test production server
curl http://localhost:3000/health
curl http://localhost:3000/  # Should return HTML
curl -I http://localhost:3000/assets/index-*.js  # Should return 200

# Open in browser
open http://localhost:3000

# Verify:
# - App loads
# - API calls work
# - Static assets load

kill $PROD_PID
```

### Expected Outcome
- Dev: Single command starts both servers
- Prod: Single server serves both frontend and API
- All functionality works in both modes

---

## Stage 7: Documentation

### Quick Verification
```bash
# Verify README files exist
find . -name "README.md" -not -path "*/node_modules/*" -not -path "*/.git/*"

# Should find:
# - ./README.md
# - ./platform/core/README.md
# - ./platform/core/src/backend/README.md
# - ./platform/core/src/frontend/README.md
# - ./modules/job-tracker-basic/README.md
# - ./shared/types/README.md
# - ./tools/module-cli/README.md

# Verify content is meaningful
cat platform/core/README.md
# Should explain structure and usage

# Run app to ensure docs didn't break anything
npm run dev &
DEV_PID=$!
sleep 5
curl http://localhost:3000/health
kill $DEV_PID
```

### Expected Outcome
- All major directories have README files
- Documentation is clear and helpful
- Application still works
- New developers can understand structure

---

## Stage 8: Deployment Configuration

### Quick Verification
```bash
# Clean build
rm -rf dist/ node_modules/
npm install

# Full production build test
npm run build

# Verify build outputs match render.yaml expectations
ls -la dist/backend/index.js  # Entry point exists
ls -la dist/frontend/index.html  # Frontend built

# Test production server
NODE_ENV=production npm start &
PROD_PID=$!
sleep 5

# Comprehensive production tests
curl http://localhost:3000/health | jq
curl http://localhost:3000/api/jobs | jq
curl http://localhost:3000/ | grep "<title>"
curl -I http://localhost:3000/assets/index-*.js

# Test with production env vars
export DATABASE_URL="postgresql://localhost/test"
export RUNTIME_DIR="/tmp/job-tracker-runtime"
curl http://localhost:3000/health

kill $PROD_PID
unset DATABASE_URL RUNTIME_DIR
```

### Pre-Deployment Checklist
- [ ] `npm run build` succeeds
- [ ] `npm start` runs without errors
- [ ] Health endpoint returns 200
- [ ] API endpoints work
- [ ] Frontend HTML is served
- [ ] Static assets load
- [ ] Environment variables are respected
- [ ] Runtime directories are created

### Render.com Deploy Test (if possible)
```bash
# Push to main/master branch (or deploy branch)
git checkout main
git merge 001-monorepo-refactor-project
git push origin main

# Monitor Render.com build logs
# Verify:
# - Build command runs successfully
# - Start command starts server
# - Health check passes
# - Application is accessible
```

---

## Comprehensive End-to-End Test

After all stages are complete, run this full test:

### 1. Clean Environment Test
```bash
# Clone repo fresh (or clean local)
git clone <repo-url> test-refactor
cd test-refactor
git checkout 001-monorepo-refactor-project

# Install dependencies
npm install

# Type check
npm run type-check
# Should pass

# Run tests (if any)
npm test
```

### 2. Development Mode Test
```bash
# Start dev servers
npm run dev &
DEV_PID=$!
sleep 5

# Test backend
curl http://localhost:3000/health
curl http://localhost:3000/api/jobs

# Test frontend (in browser)
open http://localhost:5174

# Manual browser testing:
# - Navigate all pages
# - Perform CRUD operations
# - Check console for errors
# - Verify all features work

kill $DEV_PID
```

### 3. Production Build Test
```bash
# Build
npm run build

# Verify outputs
ls dist/backend/
ls dist/frontend/

# Start production
NODE_ENV=production npm start &
PROD_PID=$!
sleep 5

# Test
curl http://localhost:3000/health
open http://localhost:3000

# Verify all features work in production mode

kill $PROD_PID
```

### 4. Database Migration Test (if applicable)
```bash
# Test with actual database
export DATABASE_URL="postgresql://localhost/job_tracker_test"

npm start &
PROD_PID=$!

# Create test job
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"company":"ACME","position":"Engineer","status":"applied"}'

# Retrieve jobs
curl http://localhost:3000/api/jobs

kill $PROD_PID
```

---

## Troubleshooting

### Common Issues

#### Issue: "Cannot find module '@platform/core'"
**Cause**: TypeScript paths not configured correctly
**Fix**: Check `tsconfig.json` paths configuration
```bash
npm run type-check
# Check error messages for hints
```

#### Issue: "ENOENT: no such file or directory"
**Cause**: Hardcoded paths not updated to PATHS config
**Fix**: Search for hardcoded paths
```bash
grep -r "temp-uploads" platform/core/src/
grep -r "storage" platform/core/src/
# Update to use PATHS.TEMP_UPLOADS, PATHS.STORAGE
```

#### Issue: "Cannot GET /api/jobs"
**Cause**: Routes not registered correctly
**Fix**: Check app.ts router registration
```typescript
// Verify in app.ts:
app.use('/api/jobs', jobsRouter);
```

#### Issue: Frontend 404 on component imports
**Cause**: Import paths not updated after moves
**Fix**: Use TypeScript language server to find errors
```bash
npm run type-check
# Fix each import error shown
```

---

## Success Criteria

Refactoring is successful when:

- [x] All 8 stages completed and committed
- [x] `npm run type-check` passes
- [x] `npm run dev` starts both servers
- [x] `npm run build` produces dist/ outputs
- [x] `npm start` runs production server
- [x] All API endpoints work
- [x] Frontend loads and functions correctly
- [x] No console errors
- [x] README files are helpful
- [x] Deployment config updated
- [x] Application works in production

---

## Rollback Strategy

If major issues are found after completing all stages:

### Option 1: Fix Forward (Preferred)
1. Identify specific issue
2. Create hotfix
3. Test thoroughly
4. Commit fix
5. Continue

### Option 2: Rollback to Specific Stage
```bash
# Find the stage commit
git log --oneline | grep "Stage"

# Rollback to that commit
git reset --hard <commit-hash>

# Force push (feature branch only!)
git push -f origin 001-monorepo-refactor-project

# Fix the issue before proceeding
```

### Option 3: Full Rollback (Last Resort)
```bash
# Rollback to before refactoring started
git checkout main
git branch -D 001-monorepo-refactor-project
git checkout -b 001-monorepo-refactor-project-v2

# Start over with lessons learned
```

---

## Post-Refactoring Tasks

After successful completion:

1. **Merge to main**:
   ```bash
   git checkout main
   git merge 001-monorepo-refactor-project
   git push origin main
   ```

2. **Deploy to production**:
   - Verify Render.com deployment
   - Monitor error logs
   - Test production features

3. **Update team documentation**:
   - Share new structure with team
   - Update onboarding docs
   - Create contribution guidelines

4. **Delete old branches**:
   ```bash
   git branch -d 001-monorepo-refactor-project
   git push origin --delete 001-monorepo-refactor-project
   ```

5. **Celebrate** 🎉
   - Major refactoring complete
   - Codebase is now maintainable
   - Future features easier to add

---

**Remember**: Test thoroughly at each stage. Incremental progress is safer than rushing through all stages.
