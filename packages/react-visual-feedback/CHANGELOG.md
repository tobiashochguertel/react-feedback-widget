# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Architecture Improvements (I001-I035)

- **XState v5 State Machine** (I001) - Centralized state management with `feedbackMachine.ts`
- **Service Layer** (I002-I011) - Abstracted services for storage, recording, screenshots, and theming
  - `StorageService` - Browser localStorage/sessionStorage abstraction
  - `VideoStorageService` - IndexedDB-based video storage
  - `RecorderService` - MediaRecorder abstraction
  - `ScreenshotService` - html2canvas abstraction
  - `ThemeService` - Theme management service
- **Integration Factory** (I020-I024) - Factory pattern for managing integrations
  - `IntegrationFactory` - Dynamic integration registration
  - `Integration` interface - Standardized integration API
  - Strategy pattern for interchangeable integration behaviors
- **Type System** (I012-I019) - Comprehensive TypeScript types
  - Centralized type definitions in `src/types/`
  - Strict null checks enabled
  - Full type coverage for all public APIs

#### Hooks API (T001-T008)

- **useActivation** - Control feedback mode activation/deactivation
- **useDashboard** - Control dashboard visibility
- **useRecording** - Screen recording controls with state management
- **useScreenCapture** - Screenshot capture with element selection
- **useElementSelection** - DOM element selection with hover effects
- **useKeyboardShortcuts** - Customizable keyboard shortcuts
- **useFeedbackSubmission** - Submission queue with retry and persistence
- **useIntegrations** - Integration management (Jira, Sheets, custom)
- **useTheme** - Theme access (light/dark mode)
- **useColors** - Theme color palette access
- **useFeedbackTheme** - Full theme object access

#### Documentation (D001-D005)

- **Architecture Documentation** - System design, data flow, component hierarchy
- **Hooks API Documentation** - Complete hooks reference with examples
- **Service Layer Documentation** - Service interfaces and implementations
- **Integration Guide** - Jira, Sheets, server-side handlers, custom integrations

### Changed

- Upgraded to XState v5 from inline React state management
- Refactored monolithic components into hooks + services architecture
- Improved TypeScript strict mode compliance
- Enhanced error handling with typed error codes

### Fixed

- Memory leaks in recording cleanup
- Race conditions in submission queue
- Theme persistence across sessions
- Screenshot capture on high-DPI displays

## [1.0.0] - 2024-XX-XX

### Added

- Initial release with core feedback collection features
- Visual element selection
- Screenshot capture with html2canvas
- Screen recording with MediaRecorder API
- Dashboard for managing feedback
- Session replay with synced logs
- Jira and Google Sheets integrations
- Dark/Light theme support
- TypeScript support

---

*Maintained by: Murali Vvrsn Gurajapu*
*Documentation updated: 2026-01-16*
