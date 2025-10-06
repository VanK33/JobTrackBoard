# Tasks: Fix File Upload in New/Edit Application Forms

**Input**: Design documents from `/specs/005-bug-new-application/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Loaded: TypeScript/React web app, monorepo structure
   → ✅ Tech stack: React 18, TypeScript 5.0+, Express, Vite
2. Load optional design documents:
   → ✅ data-model.md: JobFile interface extension
   → ✅ contracts/: Internal API contracts (3 functions to modify)
   → ✅ research.md: Root cause analysis, solution design
   → ✅ quickstart.md: 8 manual test scenarios
3. Generate tasks by category:
   → Setup: No new dependencies (bug fix)
   → Core: Interface update + 3 function fixes
   → Testing: 8 manual test scenarios from quickstart
4. Apply task rules:
   → All changes in same file (JobDashboard.tsx) = sequential
   → Testing tasks can be parallel [P]
5. Number tasks sequentially (T001-T006)
6. Generate dependency graph
7. Create manual testing checklist
8. Validate task completeness:
   → ✅ All contract changes covered
   → ✅ All test scenarios included
   → ✅ Data model changes implemented
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All code changes in `platform/core/src/frontend/pages/JobDashboard.tsx`

## Path Conventions
This is a web application monorepo:
- **Frontend**: `platform/core/src/frontend/pages/JobDashboard.tsx` (PRIMARY FILE)
- **Backend**: No changes required (API already working)
- **Tests**: Manual testing only (no automated test framework)

---

## Phase 3.1: Setup
**Status**: ✅ Not required - this is a bug fix to existing code, no new dependencies

---

## Phase 3.2: Core Implementation

### T001: Update JobFile interface to support pending uploads
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (line ~38-49)

**Task**:
1. Locate the `JobFile` interface definition (around line 38)
2. Update `uploadStatus` type to include `'pending'`:
   ```typescript
   uploadStatus?: 'uploading' | 'completed' | 'failed' | 'pending'
   ```
3. Add new optional field for storing raw File object:
   ```typescript
   rawFile?: File  // Store original File object for pending uploads
   ```

**Acceptance Criteria**:
- TypeScript compiles without errors
- Interface supports all four upload states
- rawFile field is optional and typed as File

**Reference**: data-model.md "Modified Interfaces"

---

### T002: Fix handleFilesUpload() to store raw File objects
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (line ~692-708)
**Dependencies**: T001 (requires updated interface)

**Task**:
1. Locate `handleFilesUpload()` function
2. Find the section that creates temporary files for new job creation (around line 692-708)
3. Update the `tempFile` object creation to include:
   ```typescript
   const tempFile: JobFile = {
     id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
     name: file.name,
     type: 'other',
     mimeType: file.type,
     size: file.size,
     url: URL.createObjectURL(file),
     uploadedAt: new Date().toISOString(),
     uploadStatus: 'pending',
     rawFile: file  // NEW: Store the raw File object
   }
   ```

**Acceptance Criteria**:
- Pending files have `rawFile` populated with browser File object
- Blob URL still created for preview purposes
- No TypeScript errors

**Reference**: contracts/file-upload.contract.md "handleFilesUpload()"

---

### T003: Fix handleSaveNewApplication() to use stored File objects
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (line ~437-449)
**Dependencies**: T002 (requires rawFile to be stored)

**Task**:
1. Locate `handleSaveNewApplication()` function
2. Find the section that uploads pending files (around line 437-449)
3. **Remove** the broken blob URL fetch code (lines 440-442):
   ```typescript
   // DELETE THESE LINES:
   const response = await apiFetch(pendingFile.url)
   const blob = await response.blob()
   const file = new File([blob], pendingFile.name, { type: pendingFile.mimeType })
   ```
4. **Replace** with direct File access:
   ```typescript
   // ADD THIS CODE:
   const file = pendingFile.rawFile
   if (!file) {
     console.error(`No raw file for pending upload: ${pendingFile.name}`)
     continue
   }
   ```
5. Keep the existing `realFileUpload(file, jobIdString, pendingFile.type)` call

**Acceptance Criteria**:
- No more attempts to fetch blob URLs via apiFetch
- Files upload successfully using stored rawFile
- Error handling for missing rawFile
- Console logs show "Uploading N pending files" and "Successfully uploaded {filename}"

**Reference**: contracts/file-upload.contract.md "handleSaveNewApplication()"

---

### T004: Add pending file upload logic to handleSaveEdit()
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx` (line ~275-325)
**Dependencies**: T002 (requires rawFile to be stored)

