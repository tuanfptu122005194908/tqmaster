# Graph Report - smart-curate-learn-main  (2026-10-05)

## Corpus Check
- 352 files · ~744,359 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 3, .css 2, .lock 1)

## Summary
- 1989 nodes · 3262 edges · 189 communities (127 shown, 62 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `140aa921`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AppContext.tsx
- form.tsx
- App.tsx
- ProfilePage.tsx
- excelBackup.ts
- AdminTheory.tsx
- compilerOptions
- utils.ts
- types.ts
- os
- pagination.tsx
- compilerOptions
- command.tsx
- components.json
- create-new-feature.sh
- common.ps1
- scripts
- dependencies
- cn
- AdminAnnouncements.tsx
- 2. User Scenarios
- KnowledgeCoreScene.tsx
- compilerOptions
- @vitejs/plugin-react-swc
- 2. User Scenarios
- git/scripts/powershell/create-new-feature.ps1
- AdminBackup.tsx
- sidebar.tsx
- 2. User Scenarios
- devDependencies
- .specify/scripts/powershell/create-new-feature.ps1
- restore-worker/index.ts
- carousel.tsx
- class-variance-authority
- exportQuestions.ts
- BackupExportPanel
- AdminDashboard.tsx
- input-otp.tsx
- package.json
- Header
- FptPanoViewer.tsx
- notify-admin-new-order/index.ts
- git-common.ps1
- breadcrumb.tsx
- select.tsx
- KnowledgeNetworkScene.tsx
- TopNav
- drawer.tsx
- GlobalErrorBoundary
- Plan: 11 - Admin Data Backup (Excel Import / Export)
- auto-commit.sh
- initialize-repo.sh
- Project AGENTS & Development Rules
- eslint.config.js
- Technical Implementation Plan: E-Commerce & Checkout
- LandingPage.tsx
- Bắt buộc Tuân thủ SDD & Quy trình Phát triển TQMaster
- Spec: Fix Flashcard Double Skip Bug
- ExamPage.tsx
- avatar.tsx
- Technical Implementation Plan: Core Authentication & Profile
- sheet.tsx
- Technical Implementation Plan: News & Announcements Management
- 17-admin-simulate-student-cart-topnav/spec.md
- BackupExportPanel.tsx
- Plan: Show TopNav UI for Admin in Student view
- @radix-ui/react-aspect-ratio
- HomePage.tsx
- @radix-ui/react-collapsible
- tailwindcss
- AdminExamStats.tsx
- 01-core-auth-and-security/tasks.md
- 2. User Scenarios
- 06-news-and-announcements/tasks.md
- 09-ecommerce-checkout/tasks.md
- 14-split-fe-pt-exams/plan.md
- concurrent_futures
- docx
- Tasks: [FEATURE NAME]
- navigation-menu.tsx
- google
- AdminExams.tsx
- io
- json
- json_repair
- client.ts
- AuthPage.tsx
- pathlib
- accordion.tsx
- 17-admin-simulate-student-cart-topnav/tasks.md
- re
- ref_fs
- subprocess
- sys
- Plan: Admin Simulate Student View
- 16-admin-simulate-student-view/spec.md
- threading
- time
- Plan: Fix Flashcard Double Skip Bug
- ref_url
- 18-fix-flashcard-double-skip/tasks.md
- Tasks: 11 - Admin Data Backup (Excel Import / Export)
- speckit.analyze.agent.md
- update-agent-context.sh
- vercel.json
- backupCore.ts
- README.md
- 🎨 TQMaster UI & Design System Guidelines (`design.md`)
- Feature Specification: [FEATURE NAME]
- speckit.plan.agent.md
- speckit.specify.agent.md
- speckit.tasks.agent.md
- Core Principles
- Core Principles
- chart.tsx
- Git Branching Workflow Extension
- Create Feature Branch
- Product
- 2. User Scenarios & Testing
- Create Feature Branch
- Implementation Plan: [FEATURE]
- speckit.checklist.agent.md
- Feature Specification: Subject Catalog & Theory Management
- 2. User Scenarios
- 2. User Scenarios
- speckit.clarify.agent.md
- speckit.implement.agent.md
- Coding Agent Context Extension
- Auto-Commit Changes
- Initialize Git Repository
- Detect Git Remote URL
- Validate Feature Branch
- Technical Implementation Plan: Admin Dashboard & Settings
- Technical Implementation Plan: Interactive Exam System
- Auto-Commit Changes
- Initialize Git Repository
- Detect Git Remote URL
- Validate Feature Branch
- speckit.constitution.agent.md
- speckit.taskstoissues.agent.md
- Project Constitution (SDD)
- Technical Implementation Plan: Subject & Theory Management
- Technical Implementation Plan: Exam & Question Management
- Technical Implementation Plan: Order & User Management
- Technical Implementation Plan: StudyHub & Course Catalog
- [CHECKLIST TYPE] Checklist: [FEATURE NAME]
- Project AGENTS & Development Rules
- Update Coding Agent Context
- Update Coding Agent Context
- Gemini Agent Instructions
- 02-admin-dashboard/tasks.md
- 03-admin-subject-theory/tasks.md
- 04-admin-exam-questions/tasks.md
- 05-admin-order-users/tasks.md
- 07-user-studyhub/tasks.md
- 08-user-exam-system/tasks.md
- react
- SnapshotRestorePanel.tsx
- SnapshotExportPanel.tsx
- BackgroundRestorePanel.tsx
- hooks/use-toast.ts
- FptCampusScene.tsx
- ref_child_process

## God Nodes (most connected - your core abstractions)
1. `cn()` - 228 edges
2. `react` - 130 edges
3. `lucide-react` - 82 edges
4. `useApp()` - 56 edges
5. `supabase` - 36 edges
6. `react-router-dom` - 24 edges
7. `formatPrice()` - 21 edges
8. `Tables` - 19 edges
9. `compilerOptions` - 19 edges
10. `useToast()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `User Story 2 – Quản lý liên kết Mạng xã hội & Hỗ trợ (Priority: P2)` --references--> `TopNav()`  [INFERRED]
  .sdd/specs/12-system-settings/spec.md → src/components/TopNav.tsx
- `User Story 2 – Quản trị Tài liệu & Giải nén ZIP PE (Priority: P1)` --references--> `ExamImageViewerModal()`  [INFERRED]
  .sdd/specs/03-admin-subject-theory/spec.md → src/components/common/ExamImageViewerModal.tsx
- `Bước 3: Áp dụng liên kết động vào Giao diện (UI)` --references--> `useApp()`  [INFERRED]
  .sdd/specs/12-system-settings/plan.md → src/lib/AppContext.tsx
- `Key Files` --references--> `formatPrice()`  [INFERRED]
  .sdd/specs/02-admin-dashboard/spec.md → src/lib/mockData.ts
- `User Story 1 – Quản lý bộ đề thi & Sắp xếp niên đại FPT (Priority: P1)` --references--> `sortExams()`  [INFERRED]
  .sdd/specs/04-admin-exam-questions/spec.md → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (189 total, 62 thin omitted)

### Community 0 - "AppContext.tsx"
Cohesion: 0.29
Nodes (7): AppContext, AppContextValue, AppProvider(), CartItem, getSessionId(), Profile, Subject

### Community 1 - "form.tsx"
Cohesion: 0.17
Nodes (14): @radix-ui/react-label, react-hook-form, FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+6 more)

### Community 2 - "App.tsx"
Cohesion: 0.06
Nodes (39): ref_assets_google_cloud_study_hub_html_raw, next-themes, react-dom, sonner, Key Files, Tasks: Admin Simulate Student View, AdminNews, AdminQuestionReports (+31 more)

### Community 3 - "ProfilePage.tsx"
Cohesion: 0.14
Nodes (23): AdminSubjects, ProfilePage, formatPrice(), generateOrderId(), SEMESTERS, SUBJECT_COLORS, subjectColor(), subjectInitials() (+15 more)

### Community 4 - "excelBackup.ts"
Cohesion: 0.26
Nodes (12): @tanstack/react-query, BackupImportPanel(), ImportResultDialogProps, detectSheetsInFile(), detectSheetsInZip(), downloadTemplate(), getSupabasePublicUrl(), importFromZip() (+4 more)

### Community 5 - "AdminTheory.tsx"
Cohesion: 0.05
Nodes (56): jszip, 1. Overview, 2. User Scenarios, 3. Requirements, 4. Success Criteria, Functional Requirements, Key Entities, Key Files (+48 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 7 - "utils.ts"
Cohesion: 0.05
Nodes (25): @radix-ui/react-checkbox, @radix-ui/react-hover-card, @radix-ui/react-popover, @radix-ui/react-progress, @radix-ui/react-radio-group, @radix-ui/react-scroll-area, @radix-ui/react-slider, @radix-ui/react-switch (+17 more)

### Community 8 - "types.ts"
Cohesion: 0.12
Nodes (14): AdminCoupons, CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Json, TablesInsert (+6 more)

### Community 10 - "pagination.tsx"
Cohesion: 0.10
Nodes (24): @radix-ui/react-alert-dialog, @radix-ui/react-slot, react-day-picker, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter() (+16 more)

### Community 11 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 12 - "command.tsx"
Cohesion: 0.10
Nodes (18): cmdk, @radix-ui/react-dialog, Command, CommandDialogProps, CommandEmpty, CommandGroup, CommandInput, CommandItem (+10 more)

### Community 13 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 14 - "create-new-feature.sh"
Cohesion: 0.24
Nodes (14): _byte_length(), check_existing_branches(), clean_branch_name(), _extract_highest_number(), _find_project_root(), generate_branch_name(), get_highest_from_branches(), get_highest_from_remote_refs() (+6 more)

### Community 15 - "common.ps1"
Cohesion: 0.23
Nodes (11): Find-FeatureDirByPrefix(), Find-SpecifyRoot(), Get-CurrentBranch(), Get-FeatureDirFromBranchPrefixOrExit(), Get-FeaturePathsEnv(), Get-Python3Command(), Get-RepoRoot(), Get-SpecKitEffectiveBranchName() (+3 more)

### Community 16 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, build:dev, db:export, db:migrate, dev, export:sql, lint (+4 more)

### Community 17 - "dependencies"
Cohesion: 0.03
Nodes (67): dependencies, class-variance-authority, clsx, cmdk, cobe, date-fns, embla-carousel-react, file-saver (+59 more)

### Community 18 - "cn"
Cohesion: 0.06
Nodes (51): @radix-ui/react-context-menu, @radix-ui/react-dropdown-menu, @radix-ui/react-menubar, @radix-ui/react-tabs, Card, CardContent, CardDescription, CardFooter (+43 more)

### Community 19 - "AdminAnnouncements.tsx"
Cohesion: 0.15
Nodes (14): AdminAnnouncements, AdminOrders, Announcement, AnnouncementPopup(), formatDate(), renderRichText(), AdminAnnouncements(), Announcement (+6 more)

### Community 20 - "2. User Scenarios"
Cohesion: 0.18
Nodes (10): 1. Overview, 2. User Scenarios, 3. Requirements, 4. Success Criteria, Functional Requirements, Key Entities, Key Files, User Story 1 – Quản trị viên viết & Đăng thông báo (Priority: P1) (+2 more)

### Community 21 - "KnowledgeCoreScene.tsx"
Cohesion: 0.22
Nodes (5): KnowledgeCoreScene(), KnowledgeCoreSceneProps, SUBJECT_NODES, SubjectNodeData, LandingHeroProps

### Community 22 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowJs, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck, strictNullChecks (+2 more)

### Community 23 - "@vitejs/plugin-react-swc"
Cohesion: 0.40
Nodes (4): ref_path, vite, @vitejs/plugin-react-swc, vitest

### Community 24 - "2. User Scenarios"
Cohesion: 0.18
Nodes (10): 1. Overview, 2. User Scenarios, 3. Requirements, 4. Success Criteria, Functional Requirements, Key Entities, Key Files, User Story 1 – Quản lý Giỏ hàng & Áp dụng Mã giảm giá (Priority: P1) (+2 more)

### Community 25 - "git/scripts/powershell/create-new-feature.ps1"
Cohesion: 0.39
Nodes (7): ConvertTo-CleanBranchName(), Get-BranchName(), Get-HighestNumberFromBranches(), Get-HighestNumberFromNames(), Get-HighestNumberFromRemoteRefs(), Get-HighestNumberFromSpecs(), Get-NextBranchNumber()

### Community 26 - "AdminBackup.tsx"
Cohesion: 0.13
Nodes (17): 2. User Scenarios, 4. Success Criteria, User Story 1 – Sao lưu và Phục hồi ngầm bằng Background Worker (Priority: P0), User Story 2 – Tạo Snapshot SQL / Phục hồi Tức thời (Priority: P1), AdminBackup, BackgroundBackupPanel(), BackupJob, STATUS_META (+9 more)

### Community 27 - "sidebar.tsx"
Cohesion: 0.06
Nodes (34): Input, Separator, src_components_ui_sheet_sheet, Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup (+26 more)

### Community 28 - "2. User Scenarios"
Cohesion: 0.20
Nodes (9): 1. Overview, 2. User Scenarios, 3. Requirements, 4. Success Criteria, Functional Requirements, Key Entities, Key Files, User Story 1 – Cấu hình tài khoản ngân hàng & Tự động tạo VietQR (Priority: P1) (+1 more)

### Community 29 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom (+15 more)

### Community 30 - ".specify/scripts/powershell/create-new-feature.ps1"
Cohesion: 0.46
Nodes (7): ConvertTo-CleanBranchName(), Get-BranchName(), Get-HighestNumberFromBranches(), Get-HighestNumberFromNames(), Get-HighestNumberFromRemoteRefs(), Get-HighestNumberFromSpecs(), Get-NextBranchNumber()

### Community 31 - "restore-worker/index.ts"
Cohesion: 0.07
Nodes (29): ref_npm_jszip_3_10_1, ref_npm_nodemailer, ref_npm_supabase, admin, BACKUP_TABLES, BackupTable, fetchTableRows(), KNOWN_BUCKETS (+21 more)

### Community 32 - "carousel.tsx"
Cohesion: 0.17
Nodes (14): embla-carousel-react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext (+6 more)

### Community 33 - "class-variance-authority"
Cohesion: 0.14
Nodes (15): class-variance-authority, @radix-ui/react-toggle, @radix-ui/react-toggle-group, Alert, AlertDescription, AlertTitle, alertVariants, Badge() (+7 more)

### Community 34 - "exportQuestions.ts"
Cohesion: 0.22
Nodes (8): file-saver, xlsx, ExamRow, exportQuestionsReadable(), OptionRow, QuestionRow, SubjectRow, getExamScore()

### Community 35 - "BackupExportPanel"
Cohesion: 0.20
Nodes (10): 3. Requirements, Functional Requirements, Key Entities, Key Files, User Story 3 – Xuất Excel Đọc được & Khôi phục từng phần (Priority: P1), BackupExportPanel(), ImportResultDialog(), exportToExcel() (+2 more)

### Community 36 - "AdminDashboard.tsx"
Cohesion: 0.25
Nodes (7): AdminDashboard, AdminDashboard(), Order, OrderItem, RevenueTooltip(), RevFilter, Subject

### Community 37 - "input-otp.tsx"
Cohesion: 0.33
Nodes (5): input-otp, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 38 - "package.json"
Cohesion: 0.06
Nodes (31): name, private, type, version, autoprefixer, clsx, cobe, date-fns (+23 more)

### Community 39 - "Header"
Cohesion: 0.25
Nodes (7): 1. Overview, 2. User Scenarios & Testing, 3. Requirements, 4. Success Criteria, Header, Key Entities, Key Files

### Community 40 - "FptPanoViewer.tsx"
Cohesion: 0.12
Nodes (13): FptPanoViewer(), FptPanoViewerProps, PANO_SCENES, PanoSceneConfig, PanoSceneId, HeroSceneProps, FPT_CAMPUSES, HeroScene (+5 more)

### Community 41 - "notify-admin-new-order/index.ts"
Cohesion: 0.14
Nodes (6): ref_https, corsHeaders, corsHeaders, corsHeaders, OrderItem, OrderPayload

### Community 43 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 44 - "select.tsx"
Cohesion: 0.22
Nodes (8): @radix-ui/react-select, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 45 - "KnowledgeNetworkScene.tsx"
Cohesion: 0.13
Nodes (7): AmbientBackgroundCore(), KnowledgeNetworkScene(), NETWORK_DATA, NetworkNode, Canvas(), isWebGLAvailable(), WebGLErrorBoundary

### Community 46 - "TopNav"
Cohesion: 0.25
Nodes (7): 1. Mục tiêu (Goal), 2. Chi tiết thực hiện (Implementation Details), 3. Kế hoạch kiểm thử (Verification Plan), Bước 1: Cập nhật AppContext (State Management), Bước 2: Cập nhật trang Admin Settings, Bước 3: Áp dụng liên kết động vào Giao diện (UI), TopNav()

### Community 47 - "drawer.tsx"
Cohesion: 0.22
Nodes (7): vaul, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 48 - "GlobalErrorBoundary"
Cohesion: 0.12
Nodes (14): 1. Overview, 2. User Scenarios & Testing, 3. Requirements, 4. Success Criteria, Feature Specification: Core Authentication & Security Platform, Functional Requirements, Key Entities, User Story 1 – Đăng nhập đa phương thức & Bắt buộc đổi mật khẩu (Priority: P1) (+6 more)

### Community 49 - "Plan: 11 - Admin Data Backup (Excel Import / Export)"
Cohesion: 0.14
Nodes (12): Chiến lược Export, Chiến lược Import (Upsert), File Changes, Implementation Steps, Phase 1: Setup & Core Logic, Phase 2: Components, Phase 3: Page & Routing, Phân tích Kỹ thuật (+4 more)

### Community 53 - "Project AGENTS & Development Rules"
Cohesion: 0.33
Nodes (5): 1. Bắt buộc Tuân thủ Mô hình SDD (Spec-Driven Development) & Skill SpecKit, 2. Đọc & Định vị Code Siêu tốc bằng CodeGraph & Graphify, 3. Tự động Đẩy Code lên 2 Repositories (Dual-Repo Git Push), 4. UI & Design Rules (TQMaster Dashboard Theme), Project AGENTS & Development Rules

### Community 54 - "eslint.config.js"
Cohesion: 0.33
Nodes (5): @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 55 - "Technical Implementation Plan: E-Commerce & Checkout"
Cohesion: 0.33
Nodes (5): Phase 1: Cart State, Phase 2: Cart UI, Phase 3: Checkout Integration, Technical Context, Technical Implementation Plan: E-Commerce & Checkout

### Community 56 - "LandingPage.tsx"
Cohesion: 0.11
Nodes (26): framer-motion, 1. Overview, 2. User Scenarios, 3. Requirements, 4. Success Criteria, Functional Requirements, Key Components / Files, User Story 1 – Trải nghiệm không gian tri thức 3D & Hero (Priority: P1) (+18 more)

### Community 57 - "Bắt buộc Tuân thủ SDD & Quy trình Phát triển TQMaster"
Cohesion: 0.40
Nodes (4): 1. Bắt buộc: "Spec First — Có Spec mới được Code", 2. Đọc Code Nhanh bằng CodeGraph & Graphify, 3. Tự động Đẩy Code lên 2 Repositories, Bắt buộc Tuân thủ SDD & Quy trình Phát triển TQMaster

### Community 58 - "Spec: Fix Flashcard Double Skip Bug"
Cohesion: 0.25
Nodes (7): Functional Requirements, Key Files, Overview, Spec: Fix Flashcard Double Skip Bug, Status, Success Criteria, User Scenarios

### Community 59 - "ExamPage.tsx"
Cohesion: 0.12
Nodes (20): katex, ExamPage, getKatex(), parseSegments(), renderLatex(), RichContent(), RichContentProps, Segment (+12 more)

### Community 60 - "avatar.tsx"
Cohesion: 0.40
Nodes (4): @radix-ui/react-avatar, Avatar, AvatarFallback, AvatarImage

### Community 61 - "Technical Implementation Plan: Core Authentication & Profile"
Cohesion: 0.40
Nodes (4): Phase 1: Database, Phase 2: Frontend, Technical Context, Technical Implementation Plan: Core Authentication & Profile

### Community 62 - "sheet.tsx"
Cohesion: 0.25
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 63 - "Technical Implementation Plan: News & Announcements Management"
Cohesion: 0.40
Nodes (4): Phase 1: News, Phase 2: Announcements, Technical Context, Technical Implementation Plan: News & Announcements Management

### Community 64 - "17-admin-simulate-student-cart-topnav/spec.md"
Cohesion: 0.40
Nodes (4): 1. Overview, 2. User Scenarios & Testing, 3. Requirements, 4. Success Criteria

### Community 65 - "BackupExportPanel.tsx"
Cohesion: 0.32
Nodes (6): BackupTableSelector(), BackupTableSelectorProps, GROUP_LABELS, ExportResult, TABLE_SCHEMAS, TableSchema

### Community 66 - "Plan: Show TopNav UI for Admin in Student view"
Cohesion: 0.50
Nodes (3): Implementation Details, Plan: Show TopNav UI for Admin in Student view, Rủi ro

### Community 68 - "HomePage.tsx"
Cohesion: 0.10
Nodes (26): HomePage, CourseListItem(), CourseListItemProps, ProductFilterBar(), ProductFilterBarProps, Tables, optimizedImage(), extractSubjectCode() (+18 more)

### Community 71 - "AdminExamStats.tsx"
Cohesion: 0.14
Nodes (14): AdminExamStats, AdminExamStats(), AnswerBar(), DEFAULT_PAL, ExamRow, ExamStat, ExamStatCard(), getPal() (+6 more)

### Community 73 - "2. User Scenarios"
Cohesion: 0.09
Nodes (17): ref_lib_supabase, 1. Kiến trúc UI & Design System, 2. Các bước triển khai (Implementation Steps), Kế hoạch triển khai Kỹ thuật: Product Interface Redesign, 1. Overview, 2. User Scenarios, 3. Requirements, 4. Success Criteria (+9 more)

### Community 79 - "Tasks: [FEATURE NAME]"
Cohesion: 0.07
Nodes (26): Dependencies & Execution Order, Format: `[ID] [P?] [Story] Description`, Implementation for User Story 1, Implementation for User Story 2, Implementation for User Story 3, Implementation Strategy, Incremental Delivery, MVP First (User Story 1 Only) (+18 more)

### Community 80 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (8): @radix-ui/react-navigation-menu, NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 82 - "AdminExams.tsx"
Cohesion: 0.06
Nodes (55): mammoth, 1. Overview, 2. User Scenarios & Testing, 3. Requirements, 4. Success Criteria, Feature Specification: Exam, Questions & Analytics Management, Functional Requirements, Key Entities (+47 more)

### Community 86 - "client.ts"
Cohesion: 0.09
Nodes (21): @lovable.dev/cloud-auth-js, @supabase/supabase-js, AdminSettings, AdminUsers, FileUploader(), Props, lovable, lovableAuth (+13 more)

### Community 87 - "AuthPage.tsx"
Cohesion: 0.19
Nodes (10): AuthPage, VerifyEmailPage, parseFunctionError(), AuthPage(), ensureGoogleScriptLoaded(), Mode, Window, getResendLog() (+2 more)

### Community 89 - "accordion.tsx"
Cohesion: 0.40
Nodes (4): @radix-ui/react-accordion, AccordionContent, AccordionItem, AccordionTrigger

### Community 96 - "Plan: Admin Simulate Student View"
Cohesion: 0.40
Nodes (4): Deployment / Next steps, Kiến trúc kỹ thuật & Luồng dữ liệu, Plan: Admin Simulate Student View, Rủi ro kỹ thuật

### Community 97 - "16-admin-simulate-student-view/spec.md"
Cohesion: 0.33
Nodes (5): 1. Overview, 2. User Scenarios & Testing, 3. Requirements, 4. Success Criteria, StudyHubPage()

### Community 100 - "Plan: Fix Flashcard Double Skip Bug"
Cohesion: 0.40
Nodes (4): Các bước thực hiện, Giải pháp kỹ thuật, Plan: Fix Flashcard Double Skip Bug, Vấn đề hiện tại

### Community 104 - "Tasks: 11 - Admin Data Backup (Excel Import / Export)"
Cohesion: 0.33
Nodes (5): Phase 1: Setup & Core Logic, Phase 2: Components, Phase 3: Page & Routing, Phase 4: Verification, Tasks: 11 - Admin Data Backup (Excel Import / Export)

### Community 107 - "speckit.analyze.agent.md"
Cohesion: 0.08
Nodes (25): 1. Initialize Analysis Context, 2. Load Artifacts (Progressive Disclosure), 3. Build Semantic Models, 4. Detection Passes (Token-Efficient Analysis), 5. Severity Assignment, 6. Produce Compact Analysis Report, 7. Provide Next Actions, 8. Offer Remediation (+17 more)

### Community 140 - "backupCore.ts"
Cohesion: 0.13
Nodes (24): BACKUP_FORMAT_VERSION, BackupManifest, BackupTable, buildReadme(), currentOrigin(), downloadMedia(), exportFullSnapshot(), ExportOptions (+16 more)

### Community 141 - "README.md"
Cohesion: 0.13
Nodes (14): 1. Hệ thống Thương mại & Khóa học (E-Commerce & StudyHub), 1. Luồng dữ liệu (Architecture), 2. Sơ đồ Thực thể (Core ERD), 2. Test Engine & Đánh giá năng lực (Exam System), 3. Phân hệ Tin tức & Giao tiếp (Communication), 4. Quản trị Hệ thống (System Admin Dashboard), Các bước thiết lập, 🛠️ Công nghệ (Tech Stack) (+6 more)

### Community 143 - "🎨 TQMaster UI & Design System Guidelines (`design.md`)"
Cohesion: 0.13
Nodes (14): 1. Khung Card Chuẩn (Admin Standard Card), 🎯 1. Triết Lý Thiết Kế (Design Philosophy), 🎨 2. Bảng Màu Chi Tiết (Color Palette), 2. Khung Trống (Empty State Card), 3. Nút Kêu Gọi Hành Động Nổi Bật (Primary CTA Gradient), 🔤 3. Quy Chuẩn Font Chữ (Typography Rules), 🧱 4. Quy Chuẩn Cấu Trúc Khung (Component Specifications), 4. Thanh Điều Hướng (Pill Navigation / Tabs) (+6 more)

### Community 145 - "Feature Specification: [FEATURE NAME]"
Cohesion: 0.15
Nodes (12): Assumptions, Edge Cases, Feature Specification: [FEATURE NAME], Functional Requirements, Key Entities *(include if feature involves data)*, Measurable Outcomes, Requirements *(mandatory)*, Success Criteria *(mandatory)* (+4 more)

### Community 146 - "speckit.plan.agent.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, Key rules, Mandatory Post-Execution Hooks, Outline, Phase 0: Outline & Research, Phase 1: Design & Contracts, Phases (+2 more)

### Community 147 - "speckit.specify.agent.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, For AI Generation, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, Quick Guidelines, Section Requirements (+2 more)

### Community 148 - "speckit.tasks.agent.md"
Cohesion: 0.18
Nodes (10): Checklist Format (REQUIRED), Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Phase Structure, Pre-Execution Checks, Task Generation Rules (+2 more)

### Community 150 - "Core Principles"
Cohesion: 0.18
Nodes (10): Core Principles, Governance, [PRINCIPLE_1_NAME], [PRINCIPLE_2_NAME], [PRINCIPLE_3_NAME], [PRINCIPLE_4_NAME], [PRINCIPLE_5_NAME], [PROJECT_NAME] Constitution (+2 more)

### Community 151 - "Core Principles"
Cohesion: 0.18
Nodes (10): Core Principles, Governance, [PRINCIPLE_1_NAME], [PRINCIPLE_2_NAME], [PRINCIPLE_3_NAME], [PRINCIPLE_4_NAME], [PRINCIPLE_5_NAME], [PROJECT_NAME] Constitution (+2 more)

### Community 152 - "chart.tsx"
Cohesion: 0.23
Nodes (10): recharts, ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, getPayloadConfigFromPayload() (+2 more)

### Community 154 - "Git Branching Workflow Extension"
Cohesion: 0.20
Nodes (9): Commands, Configuration, Disabling, Git Branching Workflow Extension, Graceful Degradation, Hooks, Installation, Overview (+1 more)

### Community 155 - "Create Feature Branch"
Cohesion: 0.22
Nodes (8): Branch Numbering Mode, Create Feature Branch, Environment Variable Override, Execution, Graceful Degradation, Output, Prerequisites, User Input

### Community 156 - "Product"
Cohesion: 0.22
Nodes (8): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Product, Product Purpose, Register, Users

### Community 158 - "2. User Scenarios & Testing"
Cohesion: 0.15
Nodes (12): 1. Overview, 2. User Scenarios & Testing, 3. Requirements, 4. Success Criteria, Feature Specification: Admin Analytics Dashboard, Functional Requirements, Key Entities, Key Files (+4 more)

### Community 159 - "Create Feature Branch"
Cohesion: 0.22
Nodes (8): Branch Numbering Mode, Create Feature Branch, Environment Variable Override, Execution, Graceful Degradation, Output, Prerequisites, User Input

### Community 160 - "Implementation Plan: [FEATURE]"
Cohesion: 0.22
Nodes (8): Complexity Tracking, Constitution Check, Documentation (this feature), Implementation Plan: [FEATURE], Project Structure, Source Code (repository root), Summary, Technical Context

### Community 162 - "speckit.checklist.agent.md"
Cohesion: 0.25
Nodes (7): Anti-Examples: What NOT To Do, Checklist Purpose: "Unit Tests for English", Example Checklist Types & Sample Items, Execution Steps, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 163 - "Feature Specification: Subject Catalog & Theory Management"
Cohesion: 0.17
Nodes (11): 1. Overview, 2. User Scenarios & Testing, 3. Requirements, 4. Success Criteria, Feature Specification: Subject Catalog & Theory Management, Functional Requirements, Key Entities, Key Files (+3 more)

### Community 164 - "2. User Scenarios"
Cohesion: 0.15
Nodes (12): 1. Overview, 2. User Scenarios, 3. Requirements, 4. Success Criteria, Functional Requirements, Key Entities, Key Files, User Story 1 – Quản lý & Phê duyệt đơn hàng tốc độ cao (Priority: P1) (+4 more)

### Community 167 - "2. User Scenarios"
Cohesion: 0.18
Nodes (10): 1. Overview, 2. User Scenarios, 3. Requirements, 4. Success Criteria, Functional Requirements, Key Entities, Key Files, User Story 1 – Trải nghiệm làm bài thi tập trung (Priority: P1) (+2 more)

### Community 171 - "speckit.clarify.agent.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 172 - "speckit.implement.agent.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 174 - "Coding Agent Context Extension"
Cohesion: 0.29
Nodes (6): Coding Agent Context Extension, Commands, Configuration, Disable, Requirements, Why an extension?

### Community 176 - "Auto-Commit Changes"
Cohesion: 0.33
Nodes (5): Auto-Commit Changes, Behavior, Configuration, Execution, Graceful Degradation

### Community 177 - "Initialize Git Repository"
Cohesion: 0.33
Nodes (5): Customization, Execution, Graceful Degradation, Initialize Git Repository, Output

### Community 178 - "Detect Git Remote URL"
Cohesion: 0.33
Nodes (5): Detect Git Remote URL, Execution, Graceful Degradation, Output, Prerequisites

### Community 179 - "Validate Feature Branch"
Cohesion: 0.33
Nodes (5): Execution, Graceful Degradation, Prerequisites, Validate Feature Branch, Validation Rules

### Community 180 - "Technical Implementation Plan: Admin Dashboard & Settings"
Cohesion: 0.33
Nodes (5): Phase 1: Dashboard, Phase 2: Real-time Notifications, Phase 3: Settings, Technical Context, Technical Implementation Plan: Admin Dashboard & Settings

### Community 181 - "Technical Implementation Plan: Interactive Exam System"
Cohesion: 0.33
Nodes (5): Phase 1: Exam Interface, Phase 2: Scoring, Phase 3: Reporting, Technical Context, Technical Implementation Plan: Interactive Exam System

### Community 184 - "Auto-Commit Changes"
Cohesion: 0.33
Nodes (5): Auto-Commit Changes, Behavior, Configuration, Execution, Graceful Degradation

### Community 185 - "Initialize Git Repository"
Cohesion: 0.33
Nodes (5): Customization, Execution, Graceful Degradation, Initialize Git Repository, Output

### Community 186 - "Detect Git Remote URL"
Cohesion: 0.33
Nodes (5): Detect Git Remote URL, Execution, Graceful Degradation, Output, Prerequisites

### Community 187 - "Validate Feature Branch"
Cohesion: 0.33
Nodes (5): Execution, Graceful Degradation, Prerequisites, Validate Feature Branch, Validation Rules

### Community 188 - "speckit.constitution.agent.md"
Cohesion: 0.40
Nodes (4): Outline, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 189 - "speckit.taskstoissues.agent.md"
Cohesion: 0.40
Nodes (4): Outline, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 191 - "Project Constitution (SDD)"
Cohesion: 0.40
Nodes (4): Core Principles, Git & Workflow, Project Constitution (SDD), Technical Architecture

### Community 193 - "Technical Implementation Plan: Subject & Theory Management"
Cohesion: 0.40
Nodes (4): Phase 1: Subject Management, Phase 2: Theory Management, Technical Context, Technical Implementation Plan: Subject & Theory Management

### Community 194 - "Technical Implementation Plan: Exam & Question Management"
Cohesion: 0.40
Nodes (4): Phase 1: Exams CRUD, Phase 2: Question Reports, Technical Context, Technical Implementation Plan: Exam & Question Management

### Community 195 - "Technical Implementation Plan: Order & User Management"
Cohesion: 0.40
Nodes (4): Phase 1: Orders, Phase 2: Users, Technical Context, Technical Implementation Plan: Order & User Management

### Community 197 - "Technical Implementation Plan: StudyHub & Course Catalog"
Cohesion: 0.40
Nodes (4): Phase 1: StudyHub Page, Phase 2: Subject Detail Page, Technical Context, Technical Implementation Plan: StudyHub & Course Catalog

### Community 199 - "[CHECKLIST TYPE] Checklist: [FEATURE NAME]"
Cohesion: 0.40
Nodes (4): [Category 1], [Category 2], [CHECKLIST TYPE] Checklist: [FEATURE NAME], Notes

### Community 200 - "Project AGENTS & Development Rules"
Cohesion: 0.33
Nodes (5): 1. Bắt buộc Tuân thủ Mô hình SDD (Spec-Driven Development) & Skill SpecKit, 2. Đọc & Định vị Code Siêu tốc bằng CodeGraph & Graphify, 3. Tự động Đẩy Code lên 2 Repositories (Dual-Repo Git Push), 4. UI & Design Rules (TQMaster Dashboard Theme), Project AGENTS & Development Rules

### Community 201 - "Update Coding Agent Context"
Cohesion: 0.50
Nodes (3): Behavior, Execution, Update Coding Agent Context

### Community 202 - "Update Coding Agent Context"
Cohesion: 0.50
Nodes (3): Behavior, Execution, Update Coding Agent Context

### Community 203 - "Gemini Agent Instructions"
Cohesion: 0.33
Nodes (5): 1. SDD Workflow: "Spec First — Có Spec mới được Code", 2. Fast Code Exploration via CodeGraph & Graphify, 3. Automated Dual-Repo Git Push, 4. UI & Technology Stack Rules, Gemini Agent Instructions

### Community 252 - "react"
Cohesion: 0.14
Nodes (7): lucide-react, react, react-router-dom, ExamImageViewerModalProps, Props, State, Logo()

### Community 259 - "SnapshotRestorePanel.tsx"
Cohesion: 0.12
Nodes (18): card, cb, chip, confirmInput, dangerBtn(), dropZone(), footer, header (+10 more)

### Community 260 - "SnapshotExportPanel.tsx"
Cohesion: 0.11
Nodes (18): card, cb, chip, footer, ghostBtn, groupBox, groupHeader, GROUPS (+10 more)

### Community 262 - "BackgroundRestorePanel.tsx"
Cohesion: 0.12
Nodes (16): badge, card, checkRow, confirmInput, fileBox, ghostBtn, iconWrap, Job (+8 more)

### Community 266 - "hooks/use-toast.ts"
Cohesion: 0.11
Nodes (26): @radix-ui/react-toast, Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, src_components_ui_toast_toastprovider (+18 more)

### Community 280 - "FptCampusScene.tsx"
Cohesion: 0.08
Nodes (22): @react-three/drei, @react-three/fiber, three, AlphaBuilding(), AlphaBuildingProps, CampusGround(), CampusSky(), CampusSkyProps (+14 more)

## Knowledge Gaps
- **848 isolated node(s):** `update-agent-context.sh script`, `git-common.sh script`, `$schema`, `style`, `rsc` (+843 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1051 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **62 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `AppContext.tsx`, `form.tsx`, `App.tsx`, `SnapshotRestorePanel.tsx`, `excelBackup.ts`, `SnapshotExportPanel.tsx`, `BackgroundRestorePanel.tsx`, `utils.ts`, `AdminTheory.tsx`, `types.ts`, `pagination.tsx`, `hooks/use-toast.ts`, `command.tsx`, `ProfilePage.tsx`, `cn`, `AdminAnnouncements.tsx`, `KnowledgeCoreScene.tsx`, `FptCampusScene.tsx`, `chart.tsx`, `AdminBackup.tsx`, `sidebar.tsx`, `carousel.tsx`, `class-variance-authority`, `AdminDashboard.tsx`, `input-otp.tsx`, `package.json`, `FptPanoViewer.tsx`, `breadcrumb.tsx`, `select.tsx`, `KnowledgeNetworkScene.tsx`, `drawer.tsx`, `LandingPage.tsx`, `ExamPage.tsx`, `avatar.tsx`, `sheet.tsx`, `BackupExportPanel.tsx`, `HomePage.tsx`, `AdminExamStats.tsx`, `2. User Scenarios`, `navigation-menu.tsx`, `AdminExams.tsx`, `client.ts`, `AuthPage.tsx`, `accordion.tsx`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `App.tsx`, `SnapshotRestorePanel.tsx`, `excelBackup.ts`, `SnapshotExportPanel.tsx`, `BackgroundRestorePanel.tsx`, `AdminTheory.tsx`, `utils.ts`, `types.ts`, `pagination.tsx`, `hooks/use-toast.ts`, `command.tsx`, `ProfilePage.tsx`, `cn`, `AdminAnnouncements.tsx`, `KnowledgeCoreScene.tsx`, `FptCampusScene.tsx`, `AdminBackup.tsx`, `sidebar.tsx`, `carousel.tsx`, `AdminDashboard.tsx`, `input-otp.tsx`, `package.json`, `FptPanoViewer.tsx`, `breadcrumb.tsx`, `select.tsx`, `KnowledgeNetworkScene.tsx`, `LandingPage.tsx`, `ExamPage.tsx`, `sheet.tsx`, `BackupExportPanel.tsx`, `HomePage.tsx`, `AdminExamStats.tsx`, `navigation-menu.tsx`, `AdminExams.tsx`, `client.ts`, `AuthPage.tsx`, `accordion.tsx`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useApp()` (e.g. with `Bước 3: Áp dụng liên kết động vào Giao diện (UI)` and `Tasks: Admin Simulate Student View`) actually correct?**
  _`useApp()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `update-agent-context.sh script`, `git-common.sh script`, `$schema` to the rest of the system?**
  _848 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05520614954577219 - nodes in this community are weakly interconnected._
- **Should `ProfilePage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1396011396011396 - nodes in this community are weakly interconnected._