# Data Model: File Upload Fix

## Entity: JobFile (Frontend)

### Purpose
Represents a file attachment associated with a job application, including both persisted files (uploaded to backend) and pending files (selected but not yet uploaded).

### Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Unique identifier (DB ID for uploaded, temp ID for pending) | Non-empty string |
| name | string | Yes | Display name of the file | Non-empty string |
| type | FileType | Yes | Category of file | One of: 'resume', 'cover-letter', 'portfolio', 'job-description', 'transcript', 'other' |
| mimeType | string | Yes | MIME type of the file | Valid MIME type string |
| size | number | Yes | File size in bytes | 0 < size <= 25MB (26,214,400 bytes) |
| url | string | Yes | URL to access the file (backend URL or blob URL) | Valid URL or blob URL |
| uploadedAt | string | Yes | ISO timestamp of upload/selection | ISO 8601 format |
| uploadProgress | number | No | Upload progress percentage | 0-100 |
| uploadStatus | UploadStatus | No | Current status of file upload | One of: 'uploading', 'completed', 'failed', 'pending' |
| error | string | No | Error message if upload failed | Any string |
| **rawFile** | File | No | **NEW**: Raw browser File object for pending uploads | Browser File object |

### State Transitions

```
[File Selected]
    → uploadStatus: 'pending', rawFile: File object stored

[Upload Started]
    → uploadStatus: 'uploading', uploadProgress: 0-100

[Upload Success]
    → uploadStatus: 'completed', rawFile: cleared, url: backend URL

[Upload Failed]
    → uploadStatus: 'failed', error: error message
```

### Relationships
- **Parent**: Job (1:N - one job has many files)
- **Storage**: File objects are temporary (exist only in component state)
- **Persistence**: Only uploaded files are persisted to backend database

### Business Rules
1. **Pending files** (uploadStatus='pending'):
   - Must have `rawFile` populated with browser File object
   - May use blob URL for preview purposes
   - Not persisted in database
   - Cleared on successful upload or form cancellation

2. **Uploaded files** (uploadStatus='completed'):
   - Must have backend URL in `url` field
   - Must have database ID in `id` field
   - `rawFile` must be null/undefined
   - Persisted in database

3. **Failed files** (uploadStatus='failed'):
   - Retain `rawFile` for retry capability
   - Must have `error` message
   - Can be retried or removed by user

## Entity: FileUploadState (Frontend)

### Purpose
Tracks global file upload state across the application.

### Fields
| Field | Type | Description |
|-------|------|-------------|
| isDragOver | boolean | Whether drag-and-drop is active |
| uploadingFiles | Set<string> | Set of filenames currently uploading |
| failedFiles | Set<string> | Set of filenames that failed to upload |

## Modified Interfaces

### Before (Current - Broken)
```typescript
interface JobFile {
  id: string
  name: string
  type: 'resume' | 'cover-letter' | 'portfolio' | 'job-description' | 'transcript' | 'other'
  mimeType: string
  size: number
  url: string
  uploadedAt: string
  uploadProgress?: number
  uploadStatus?: 'uploading' | 'completed' | 'failed'  // Missing 'pending'
  error?: string
}
```

### After (Fixed)
```typescript
interface JobFile {
  id: string
  name: string
  type: 'resume' | 'cover-letter' | 'portfolio' | 'job-description' | 'transcript' | 'other'
  mimeType: string
  size: number
  url: string
  uploadedAt: string
  uploadProgress?: number
  uploadStatus?: 'uploading' | 'completed' | 'failed' | 'pending'  // Added 'pending'
  error?: string
  rawFile?: File  // NEW: Store raw File for pending uploads
}
```

## Data Flow

### Scenario 1: New Application with Files
```
1. User selects files
   → handleFilesUpload() creates JobFile with:
      - uploadStatus: 'pending'
      - rawFile: browser File object
      - url: blob URL (for preview only)
   → Add to newJobForm.files[]

2. User saves application
   → handleSaveNewApplication() creates job
   → Filter files where uploadStatus === 'pending'
   → For each pending file:
      - Extract rawFile
      - Call realFileUpload(rawFile, jobId, fileType)
      - Update uploadStatus to 'uploading' → 'completed'/'failed'
   → Refresh job data from backend
```

### Scenario 2: Edit Application with New Files
```
1. User enters edit mode
   → editForm populated with existing job data
   → Existing files have uploadStatus: 'completed'

2. User adds new files
   → handleFilesUpload() creates JobFile with:
      - uploadStatus: 'pending'
      - rawFile: browser File object
   → Add to editForm.files[]

3. User saves changes
   → handleSaveEdit() updates job data
   → Filter files where uploadStatus === 'pending'
   → For each pending file:
      - Extract rawFile
      - Call realFileUpload(rawFile, jobId, fileType)
      - Update uploadStatus to 'uploading' → 'completed'/'failed'
   → Refresh job data from backend
```

### Scenario 3: Main Page "Add File" (Already Working)
```
1. User selects file with job selected
   → jobId is available
   → Directly call realFileUpload(file, jobId, fileType)
   → No temporary storage needed
   → File uploaded immediately
```

## Storage Considerations

### Browser Memory
- **Pending files**: Held in component state as File objects
- **Typical size**: 1-5 files × 1-5MB = 5-25MB total
- **Cleanup**: On form submission, cancellation, or component unmount
- **Blob URLs**: Created for preview, revoked after upload or cleanup

### Backend Storage
- Files uploaded via multipart/form-data
- Stored via StorageManager (Supabase or local)
- Database records created with file metadata
- No changes required to backend storage logic

## Validation Rules

### File Validation (Existing)
1. File size ≤ 25MB (26,214,400 bytes)
2. Accepted MIME types: .pdf, .doc, .docx, .png, .jpg, .jpeg, .webp, .txt, .md
3. Filename must be non-empty

### New Validation Rules
1. Pending files must have `rawFile` populated
2. Uploaded files must NOT have `rawFile` (cleaned up after upload)
3. If `uploadStatus === 'pending'`, `rawFile` must exist
4. Blob URLs should be revoked after upload or on cleanup
