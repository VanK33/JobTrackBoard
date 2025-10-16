# Quickstart: Remove Sensitive Database Information

**Feature**: 015-sensitive-information-folder
**Date**: 2025-10-14
**Purpose**: Manual verification guide for removing sensitive database credentials

---

## Prerequisites

Before starting this quickstart:
- [ ] You have read `research.md` and understand the security implications
- [ ] You are aware that `database-config.json` was committed to git (commit `f1b13c5`)
- [ ] You understand credentials must be rotated after removal
- [ ] Feature 014 (localStorage configuration) is implemented
- [ ] You have access to database admin panel to rotate credentials

---

## Quick Reference

### Files Affected
- `platform/core/database-config.json` - **DELETE**
- `.gitignore` - **UPDATE** (add database-config.json)
- `platform/core/.env` - **KEEP** (already protected)

### Commands
```bash
# Audit
grep -r "urgmsorlmjbdwilxsaud\|Bnknnkw4R9Zq4JJC" --exclude-dir={node_modules,.git,dist}

# Delete
rm platform/core/database-config.json

# Verify
npm run dev
git status
```

---

## Scenario 1: Audit Repository for Sensitive Data

**Given**: Repository may contain hardcoded credentials
**When**: I search for sensitive patterns
**Then**: I should identify all files with credentials

### Steps

1. **Search for database project ID**:
```bash
grep -r "urgmsorlmjbdwilxsaud" --exclude-dir={node_modules,.git,dist}
```

**Expected output**:
```
platform/core/.env:SUPABASE_URL=https://urgmsorlmjbdwilxsaud.supabase.co
platform/core/.env:DATABASE_CONNECTION_STRING=postgresql://postgres.urgmsorlmjbdwilxsaud:...
platform/core/database-config.json:  "connectionString": "postgresql://postgres.urgmsorlmjbdwilxsaud:..."
```

2. **Search for database password**:
```bash
grep -r "Bnknnkw4R9Zq4JJC" --exclude-dir={node_modules,.git,dist}
```

**Expected output**:
```
platform/core/.env:DATABASE_CONNECTION_STRING=postgresql://postgres.urgmsorlmjbdwilxsaud:Bnknnkw4R9Zq4JJC@...
platform/core/database-config.json:  "connectionString": "postgresql://postgres.urgmsorlmjbdwilxsaud:Bnknnkw4R9Zq4JJC@..."
```

3. **Verify findings**:
   - `.env` file: ✅ Expected (needed for backend, already gitignored)
   - `database-config.json`: ❌ Exposed (not gitignored, must delete)

### Success Criteria
- [x] Identified `platform/core/database-config.json` as containing credentials
- [x] Confirmed `.env` is safe (in .gitignore)
- [x] No other source code files contain hardcoded credentials

---

## Scenario 2: Remove Sensitive File

**Given**: `database-config.json` contains exposed credentials
**When**: I delete the file
**Then**: File should be removed from file system

### Steps

1. **Verify file exists**:
```bash
ls -la platform/core/database-config.json
```

**Expected**: File exists with size ~1KB

2. **Delete the file**:
```bash
rm platform/core/database-config.json
```

3. **Verify deletion**:
```bash
ls platform/core/database-config.json
```

**Expected**: `No such file or directory`

### Success Criteria
- [x] File successfully deleted from file system
- [x] No errors during deletion

---

## Scenario 3: Update .gitignore

**Given**: `database-config.json` pattern is not in `.gitignore`
**When**: I add the pattern
**Then**: Git should ignore the file pattern

### Steps

1. **Check current .gitignore**:
```bash
grep "database-config" .gitignore
```

**Expected**: No matches (pattern not yet added)

2. **Add pattern to .gitignore**:
```bash
# Add to end of .gitignore file
echo "" >> .gitignore
echo "# Database configuration files (sensitive)" >> .gitignore
echo "database-config.json" >> .gitignore
echo "platform/core/database-config.json" >> .gitignore
```

Or manually edit `.gitignore`:
```gitignore
# Database configuration files (sensitive)
database-config.json
platform/core/database-config.json
```

3. **Verify pattern was added**:
```bash
grep "database-config" .gitignore
```

**Expected**:
```
database-config.json
platform/core/database-config.json
```

4. **Test git ignore**:
```bash
# Try to re-create file (for testing)
touch platform/core/database-config.json

# Check git status
git status

# Clean up test file
rm platform/core/database-config.json
```

