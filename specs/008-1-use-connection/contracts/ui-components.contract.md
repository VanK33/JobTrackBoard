# UI Components Contract

**Feature**: 008-1-use-connection
**Date**: 2025-10-07

## Component Interfaces

### TutorialModal Component

**File**: `/platform/core/src/frontend/components/TutorialModal.tsx`

#### Props Interface

```typescript
interface TutorialModalProps {
  /**
   * Controls whether the modal is visible
   * @default false
   */
  isOpen: boolean

  /**
   * Callback invoked when user requests to close the modal
   * Triggered by:
   * - Clicking the close (X) button
   * - Pressing Escape key
   * - Clicking the modal backdrop/overlay
   */
  onClose: () => void
}
```

#### Component Contract

**Behavior Requirements**:
1. MUST render nothing when `isOpen === false`
2. MUST render modal overlay + content when `isOpen === true`
3. MUST call `onClose()` when:
   - Close button clicked
   - Escape key pressed
   - Backdrop/overlay clicked
4. MUST display title "Tutorial"
5. MUST include close button (X icon or similar)
6. MUST include empty scrollable content area
7. MUST prevent body scroll when open (modal overlay)
8. MUST be keyboard accessible (Escape to close)

**Visual Requirements** (from FR-006):
- Title displaying "Tutorial"
- Close/dismiss button (top-right corner typical pattern)
- Empty scrollable content area (prepared for future content)
- Semi-transparent backdrop overlay
- Centered modal content box

**Accessibility Requirements**:
- `role="dialog"`
- `aria-labelledby` pointing to title element
- `aria-modal="true"`
- Close button must have `aria-label="Close tutorial"`

**Example Usage**:

```tsx
function DatabaseSettings() {
  const [showTutorialModal, setShowTutorialModal] = useState(false)

  return (
    <>
      <button onClick={() => setShowTutorialModal(true)}>
        Tutorial
      </button>

      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
      />
    </>
  )
}
```

### DatabaseSettings Component (Modified)

**File**: `/platform/core/src/frontend/pages/DatabaseSettings.tsx`

#### Modified State Interface

```typescript
interface DatabaseSettingsState {
  // Existing state (unchanged)
  config: DatabaseConfig
  status: DatabaseStatus
  isTestingConnection: boolean
  showAdvanced: boolean  // Legacy advanced section toggle
  savedConnectionString: string
  connectionStringHistory: string[]
  migrationStatus: MigrationStatus

  // MODIFIED: Default value changed from false → true
  useConnectionString: boolean  // NEW DEFAULT: true

  // NEW STATE: Tutorial modal visibility
  showTutorialModal: boolean    // DEFAULT: false

  // NEW STATE: Advanced fields disclosure
  showAdvancedFields: boolean   // DEFAULT: false
}
```

#### Event Handlers

##### New Handler: Tutorial Modal

```typescript
/**
 * Opens the tutorial modal
 */
const handleOpenTutorial = (): void => {
  setShowTutorialModal(true)
}

/**
 * Closes the tutorial modal
 */
const handleCloseTutorial = (): void => {
  setShowTutorialModal(false)
}
```

##### New Handler: Advanced Fields Toggle

```typescript
/**
 * Toggles visibility of individual database field inputs
 */
const handleToggleAdvancedFields = (): void => {
  setShowAdvancedFields(prev => !prev)
}
```

#### Computed Properties

```typescript
/**
 * Determines page title based on presence of stored database config
 * @returns "Database Initialization" if no config exists, "Database Settings" otherwise
 */
const pageTitle = (): string => {
  const dbConfig = getStoredDatabaseConfig()
  return dbConfig ? "Database Settings" : "Database Initialization"
}
```

**Source Requirements**:
- FR-002: "Database Initialization" when no config exists
- FR-003: "Database Settings" when config exists
- FR-003a: Determined by checking browser storage

#### Render Contract

**Required Changes to JSX**:

1. **Page Title** (FR-002, FR-003):
   ```tsx
   <h1>{pageTitle()}</h1>
   ```

