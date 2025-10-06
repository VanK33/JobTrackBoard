# Research: File Upload Bug in New/Edit Application Forms

## Problem Analysis

### Root Cause
The file upload functionality fails in new/edit application forms due to incorrect handling of temporary file objects. The issue has two distinct problems:

1. **New Application Form**: Files are stored with `uploadStatus: 'pending'` and blob URLs (`URL.createObjectURL()`). After job creation, the code attempts to re-upload these files by fetching from blob URLs using `apiFetch()`, which fails because:
   - Blob URLs are browser-local references that cannot be fetched via network requests
   - The original File object is lost after creating the blob URL
   - Location: `JobDashboard.tsx:440` - `const response = await apiFetch(pendingFile.url)`

2. **Edit Application Form**: Files uploaded during editing are stored as temporary with `uploadStatus: 'pending'`, but `handleSaveEdit()` has NO logic to process pending files at all. They are simply ignored when saving.

### Working Implementation (Main Page "Add File")
The main page file upload works because:
- It has a valid `jobId` (line 687-688)
- Files are immediately uploaded via `realFileUpload()` (line 761)
- No temporary storage is needed

### Technical Context
- **Language/Version**: TypeScript 5.0+, React 18
- **File Upload**: Multipart form-data via FormData
- **Backend API**: `/api/jobs/:id/files` (POST) - confirmed working
- **Frontend Component**: `JobDashboard.tsx` (large file, ~3300 lines)
- **Key Functions**:
  - `handleFilesUpload()` - Handles file selection and temporary storage
  - `handleSaveNewApplication()` - Creates job and attempts to upload pending files (broken)
  - `handleSaveEdit()` - Updates job but ignores pending files (incomplete)
  - `realFileUpload()` - Actual file upload using FormData (working)

### Current File Storage Architecture
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

**Issue**: `uploadStatus` type doesn't include 'pending' but code uses it (line 700, 406)

## Solution Design

### Decision: Store Raw File Objects for Pending Uploads
**Rationale**:
- Browser File objects can be held in memory during form lifecycle
- No need for blob URLs that can't be re-fetched
- Matches how files are handled in the working upload path
- Simpler implementation than trying to reconstruct File from blob

### Alternatives Considered
1. **Convert blob URL back to File**: Complex, unreliable, requires Response/Blob conversion
2. **Upload immediately on selection**: Would require partial job creation or temporary server storage
3. **Store files in IndexedDB**: Over-engineered for this use case
4. **Base64 encode files**: Memory inefficient, size limits

### Implementation Strategy
1. **Extend JobFile interface** to support pending files:
   ```typescript
   interface JobFile {
     // ... existing fields
     uploadStatus?: 'uploading' | 'completed' | 'failed' | 'pending'
     rawFile?: File  // Store original File object for pending uploads
   }
   ```

2. **Update handleFilesUpload()** (line 674):
   - For new/edit forms without jobId, store the raw File object
   - Keep blob URL for preview purposes
   - Set uploadStatus to 'pending'

3. **Fix handleSaveNewApplication()** (line 383):
   - Access stored File objects directly from `pendingFile.rawFile`
   - Remove blob URL fetching logic (line 440-442)
   - Use the raw File directly in `realFileUpload()`

4. **Fix handleSaveEdit()** (line 275):
   - Add pending file upload logic similar to new application
   - Process files with `uploadStatus === 'pending'` after successful job update
   - Use stored File objects for upload

## Technology Best Practices

### File Handling in React
- ✅ Store File objects in component state for short-term use
- ✅ Use blob URLs only for preview (revoke with `URL.revokeObjectURL()` when done)
- ✅ Upload files via FormData with multipart/form-data
- ❌ Never try to fetch blob URLs over network
- ❌ Don't JSON.stringify File objects (they're not serializable)

### Form State Management
- Pending uploads should be isolated from persisted job data
- Clear temporary state after successful upload
- Handle cleanup on component unmount or navigation

### Error Handling
- Validate files before storing (size, type)
- Preserve file state if job save fails
- Show clear error messages for upload failures
- Clean up blob URLs to prevent memory leaks

## Dependencies & Integration Points

### Backend API (Confirmed Working)
- **Endpoint**: `POST /api/jobs/:id/files`
- **Request**: multipart/form-data with 'file' field
- **Body params**: `type` (file type category)
- **Response**: Saved file record with database ID and storage path

### Frontend Components
- **JobDashboard.tsx**: Main component requiring fixes
- **Shared types**: Need to ensure JobFile interface is consistent
- **API client**: `apiFetch()` for network requests, not for blob URLs

### Storage Layer
- Backend handles storage via StorageManager
- Supports both Supabase Storage and local filesystem fallback
- No frontend changes needed for storage

## Performance & Constraints

### Performance Goals
- File upload should not block form submission
- Preview generation should be fast (<100ms for images)
- Memory usage: Acceptable to hold File objects during form lifecycle

### Constraints
- Browser file size limits: 25MB (backend validation)
- Accepted MIME types: .pdf, .doc, .docx, .png, .jpg, .jpeg, .webp, .txt, .md
- Must maintain existing upload progress tracking
- Must support multiple file uploads per job

### Scale/Scope
- Typical use: 1-5 files per job application
- File sizes: Usually <5MB each
- Concurrent uploads: One at a time per file (sequential)

## Risk Assessment

### Technical Risks
- **Memory**: Holding large File objects in state (Mitigation: 25MB limit enforced)
- **State sync**: File state getting out of sync with job data (Mitigation: Clear state after operations)
- **Browser compatibility**: File object handling (Mitigation: Modern browsers all support)

### Testing Considerations
- Test new application with files
- Test edit application with new files
- Test edit application replacing existing files
- Test upload failure scenarios
- Test browser refresh during file selection (expected: lose files)
- Verify no regression in main page "add file" functionality

## Open Questions
None - all technical unknowns resolved through codebase analysis.
