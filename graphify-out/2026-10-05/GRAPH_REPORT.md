# Graph Report - smart-curate-learn-main  (2026-10-05)

## Corpus Check
- 343 files · ~742,198 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 3, .css 2, .lock 1)

## Summary
- 1952 nodes · 3223 edges · 186 communities (126 shown, 60 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ad962b88`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- RichContent.tsx
- form.tsx
- App.tsx
- HomePage.tsx
- excelBackup.ts
- AdminTheory.tsx
- compilerOptions
- utils.ts
- client.ts
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
- AdminCoupons.tsx
- 2. User Scenarios
- 2. User Scenarios
- compilerOptions
- @vitejs/plugin-react-swc
- 2. User Scenarios
- git/scripts/powershell/create-new-feature.ps1
- 2. User Scenarios
- sidebar.tsx
- 2. User Scenarios
- devDependencies
- .specify/scripts/powershell/create-new-feature.ps1
- restore-worker/index.ts
- carousel.tsx
- class-variance-authority
- select.tsx
- SubjectDetailPage.tsx
- drawer.tsx
- input-otp.tsx
- package.json
- Header
- FptPanoViewer.tsx
- notify-admin-new-order/index.ts
- git-common.ps1
- breadcrumb.tsx
- 2. Chi tiết thực hiện (Implementation Details)
- KnowledgeCoreScene.tsx
- accordion.tsx
- main.tsx
- GlobalErrorBoundary
- auto-commit.sh
- initialize-repo.sh
- Project AGENTS & Development Rules
- eslint.config.js
- Technical Implementation Plan: E-Commerce & Checkout
- Bắt buộc Tuân thủ SDD & Quy trình Phát triển TQMaster
- lovable/index.ts
- ExamPage.tsx
- avatar.tsx
- Technical Implementation Plan: Core Authentication & Profile
- sheet.tsx
- Technical Implementation Plan: News & Announcements Management
- TourHotspots.tsx
- @radix-ui/react-aspect-ratio
- subjectClassification.ts
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
- AdminAnnouncements.tsx
- AuthPage.tsx
- pathlib
- AdminReviews.tsx
- HeroSection.tsx
- re
- ref_fs
- subprocess
- sys
- peZipExtractor.ts
- threading
- time
- signedImage.ts
- ref_url
- three
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
- SafeCanvas.tsx
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
- KnowledgeNetworkScene.tsx
- FptCampusScene.tsx
- ref_child_process

## God Nodes (most connected - your core abstractions)
1. `cn()` - 228 edges
2. `react` - 130 edges
3. `lucide-react` - 82 edges
4. `useApp()` - 55 edges
5. `supabase` - 36 edges
6. `react-router-dom` - 24 edges
7. `formatPrice()` - 21 edges
8. `Tables` - 19 edges
9. `compilerOptions` - 19 edges
10. `useToast()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Bước 1: Cập nhật AppContext (State Management)` --references--> `TopNav()`  [INFERRED]
  .sdd/specs/12-system-settings/plan.md → src/components/TopNav.tsx
- `User Story 2 – Quản lý liên kết Mạng xã hội & Hỗ trợ (Priority: P2)` --references--> `TopNav()`  [INFERRED]
  .sdd/specs/12-system-settings/spec.md → src/components/TopNav.tsx
- `Functional Requirements` --references--> `KnowledgeNetworkSection()`  [INFERRED]
  .sdd/specs/13-interactive-landing-page/spec.md → src/components/landing/KnowledgeNetworkSection.tsx
- `Bước 3: Áp dụng liên kết động vào Giao diện (UI)` --references--> `useApp()`  [INFERRED]
  .sdd/specs/12-system-settings/plan.md → src/lib/AppContext.tsx
- `Key Files` --references--> `formatPrice()`  [INFERRED]
  .sdd/specs/02-admin-dashboard/spec.md → src/lib/mockData.ts

## Import Cycles
- None detected.

## Communities (186 total, 60 thin omitted)

### Community 0 - "RichContent.tsx"
Cohesion: 0.31
Nodes (7): katex, getKatex(), parseSegments(), renderLatex(), RichContent(), RichContentProps, Segment

### Community 1 - "form.tsx"
Cohesion: 0.17
Nodes (14): @radix-ui/react-label, react-hook-form, FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+6 more)

### Community 2 - "App.tsx"
Cohesion: 0.07
Nodes (34): ref_assets_google_cloud_study_hub_html_raw, AdminNews, AdminSubjects, adminVars, AppShell(), LandingPage, NewsPage, queryClient (+26 more)

### Community 3 - "HomePage.tsx"
Cohesion: 0.10
Nodes (31): CartPage, HomePage, ProfilePage, CourseListItem(), CourseListItemProps, SubjectGridSkeleton(), Tables, optimizedImage() (+23 more)

### Community 4 - "excelBackup.ts"
Cohesion: 0.08
Nodes (35): file-saver, @tanstack/react-query, xlsx, User Story 3 – Xuất Excel Đọc được & Khôi phục từng phần (Priority: P1), Phase 2: Components, AdminBackup, BackupExportPanel(), BackupImportPanel() (+27 more)

### Community 5 - "AdminTheory.tsx"
Cohesion: 0.17
Nodes (10): AdminTheory, CAT_LABEL, Category, EMPTY_FORM, FormState, getCat(), inputStyle, Subject (+2 more)

### Community 6 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 7 - "utils.ts"
Cohesion: 0.05
Nodes (25): @radix-ui/react-checkbox, @radix-ui/react-hover-card, @radix-ui/react-popover, @radix-ui/react-progress, @radix-ui/react-radio-group, @radix-ui/react-scroll-area, @radix-ui/react-slider, @radix-ui/react-switch (+17 more)

### Community 8 - "client.ts"
Cohesion: 0.06
Nodes (32): @supabase/supabase-js, AdminDashboard, AdminSettings, AdminUsers, FileUploader(), Props, supabase, brokeredPreviewStorage() (+24 more)

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

### Community 19 - "AdminCoupons.tsx"
Cohesion: 0.17
Nodes (10): next-themes, sonner, AdminCoupons, Toaster(), ToasterProps, AdminCoupons(), Coupon, FormState (+2 more)

### Community 20 - "2. User Scenarios"
Cohesion: 0.18
Nodes (10): 1. Overview, 2. User Scenarios, 3. Requirements, 4. Success Criteria, Functional Requirements, Key Entities, Key Files, User Story 1 – Quản trị viên viết & Đăng thông báo (Priority: P1) (+2 more)

### Community 21 - "2. User Scenarios"
Cohesion: 0.20
Nodes (9): 1. Overview, 2. User Scenarios, 3. Requirements, 4. Success Criteria, Functional Requirements, Key Entities, Key Files, User Story 1 – Khám phá & Quản lý môn học (Priority: P1) (+1 more)

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

### Community 26 - "2. User Scenarios"
Cohesion: 0.29
Nodes (7): 2. User Scenarios, 3. Requirements, 4. Success Criteria, Functional Requirements, Key Entities, Key Files, User Story 2 – Tạo Snapshot SQL / Phục hồi Tức thời (Priority: P1)

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

### Community 34 - "select.tsx"
Cohesion: 0.22
Nodes (8): @radix-ui/react-select, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 35 - "SubjectDetailPage.tsx"
Cohesion: 0.20
Nodes (10): SubjectDetailPage, formatTheoryDescription(), parseTheoryDescription(), TheoryMetadata, Announcement, Exam, Subject, SubjectDetailPage() (+2 more)

### Community 36 - "drawer.tsx"
Cohesion: 0.22
Nodes (7): vaul, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

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
Cohesion: 0.25
Nodes (4): FptPanoViewerProps, PANO_SCENES, PanoSceneConfig, PanoSceneId

### Community 41 - "notify-admin-new-order/index.ts"
Cohesion: 0.14
Nodes (6): ref_https, corsHeaders, corsHeaders, corsHeaders, OrderItem, OrderPayload

### Community 43 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 44 - "2. Chi tiết thực hiện (Implementation Details)"
Cohesion: 0.29
Nodes (6): 1. Mục tiêu (Goal), 2. Chi tiết thực hiện (Implementation Details), 3. Kế hoạch kiểm thử (Verification Plan), Bước 1: Cập nhật AppContext (State Management), Bước 2: Cập nhật trang Admin Settings, Bước 3: Áp dụng liên kết động vào Giao diện (UI)

### Community 45 - "KnowledgeCoreScene.tsx"
Cohesion: 0.22
Nodes (4): KnowledgeCoreScene(), KnowledgeCoreSceneProps, SUBJECT_NODES, SubjectNodeData

### Community 46 - "accordion.tsx"
Cohesion: 0.40
Nodes (4): @radix-ui/react-accordion, AccordionContent, AccordionItem, AccordionTrigger

### Community 47 - "main.tsx"
Cohesion: 0.50
Nodes (3): react-dom, App(), src_index

### Community 48 - "GlobalErrorBoundary"
Cohesion: 0.06
Nodes (28): 1. Overview, 2. User Scenarios & Testing, 3. Requirements, 4. Success Criteria, Feature Specification: Core Authentication & Security Platform, Functional Requirements, Key Entities, Key Files (+20 more)

### Community 53 - "Project AGENTS & Development Rules"
Cohesion: 0.33
Nodes (5): 1. Bắt buộc Tuân thủ Mô hình SDD (Spec-Driven Development) & Skill SpecKit, 2. Đọc & Định vị Code Siêu tốc bằng CodeGraph & Graphify, 3. Tự động Đẩy Code lên 2 Repositories (Dual-Repo Git Push), 4. UI & Design Rules (TQMaster Dashboard Theme), Project AGENTS & Development Rules

### Community 54 - "eslint.config.js"
Cohesion: 0.33
Nodes (5): @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 55 - "Technical Implementation Plan: E-Commerce & Checkout"
Cohesion: 0.33
Nodes (5): Phase 1: Cart State, Phase 2: Cart UI, Phase 3: Checkout Integration, Technical Context, Technical Implementation Plan: E-Commerce & Checkout

### Community 57 - "Bắt buộc Tuân thủ SDD & Quy trình Phát triển TQMaster"
Cohesion: 0.40
Nodes (4): 1. Bắt buộc: "Spec First — Có Spec mới được Code", 2. Đọc Code Nhanh bằng CodeGraph & Graphify, 3. Tự động Đẩy Code lên 2 Repositories, Bắt buộc Tuân thủ SDD & Quy trình Phát triển TQMaster

### Community 58 - "lovable/index.ts"
Cohesion: 0.40
Nodes (4): @lovable.dev/cloud-auth-js, lovable, lovableAuth, SignInOptions

### Community 59 - "ExamPage.tsx"
Cohesion: 0.15
Nodes (15): AdminQuestionReports, ExamPage, checkIsTextExam(), RoutingQuestion, signQuestionImages(), getCtx(), playSound, playTone() (+7 more)

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

### Community 64 - "TourHotspots.tsx"
Cohesion: 0.40
Nodes (3): HOTSPOTS, TourHotspots(), TourHotspotsProps

### Community 68 - "subjectClassification.ts"
Cohesion: 0.14
Nodes (19): ProductFilterBar(), ProductFilterBarProps, extractSubjectCode(), filterAndSortSubjects(), FilterState, getMajorFromSubjectName(), INITIAL_FILTER_STATE, MAJOR_OPTIONS (+11 more)

### Community 71 - "AdminExamStats.tsx"
Cohesion: 0.14
Nodes (15): AdminExamStats, getExamScore(), AdminExamStats(), AnswerBar(), DEFAULT_PAL, ExamRow, ExamStat, ExamStatCard() (+7 more)

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
Cohesion: 0.05
Nodes (57): jszip, mammoth, 1. Overview, 2. User Scenarios & Testing, 3. Requirements, 4. Success Criteria, Feature Specification: Exam, Questions & Analytics Management, Functional Requirements (+49 more)

### Community 86 - "AdminAnnouncements.tsx"
Cohesion: 0.15
Nodes (14): AdminAnnouncements, AdminOrders, Announcement, AnnouncementPopup(), formatDate(), renderRichText(), AdminAnnouncements(), Announcement (+6 more)

### Community 87 - "AuthPage.tsx"
Cohesion: 0.19
Nodes (10): AuthPage, VerifyEmailPage, parseFunctionError(), AuthPage(), ensureGoogleScriptLoaded(), Mode, Window, getResendLog() (+2 more)

### Community 89 - "AdminReviews.tsx"
Cohesion: 0.42
Nodes (7): AdminReviews, MOCK_REVIEWS, ProductReviews(), Review, getFakeReviews(), saveFakeReviews(), AdminReviews()

### Community 90 - "HeroSection.tsx"
Cohesion: 0.20
Nodes (9): FptPanoViewer(), HeroSceneProps, FPT_CAMPUSES, HeroScene, HeroSection(), HeroSectionProps, POPULAR_FPT_SUBJECTS, STATS (+1 more)

### Community 97 - "peZipExtractor.ts"
Cohesion: 0.38
Nodes (9): ExtractedImageItem, extractZipImagesFromRemoteUrl(), getMimeType(), inspectZipImages(), isValidZipImageEntry(), naturalSortNames(), sanitizeFileName(), uploadExtractedZipImages() (+1 more)

### Community 100 - "signedImage.ts"
Cohesion: 0.32
Nodes (7): AnyQuestion, cache, CacheEntry, parseStorageUrl(), PRIVATE_BUCKETS, signStorageUrl(), signStorageUrls()

### Community 102 - "three"
Cohesion: 0.15
Nodes (5): @react-three/fiber, three, CenterFocalPointProps, FloatingBooksProps, FloatingParticlesProps

### Community 104 - "Tasks: 11 - Admin Data Backup (Excel Import / Export)"
Cohesion: 0.40
Nodes (4): Phase 1: Setup & Core Logic, Phase 3: Page & Routing, Phase 4: Verification, Tasks: 11 - Admin Data Backup (Excel Import / Export)

### Community 107 - "speckit.analyze.agent.md"
Cohesion: 0.08
Nodes (25): 1. Initialize Analysis Context, 2. Load Artifacts (Progressive Disclosure), 3. Build Semantic Models, 4. Detection Passes (Token-Efficient Analysis), 5. Severity Assignment, 6. Produce Compact Analysis Report, 7. Provide Next Actions, 8. Offer Remediation (+17 more)

### Community 140 - "backupCore.ts"
Cohesion: 0.13
Nodes (24): BACKUP_FORMAT_VERSION, BackupManifest, BackupTable, buildReadme(), currentOrigin(), downloadMedia(), exportFullSnapshot(), ExportOptions (+16 more)

### Community 141 - "README.md"
Cohesion: 0.12
Nodes (15): 1. Sơ đồ Kiến trúc (Architecture Diagram), 2. Sơ đồ Thực thể Liên kết (ERD), 3. Bảo mật và Phân quyền (RBAC), Backend (BaaS), Cài đặt, 🛠️ Công nghệ sử dụng (Tech Stack), 🎓 Dành cho Học viên (Student Portal), 🛡️ Dành cho Quản trị viên (Admin Dashboard) (+7 more)

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
Cohesion: 0.14
Nodes (13): 1. Overview, 2. User Scenarios & Testing, 3. Requirements, 4. Success Criteria, Feature Specification: Subject Catalog & Theory Management, Functional Requirements, Key Entities, Key Files (+5 more)

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

### Community 205 - "SafeCanvas.tsx"
Cohesion: 0.24
Nodes (4): AmbientBackgroundCore(), Canvas(), isWebGLAvailable(), WebGLErrorBoundary

### Community 252 - "react"
Cohesion: 0.07
Nodes (34): framer-motion, lucide-react, react, react-router-dom, 1. Overview, 2. User Scenarios, 3. Requirements, 4. Success Criteria (+26 more)

### Community 259 - "SnapshotRestorePanel.tsx"
Cohesion: 0.12
Nodes (19): card, cb, chip, confirmInput, dangerBtn(), dropZone(), footer, header (+11 more)

### Community 260 - "SnapshotExportPanel.tsx"
Cohesion: 0.08
Nodes (29): User Story 1 – Sao lưu và Phục hồi ngầm bằng Background Worker (Priority: P0), BackgroundBackupPanel(), BackupJob, STATUS_META, BackgroundRestorePanel(), card, cb, chip (+21 more)

### Community 262 - "BackgroundRestorePanel.tsx"
Cohesion: 0.12
Nodes (16): badge, card, checkRow, confirmInput, fileBox, ghostBtn, iconWrap, Job (+8 more)

### Community 266 - "hooks/use-toast.ts"
Cohesion: 0.11
Nodes (25): @radix-ui/react-toast, Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, src_components_ui_toast_toastprovider (+17 more)

### Community 270 - "KnowledgeNetworkScene.tsx"
Cohesion: 0.25
Nodes (4): KnowledgeNetworkScene(), NETWORK_DATA, NetworkNode, KnowledgeNetworkSection()

### Community 280 - "FptCampusScene.tsx"
Cohesion: 0.12
Nodes (14): @react-three/drei, AlphaBuilding(), AlphaBuildingProps, CampusGround(), CampusSky(), CampusSkyProps, TimeOfDay, FptCampusSceneProps (+6 more)

## Knowledge Gaps
- **826 isolated node(s):** `update-agent-context.sh script`, `git-common.sh script`, `$schema`, `style`, `rsc` (+821 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1023 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **60 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `RichContent.tsx`, `form.tsx`, `App.tsx`, `SnapshotRestorePanel.tsx`, `SnapshotExportPanel.tsx`, `excelBackup.ts`, `BackgroundRestorePanel.tsx`, `HomePage.tsx`, `client.ts`, `utils.ts`, `pagination.tsx`, `hooks/use-toast.ts`, `command.tsx`, `AdminTheory.tsx`, `KnowledgeNetworkScene.tsx`, `cn`, `AdminCoupons.tsx`, `FptCampusScene.tsx`, `chart.tsx`, `sidebar.tsx`, `carousel.tsx`, `class-variance-authority`, `select.tsx`, `SubjectDetailPage.tsx`, `drawer.tsx`, `input-otp.tsx`, `package.json`, `FptPanoViewer.tsx`, `breadcrumb.tsx`, `KnowledgeCoreScene.tsx`, `accordion.tsx`, `ExamPage.tsx`, `avatar.tsx`, `sheet.tsx`, `TourHotspots.tsx`, `subjectClassification.ts`, `AdminExamStats.tsx`, `2. User Scenarios`, `SafeCanvas.tsx`, `navigation-menu.tsx`, `AdminExams.tsx`, `AdminAnnouncements.tsx`, `AuthPage.tsx`, `AdminReviews.tsx`, `HeroSection.tsx`, `three`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `App.tsx`, `SnapshotRestorePanel.tsx`, `SnapshotExportPanel.tsx`, `excelBackup.ts`, `BackgroundRestorePanel.tsx`, `HomePage.tsx`, `client.ts`, `utils.ts`, `pagination.tsx`, `hooks/use-toast.ts`, `command.tsx`, `AdminTheory.tsx`, `KnowledgeNetworkScene.tsx`, `cn`, `AdminCoupons.tsx`, `FptCampusScene.tsx`, `sidebar.tsx`, `carousel.tsx`, `select.tsx`, `SubjectDetailPage.tsx`, `input-otp.tsx`, `package.json`, `FptPanoViewer.tsx`, `breadcrumb.tsx`, `accordion.tsx`, `ExamPage.tsx`, `sheet.tsx`, `TourHotspots.tsx`, `subjectClassification.ts`, `AdminExamStats.tsx`, `navigation-menu.tsx`, `AdminExams.tsx`, `AdminAnnouncements.tsx`, `AuthPage.tsx`, `AdminReviews.tsx`, `HeroSection.tsx`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `update-agent-context.sh script`, `git-common.sh script`, `$schema` to the rest of the system?**
  _826 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.070578231292517 - nodes in this community are weakly interconnected._
- **Should `HomePage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10121951219512196 - nodes in this community are weakly interconnected._
- **Should `excelBackup.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08383838383838384 - nodes in this community are weakly interconnected._