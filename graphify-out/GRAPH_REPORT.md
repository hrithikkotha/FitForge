# Graph Report - .  (2026-04-18)

## Corpus Check
- 69 files · ~56,064 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 370 nodes · 382 edges · 79 communities detected
- Extraction: 69% EXTRACTED · 31% INFERRED · 0% AMBIGUOUS · INFERRED: 119 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Build Tooling (ViteESLint)|Build Tooling (Vite/ESLint)]]
- [[_COMMUNITY_Admin Member & Food Mgmt|Admin Member & Food Mgmt]]
- [[_COMMUNITY_Body Map Anatomy (Front)|Body Map Anatomy (Front)]]
- [[_COMMUNITY_Report-Derived Community Nodes|Report-Derived Community Nodes]]
- [[_COMMUNITY_Workout Session UI|Workout Session UI]]
- [[_COMMUNITY_Body Map Anatomy (Back)|Body Map Anatomy (Back)]]
- [[_COMMUNITY_Build Config Files|Build Config Files]]
- [[_COMMUNITY_Voice AI Route (Server)|Voice AI Route (Server)]]
- [[_COMMUNITY_Admin Panel Cluster|Admin Panel Cluster]]
- [[_COMMUNITY_Auth Guards & Routing|Auth Guards & Routing]]
- [[_COMMUNITY_Iron Forge Brand Assets|Iron Forge Brand Assets]]
- [[_COMMUNITY_AI Chat Interface|AI Chat Interface]]
- [[_COMMUNITY_Exercises Admin CRUD|Exercises Admin CRUD]]
- [[_COMMUNITY_Voice Command Parsing|Voice Command Parsing]]
- [[_COMMUNITY_FitForge Brand Assets|FitForge Brand Assets]]
- [[_COMMUNITY_Voice Assistant Component|Voice Assistant Component]]
- [[_COMMUNITY_DB Connection & Seeding|DB Connection & Seeding]]
- [[_COMMUNITY_ProjectX Logo Assets|ProjectX Logo Assets]]
- [[_COMMUNITY_Auth Layer (Full)|Auth Layer (Full)]]
- [[_COMMUNITY_Date Picker Component|Date Picker Component]]
- [[_COMMUNITY_Admin Approval Workflow|Admin Approval Workflow]]
- [[_COMMUNITY_Vite Brand SVG Assets|Vite Brand SVG Assets]]
- [[_COMMUNITY_Body Map Interactions|Body Map Interactions]]
- [[_COMMUNITY_Voice Hooks (Client)|Voice Hooks (Client)]]
- [[_COMMUNITY_React Brand Assets|React Brand Assets]]
- [[_COMMUNITY_Food & Meal ModelsRoutes|Food & Meal Models/Routes]]
- [[_COMMUNITY_All Brand Identity Assets|All Brand Identity Assets]]
- [[_COMMUNITY_Sidebar Component|Sidebar Component]]
- [[_COMMUNITY_Admin Layout|Admin Layout]]
- [[_COMMUNITY_SuperAdmin Layout|SuperAdmin Layout]]
- [[_COMMUNITY_Statistics Page|Statistics Page]]
- [[_COMMUNITY_Auth Token Logic|Auth Token Logic]]
- [[_COMMUNITY_Voice Subsystem (Full)|Voice Subsystem (Full)]]
- [[_COMMUNITY_Body Map Page|Body Map Page]]
- [[_COMMUNITY_Dashboard Page|Dashboard Page]]
- [[_COMMUNITY_Nutrition Page|Nutrition Page]]
- [[_COMMUNITY_Admin Registration|Admin Registration]]
- [[_COMMUNITY_Auth Middleware|Auth Middleware]]
- [[_COMMUNITY_Analytics Cache|Analytics Cache]]
- [[_COMMUNITY_Analytics & Stats Pages|Analytics & Stats Pages]]
- [[_COMMUNITY_Back Body SVG Component|Back Body SVG Component]]
- [[_COMMUNITY_Front Body SVG Component|Front Body SVG Component]]
- [[_COMMUNITY_Page Loader Component|Page Loader Component]]
- [[_COMMUNITY_Toast Notifications|Toast Notifications]]
- [[_COMMUNITY_Auth Page (Login)|Auth Page (Login)]]
- [[_COMMUNITY_Profile Page|Profile Page]]
- [[_COMMUNITY_Admin Detail Page|Admin Detail Page]]
- [[_COMMUNITY_All Users Page|All Users Page]]
- [[_COMMUNITY_Platform Settings Page|Platform Settings Page]]
- [[_COMMUNITY_Admin Dashboard & Layout|Admin Dashboard & Layout]]
- [[_COMMUNITY_Workout Model & Routes|Workout Model & Routes]]
- [[_COMMUNITY_Exercise Model & Routes|Exercise Model & Routes]]
- [[_COMMUNITY_SuperAdmin Layout & Routes|SuperAdmin Layout & Routes]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_Vite Env Types|Vite Env Types]]
- [[_COMMUNITY_Axios HTTP Client|Axios HTTP Client]]
- [[_COMMUNITY_Test File|Test File]]
- [[_COMMUNITY_Admin Dashboard Page|Admin Dashboard Page]]
- [[_COMMUNITY_SVG Converter Script|SVG Converter Script]]
- [[_COMMUNITY_Exercise Model|Exercise Model]]
- [[_COMMUNITY_Food Item Model|Food Item Model]]
- [[_COMMUNITY_Meal Entry Model|Meal Entry Model]]
- [[_COMMUNITY_Platform Settings Model|Platform Settings Model]]
- [[_COMMUNITY_User Model|User Model]]
- [[_COMMUNITY_Workout Session Model|Workout Session Model]]
- [[_COMMUNITY_Admin Panel Routes|Admin Panel Routes]]
- [[_COMMUNITY_Exercises Routes|Exercises Routes]]
- [[_COMMUNITY_Foods Routes|Foods Routes]]
- [[_COMMUNITY_Meals Routes|Meals Routes]]
- [[_COMMUNITY_SuperAdmin Routes|SuperAdmin Routes]]
- [[_COMMUNITY_Workouts Routes|Workouts Routes]]
- [[_COMMUNITY_AI Chat Interface (Report)|AI Chat Interface (Report)]]
- [[_COMMUNITY_Date Picker (Report)|Date Picker (Report)]]
- [[_COMMUNITY_Vite SVG Assets (Report)|Vite SVG Assets (Report)]]
- [[_COMMUNITY_React Assets (Report)|React Assets (Report)]]
- [[_COMMUNITY_Sidebar (Report)|Sidebar (Report)]]
- [[_COMMUNITY_Test File (Report)|Test File (Report)]]
- [[_COMMUNITY_Platform Settings Model (Report)|Platform Settings Model (Report)]]