**Task**:
1. Locate `handleSaveEdit()` function
2. Find the section after successful job update (around line 294-312)
3. **Add** pending file upload logic after the job update but before clearing edit state:
   ```typescript
   // Add this code after line 312 (before setIsEditing(false)):

   // Handle pending file uploads
   const pendingFiles = editForm?.files?.filter(f => f.uploadStatus === 'pending') || []

   if (pendingFiles.length > 0) {
     const jobIdString = editForm._id
     console.log(`Uploading ${pendingFiles.length} pending files to job ${jobIdString}`)

     for (const pendingFile of pendingFiles) {
       try {
         const file = pendingFile.rawFile
         if (!file) {
           console.error(`No raw file for pending upload: ${pendingFile.name}`)
           continue
         }

         await realFileUpload(file, jobIdString, pendingFile.type)
         console.log(`Successfully uploaded ${pendingFile.name}`)
       } catch (uploadError) {
         console.error(`Failed to upload ${pendingFile.name}:`, uploadError)
       }
     }

     // Refresh to show uploaded files
     const freshResponse = await apiFetch(`${API_BASE_URL}/api/jobs/${editForm._id}`)
     if (freshResponse.ok) {
       const updatedJob = await freshResponse.json()
       setJobs(jobs.map(job => job._id === editForm._id ? updatedJob : job))
       setSelectedJob(updatedJob)
     }
   }
   ```

