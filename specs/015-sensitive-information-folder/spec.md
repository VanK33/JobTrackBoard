# Feature Specification: Remove Sensitive Database Information from Repository

**Feature Branch**: `015-sensitive-information-folder`
**Created**: 2025-10-14
**Status**: Draft
**Input**: User description: "我收到一个邮件提示我哦说我的数据库里有潜在的sensitive information, 我看了一下是我之前保存的数据库的信息. 我希望你把这个删除了, 如果没有用了的话,确认整个folder都没有相关的关于直接用database的信息的"

## Execution Flow (main)
```
1. Parse user description from Input
   → User received security alert about sensitive database credentials in repository
   → User wants to remove hardcoded database credentials if no longer needed
2. Extract key concepts from description
   → Actors: Developer, Security scanner
   → Actions: Audit sensitive files, remove credentials, verify cleanup
   → Data: Database connection strings, API keys, passwords
   → Constraints: Don't break existing functionality
3. Audit findings:
   → Found: platform/core/database-config.json (contains full connection string with password)
   → Found: platform/core/.env (contains Supabase credentials and connection string)
   → Status: .env is in .gitignore (✅ protected)
   → Status: database-config.json NOT in .gitignore (❌ exposed)
4. Fill User Scenarios & Testing section
   → Primary: Remove sensitive files, verify app still works
5. Generate Functional Requirements
   → Remove hardcoded credentials
   → Add to .gitignore if needed
   → Verify no other sensitive data exists
6. Identify Key Entities
   → database-config.json (legacy file)
   → .env (already protected)
7. Run Review Checklist
   → Implementation is straightforward file deletion
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
As a **developer**, I received a security alert that my repository contains sensitive database credentials. I need to remove all hardcoded database information to prevent unauthorized access to my production database.

### Acceptance Scenarios
1. **Given** repository contains `database-config.json` with hardcoded connection string, **When** I audit the repository, **Then** the file is identified as containing sensitive data
2. **Given** sensitive files identified, **When** I remove `database-config.json`, **Then** the file is deleted and added to `.gitignore`
3. **Given** `.env` file exists with credentials, **When** I check `.gitignore`, **Then** `.env` is already protected and not committed
4. **Given** sensitive files removed, **When** I search the entire repository, **Then** no hardcoded database credentials remain
5. **Given** sensitive files removed, **When** I run the application, **Then** the app still works using localStorage-based configuration (Feature 014)

### Edge Cases
- What happens when `database-config.json` is deleted but app expects it?
  - App should fallback to localStorage configuration (already implemented in Feature 014)
- How does system handle when `.env` is missing?
  - Backend should fail gracefully and prompt for configuration
- What if credentials appear in git history?
  - User should be warned to rotate credentials and optionally rewrite git history

## Requirements

### Functional Requirements
- **FR-001**: System MUST identify all files containing hardcoded database credentials
- **FR-002**: System MUST remove `platform/core/database-config.json` from repository
- **FR-003**: System MUST add `database-config.json` to `.gitignore` to prevent future commits
- **FR-004**: System MUST verify `.env` is already in `.gitignore`
- **FR-005**: System MUST search entire repository (excluding node_modules, .git, dist) for any remaining hardcoded credentials
- **FR-006**: System MUST verify application still functions after removing hardcoded credentials
- **FR-007**: System MUST NOT remove `.env` file (needed for local development)
- **FR-008**: System MUST document that users should use localStorage-based configuration (Feature 014) instead of hardcoded files
- **FR-009**: System SHOULD warn user if sensitive data exists in git history and suggest credential rotation

### Key Entities
- **database-config.json**: Legacy configuration file containing hardcoded connection string with username/password (MUST be removed)
- **.env**: Environment variables file containing Supabase credentials (already gitignored, keep for local dev)
- **.gitignore**: File protection manifest (MUST include database-config.json)
- **localStorage**: Client-side storage for database configuration (Feature 014 implementation)

---

## Audit Results

### Files Containing Sensitive Data
1. **platform/core/database-config.json**
   - Status: ❌ NOT in .gitignore (EXPOSED)
   - Contains: Full PostgreSQL connection string with password
   - Action: DELETE and add to .gitignore

2. **platform/core/.env**
   - Status: ✅ Already in .gitignore (PROTECTED)
   - Contains: Supabase URL, service role key, connection string
   - Action: KEEP (needed for backend, already protected)

### Search Results
Found 3 occurrences of sensitive credentials:
- `platform/core/.env` (line 2-7)
- `platform/core/database-config.json` (line 9)

All occurrences are in expected configuration files. No hardcoded credentials found in source code.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (none)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Dependencies & Assumptions

### Dependencies
- **Feature 014** (Database Connection Security): App now uses localStorage for database configuration, making `database-config.json` obsolete

### Assumptions
- User has already implemented Feature 014 (named connections with localStorage)
- User wants to continue using `.env` for local development
- User is aware that credentials in git history may need rotation

---

## Security Notes

### Immediate Actions Required
1. Delete `platform/core/database-config.json`
2. Add `database-config.json` to `.gitignore`
3. Verify no other sensitive files exist

### Recommended Follow-up Actions
1. **Rotate database credentials** if `database-config.json` was ever committed to git
2. **Review git history** for leaked credentials: `git log -p -- database-config.json`
3. **Use git-secrets** or similar tools to prevent future credential leaks
4. **Enable GitHub Secret Scanning** if using GitHub

### Safe Configuration Practices
- ✅ Use `.env` for local development (already gitignored)
- ✅ Use localStorage for client-side database config (Feature 014)
- ✅ Never commit files with credentials
- ✅ Use environment variables in production deployments
