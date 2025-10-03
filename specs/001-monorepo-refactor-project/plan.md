# Implementation Plan: Monorepo Structure Refactoring

**Branch**: `001-monorepo-refactor-project` | **Date**: 2025-10-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-monorepo-refactor-project/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ COMPLETE: Loaded and analyzed specification
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ COMPLETE: Web application (frontend+backend), TypeScript monorepo
3. Fill the Constitution Check section
   → ✅ COMPLETE: Constitution is template-based, no specific violations
4. Evaluate Constitution Check section
   → ✅ PASS: Refactoring aligns with simplicity principles
5. Execute Phase 0 → research.md
   → ✅ COMPLETE: 6 research areas documented
6. Execute Phase 1 → directory-structure, migration-stages, quickstart
   → ✅ COMPLETE: All design artifacts generated
7. Re-evaluate Constitution Check
   → ✅ PASS: No new violations introduced
8. Plan Phase 2 → Describe task generation approach
   → ✅ COMPLETE: Task generation strategy documented
9. STOP - Ready for /tasks command
   → ✅ READY: All planning complete, proceed to /tasks
```

## Summary

**Primary Requirement**: Refactor the job tracker monorepo to improve organization, discoverability, and maintainability through incremental structural improvements.

**Technical Approach**:
- Incremental refactoring with git commits at each stable stage
- Reorganize directories following clear separation of concerns
- Centralize build artifacts and runtime directories
- Create unified entry point for backend + frontend
- Update import paths and deployment configuration
- Add README.md files for documentation

**Current State**: Vibecoding project with mixed concerns, unclear boundaries, and inconsistent organization across platform/core, modules, shared, and tools workspaces.

## Technical Context

**Language/Version**: TypeScript 5.0+ / Node.js 18+
**Primary Dependencies**:
- Backend: Express 4, PostgreSQL (pg), SQL.js, Supabase, Winston, Zod
- Frontend: React 18, Vite 5, React DOM 18
- Build: TypeScript, npm workspaces, tsx, concurrently

**Storage**:
- Primary: PostgreSQL (via Supabase or direct connection)
- Fallback: SQL.js (in-memory SQLite)
- File storage: Local filesystem (temp-uploads/, storage/, local/)

**Testing**: Jest 29 (current), need integration test strategy
**Target Platform**: Web (Node.js backend on port 3000, Vite frontend on port 5174), deployed on Render.com
**Project Type**: **web** (monorepo with frontend + backend + modules)

**Performance Goals**:
- Development: Fast HMR (<1s), quick builds (<30s)
- Production: Standard web app response times (<500ms API)

**Constraints**:
- Incremental migration (no big bang)
- Must work after each commit
- Breaking changes allowed (import paths)
- Git history cleanup deferred to end

**Scale/Scope**:
- ~4 workspace packages (platform/core, modules/job-tracker-basic, shared/types, shared/utils, tools)
- Mixed backend/frontend code
- Module system architecture to preserve

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS

The constitution is template-based with no project-specific constraints. This refactoring aligns with general engineering principles:

- **Simplicity**: Reducing complexity by organizing code clearly
- **Clarity**: Improving discoverability through structure
- **Maintainability**: Co-locating related code, separating concerns
- **Testability**: Each stage verified before proceeding

**No violations detected.** This is infrastructure work that enables better adherence to future principles.

## Project Structure

### Documentation (this feature)
```
specs/001-monorepo-refactor-project/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── directory-structure.md  # Phase 1: Proposed new structure
├── migration-stages.md  # Phase 1: Stage-by-stage plan
├── quickstart.md        # Phase 1: Verification steps
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

**Current Structure** (problematic):
```
job_seek_app/
├── platform/
│   ├── core/
│   │   ├── src/
│   │   │   ├── backend/        # Backend with multiple entry points
│   │   │   ├── frontend/       # Frontend code
│   │   │   └── shared/         # Platform-specific shared code
│   │   ├── dist/               # Build artifacts
│   │   ├── temp-uploads/       # Runtime directory
│   │   ├── storage/            # Runtime directory
│   │   ├── local/              # Runtime directory
│   │   └── package.json
│   └── ui-shell/               # Empty/unused?
├── modules/
│   ├── job-tracker-basic/src/
│   └── module-cli/
├── shared/
│   ├── types/src/
│   └── utils/
├── tools/
│   └── module-cli/
├── node_modules/               # Root dependencies
├── package.json                # Monorepo root
├── tsconfig.json               # Shared TS config
└── render.yaml                 # Deployment config
```