## God Nodes (most connected - your core abstractions)
1. `Body Map SVG` - 18 edges
2. `Client Project Template (React + TS + Vite)` - 11 edges
3. `Back Body SVG Diagram` - 11 edges
4. `Full Body Outline (Back View)` - 10 edges
5. `load()` - 9 edges
6. `Thin Communities` - 9 edges
7. `Build Tooling (Vite/ESLint)` - 8 edges
8. `load()` - 8 edges
9. `ProjectX Logo` - 6 edges
10. `Iron Forge Fitness Logo` - 6 edges

## Surprising Connections (you probably didn't know these)
- `suspend()` --calls--> `load()`  [INFERRED]
  client\src\pages\admin\MembersPage.tsx → client\src\pages\superadmin\FoodsPage.tsx
- `activate()` --calls--> `load()`  [INFERRED]
  client\src\pages\admin\MembersPage.tsx → client\src\pages\superadmin\FoodsPage.tsx
- `bulkSuspend()` --calls--> `load()`  [INFERRED]
  client\src\pages\admin\MembersPage.tsx → client\src\pages\superadmin\FoodsPage.tsx
- `bulkActivate()` --calls--> `load()`  [INFERRED]
  client\src\pages\admin\MembersPage.tsx → client\src\pages\superadmin\FoodsPage.tsx
- `handleAdd()` --calls--> `load()`  [INFERRED]
  client\src\pages\admin\MembersPage.tsx → client\src\pages\superadmin\FoodsPage.tsx

## Hyperedges (group relationships)
- **Vite + React + TypeScript Client Stack** — readme_client_template, readme_vite, readme_react, readme_typescript, readme_hmr [EXTRACTED 1.00]
- **Fast Refresh Plugin Options** — readme_plugin_react, readme_plugin_react_swc, readme_fast_refresh, readme_babel, readme_swc [EXTRACTED 1.00]
- **ESLint Configuration Ecosystem** — readme_eslint, readme_tseslint, readme_eslint_plugin_react_x, readme_eslint_plugin_react_dom, readme_tsconfig_node, readme_tsconfig_app [INFERRED 0.85]
- **Vite + React + TypeScript Client Stack** — hyperedge_vite_react_ts, godnode_client_template, community_build_tooling, community_vite_config [EXTRACTED 1.00]
- **Fast Refresh Plugin Options** — hyperedge_fast_refresh, godnode_vitejs_plugin_react, community_build_tooling [EXTRACTED 1.00]
- **ESLint Configuration Ecosystem** — hyperedge_eslint_ecosystem, community_eslint_config, community_build_tooling [INFERRED 0.85]

