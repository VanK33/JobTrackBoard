# File Upload Contract

## Internal API Contract (Frontend)

### handleFilesUpload(files: FileList | File[])

**Purpose**: Handle file selection and prepare files for upload

**Input**:
- `files`: FileList or File[] - Files selected by user

**Behavior**:
1. For each file:
   - Validate file (size, type)
   - Check if jobId exists (isCreatingNew, isEditing, selectedJob)

2. **Case A: Job exists (jobId available)**
   - Upload immediately via `realFileUpload(file, jobId, 'other')`
   - Track upload progress
   - Update file state with backend response

3. **Case B: New/Edit form without saved jobId**
   - Create JobFile with:
     ```typescript
     {
       id: `temp-${Date.now()}-${random}`,
       name: file.name,
       type: 'other',
       mimeType: file.type,
       size: file.size,
       url: URL.createObjectURL(file),
       uploadedAt: new Date().toISOString(),
       uploadStatus: 'pending',
       rawFile: file  // NEW: Store original File
     }
     ```
   - Add to form.files[]

**Output**:
- Updates component state (newJobForm or editForm)
- No return value

**Error Handling**:
- Invalid file → Log error, skip file
- Upload failure → Set uploadStatus: 'failed', error message

---

### handleSaveNewApplication()

**Purpose**: Create new job and upload pending files

**Input**: None (reads from newJobForm state)

**Behavior**:
1. Validate form
2. Create job via POST `/api/jobs`
3. Extract pending files: `filter(f => f.uploadStatus === 'pending')`
4. For each pending file:
   - Get File from `pendingFile.rawFile`
   - Upload via `realFileUpload(rawFile, createdJobId, fileType)`
   - Track progress
5. Refresh job data from backend
6. Clear form state and select new job

**Output**:
- Created job with uploaded files
- Updates jobs list
- Clears newJobForm

**Error Handling**:
- Validation error → Show errors, keep form open
- Job creation error → Alert user
- File upload error → Log error, continue with other files

**Changed Logic** (Line 440-442):
```typescript
// BEFORE (Broken)
const response = await apiFetch(pendingFile.url)  // ❌ Can't fetch blob URL
const blob = await response.blob()
const file = new File([blob], pendingFile.name, { type: pendingFile.mimeType })

// AFTER (Fixed)
const file = pendingFile.rawFile  // ✅ Use stored File directly
if (!file) {
  console.error('No raw file for pending upload')
  continue
}
```

---

### handleSaveEdit()

**Purpose**: Update job and upload pending files

**Input**: None (reads from editForm state)

**Behavior**:
1. Validate form
2. Update job via PUT `/api/jobs/:id`
3. **NEW**: Extract pending files: `filter(f => f.uploadStatus === 'pending')`
4. **NEW**: For each pending file:
   - Get File from `pendingFile.rawFile`
   - Upload via `realFileUpload(rawFile, editForm._id, fileType)`
   - Track progress
5. Refresh job data from backend
6. Clear edit state and update selected job

**Output**:
- Updated job with new files uploaded
- Updates jobs list
- Clears editForm

**Error Handling**:
- Validation error → Show errors, keep form open
- Job update error → Alert user
- File upload error → Log error, continue with other files

**New Logic** (After line 312):
```typescript
// After successful job update
const pendingFiles = editForm?.files?.filter(f => f.uploadStatus === 'pending') || []

if (pendingFiles.length > 0) {
  for (const pendingFile of pendingFiles) {
    try {
      const file = pendingFile.rawFile
      if (!file) {
        console.error('No raw file for pending upload')
        continue
      }

      await realFileUpload(file, editForm._id, pendingFile.type)
    } catch (error) {
      console.error(`Failed to upload ${pendingFile.name}:`, error)
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

---

### realFileUpload(file: File, jobId: string, fileType: string, onProgress?: (progress: number) => void)

**Purpose**: Upload a file to the backend (existing, confirmed working)

**Input**:
- `file`: File - Browser File object
- `jobId`: string - Database ID of the job
- `fileType`: string - Category ('resume', 'other', etc.)
- `onProgress`: (progress: number) => void - Progress callback

**Behavior**:
1. Create FormData with file
2. Add 'type' field with fileType
3. POST to `/api/jobs/${jobId}/files` with multipart/form-data
4. Track upload progress via XHR
5. Call onProgress callback with percentage

**Output**:
- Promise<JobFile> - Uploaded file record from backend

**Error Handling**:
- Network error → Reject with error
- Server error → Reject with status message
- Invalid response → Reject with parse error

**No changes required** - This function already works correctly

---

## Backend API Contract (No Changes)

### POST /api/jobs/:id/files

**Request**:
```http
POST /api/jobs/:id/files
Content-Type: multipart/form-data

file: <binary data>
type: 'resume' | 'cover-letter' | 'portfolio' | 'job-description' | 'transcript' | 'other'
```

**Response** (200 OK):
```json
{
  "id": "123",
  "jobId": 456,
  "filename": "uuid-filename.pdf",
  "originalName": "resume.pdf",
  "fileSize": 12345,
  "mimeType": "application/pdf",
  "filePath": "/uploads/456/uuid-filename.pdf",
  "fileType": "resume",
  "uploadedAt": "2025-10-06T12:00:00.000Z",
  "url": "http://backend.com/files/..."
}
```

**Response** (400 Bad Request):
```json
{
  "error": "No file uploaded"
}
```

**No changes to backend** - API already handles file uploads correctly

---

## Component State Contracts

### newJobForm: Job | null

**Contains**:
- All job fields
- `files: JobFile[]` - Array may contain pending files with rawFile

**Lifecycle**:
1. Created: User clicks "New Application"
2. Updated: User edits fields or adds files
3. Saved: handleSaveNewApplication() → Create job → Upload files
4. Cleared: After successful save or cancel

### editForm: Job | null

**Contains**:
- Copy of selected job data
- `files: JobFile[]` - Array may contain mix of completed and pending files

**Lifecycle**:
1. Created: User clicks "Edit" on existing job
2. Updated: User edits fields or adds new files
3. Saved: handleSaveEdit() → Update job → Upload pending files
4. Cleared: After successful save or cancel

## Testing Contract

### Test Cases Required

1. **New Application with Files**
   - Upload single file → Verify saved with job
   - Upload multiple files → Verify all saved
   - Upload then validate error → Verify files preserved
   - Upload large file → Verify size limit enforced

2. **Edit Application with New Files**
   - Add files to existing job → Verify uploaded
   - Add files with existing files → Verify both present
   - Edit form validation error → Verify new files preserved

3. **Main Page Upload (Regression)**
   - Upload to selected job → Verify still works
   - Upload multiple files → Verify all uploaded

4. **Error Scenarios**
   - Invalid file type → Verify rejected
   - File too large → Verify rejected
   - Network error during upload → Verify error shown
   - Job creation fails → Verify files not leaked

5. **Cleanup**
   - Cancel new form with files → Verify memory cleaned
   - Cancel edit form with files → Verify memory cleaned
   - Navigate away during upload → Verify no memory leak