**Target Structure** (proposed in Phase 1):
```
job_seek_app/
├── platform/core/
│   ├── src/
│   │   ├── backend/
│   │   │   ├── api/           # Routes organized by domain
│   │   │   ├── services/      # Business logic
│   │   │   ├── middleware/    # Express middleware
│   │   │   ├── database/      # DB schemas, migrations
│   │   │   └── utils/         # Backend utilities
│   │   ├── frontend/
│   │   │   ├── components/    # React components
│   │   │   ├── pages/         # Page components
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── services/      # API clients
│   │   │   └── utils/         # Frontend utilities
│   │   ├── shared/            # Code used by both FE & BE
│   │   └── index.ts           # UNIFIED ENTRY POINT
│   ├── tests/                 # Test files co-located or here
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── modules/
│   ├── job-tracker-basic/
│   │   ├── src/
│   │   │   ├── backend/       # Module backend
│   │   │   └── frontend/      # Module frontend (if any)
│   │   ├── tests/
│   │   ├── package.json
│   │   └── README.md
│   └── [future modules]/
├── shared/
│   ├── types/
│   │   ├── src/
│   │   │   ├── auth.ts
│   │   │   ├── jobs.ts
│   │   │   ├── platform.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   └── utils/
│       ├── src/
│       ├── package.json
│       └── README.md
├── tools/
│   └── module-cli/
│       ├── src/
│       ├── package.json
│       └── README.md
├── dist/                      # Centralized build output
├── .runtime/                  # Centralized runtime directories
│   ├── temp-uploads/
│   ├── storage/
│   └── local/
├── node_modules/
├── package.json
├── tsconfig.json
├── render.yaml                # Updated for new entry point
└── README.md                  # Updated project overview
```

**Structure Decision**: This is a **web application monorepo** with:
- Platform core providing infrastructure (backend API + frontend shell)
- Pluggable modules extending functionality
- Shared types and utilities consumed by multiple packages
- Tools for development workflows

The refactor maintains the workspace structure but reorganizes internal directories for clarity, centralizes artifacts, and creates a unified entry point.

## Phase 0: Outline & Research

**Research Tasks**:

1. **Monorepo Best Practices**
   - Decision needed: How to organize TypeScript paths after restructuring
   - Research: npm workspaces + TypeScript path mapping patterns
   - Output: Updated tsconfig.json paths strategy

2. **Unified Entry Point Strategy**
   - Decision needed: How to start backend + frontend from single command
   - Research: Concurrently vs custom Node.js launcher script
   - Output: Entry point implementation approach

3. **Runtime Directory Management**
   - Decision needed: Path resolution strategy for moved directories
   - Research: Environment variables vs config files vs path constants
   - Output: Configuration approach for runtime paths

4. **Git File Movement**
   - Decision needed: `git mv` vs regular move for history preservation
   - Research: Git history preservation techniques
   - Output: File movement commands for each stage

5. **Incremental Migration Stages**
   - Decision needed: Order of refactoring operations
   - Research: Risk-minimizing migration sequences
   - Output: Stage boundaries and verification points

6. **Render.yaml Build/Start Commands**
   - Decision needed: How to update deployment config for new entry point
   - Research: Render.com build command requirements
   - Output: Updated render.yaml configuration

**Output**: research.md with all decisions documented

## Phase 1: Design & Contracts

*Prerequisites: research.md complete*

**This phase will generate:**

1. **directory-structure.md**: Detailed proposed directory tree with:
   - File-by-file mapping (current → new locations)
   - Updated import paths for each moved file
   - README.md content for each major directory

2. **migration-stages.md**: Step-by-step migration plan:
   - Stage 1: Move runtime directories to root
   - Stage 2: Reorganize backend structure
   - Stage 3: Reorganize frontend structure
   - Stage 4: Create unified entry point
   - Stage 5: Centralize build artifacts
   - Stage 6: Add README files
   - Stage 7: Update deployment config
   - Stage 8: (Optional) Git history cleanup

3. **quickstart.md**: Verification checklist:
   - How to verify each stage works
   - Commands to run after each stage
   - Expected outputs
   - Rollback procedures if needed

4. **Agent context update**:
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
   - Add refactoring context to CLAUDE.md

**Note**: This refactoring doesn't have traditional "contracts" (API endpoints) but instead has:
- **Structural contracts**: Directory organization patterns
- **Import contracts**: Module resolution rules
- **Build contracts**: Scripts and entry points
- **Deployment contracts**: render.yaml configuration

## Phase 2: Task Planning Approach

*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate ordered tasks from migration-stages.md
- Each stage becomes multiple atomic tasks
- Each task includes verification step

**Example Task Sequence** (from Stage 1):
```
1. Create .runtime/ directory at repository root
2. Move platform/core/temp-uploads to .runtime/temp-uploads
3. Update backend code to reference new temp-uploads path
4. Test file upload functionality
5. Commit Stage 1: Runtime directories moved
6. Push to git as backup checkpoint
```

**Ordering Strategy**:
- Sequential by stage (each stage tested before next)
- Within stage: Move → Update references → Test → Commit
- No parallel execution (refactoring is inherently sequential)

**Estimated Output**: 40-50 numbered, ordered tasks in tasks.md (approximately 5-7 tasks per migration stage)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md incrementally with testing)
**Phase 5**: Validation (all builds work, deployments succeed, git history clean)

## Complexity Tracking

*No constitutional violations - this is infrastructure simplification work*

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| Incremental approach | Higher short-term effort | Required for safety; allows rollback at any stage |
| Breaking import changes | Immediate impact | Acceptable per user clarification; improves long-term clarity |

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [ ] Phase 3: Tasks generated (/tasks command) - NEXT STEP
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All research decisions made ✅
- [x] Complexity deviations documented (none) ✅

**Artifacts Generated**:
- [x] research.md - 6 research decisions documented
- [x] directory-structure.md - File-by-file mapping created
- [x] migration-stages.md - 8-stage migration plan created
- [x] quickstart.md - Verification procedures documented
- [x] CLAUDE.md - Agent context updated

---
*Based on project template constitution - See `.specify/memory/constitution.md`*