## Communities

### Community 0 - "Build Tooling (Vite/ESLint)"
Cohesion: 0.13
Nodes (20): Babel, Client Project Template (React + TS + Vite), ESLint, eslint-plugin-react-dom, eslint-plugin-react-x, Fast Refresh, Hot Module Replacement (HMR), oxc (+12 more)

### Community 1 - "Admin Member & Food Mgmt"
Cohesion: 0.16
Nodes (12): closeModal(), handleDelete(), handleSave(), load(), activate(), bulkActivate(), bulkSuspend(), handleAdd() (+4 more)

### Community 2 - "Body Map Anatomy (Front)"
Cohesion: 0.19
Nodes (19): Abdominals Muscle Region, Ankle Joint Marker, Biceps Muscle Region, Body Silhouette, Calves Muscle Region, Chest Muscle Region, Elbow Joint Marker, Forearms Muscle Region (+11 more)

### Community 3 - "Report-Derived Community Nodes"
Cohesion: 0.13
Nodes (19): Admin Detail Page, All Users Page, Auth Page (Login), Back Body SVG Component, Body Map Anatomy (Back), Body Map Anatomy (Front), Body Map Interactions, Body Map Page (+11 more)

### Community 4 - "Workout Session UI"
Cohesion: 0.14
Nodes (0): 

### Community 5 - "Body Map Anatomy (Back)"
Cohesion: 0.41
Nodes (12): Full Body Outline (Back View), Calves (Gastrocnemius), Forearms, Glutes (Gluteus Maximus), Hamstrings, Latissimus Dorsi (Lats), Lower Back, Rear Shoulders (Posterior Deltoids) (+4 more)

### Community 6 - "Build Config Files"
Cohesion: 0.2
Nodes (12): Build Tooling (Vite/ESLint), ESLint Config, Vite Config, Vite Env Types, Workout Session UI, Isolated Tool Nodes, Low Cohesion Communities, Client Project Template (React + TS + Vite) (+4 more)

### Community 7 - "Voice AI Route (Server)"
Cohesion: 0.22
Nodes (3): gatherUserData(), getCachedUserData(), setCachedUserData()

### Community 8 - "Admin Panel Cluster"
Cohesion: 0.27
Nodes (11): Admin Approval Workflow, Admin Member & Food Mgmt, Admin Panel Routes, Admin Registration, Exercises Admin CRUD, activate(), bulkActivate(), bulkSuspend() (+3 more)

### Community 9 - "Auth Guards & Routing"
Cohesion: 0.22
Nodes (4): AdminGuard(), SuperAdminGuard(), useAuth(), ForceLogoutOverlay()

### Community 10 - "Iron Forge Brand Assets"
Cohesion: 0.33
Nodes (10): Anvil Symbol, Barbell / Dumbbell Symbol, Iron Forge Fitness (Brand), Gold / Bronze Color Palette, Forging Strength Concept, Blacksmithing / Metalworking Domain, Fitness / Gym Domain, Iron Forge Fitness Logo (+2 more)

### Community 11 - "AI Chat Interface"
Cohesion: 0.22
Nodes (0): 

### Community 12 - "Exercises Admin CRUD"
Cohesion: 0.31
Nodes (4): closeModal(), handleDelete(), handleSave(), load()

### Community 13 - "Voice Command Parsing"
Cohesion: 0.33
Nodes (6): fuzzyMatchExercise(), fuzzyMatchFood(), generateSuggestions(), parseVoiceCommand(), topExerciseMatches(), topFoodMatches()

### Community 14 - "FitForge Brand Assets"
Cohesion: 0.31
Nodes (9): Black Background, Purple / Violet Metallic Color Palette, FF Monogram Icon, Fit Forge Brand, Fitness / Workout Application Domain, Purple Glow / Neon Effect, Shield / Chevron Shape, Four-Pointed Star Accent (+1 more)

### Community 15 - "Voice Assistant Component"
Cohesion: 0.25
Nodes (0): 

### Community 16 - "DB Connection & Seeding"
Cohesion: 0.25
Nodes (4): connectDB(), seedDatabase(), seedSuperAdmin(), startServer()

