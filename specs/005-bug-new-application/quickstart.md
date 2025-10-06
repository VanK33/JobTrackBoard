# Quickstart: File Upload Bug Fix Testing

## Prerequisites
- Development server running (`npm run dev`)
- Database configured and accessible
- Test files ready:
  - `test-resume.pdf` (< 1MB)
  - `test-cover-letter.pdf` (< 1MB)
  - `large-file.pdf` (> 25MB for error testing)

## Test Scenario 1: New Application with Files ✅

### Steps
1. Navigate to Job Dashboard
2. Click "New Application" button
3. Fill in required fields:
   - Title: "Test Job 1"
   - Company: "Test Company"
   - Location: "Remote"
4. Click "Add Documents" in the form
5. Select `test-resume.pdf` and `test-cover-letter.pdf`
6. Verify files appear in the document list with preview
7. Click "Save Application"
8. Wait for upload progress to complete

### Expected Results
- ✅ Job is created successfully
- ✅ Both files are uploaded to the backend
- ✅ Files appear in the "Related Documents" section
- ✅ File previews work (click thumbnail to view)
- ✅ Files are persisted (refresh page and verify they remain)

### Current Behavior (Bug)
- ❌ Job is created
- ❌ Files show as "pending" but are never uploaded
- ❌ Error in console: "Failed to fetch blob URL"

---

## Test Scenario 2: Edit Application with New Files ✅

### Steps
1. Navigate to Job Dashboard
2. Select an existing job from the list
3. Click "Edit" button
4. Click "Add Documents" in the edit form
5. Select `test-resume.pdf`
6. Verify file appears in the document list
7. Click "Save Changes"
8. Wait for upload to complete

### Expected Results
- ✅ Job is updated successfully
- ✅ New file is uploaded to the backend
- ✅ New file appears alongside existing files
- ✅ File count incremented
- ✅ File persisted (refresh and verify)

### Current Behavior (Bug)
- ❌ Job is updated
- ❌ New file is ignored (not uploaded)
- ❌ File does not appear after save

---

## Test Scenario 3: Main Page Upload (Regression Test) ✅

### Steps
1. Navigate to Job Dashboard
2. Select an existing job from the list
3. In the "Related Documents" section, click "Add File" button (black button)
4. Select `test-resume.pdf`
5. Wait for upload to complete

### Expected Results
- ✅ File uploads immediately
- ✅ Upload progress shown
- ✅ File appears in documents list
- ✅ No errors in console

### Current Behavior
- ✅ This path currently works (no changes needed, verify no regression)

---

## Test Scenario 4: File Validation ✅

### Steps
1. Navigate to Job Dashboard
2. Click "New Application"
3. Try to upload `large-file.pdf` (> 25MB)

### Expected Results
- ✅ Error message displayed
- ✅ File rejected
- ✅ Other valid files still uploadable

### Steps (Invalid Type)
1. Try to upload `test.exe` or `test.zip`

### Expected Results
- ✅ Error message about unsupported file type
- ✅ File rejected

---

## Test Scenario 5: Form Validation with Files ✅

### Steps
1. Click "New Application"
2. Upload `test-resume.pdf` (DO NOT fill required fields)
3. Click "Save Application"

### Expected Results
- ✅ Validation errors shown (missing title, company, etc.)
- ✅ Form remains open
- ✅ Uploaded file is preserved (still visible in form)
- ✅ Can fix validation errors and save successfully
- ✅ File uploads after valid save

---

## Test Scenario 6: Multiple File Upload ✅

### Steps
1. Click "New Application"
2. Fill required fields
3. Select multiple files (Ctrl+Click or Cmd+Click):
   - `test-resume.pdf`
   - `test-cover-letter.pdf`
   - `test-portfolio.png`
4. Click "Save Application"

### Expected Results
- ✅ All 3 files shown in form before save
- ✅ All 3 files uploaded after job creation
- ✅ Upload progress shown for each file
- ✅ All 3 files visible in job documents

---

## Test Scenario 7: Cancel with Files ✅

### Steps
1. Click "New Application"
2. Upload `test-resume.pdf`
3. Click "Cancel" button
4. Open browser DevTools → Memory → Take heap snapshot
5. Check for leaked blob URLs or File objects

### Expected Results
- ✅ Form closes
- ✅ File state cleared
- ✅ No memory leaks (blob URLs revoked)

---

## Test Scenario 8: Edit with Mixed Files ✅

### Steps
1. Select a job that already has 2 files uploaded
2. Click "Edit"
3. Upload a new `test-resume.pdf` (don't save yet)
4. Verify 3 files shown: 2 existing + 1 pending
5. Click "Save Changes"

### Expected Results
- ✅ 2 existing files remain unchanged
- ✅ 1 new file uploads successfully
- ✅ Total 3 files shown after save
- ✅ All files accessible

---

## Manual Testing Checklist

After implementing the fix, run through all scenarios:

- [ ] Scenario 1: New application with files
- [ ] Scenario 2: Edit application with new files
- [ ] Scenario 3: Main page upload (regression)
- [ ] Scenario 4: File validation
- [ ] Scenario 5: Form validation with files
- [ ] Scenario 6: Multiple file upload
- [ ] Scenario 7: Cancel with files (memory cleanup)
- [ ] Scenario 8: Edit with mixed files

## Success Criteria

All scenarios must pass with expected results. Key validations:

1. **Functionality**: Files upload successfully in new/edit forms
2. **Data Integrity**: Files persisted correctly to backend
3. **Error Handling**: Proper validation and error messages
4. **Performance**: No memory leaks, smooth upload progress
5. **Regression**: Main page upload still works
6. **User Experience**: Clear feedback during upload

## Automated Test Commands

```bash
# Run development server
npm run dev

# Open browser to test
open http://localhost:5173

# Check backend logs for upload success
# Look for: "Uploading N pending files to job {id}"
# Look for: "Successfully uploaded {filename}"
```

## Debugging

If issues occur:

1. **Open DevTools Console**
   - Check for errors related to blob URLs
   - Look for "Failed to upload" messages

2. **Network Tab**
   - Verify POST to `/api/jobs/:id/files`
   - Check multipart/form-data payload
   - Verify 200 OK response

3. **React DevTools**
   - Inspect newJobForm or editForm state
   - Verify files array has `rawFile` for pending uploads
   - Check uploadStatus values

4. **Backend Logs**
   - Verify file received
   - Check storage manager logs
   - Confirm database record created

## Rollback Plan

If critical issues found:

1. Revert changes to `JobDashboard.tsx`
2. Files will revert to broken state (known issue)
3. Main page upload will continue working
4. Document issues for next iteration