2. **Tutorial Button in Supabase Section** (FR-004):
   ```tsx
   <div className="supabase-provider-row">
     <a href={supabaseProvider.docsUrl}>Documentation</a>
     <button onClick={handleOpenTutorial}>Tutorial</button>
   </div>
   ```

3. **Connection String Input** (FR-001, FR-008):
   ```tsx
   {/* No toggle required - connection string visible by default */}
   <input
     type="text"
     value={config.connectionString}
     onChange={(e) => handleConfigChange('connectionString', e.target.value)}
     placeholder="postgresql://user:password@host:port/database"
   />
   ```

4. **Advanced Fields Toggle** (FR-009):
   ```tsx
   <button onClick={handleToggleAdvancedFields}>
     {showAdvancedFields ? 'Hide' : 'Show'} Advanced Options
   </button>
   ```

5. **Individual Fields Section** (FR-010):
   ```tsx
   {showAdvancedFields && (
     <div className="advanced-fields">
       <input {...} /> {/* host */}
       <input {...} /> {/* port */}
       <input {...} /> {/* database */}
       <input {...} /> {/* username */}
       <input {...} /> {/* password */}
     </div>
   )}
   ```

6. **Help Text** (FR-007):
   ```tsx
   <p className="help-text">
     This project is designed for Supabase by default. Should work with other PostgreSQL
   </p>
   ```

7. **Tutorial Modal** (FR-005, FR-006, FR-006a):
   ```tsx
   <TutorialModal
     isOpen={showTutorialModal}
     onClose={handleCloseTutorial}
   />
   ```

## Component Communication Flow

```
User clicks "Tutorial" button
  ↓
DatabaseSettings.handleOpenTutorial() called
  ↓
setShowTutorialModal(true)
  ↓
TutorialModal receives isOpen={true}
  ↓
TutorialModal renders overlay + content
  ↓
User clicks close button OR presses Escape
  ↓
TutorialModal calls onClose()
  ↓
DatabaseSettings.handleCloseTutorial() called
  ↓
setShowTutorialModal(false)
  ↓
TutorialModal receives isOpen={false}
  ↓
TutorialModal renders nothing (null)
```

## Styling Contract

**Maintain Existing Inline Styling Pattern**:
- All styles defined via `style` prop (inline CSS-in-JS)
- No external CSS files or CSS modules
- Consistent with existing DatabaseSettings component pattern

**TutorialModal Styling Requirements**:

```typescript
// Overlay (backdrop)
style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}

// Modal content box
style={{
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '24px',
  maxWidth: '600px',
  width: '90%',
  maxHeight: '80vh',
  overflowY: 'auto',
  position: 'relative',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
}}

// Close button
style={{
  position: 'absolute',
  top: '12px',
  right: '12px',
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: '#666'
}}

// Title
style={{
  margin: '0 0 16px 0',
  fontSize: '24px',
  fontWeight: '600'
}}

// Content area (scrollable)
style={{
  minHeight: '200px',
  marginTop: '16px'
}}
```

## Backward Compatibility

**No Breaking Changes**:
- All existing props interfaces unchanged
- All existing methods/handlers preserved
- New state variables additive only
- `DatabaseSettingsProps` interface unchanged:
  ```typescript
  interface DatabaseSettingsProps {
    onNavigateBack?: () => void  // Still optional
  }
  ```

## Testing Considerations

**Manual Test Points** (from quickstart.md):
1. Page title changes based on localStorage state
2. Tutorial button click opens modal
3. Modal close button dismisses modal
4. Escape key dismisses modal
5. Backdrop click dismisses modal
6. Tutorial can be re-opened after closing
7. Connection string input visible by default
8. Advanced toggle shows/hides individual fields
9. Help text displays correct message

**No Automated Tests Required**:
- Per project pattern (no UI test infrastructure)
- Manual testing via quickstart.md sufficient

## References

- Functional Requirements: `/specs/008-1-use-connection/spec.md` (FR-001 through FR-010)
- Data Model: `/specs/008-1-use-connection/data-model.md`
- Research Findings: `/specs/008-1-use-connection/research.md`