### Community 17 - "ProjectX Logo Assets"
Cohesion: 0.43
Nodes (8): Brand Identity, Dumbbell / Barbell Motif, Energy and Strength Theme, Fitness / Gym Domain, Flame Motif, Gold Color Scheme, Monogram Letters HAH, ProjectX Logo

### Community 18 - "Auth Layer (Full)"
Cohesion: 0.32
Nodes (8): Auth Guards & Routing, Auth Middleware, Auth Token Logic, Axios HTTP Client, DB Connection & Seeding, User Model, Graph Audit Report, ProjectX Fitness Web Application

### Community 19 - "Date Picker Component"
Cohesion: 0.29
Nodes (0): 

### Community 20 - "Admin Approval Workflow"
Cohesion: 0.48
Nodes (5): approve(), handleDelete(), load(), suspend(), unsuspend()

### Community 21 - "Vite Brand SVG Assets"
Cohesion: 0.38
Nodes (7): Blue-Purple Linear Gradient, Yellow-Orange Linear Gradient, Iconify Icon Library, Inner Lightning Bolt Shape, Outer Shield/Lightning Shape, Vite Build Tool Brand, Vite Logo

### Community 22 - "Body Map Interactions"
Cohesion: 0.33
Nodes (0): 

### Community 23 - "Voice Hooks (Client)"
Cohesion: 0.33
Nodes (2): useVoiceActions(), useVoiceCommand()