**Expected**: `git status` should NOT show `database-config.json` as untracked

### Success Criteria
- [x] Pattern added to `.gitignore`
- [x] Git ignores `database-config.json` files
- [x] Pattern is documented with comment

---

## Scenario 4: Verify .env Protection

**Given**: `.env` file contains sensitive credentials
**When**: I check if it's protected by `.gitignore`
**Then**: `.env` should be listed in `.gitignore`

### Steps

1. **Check .gitignore for .env**:
```bash
grep "^\.env$" .gitignore
```

**Expected**: `.env` is listed

2. **Verify git ignores .env**:
```bash
git status | grep ".env"
```

**Expected**: No output (file is ignored)

3. **Confirm .env exists and has credentials**:
```bash
grep "DATABASE_CONNECTION_STRING" platform/core/.env
```

**Expected**: Shows connection string (proves file exists and has credentials)

### Success Criteria
- [x] `.env` is in `.gitignore`
- [x] Git ignores `.env` file
- [x] `.env` contains necessary credentials for backend

---

## Scenario 5: Search for Remaining Credentials

**Given**: Sensitive files have been removed
**When**: I search entire repository for credentials
**Then**: Only protected files should contain credentials

### Steps

1. **Comprehensive credential search**:
```bash
grep -r "urgmsorlmjbdwilxsaud\|Bnknnkw4R9Zq4JJC\|postgresql://.*:.*@\|SUPABASE.*KEY" \
  --exclude-dir={node_modules,.git,dist} \
  --exclude="*.md" \
  .
```

**Expected output** (only protected files):
```
platform/core/.env:SUPABASE_URL=https://urgmsorlmjbdwilxsaud.supabase.co
platform/core/.env:SUPABASE_SERVICE_ROLE_KEY=...
platform/core/.env:DATABASE_CONNECTION_STRING=postgresql://...
```

2. **Verify no source code has credentials**:
```bash
grep -r "postgresql://.*:.*@" platform/core/src --include="*.ts" --include="*.tsx"
```

**Expected**: No output (no hardcoded credentials in source)

3. **Check for other config files**:
```bash
find . -name "*config*.json" -not -path "*/node_modules/*" -not -path "*/.git/*"
```

**Expected**: Only package.json, tsconfig.json, etc. (no sensitive config files)

### Success Criteria
- [x] Only `.env` contains credentials (protected by .gitignore)
- [x] No credentials in source code
- [x] No other unprotected config files with credentials

---

## Scenario 6: Verify Application Still Works

**Given**: `database-config.json` has been deleted
**When**: I run the application
**Then**: App should work using localStorage config (Feature 014)

### Steps

1. **Start development server**:
```bash
npm run dev
```

**Expected**: Server starts without errors
```
> dev
> concurrently "npm run dev:backend" "npm run dev:frontend"

[backend] Server running on port 3000
[frontend] VITE ready in XXXms
```

2. **Open browser** to `http://localhost:5173`

3. **Check browser console** for errors:
   - Open DevTools (F12)
   - Go to Console tab

**Expected**: No errors about missing `database-config.json`

4. **Verify database connection**:
   - If app shows DatabaseSettings page: Enter connection and save
   - If app loads normally: Database connection is working

5. **Check localStorage**:
```javascript
// In browser console
localStorage.getItem('databaseConfig')
```

**Expected**: Returns configuration object or null (if not set yet)

6. **Test database functionality**:
   - Navigate to main app pages
   - Try creating/reading data
   - Verify operations work

**Expected**: All database operations work normally

7. **Stop server**: Press `Ctrl+C` in terminal

### Success Criteria
- [x] Server starts without errors
- [x] No console errors about missing config file
- [x] Database connection works
- [x] App uses localStorage for configuration (Feature 014)

---

## Scenario 7: Check Git History (Security Advisory)

**Given**: File was committed to git
**When**: I check git history
**Then**: I should see the commit and understand credentials are exposed

### Steps

1. **Check git log for database-config.json**:
```bash
git log --all --oneline -- platform/core/database-config.json
```

**Expected output**:
```
f1b13c5 stage 1 complete
```

2. **View the commit details**:
```bash
git show f1b13c5:platform/core/database-config.json
```

**Expected**: Shows file contents with exposed credentials