**Acceptance Criteria**:
- Edit form uploads pending files after saving job changes
- Upload progress tracked and logged
- Job data refreshed to show newly uploaded files
- Error handling per file (one failure doesn't block others)

**Reference**: contracts/file-upload.contract.md "handleSaveEdit()"

---

## Phase 3.3: Cleanup & Optimization (Optional Enhancement)

### T005: Add blob URL cleanup to prevent memory leaks
**File**: `platform/core/src/frontend/pages/JobDashboard.tsx`
**Dependencies**: T003, T004 (requires upload logic to be complete)
**Priority**: Medium (enhancement, not critical for bug fix)

**Task**:
1. After successful file upload in both `handleSaveNewApplication()` and `handleSaveEdit()`:
   ```typescript
   // After successful upload, clean up blob URL:
   if (pendingFile.url.startsWith('blob:')) {
     URL.revokeObjectURL(pendingFile.url)
   }
   ```
2. Also add cleanup on form cancellation:
   - In `handleCancelNewApplication()` (line ~468-473)
   - In `handleCancelEdit()` / `confirmCancelEdit()` (line ~327-340)
   ```typescript
   // Clean up blob URLs before clearing form
   form?.files?.forEach(file => {
     if (file.url.startsWith('blob:')) {
       URL.revokeObjectURL(file.url)
     }
   })
   ```

**Acceptance Criteria**:
- Blob URLs revoked after successful upload
- Blob URLs revoked on form cancellation
- No memory leaks visible in DevTools heap snapshots

**Reference**: research.md "Performance & Constraints"

---

## Phase 3.4: Manual Testing (After T001-T004 Complete)

**Prerequisites**: Development server running (`npm run dev`)

### T006 [P]: Execute all manual test scenarios from quickstart.md

**Scenarios to test** (can be run in parallel by different testers):

1. **New Application with Files** (Scenario 1)
   - Create new job with 2 files attached
   - Verify both files upload after save
   - Check files persist after page refresh

2. **Edit Application with New Files** (Scenario 2)
   - Edit existing job and add 1 new file
   - Verify file uploads after save
   - Verify file count incremented

3. **Main Page Upload - Regression Test** (Scenario 3)
   - Upload file via "Add File" button on main page
   - Verify functionality unchanged (no regression)

4. **File Validation** (Scenario 4)
   - Try uploading >25MB file → verify rejected
   - Try uploading .exe file → verify rejected

5. **Form Validation with Files** (Scenario 5)
   - Upload file to new job form
   - Submit without required fields
   - Fix validation errors and save
   - Verify file preserved and uploads

6. **Multiple File Upload** (Scenario 6)
   - Select 3 files at once in new job form
   - Verify all 3 upload after save

7. **Cancel with Files** (Scenario 7)
   - Upload file to new job form
   - Cancel without saving
   - Check DevTools for memory leaks (if T005 complete)

8. **Edit with Mixed Files** (Scenario 8)
   - Edit job with 2 existing files
   - Add 1 new file
   - Save and verify 3 total files

**Acceptance Criteria**:
- ✅ All 8 scenarios pass with expected results
- ✅ No console errors during any scenario
- ✅ Files persist correctly to backend
- ✅ No regression in existing functionality
- ✅ Upload progress shown for each file

**Reference**: quickstart.md (complete testing guide)

**Debugging**:
- Check browser DevTools console for errors
- Check Network tab for POST to `/api/jobs/:id/files`
- Check React DevTools for file state (`rawFile` should exist for pending)
- Check backend logs for "Successfully uploaded" messages

---

## Dependencies

```
T001 (Interface)
  ↓
T002 (Store rawFile) ──┐
  ↓                    ↓
T003 (Fix new app)   T004 (Fix edit)
  ↓                    ↓
  └─────── T005 (Cleanup) ─────┘
              ↓
           T006 (Testing)
```

**Critical Path**: T001 → T002 → T003 → T004 → T006

**Optional**: T005 (can be done later or skipped)

---

## Execution Notes

### Sequential Execution Required
All tasks T001-T004 modify the same file (`JobDashboard.tsx`), so they **cannot** be parallelized. Execute in order.

### Recommended Approach
```bash
# 1. Make a backup
cp platform/core/src/frontend/pages/JobDashboard.tsx platform/core/src/frontend/pages/JobDashboard.tsx.backup

# 2. Execute tasks T001-T004 sequentially
# Each task should be a single, focused edit

# 3. Run type check after each task
npm run type-check

# 4. Test in browser after T004
npm run dev
# Open http://localhost:5173 and test manually

# 5. Execute T006 manual testing
# Follow quickstart.md scenarios

# 6. Commit when all tests pass
git add platform/core/src/frontend/pages/JobDashboard.tsx
git commit -m "fix: file upload in new/edit application forms

- Store raw File objects for pending uploads
- Fix blob URL fetch error in new application
- Add pending file upload to edit application
- Fixes issue where files were not uploaded during job creation/editing"
```

### Rollback Plan
```bash
# If issues found:
cp platform/core/src/frontend/pages/JobDashboard.tsx.backup platform/core/src/frontend/pages/JobDashboard.tsx
npm run type-check
```

---

## Validation Checklist
*GATE: Must pass before marking feature complete*

- [x] All contracts have corresponding implementation (T001-T004)
- [x] All data model changes implemented (JobFile interface)
- [x] All test scenarios covered (T006 references all 8 from quickstart.md)
- [x] Tasks ordered by dependencies
- [x] Each task specifies exact file path and line numbers
- [x] No tasks modify same code section (all sequential in same file)
- [x] Acceptance criteria defined for each task
- [x] References to design docs included

---

## Success Metrics

After completing all tasks:

1. **Functionality**: Files upload successfully in new/edit forms ✅
2. **Data Integrity**: Files persisted to backend with correct metadata ✅
3. **Error Handling**: Proper validation and error messages ✅
4. **Performance**: Smooth upload progress, no memory leaks ✅
5. **Regression**: Main page upload still works ✅
6. **Code Quality**: Type-safe, maintainable, follows existing patterns ✅

---

**Estimated Time**: 2-3 hours
- T001-T004: 1-2 hours (coding + type-checking)
- T005: 30 minutes (optional)
- T006: 30-60 minutes (manual testing)
