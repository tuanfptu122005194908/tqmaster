# Graph Report - .  (2026-08-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 846 nodes · 1235 edges · 138 communities (67 shown, 71 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2767f6a0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sidebar.tsx
- carousel.tsx
- App.tsx
- ProfilePage.tsx
- hooks/use-toast.ts
- client.ts
- compilerOptions
- utils.ts
- types.ts
- extract.py
- cn
- compilerOptions
- command.tsx
- components.json
- create-new-feature.sh
- common.ps1
- AppContext.tsx
- dependencies
- menubar.tsx
- AuthPage.tsx
- devDependencies
- SubjectDetailPage.tsx
- compilerOptions
- context-menu.tsx
- dropdown-menu.tsx
- git/scripts/powershell/create-new-feature.ps1
- alert-dialog.tsx
- table.tsx
- signup-with-otp/index.ts
- scripts
- .specify/scripts/powershell/create-new-feature.ps1
- breadcrumb.tsx
- drawer.tsx
- navigation-menu.tsx
- select.tsx
- AdminExams.tsx
- card.tsx
- toggle-group.tsx
- package.json
- alert.tsx
- input-otp.tsx
- notify-admin-new-order/index.ts
- git-common.ps1
- avatar.tsx
- badge.tsx
- tabs.tsx
- lovable/index.ts
- sound.ts
- create-order/index.ts
- forgot-password/index.ts
- auto-commit.sh
- initialize-repo.sh
- NavLink.tsx
- cmdk
- cobe
- date-fns
- embla-carousel-react
- globals
- @eslint/js
- eslint-plugin-react-hooks
- framer-motion
- @hookform/resolvers
- input-otp
- jsdom
- lucide-react
- mammoth
- next-themes
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-aspect-ratio
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-collapsible
- @radix-ui/react-context-menu
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-hover-card
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- @radix-ui/react-scroll-area
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-toggle
- @radix-ui/react-toggle-group
- react-day-picker
- react-dom
- react-fast-marquee
- react-hook-form
- react-router-dom
- recharts
- sonner
- @supabase/supabase-js
- tailwind-merge
- tailwindcss-animate
- @tanstack/react-query
- tesseract.js
- vaul
- zod
- postcss
- @tailwindcss/typography
- @testing-library/jest-dom
- @testing-library/react
- @types/node
- @types/react-dom
- typescript
- typescript-eslint
- vite
- @vitejs/plugin-react-swc
- vitest
- update-agent-context.sh
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `cn()` - 70 edges
2. `useApp()` - 48 edges
3. `supabase` - 26 edges
4. `compilerOptions` - 19 edges
5. `formatPrice()` - 18 edges
6. `Tables` - 15 edges
7. `compilerOptions` - 14 edges
8. `subjectColor()` - 9 edges
9. `subjectInitials()` - 9 edges
10. `formatDate()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `useCarousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `useSidebar()` --references--> `react`  [EXTRACTED]
  src/components/ui/sidebar.tsx → package.json
- `useIsMobile()` --references--> `react`  [EXTRACTED]
  src/hooks/use-mobile.tsx → package.json

## Import Cycles
- None detected.

## Communities (138 total, 71 thin omitted)

### Community 0 - "sidebar.tsx"
Cohesion: 0.05
Nodes (38): Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+30 more)

### Community 1 - "carousel.tsx"
Cohesion: 0.05
Nodes (37): react, react, Button, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps (+29 more)

### Community 2 - "App.tsx"
Cohesion: 0.09
Nodes (25): adminVars, App(), AppShell(), ProtectedRoute(), queryClient, UserLayout(), AdminSidebar(), NAV (+17 more)

### Community 3 - "ProfilePage.tsx"
Cohesion: 0.15
Nodes (23): optimizedImage(), formatPrice(), generateOrderId(), SEMESTERS, SUBJECT_COLORS, subjectColor(), subjectInitials(), AdminSubjects() (+15 more)

### Community 4 - "hooks/use-toast.ts"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 5 - "client.ts"
Cohesion: 0.11
Nodes (19): FileUploader(), Props, supabase, AdminAnnouncements(), Announcement, inputStyle, Subject, AdminSettings() (+11 more)

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, DOM.Iterable, ES2020, src, vitest/globals, compilerOptions, allowImportingTsExtensions, isolatedModules (+17 more)

### Community 7 - "utils.ts"
Cohesion: 0.08
Nodes (15): AccordionContent, AccordionItem, AccordionTrigger, Checkbox, HoverCardContent, PopoverContent, Progress, RadioGroup (+7 more)

### Community 8 - "types.ts"
Cohesion: 0.09
Nodes (22): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+14 more)

### Community 9 - "extract.py"
Cohesion: 0.15
Nodes (23): Groq, Path, build_docx(), call_groq_batch(), clean_json_array(), get_groq_client(), groq_all_batched(), main() (+15 more)