### Community 24 - "React Brand Assets"
Cohesion: 0.5
Nodes (5): Atom Symbol (Visual Element), Cyan Color (#00D8FF), Iconify Icon Library, React.js Framework, React Logo (SVG)

### Community 25 - "Food & Meal Models/Routes"
Cohesion: 0.4
Nodes (5): Food Item Model, Foods Routes, Meal Entry Model, Meals Routes, Nutrition Page

### Community 26 - "All Brand Identity Assets"
Cohesion: 0.4
Nodes (5): Brand Identity Assets, FitForge Brand Assets, ProjectX Logo Assets, Iron Forge Fitness Logo, ProjectX Logo

### Community 27 - "Sidebar Component"
Cohesion: 0.5
Nodes (0): 

### Community 28 - "Admin Layout"
Cohesion: 0.5
Nodes (0): 

### Community 29 - "SuperAdmin Layout"
Cohesion: 0.5
Nodes (0): 

### Community 30 - "Statistics Page"
Cohesion: 0.5
Nodes (0): 

### Community 31 - "Auth Token Logic"
Cohesion: 0.5
Nodes (0): 

### Community 32 - "Voice Subsystem (Full)"
Cohesion: 0.67
Nodes (4): Voice AI Route (Server), Voice Assistant Component, Voice Command Parsing, Voice Hooks (Client)

### Community 33 - "Body Map Page"
Cohesion: 0.67
Nodes (0): 

### Community 34 - "Dashboard Page"
Cohesion: 0.67
Nodes (0): 

### Community 35 - "Nutrition Page"
Cohesion: 0.67
Nodes (0): 

### Community 36 - "Admin Registration"
Cohesion: 0.67
Nodes (0): 

### Community 37 - "Auth Middleware"
Cohesion: 0.67
Nodes (0): 

### Community 38 - "Analytics Cache"
Cohesion: 0.67
Nodes (0): 

### Community 39 - "Analytics & Stats Pages"
Cohesion: 0.67
Nodes (3): Analytics Routes, Dashboard Page, Statistics Page

### Community 40 - "Back Body SVG Component"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Front Body SVG Component"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Page Loader Component"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Toast Notifications"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Auth Page (Login)"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Profile Page"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Admin Detail Page"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "All Users Page"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Platform Settings Page"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Admin Dashboard & Layout"
Cohesion: 1.0
Nodes (2): Admin Dashboard Page, Admin Layout

### Community 50 - "Workout Model & Routes"
Cohesion: 1.0
Nodes (2): Workout Session Model, Workouts Routes

### Community 51 - "Exercise Model & Routes"
Cohesion: 1.0
Nodes (2): Exercise Model, Exercises Routes

### Community 52 - "SuperAdmin Layout & Routes"
Cohesion: 1.0
Nodes (2): SuperAdmin Layout, SuperAdmin Routes

### Community 53 - "ESLint Config"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Vite Env Types"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Axios HTTP Client"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Test File"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Admin Dashboard Page"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "SVG Converter Script"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Exercise Model"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Food Item Model"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Meal Entry Model"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Platform Settings Model"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "User Model"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Workout Session Model"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Admin Panel Routes"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "Exercises Routes"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "Foods Routes"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "Meals Routes"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "SuperAdmin Routes"
Cohesion: 1.0
Nodes (0): 

### Community 71 - "Workouts Routes"
Cohesion: 1.0
Nodes (0): 

### Community 72 - "AI Chat Interface (Report)"
Cohesion: 1.0
Nodes (1): AI Chat Interface

### Community 73 - "Date Picker (Report)"
Cohesion: 1.0
Nodes (1): Date Picker Component

### Community 74 - "Vite SVG Assets (Report)"
Cohesion: 1.0
Nodes (1): Vite Brand SVG Assets

### Community 75 - "React Assets (Report)"
Cohesion: 1.0
Nodes (1): React Brand Assets

### Community 76 - "Sidebar (Report)"
Cohesion: 1.0
Nodes (1): Sidebar Component

### Community 77 - "Test File (Report)"
Cohesion: 1.0
Nodes (1): Test File

### Community 78 - "Platform Settings Model (Report)"
Cohesion: 1.0
Nodes (1): Platform Settings Model

## Knowledge Gaps
- **56 isolated node(s):** `ESLint`, `Babel`, `oxc`, `rolldown-vite`, `SWC` (+51 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Back Body SVG Component`** (2 nodes): `BackBodySvg()`, `BackBodySvg.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Front Body SVG Component`** (2 nodes): `FrontBodySvg.tsx`, `FrontBodySvg()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Loader Component`** (2 nodes): `PageLoader.tsx`, `PageLoader()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Toast Notifications`** (2 nodes): `Toast.tsx`, `useToast()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Page (Login)`** (2 nodes): `handleSubmit()`, `AuthPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Profile Page`** (2 nodes): `ProfilePage.tsx`, `handleSave()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Detail Page`** (2 nodes): `StatusBadge()`, `AdminDetailPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `All Users Page`** (2 nodes): `StatusBadge()`, `AllUsersPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Platform Settings Page`** (2 nodes): `OverviewPage.tsx`, `toggleAutoApprove()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Dashboard & Layout`** (2 nodes): `Admin Dashboard Page`, `Admin Layout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Workout Model & Routes`** (2 nodes): `Workout Session Model`, `Workouts Routes`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Exercise Model & Routes`** (2 nodes): `Exercise Model`, `Exercises Routes`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SuperAdmin Layout & Routes`** (2 nodes): `SuperAdmin Layout`, `SuperAdmin Routes`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Env Types`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Axios HTTP Client`** (1 nodes): `axios.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test File`** (1 nodes): `test.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Dashboard Page`** (1 nodes): `AdminDashboardPage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SVG Converter Script`** (1 nodes): `convert_front.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Exercise Model`** (1 nodes): `Exercise.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Food Item Model`** (1 nodes): `FoodItem.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Meal Entry Model`** (1 nodes): `MealEntry.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Platform Settings Model`** (1 nodes): `PlatformSettings.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `User Model`** (1 nodes): `User.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Workout Session Model`** (1 nodes): `WorkoutSession.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Panel Routes`** (1 nodes): `adminPanel.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Exercises Routes`** (1 nodes): `exercises.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Foods Routes`** (1 nodes): `foods.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Meals Routes`** (1 nodes): `meals.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SuperAdmin Routes`** (1 nodes): `superAdmin.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Workouts Routes`** (1 nodes): `workouts.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AI Chat Interface (Report)`** (1 nodes): `AI Chat Interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Date Picker (Report)`** (1 nodes): `Date Picker Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite SVG Assets (Report)`** (1 nodes): `Vite Brand SVG Assets`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Assets (Report)`** (1 nodes): `React Brand Assets`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sidebar (Report)`** (1 nodes): `Sidebar Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test File (Report)`** (1 nodes): `Test File`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Platform Settings Model (Report)`** (1 nodes): `Platform Settings Model`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 9 inferred relationships involving `Full Body Outline (Back View)` (e.g. with `Trapezius (Upper Traps)` and `Glutes (Gluteus Maximus)`) actually correct?**
  _`Full Body Outline (Back View)` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `load()` (e.g. with `suspend()` and `activate()`) actually correct?**
  _`load()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ESLint`, `Babel`, `oxc` to the rest of the system?**
  _56 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Build Tooling (Vite/ESLint)` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Report-Derived Community Nodes` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Workout Session UI` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._