3. **⚠️ SECURITY ADVISORY**:

**CRITICAL**: Since `database-config.json` was committed to git (commit `f1b13c5` on 2025-09-27), the credentials in that file are considered **COMPROMISED**.

**Required Actions**:
1. **Immediately rotate database credentials**:
   - Log into Supabase dashboard
   - Go to Database Settings
   - Reset database password
   - Update `.env` with new password
   - Update any production deployments

2. **Optional: Rewrite git history** (only if repository is private):
```bash
# WARNING: This requires force push and affects all collaborators!
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch platform/core/database-config.json' \
  --prune-empty --tag-name-filter cat -- --all
```

3. **Notify team members** if repository is shared

### Success Criteria
- [x] Confirmed file was in git history
- [x] User understands credentials must be rotated
- [x] User decides whether to rewrite git history

---

## Scenario 8: Final Verification

**Given**: All cleanup tasks are complete
**When**: I run final checks
**Then**: Repository should be clean and secure

### Steps

1. **Check git status**:
```bash
git status
```

**Expected**:
```
On branch 015-sensitive-information-folder
Changes not staged for commit:
  modified:   .gitignore
```

2. **Verify no sensitive files tracked**:
```bash
git ls-files | grep -E "database-config|secrets|credentials"
```

**Expected**: No output (no sensitive files in git)

3. **Verify .gitignore updates**:
```bash
git diff .gitignore
```

**Expected**: Shows added database-config.json patterns

4. **Test app one more time**:
```bash
npm run dev
# Open browser, verify app works
```

5. **Commit changes** (if ready):
```bash
git add .gitignore
git commit -m "security: add database-config.json to gitignore

- Remove database-config.json from repository
- Add database-config.json to .gitignore
- Prevent future accidental commits of sensitive config

Related to Feature 015: Remove Sensitive Database Information
"
```

### Success Criteria
- [x] Only `.gitignore` is modified (in git status)
- [x] No sensitive files in git tracking
- [x] App works correctly
- [x] Changes committed with clear message

---

## Summary Checklist

Use this checklist to verify all scenarios completed successfully:

### Security Audit
- [ ] Scenario 1: Identified files with credentials
- [ ] Verified only `.env` and `database-config.json` contain credentials
- [ ] Confirmed no hardcoded credentials in source code

### Cleanup
- [ ] Scenario 2: Deleted `platform/core/database-config.json`
- [ ] Scenario 3: Added `database-config.json` to `.gitignore`
- [ ] Scenario 4: Verified `.env` is protected

### Verification
- [ ] Scenario 5: Comprehensive credential search shows only `.env`
- [ ] Scenario 6: Application works without `database-config.json`
- [ ] Scenario 7: Checked git history, aware of credential exposure

### Security Actions
- [ ] ⚠️ **CRITICAL**: Rotated database credentials (changed password)
- [ ] Updated `.env` with new credentials
- [ ] Updated production deployments (if applicable)
- [ ] Considered git history rewrite (if repository is private)

### Final Steps
- [ ] Scenario 8: Final verification passed
- [ ] Changes committed to git
- [ ] Ready to merge feature branch

---

## Troubleshooting

### App shows "No database configuration found"
**Solution**: This is expected behavior. Enter connection string in DatabaseSettings page (Feature 014).

### Can't find database-config.json
**Solution**: File may already be deleted. Proceed to verify .gitignore instead.

### Git still shows database-config.json as untracked
**Solution**: Verify .gitignore pattern is correct and file path matches.

### App throws database connection errors
**Solution**: Check `.env` file exists and has valid credentials. Check localStorage has valid config.

### Credentials still in git history after deletion
**Solution**: This is expected. Credentials remain in git history. You must rotate them.

---

## Next Steps

After completing this quickstart:

1. **Immediate**:
   - [ ] Rotate database credentials in Supabase
   - [ ] Update `.env` with new credentials
   - [ ] Test app with new credentials

2. **Short-term**:
   - [ ] Review other repositories for similar issues
   - [ ] Set up git-secrets or pre-commit hooks
   - [ ] Enable GitHub Secret Scanning (if using GitHub)

3. **Long-term**:
   - [ ] Document credential management practices
   - [ ] Train team on security best practices
   - [ ] Regular security audits

---

**Feature Status**: ✅ Ready for implementation (all manual verification steps documented)