### Community 10 - "cn"
Cohesion: 0.19
Nodes (15): ButtonProps, buttonVariants, Calendar(), CalendarProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem (+7 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (17): ES2023, vite.config.ts, compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection (+9 more)

### Community 12 - "command.tsx"
Cohesion: 0.12
Nodes (15): Command, CommandDialogProps, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator (+7 more)

### Community 13 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 14 - "create-new-feature.sh"
Cohesion: 0.14
Nodes (5): _extract_highest_number(), get_highest_from_branches(), create-new-feature.sh script, has_git(), git-common.sh script

### Community 15 - "common.ps1"
Cohesion: 0.23
Nodes (11): Find-FeatureDirByPrefix(), Find-SpecifyRoot(), Get-CurrentBranch(), Get-FeatureDirFromBranchPrefixOrExit(), Get-FeaturePathsEnv(), Get-Python3Command(), Get-RepoRoot(), Get-SpecKitEffectiveBranchName() (+3 more)

### Community 16 - "AppContext.tsx"
Cohesion: 0.14
Nodes (13): AppContext, AppContextValue, AppProvider(), CartItem, getDeviceId(), Profile, Subject, AdminDashboard() (+5 more)

### Community 17 - "dependencies"
Cohesion: 0.15
Nodes (14): class-variance-authority, clsx, @lovable.dev/cloud-auth-js, dependencies, class-variance-authority, clsx, @lovable.dev/cloud-auth-js, @radix-ui/react-tabs (+6 more)

### Community 18 - "menubar.tsx"
Cohesion: 0.17
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 19 - "AuthPage.tsx"
Cohesion: 0.24
Nodes (7): parseFunctionError(), AuthPage(), Mode, Window, getResendLog(), pushResend(), VerifyEmailPage()

### Community 20 - "devDependencies"
Cohesion: 0.18
Nodes (11): autoprefixer, eslint, eslint-plugin-react-refresh, devDependencies, autoprefixer, eslint, eslint-plugin-react-refresh, tailwindcss (+3 more)

### Community 21 - "SubjectDetailPage.tsx"
Cohesion: 0.22
Nodes (9): formatDate(), AdminOrders(), Order, Announcement, Exam, Subject, SubjectDetailPage(), Tab (+1 more)

### Community 22 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowJs, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck, strictNullChecks (+2 more)

### Community 23 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 24 - "dropdown-menu.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 25 - "git/scripts/powershell/create-new-feature.ps1"
Cohesion: 0.39
Nodes (7): ConvertTo-CleanBranchName(), Get-BranchName(), Get-HighestNumberFromBranches(), Get-HighestNumberFromNames(), Get-HighestNumberFromRemoteRefs(), Get-HighestNumberFromSpecs(), Get-NextBranchNumber()

### Community 26 - "alert-dialog.tsx"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 27 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 28 - "signup-with-otp/index.ts"
Cohesion: 0.28
Nodes (4): corsHeaders, escapeHtml(), otpEmailHtml(), sendOtpEmail()

### Community 29 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:dev, dev, lint, preview, test, test:watch

### Community 30 - ".specify/scripts/powershell/create-new-feature.ps1"
Cohesion: 0.46
Nodes (7): ConvertTo-CleanBranchName(), Get-BranchName(), Get-HighestNumberFromBranches(), Get-HighestNumberFromNames(), Get-HighestNumberFromRemoteRefs(), Get-HighestNumberFromSpecs(), Get-NextBranchNumber()

### Community 31 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 32 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 33 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 34 - "select.tsx"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 35 - "AdminExams.tsx"
Cohesion: 0.29
Nodes (7): AdminExams(), Exam, ExamWithSubjects, inputStyle, parseQuestions(), Question, Subject

### Community 36 - "card.tsx"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 37 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 38 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 39 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 40 - "input-otp.tsx"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 41 - "notify-admin-new-order/index.ts"
Cohesion: 0.40
Nodes (3): corsHeaders, OrderItem, OrderPayload

### Community 43 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 44 - "badge.tsx"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 45 - "tabs.tsx"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 46 - "lovable/index.ts"
Cohesion: 0.50
Nodes (3): lovable, lovableAuth, SignInOptions

### Community 47 - "sound.ts"
Cohesion: 0.67
Nodes (3): getCtx(), playSound, playTone()

## Knowledge Gaps
- **416 isolated node(s):** `update-agent-context.sh script`, `auto-commit.sh script`, `git-common.sh script`, `initialize-repo.sh script`, `$schema` (+411 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **71 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `carousel.tsx`, `package.json`, `cmdk`, `cobe`, `date-fns`, `embla-carousel-react`, `framer-motion`, `@hookform/resolvers`, `input-otp`, `lucide-react`, `mammoth`, `next-themes`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `react-day-picker`, `react-dom`, `react-fast-marquee`, `react-hook-form`, `react-router-dom`, `recharts`, `sonner`, `@supabase/supabase-js`, `tailwind-merge`, `tailwindcss-animate`, `@tanstack/react-query`, `tesseract.js`, `vaul`, `zod`?**
  _High betweenness centrality (0.250) - this node is a cross-community bridge._
- **Why does `react` connect `carousel.tsx` to `sidebar.tsx`, `dependencies`, `hooks/use-toast.ts`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `sidebar.tsx`, `carousel.tsx`, `hooks/use-toast.ts`, `utils.ts`, `command.tsx`, `menubar.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `alert-dialog.tsx`, `table.tsx`, `breadcrumb.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `select.tsx`, `card.tsx`, `toggle-group.tsx`, `alert.tsx`, `input-otp.tsx`, `avatar.tsx`, `badge.tsx`, `tabs.tsx`, `NavLink.tsx`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **What connects `update-agent-context.sh script`, `auto-commit.sh script`, `git-common.sh script` to the rest of the system?**
  _416 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.050505050505050504 - nodes in this community are weakly interconnected._
- **Should `carousel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09176788124156546 - nodes in this community are weakly interconnected._