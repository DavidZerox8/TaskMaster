# TaskMaster — AI-Powered Habit & Routine Platform with Gamification

TaskMaster is an intelligent platform for building good habits, structuring multi-task routines and breaking bad patterns. Powered by AI (Anthropic Claude / Google Gemini) and a gamification system with points redeemable for real rewards. Built with **Zoneless Angular 19**, **Tailwind v4 with oklch tokens** and ready to ship as a native mobile app via Capacitor.

> [Leer en Español](#taskmaster--plataforma-de-habitos-y-rutinas-con-ia-y-gamificacion)

## Design philosophy — Determinism over dopamine

Habit-tracking software has a default failure mode: it confuses **motivation** (an external trick) with **agency** (an internal capacity). The result is a treadmill of badges, streaks, push notifications and dopaminergic reinforcement loops that train the user to depend on the app rather than on themselves. The app becomes the addiction it claimed to cure.

TaskMaster refuses that frame. The thesis: **the only honest job of a routine engine is to audit the environment of the person using it**, then reflect — with mathematical conviction — the relationship between their actions and the outcomes they say they want. No applause for waking up. No streak-shame for missing a day. Just an implacable mirror.

In thermodynamic terms: a person without routines drifts toward entropy. A routine is **directed energy applied to maintain structural order**. The UI's job is not to celebrate the energy spent, but to reflect the reduction of noise — the quieter the interface gets, the more the user has won. The reward is not the next notification; it is the disappearance of the system from the user's day.

This stance forces a specific architecture. A motivational app can be sloppy because it's compensating in the dopamine layer. An audit engine cannot — every imprecision is a lie the user will eventually catch. Hence the four mandates below.

Four non-negotiable mandates drive every technical decision:

1. **Zoneless reactivity**. No `zone.js` hypervigilance. The framework only reacts to what was explicitly emitted through the signal graph. Result: 30 kB lighter initial bundle, 40–60 % faster boot, deterministic change detection.
2. **Fine-grained signals**. `signal` / `computed` / `linkedSignal` everywhere; `effect` reserved for infrastructure bridges (DOM, storage). `BehaviorSubject` and `async` pipes erased from the codebase.
3. **Atomic, deferred loading**. `@defer` with dimensioned placeholders for the heaviest views — CLS = 0, intentionality required to consume a single extra byte.
4. **Quiet UI on an oklch palette**. Tailwind v4 CSS-first with `@theme`, perceptually uniform `oklch()` colors, dual control state (`action` / `calm`) that flips theme-wide when the day's mandates are satisfied. Zero glassmorphism. Solid, brutalist contrast over translucent decoration.

The visible artefact of this doctrine is the **conviction-button**: tasks complete via sustained press-and-hold, not a single click. Friction is a feature, not a bug — high-impact actions must feel materially different from dismissing a notification.

## Table of contents
- [Design philosophy](#design-philosophy--determinism-over-dopamine)
- [Project status](#project-status)
- [Highlights — Phase 6 Iter 1 (Elevated Design System)](#highlights--phase-6-iter-1-elevated-design-system)
- [Highlights — Iter 1 elevation](#highlights--iter-1-elevation)
- [Features](#features)
  - [Habit system](#habit-system)
  - [Gamification](#gamification)
  - [Artificial Intelligence](#artificial-intelligence)
  - [Dashboard](#dashboard)
  - [UI/UX](#uiux)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Install and scripts](#install-and-scripts)
- [Capacitor (Android/iOS)](#capacitor-androidios)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Support the project](#-support-the-project)

## Project status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Foundation (architecture, routing, models) | Completed |
| Phase 2 | Habit system (CRUD, streaks, calendar) | Completed |
| Phase 3 | Gamification (XP, levels, achievements, challenges) | Completed |
| Phase 4 | AI integration (Anthropic Claude + Google Gemini) | Completed |
| Phase 4.1 | **Pre-backend elevation — Iter 1 (AI foundation)** | **Completed** |
| Phase 4.2 | Pre-backend elevation — Iter 2–7 | In progress |
| Phase 5a | Routine domain models + localStorage repositories | **Completed** |
| Phase 5b | Routine services + habit-to-routine adapter | **Completed** |
| Phase 5c | Feature `routines/` UI (index, today, detail, form) | **Completed** |
| Phase 5d | Behavior tracking + scheduled reminders pipeline | **Completed** |
| Phase 5e | Adaptive engine + AI tools for routines + UI/UX elevation | **Completed** |
| Phase 5f | NestJS backend scaffolding | Pending |
| Phase 5g | HTTP repositories + Capacitor push real | Pending |
| Phase 5h | Rebrand: TaskMaster → ControlMaster | Pending |
| Phase 6 — Iter 1 | **Elevated Design System (Zoneless + Signals + @defer + Quiet UI)** | **Completed** |
| Phase 7 — MVP | **Offline-first MVP (PIN auth, onboarding, PWA, backup)** | **Completed** |
| Phase 6 — Iter 2 | Virtual scrolling, push notifications, advanced PWA cache | Pending |

## Highlights — Phase 7 (Offline-first MVP)

The app now runs as a self-contained product while the backend is being built — no network required for any core flow, no third-party service required for any feature except optional AI calls.

### Auth — PIN + biometric
- **PIN setup** (6 digits, configurable 4–8) created during onboarding via [`AuthService.setupPin()`](src/app/core/services/auth.service.ts). The PIN is never persisted; only `salt` + `SHA-256(PBKDF2-derived key)` are stored in `localStorage['auth.user']`.
- **PBKDF2 (250k iters, SHA-256) → AES-GCM-256** wrapper in [`CryptoService`](src/app/core/services/crypto.service.ts). The derived key lives only in a private signal after unlock; it is wiped on `lock()` and on `visibilitychange → hidden`.
- **Cooldown ladder** on failed attempts: 3 → 30 s, 6 → 5 min, 9 → 30 min, 10 → reset required. Implemented in [`AuthService.registerFailure`](src/app/core/services/auth.service.ts).
- **[`BiometricService`](src/app/core/services/biometric.service.ts)** stub: web returns `web-no-op`, native bridge pending on the Capacitor build target. The lock page hides the biometric button when unavailable; no per-callsite branching.
- **[`authGuard`](src/app/core/guards/auth.guard.ts)** gates every authenticated route. `/lock` and `/onboarding/*` opt out. Lock-on-background wired in [`AppComponent`](src/app/app.component.ts) — `visibilitychange → hidden` invokes `auth.lock()`.

### Onboarding wizard
- 6-step flow at [`/onboarding/*`](src/app/features/onboarding/onboarding.routes.ts): Welcome (name) → Goals (multi-select chips) → Templates (0–3 seed routines) → AI optional → PIN setup (two-pass confirmation) → Done.
- Reusable [`OnboardingShellComponent`](src/app/features/onboarding/components/onboarding-shell/onboarding-shell.component.ts) renders the progress bar + navigation footer; each step page injects content.
- [`OnboardingService`](src/app/core/services/onboarding.service.ts) holds the draft as a signal; `complete()` invokes `AuthService.setupPin` + `RoutineService.create` for each selected template.

### Routine templates
- **10 pre-built routines** in [`TemplateCatalogService`](src/app/core/services/template-catalog.service.ts): morning routine, evening wind-down, workout, deep work, hydration, gratitude, weekly review, reading, cold + breath, post-workout stack. Each is a complete `RoutineCreateRequest` (name, icon, schedule, ordered tasks).

### PWA — installable, offline-first
- `@angular/service-worker` registered via [`provideServiceWorker`](src/app/app.config.ts) with `registerWhenStable:30000`.
- [`ngsw-config.json`](ngsw-config.json) prefetches app shell, lazy-caches assets, performance-caches Google Fonts for 30 days.
- [`public/manifest.webmanifest`](public/manifest.webmanifest) with SVG icons (any + maskable purpose), standalone display, oklch-derived theme color.
- [`PwaInstallService`](src/app/core/services/pwa-install.service.ts) captures `beforeinstallprompt`, exposes a `canInstall` signal and a `prompt()` method; dismissal persists for 7 days before re-prompting.

### Backup / restore / reset
- [`BackupService.exportToBundle()`](src/app/core/services/backup.service.ts) walks `localStorage`, captures all app-owned keys (habits, routines, gamification, etc.), explicitly skips `auth.*` to preserve at-rest security after import.
- `downloadAsJson()` builds a Blob and triggers a download (`taskmaster-backup-YYYY-MM-DD.json`).
- `importFromFile(File)` validates `app === 'TaskMaster'` and `schemaVersion` before wiping exportable keys and restoring; rejects future schemas or foreign bundles.
- `clearAll()` is the destructive nuclear option used by the **Reset app** action; the auth record is also wiped, the user is redirected to onboarding, and the app force-reloads.
- All three are wired into [`profile-page`](src/app/features/profile/pages/profile-page/profile-page.component.ts) under a new **Datos y cuenta** card.

### Verification
- `npm run build:prod` → green. Initial bundle **107 kB transfer (413 kB raw)** including service worker registration. Service worker emits at `dist/todo-app/browser/ngsw-worker.js`.
- `npm test` → **102/103 passing** (1 pre-existing date-sensitive habit-insight spec, unrelated to this work).
- 12 new specs introduced: 4 for `CryptoService`, 8 for `AuthService`, 3 for `TemplateCatalogService`, 5 for `BackupService`.
- Manual smoke: cold launch with empty `localStorage` → onboarding → name + 1 template + PIN → dashboard. Background → return → /lock. Wrong PIN ×3 → 30 s cooldown.

### Out of scope for the MVP (post-MVP)
- Multi-user profiles on the same device.
- PIN recovery (loss of PIN = reset; documented in onboarding copy).
- Sync between devices and the NestJS backend (Phase 5f–g).
- Native biometric bridge wiring (`@aparajita/capacitor-biometric-auth` install + storage of biometric-protected derived key).
- Self-hosted brutalist typography and full hero-gradient refactor (deferred from Phase 6 Iter 1).

## Installing the MVP

### As a PWA (any browser)
1. `npm run build:prod`
2. Serve `dist/todo-app/browser/` over HTTPS (or `localhost`).
3. Open in Chrome / Edge / Safari → install prompt appears (or use the browser menu → *Install TaskMaster*).
4. App opens standalone; works offline after the first visit.

### As an Android app (Capacitor)
```bash
# One-time setup (requires Android Studio installed)
npm i @capacitor/android@latest
npx cap add android

# Each release
npm run build:prod
npx cap sync android
npm run cap:android   # opens Android Studio → Run / build APK
```

### iOS (macOS only)
Same flow as Android, swap `android` for `ios`, requires Xcode.

## Highlights — Phase 6 Iter 1 (Elevated Design System)

The application was rewritten end-to-end across three layers — **engineering** (the change-detection substrate), **aesthetics** (the visual material) and **attention** (what the user is asked to consume) — so that each one expresses the same underlying stance: the framework reacts only to what was explicitly asked of it, the palette stays perceptually honest, and not a single byte of JavaScript is loaded before the user's intent requires it.

### Layer A — Engineering: Zoneless determinism
- **`provideExperimentalZonelessChangeDetection()`** in [src/app/app.config.ts](src/app/app.config.ts). `zone.js` removed from `package.json` and `angular.json` polyfills (test-only retention to preserve TestBed compatibility with the 80+ existing specs).
- **`ChangeDetectionStrategy.OnPush`** on **100 % of components** (55/55), including the legacy `todo/` folder.
- **`BehaviorSubject` count = 0**. [`UiPreferencesService`](src/app/core/services/ui-preferences.service.ts) and [`TodoService`](src/app/core/services/todo.service.ts) rewritten with `signal` / `computed` / `effect`; an Observable façade is preserved via `toObservable` for backward compatibility.
- State-exposing services (`HabitService`, `RoutineService`, `RoutineInstanceService`, `AdaptiveRecommendationsService`, `GamificationService`) audited — all already signal-based; HTTP-boundary methods retain `Observable<T>` per the doctrine's HTTP-boundary exception.
- **`linkedSignal`** introduced in the new [`ControlStateService`](src/app/core/services/control-state.service.ts) — derives `action | calm` from `HabitService.todayProgress()` + `RoutineInstanceService.todayInstances()`, accepts manual override that auto-resets when the source re-emits.

### Layer B — Aesthetics: Tailwind v4 `@theme` + oklch + Quiet UI
- [src/styles.css](src/styles.css) refactored to CSS-first `@theme` with a complete `oklch()` token palette: `surface-bg/fg/muted/border/subtle`, `conviction-core/strong/soft/fg`, `control-pass/fail`, `entropy-warn`, `audit-info`. All hardcoded hex values removed.
- **Dual control state**. `:root[data-control-state="calm"]` flips the entire palette — the calm theme activates when the day's mandates are satisfied, driven by an `effect()` in `ControlStateService` that bridges to `document.documentElement.dataset.controlState`.
- **Brand alias trick**: `--color-indigo-{50,100,500,600,700,800}` and `--color-purple-{500,600,700}` redirect to `var(--color-conviction-*)`. The 118 existing `bg-indigo-600` / `text-indigo-700` / etc. utilities across 38 files inherit the dual theme **without a single template touch**.
- **Glassmorphism erased** in the live tree. `backdrop-blur` count in non-legacy code = 0. Modal and level-up overlays use `color-mix(in oklch, var(--color-surface-fg) 65 %, transparent)` for opaque-feel backdrops.
- **Heavy shadows reduced**. `shadow-xl` / `shadow-2xl` → `shadow-sm` / `shadow-md` across achievement-toast, ai-coach-chat, level-up-modal. Borders 1–2 px replace elevation tricks.

### Layer C — Attention economy: deferred views + ElementInternals UX
- **`@defer (on idle; prefetch on idle)`** wraps `<app-ai-coach-chat />` in [`AppComponent`](src/app/app.component.ts). The 50 kB chat module leaves the initial bundle and prefetches when the main thread goes idle.
- **`NgOptimizedImage`** — non-applicable (the repo uses zero `<img>` tags; all icons are emoji or inline SVG).
- **`ConvictionButtonComponent`** at [src/app/shared/components/ui/conviction-button/](src/app/shared/components/ui/conviction-button/). Press-and-hold 600 ms with a `conic-gradient` ring that fills via `performance.now()` + `requestAnimationFrame`. Keyboard support (`Space`/`Enter` hold-to-trigger). Replaces the checkbox in [`TaskRowComponent`](src/app/features/routines/components/task-row/task-row.component.ts). ElementInternals API was investigated but requires `customElements.define()` — out of scope for Angular components; the friction UX (the actual mandate) is preserved via signals + pointer events.

### Verification
- `npm run build:prod` → green. Initial bundle **103 kB transfer (400 kB raw)**; lazy chunks split by route + AI coach.
- `npm test` → **83 / 83 passing**.
- Contrast (oklch): action state ~17:1, calm state ~13:1, conviction-core on surface ~4.5:1 (WCAG AA).

### Trade-offs and open work
- **ElementInternals API**: the original mandate called for native form-association via `attachInternals()`. That API requires the component to be registered through `customElements.define(...)`, which Angular components are not by default. Wrapping the project in Angular Elements just for this one control would force a framework-wide concession to gain a single validation hook. The friction UX — the actual point — is preserved via signals + pointer events; the API integration is deferred until there is a second use case to justify it.
- **Test polyfill**: `zone.js/testing` is retained only in the Karma config (not in the runtime bundle) to keep the existing 80+ specs running without per-spec rewrites. The runtime is fully Zoneless; the test harness is a controlled, time-bounded exception.
- **`equal: byId` on entity arrays**: tempting as a memoization shortcut but semantically wrong — when an entity mutates in place keeping the same id, the signal would suppress the change. Default reference equality is the correct primitive for arrays of mutable entities.

## Highlights — Iter 1 elevation

The AI layer graduated from text-only responses to a real execution layer. Highlights:

- **Native tool-use from both providers**. The coach chat now calls `create_habit`, `adjust_habit` and `archive_habit` through the Claude Tools API and Gemini Function Calling with a single provider-agnostic catalog.
- **`HabitInsightEngineService`**: deterministic signals (best day of week, best hour, anchor habit, habits at risk, perfect weeks/months, category stats) feed every AI prompt with real data — no more hallucinated numbers.
- **Prompts extracted** to `src/app/core/prompts/` (system, coach, insight, recommendation) with an insight block that injects patterns into the model context.
- **Action chips** in the chat: when the AI executes a tool, a tappable chip appears under the reply summarizing the change (success/error status + link to the created resource).
- **Tool loop** with token budget (max 5 tool turns, `maxTokens` bumped to 2048 when tools are active).
- **Dispatcher** (`AIActionDispatcherService`) validates tool args, calls the Observable-returning `HabitService` variants (`createHabitReturning`, `updateHabitReturning`, `archiveHabitReturning`) and correlates results by `toolCallId`.
- **`AICoachRepository` interface + injection token** ready for multi-session persistence (implementation landing in Iter 4).
- **Debt removed**: dashboard `perfectWeeks/perfectMonths` hardcode replaced by engine signals; `gamification.service` no longer writes `localStorage` directly (goes through repo via new `saveChallenges`); root `app.component.html` boilerplate deleted.
- Unit tests: Jasmine/Karma specs for `xp.utils`, `streak.utils` and `HabitInsightEngineService`.

## Highlights — Phase 5 elevation (Routine Tracker evolution)

The domain model evolved from flat `Habit` + `HabitCompletion` to a structured `Routine → Task → RoutineInstance → TaskCompletion` pipeline, absorbing the best ideas from the "Control" reference plan while keeping Angular 19 + Capacitor.

- **Routine domain model** (`src/app/models/routine.model.ts`): discriminated union `ScheduleConfig` (daily/weekly/monthly/custom cron), `RoutineInstance` with status lifecycle (Pending → InProgress → Completed | Skipped | Missed), per-task completion tracking with `completion_score`.
- **Behavior tracking pipeline** (`BehaviorTrackerService`): debounced queue (1.5s), batch flush to repository, `visibilitychange` → `navigator.sendBeacon` ready for HTTP swap. `BehaviorEventType` enum covers 11 event types (routine_opened, task_checked, streak_continued, time_window_adjusted, etc.).
- **Scheduled reminders** (`ScheduledReminderService`): materializes `ScheduledReminder[]` from `ReminderPreference` per routine, integrates Capacitor `LocalNotifications` as local channel. Reminder channels: push, in_app, local.
- **6 new repositories** behind InjectionTokens: `RoutineRepository`, `RoutineInstanceRepository`, `TaskCompletionRepository`, `BehaviorRepository`, `ReminderRepository`, `RoutineStreakRepository` — all with localStorage implementations and full specs. Swap to HTTP implementations in Phase 5g.
- **RoutineAdapterService**: `Habit` legacy coexists as virtual `Routine` (1 implicit task, no instances). Dashboard, achievements and AI tools continue working during transition.
- **Feature `routines/`** with lazy-loaded routes: index (grid cards), today (aggregated checklist), detail (instance + task rows), create/edit (multi-step form with Basics / Schedule / Tasks tabs).
- **UI components**: `RoutineCard`, `TaskRow`, `StreakBadge`, `CompletionRing` (SVG progress), `BottomNav` mobile-first, `EmptyState` reusable.

## Highlights — Phase 5e (Adaptive engine + UI/UX elevation)

The routine domain went from passive tracker to adaptive coach:

- **`AdaptiveRecommendationsService`**: detects time-window drift (mode hour from completions vs scheduled `timeWindowStart`), missed routines (3+ scheduled days without completion), and pending streak celebrations. `runAll()` is single-flight, exposes `proposedSuggestions` signal.
- **`AdaptiveSuggestion` + repository**: discriminated union payloads (`time_window_adjust` | `streak_celebration` | `missed_routine` | `task_reorder`), localStorage repo with deduplication via `hasOpenForRoutineAndType`, snapshot of previous schedule for revert.
- **5 new AI tools** (8 total in catalog): `create_routine`, `complete_task`, `accept_time_window_adjustment`, `dismiss_adaptive_suggestion`, `celebrate_streak`. The dispatcher validates args, calls the right service, and surfaces resourceRoute `/routines/:id` on action chips.
- **App-open + interval trigger**: `app.component` runs `AdaptiveRecommendationsService.runAll()` on init, on `visibilitychange → visible`, and every 30 min while foreground.
- **UI/UX elevation** of `routines/`:
  - Hero gradients per page (slate→violet for index, indigo→fuchsia for today, routine color for detail).
  - `routines-today` groups routines by time bucket (Morning/Afternoon/Evening/Flexible) with stats card row and contextual greeting.
  - Skeleton loader on first paint, animated suggestion cards with paletted variants (amber/emerald/indigo).
  - `routine-detail` integrates `AdaptiveSuggestionCardComponent`, replaces native `confirm()` with `app-modal`, sticky action footer, fires `BehaviorTrackerService` events (routine_opened, task_checked, suggestion_accepted/dismissed).
- **Specs**: `adaptive-recommendations.service.spec.ts` covers streak celebration creation, time-window proposal with sample threshold, `runAll` aggregation, and time-window apply with snapshot.

## Features

### Habit system
- Create, edit, archive and delete habits
- Types: **build** good habits or **break** bad ones
- Frequencies: daily, weekdays, weekends, weekly, custom
- 7 categories: health, fitness, productivity, mindfulness, social, learning, custom
- Completion tracking with full history
- Streaks with smart calculation per frequency (non-scheduled days don't break the chain)
- GitHub-style heatmap calendar
- Completion rate and statistics

### Routine Tracker (Phase 5 — Phase 5e completed)
- Create, edit and delete **multi-task routines** (not just single habits)
- **Tasks per routine** with order, duration estimates, and adaptive suggested times
- **Routine instances** per day: status lifecycle (Pending → InProgress → Completed | Skipped | Missed)
- Per-task completion tracking with **completion score** (0-100)
- **Streaks per routine**: current, longest, celebration pending
- Schedule types: daily, weekly (pick days), monthly (day of month), custom cron
- **Behavior tracking pipeline**: 11 event types (routine_opened, task_checked, streak_broken, time_window_adjusted...) with debounced batch flush
- **Scheduled reminders** materialized per routine from preferences, with Capacitor LocalNotifications integration
- **Habit legacy coexistence**: old habits work as virtual 1-task routines via adapter during transition

### Gamification
- **XP system**: gain experience on every habit completion
- **Levels**: from Novice (1) to Legend (10) with exponential progression
- **16 predefined achievements** across 6 categories (streak, consistency, variety, milestone, explorer, level)
- **Weekly challenges** auto-generated
- **Redeemable points** earned on level-up
- **Visual feedback**: floating XP popups, level-up modal with particles, achievement toasts

### Artificial Intelligence
- **Multi-provider**: Anthropic Claude and Google Gemini with runtime switching
- **Native tool-use** (Iter 1): the AI can create, adjust and archive habits directly from the chat
- **Action chips**: every AI action is surfaced as a tappable chip linking to the created resource
- **Daily insight**: personalized analysis of your habits backed by real signals from the insight engine
- **AI suggestions**: new habit recommendations based on your profile and detected patterns
- **AI coach**: conversational chat for motivation, advice and analysis (now with tool execution)
- **Offline fallback**: pre-built motivational messages and contextual insights when no API key is configured
- **Flexible config**: pick provider, model and API key from the profile screen
- **Supported models**: Claude Sonnet 4, Claude Haiku 4.5, Gemini 2.0 Flash, Gemini 2.5 Pro/Flash

### Dashboard
- Personalized greeting by time of day
- XP bar with current level
- Quick stats (habits today, completions, points, best streak)
- Daily progress bar
- Active challenges
- Today's habits with quick toggle
- Best streaks view

### UI/UX
- Sidebar (desktop) and bottom nav (mobile)
- Lazy-loaded routing per feature
- Fluid animations (fade-in, slide-up, bounce, shimmer)
- Toast notification system
- Reusable modals
- Accessibility support (`prefers-reduced-motion`)
- Responsive components

## Tech stack

| Technology | Use |
|-----------|-----|
| **Zoneless Angular 19.2** | Frontend framework — 100 % standalone components, `OnPush` everywhere, no `zone.js` in the runtime bundle |
| TypeScript 5.7 | End-to-end static typing |
| **Tailwind CSS v4** with `@theme` | Utility-first styling, CSS-first config, **`oklch()`** perceptually uniform palette |
| **Angular Signals** + `linkedSignal` + `effect` | Fine-grained reactive state; the only `effect()` instances bridge to DOM (`data-control-state`) and storage |
| RxJS 7 | HTTP-boundary repositories only (Observable shape is Angular HTTP's API surface) |
| `@angular/core/rxjs-interop` | `toSignal` / `toObservable` to bridge legacy consumers |
| Jasmine + Karma | Unit testing (83 specs, all green) |
| localStorage | Temporary persistence (until Phase 5g swap) |
| Capacitor | Native Android/iOS apps |
| `@capacitor/local-notifications` | Scheduled reminder materialization (Phase 5d) |

## Architecture

```
src/app/
  core/
    interfaces/          # Repository contracts (InjectionToken)
    repositories/        # localStorage implementations
    services/            # Business logic (signals-based)
      habit-insight-engine.service.ts   # deterministic pattern engine
      ai-action-dispatcher.service.ts   # tool-call executor
      ai.service.ts                     # tool loop + snapshot
      routine.service.ts                # Phase 5b — routine CRUD + signals
      routine-instance.service.ts       # Phase 5b — instances + task completion
      behavior-tracker.service.ts     # Phase 5d — debounced batch events
      scheduled-reminder.service.ts   # Phase 5d — reminder materialization
      control-state.service.ts        # Phase 6 — linkedSignal `action | calm` + DOM bridge effect
    utils/               # Helpers (dates, streaks, XP)
    providers/
      ai/
        anthropic.provider.ts           # rewritten — tool-use blocks
        gemini.provider.ts              # rewritten — functionCall/functionResponse
        tools/                          # NEW — tool catalog + translators
    prompts/                            # NEW — extracted prompt builders
  models/                # Domain types (ai.model extended with tool types)
  shared/
    components/
      layout/            # App shell, sidebar, bottom nav
      ui/                # Reusable (toast, modal, progress-bar, ai-coach-chat...)
                         # conviction-button/ — Phase 6 — press-and-hold completion (friction = feature)
    pipes/
  features/
    dashboard/
    habits/                  # Legacy — coexists during transition
    routines/                # Phase 5c — index, today, detail, form, analytics
    achievements/
    rewards/
    profile/
```

### Domain models (Phase 5a)
- `src/app/models/routine.model.ts` — `Routine`, `Task`, `RoutineInstance`, `TaskCompletion`, `RoutineStreak`, `ScheduleConfig` discriminated union
- `src/app/models/behavior.model.ts` — `BehaviorEventType` enum, `UserBehaviorEvent`
- `src/app/models/reminder.model.ts` — `ReminderPreference`, `ScheduledReminder`, `ReminderChannel`, `ReminderStatus`

### Key patterns
- **Repository pattern**: data layer decoupled behind injection tokens, localStorage today — backend swap tomorrow
- **Zoneless + Signals + OnPush**: fine-grained reactivity, no `zone.js` tree-traversal
- **`linkedSignal` for derived-writable state**: `ControlStateService` is the canonical example — `action | calm` derived from compliance, with manual override that auto-resets on source change
- **`effect()` is reserved for infrastructure bridges**: DOM (`data-control-state`), `localStorage`, `Capacitor.Preferences`. Never used to propagate state between components.
- **CSS-first design tokens**: a single `:root[data-control-state]` flip drives the whole theme; no runtime JS for color switching
- **`@defer` granularity**: heavy modules (AI coach) leave the initial bundle and prefetch when the browser is idle
- **Lazy loading**: every feature loads on demand
- **Standalone components**: no NgModules, explicit imports
- **Provider-agnostic AI tools**: single catalog, per-provider translators (`toAnthropicTools`, `toGeminiTools`)
- **Friction as a feature**: `ConvictionButtonComponent` requires sustained press-and-hold to complete high-impact actions

## Install and scripts

```bash
# Install dependencies
npm install

# Development
npm start

# Production build
npm run build:prod

# Other scripts
npm run build          # standard build
npm run watch          # watch build
npm test               # unit tests (Karma)
```

## Capacitor (Android/iOS)

Capacitor is integrated. File: `capacitor.config.ts` with `webDir: dist/todo-app/browser`.

```bash
# One-time platform install
npm i @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios

# Update flow
npm run build:prod
npx cap sync

# Open native projects
npm run cap:android   # Android Studio
npm run cap:ios       # Xcode (macOS)

# Diagnostics
npx cap doctor
```

### Windows notes
- Run Capacitor commands from PowerShell or CMD (avoid Git Bash)
- `spawn EINVAL` usually means Git Bash — switch shell
- `webDir` = `dist/todo-app/browser` in `capacitor.config.ts`

## Roadmap

### Phase 4.1 — Iter 1 (Completed)
- AI foundation with native tool-use
- `HabitInsightEngineService` feeding all prompts
- Prompts extracted, action chips in chat, debt removed
- Unit tests for insight engine + xp/streak utils

### Phase 4.2 — Iter 2–7 (In progress)
- **Iter 2**: Live dashboard (hero card, focus-today, SVG sparklines, weekday bars)
- **Iter 3**: Deep habits (wizard, templates, detail tabs, AI-powered creation)
- **Iter 4**: Real coach (multi-session persistence, weekly review, streaming chat)
- **Iter 5**: Gamification with soul (reward catalog with themes/avatars/titles, tiered achievements, streak milestone modals)
- **Iter 6**: Profile + journeys + onboarding (dark mode, onboarding flow, 21/30/66-day journeys)
- **Iter 7**: Mobile polish (local notifications, haptics, custom modals over native confirms)

### Phase 5a — Routine domain models + localStorage repositories (Completed)
- `Routine`, `Task`, `RoutineInstance`, `TaskCompletion`, `RoutineStreak`, `ScheduleConfig` discriminated union
- `BehaviorEventType`, `UserBehaviorEvent` model
- `ReminderPreference`, `ScheduledReminder`, `ReminderChannel`, `ReminderStatus` model
- 6 new repository interfaces + localStorage implementations with InjectionTokens

### Phase 5b — Routine services + Habit→Routine adapter (Completed)
- `RoutineService` with signals: activeRoutines, todayRoutines, filteredRoutines
- `RoutineInstanceService` with getOrCreateForDate, toggleTaskCompletion, completionScore recalculation
- `RoutineAdapterService`: legacy `Habit` coexists as virtual 1-task `Routine`
- `MigrationService` v1→v2: initialize new localStorage keys

### Phase 5c — Feature `routines/` UI (Completed)
- `routines.routes.ts`: index, today, new, :id/edit, :id
- Pages: `RoutinesIndexPageComponent`, `RoutinesTodayPageComponent`, `RoutineDetailPageComponent`, `RoutineFormPageComponent`
- Components: `RoutineCard`, `TaskRow`, `StreakBadge`, `CompletionRing` (SVG), `BottomNav`
- Multi-step form: Basics / Schedule / Tasks tabs

### Phase 5d — Behavior tracking + scheduled reminders (Completed)
- `BehaviorTrackerService`: debounced queue (1.5s), batch flush to `BehaviorRepository`, `visibilitychange` handler
- `ScheduledReminderService`: materialize reminders from preferences, Capacitor `LocalNotifications` integration
- 11 event types tracked: routine_opened, task_checked, task_unchecked, routine_completed, streak_continued, streak_broken, reminder_dismissed, reminder_acted, time_window_adjusted, suggestion_accepted, suggestion_dismissed

### Phase 5e — Adaptive engine + AI tools for routines + UI/UX elevation (Completed)
- `AdaptiveRecommendationsService`: `updateSuggestedTimes`, `flagMissedRoutines`, `flagStreakCelebrations`, `adjustTimeWindows`, `runAll()` with single-flight guard
- `AdaptiveSuggestion` model + `IAdaptiveSuggestionRepository` + localStorage impl with dedup
- 5 new AI tools wired to dispatcher: `create_routine`, `complete_task`, `accept_time_window_adjustment`, `dismiss_adaptive_suggestion`, `celebrate_streak`
- `AdaptiveSuggestionCardComponent` (Accept/Revert/Dismiss) embedded in routine detail
- Trigger: on `app-open`, on `visibilitychange → visible`, and every 30 min interval (backend job will replace it in Phase 5f)
- UI/UX elevation of `routines/`: gradient heroes, skeleton loaders, time-bucket grouping in Today, sticky action footer + modal-based delete in detail, `BehaviorTrackerService` integrated

### Phase 5f — NestJS backend scaffolding (Pending)
- NestJS + TypeORM + PostgreSQL + JWT + `@nestjs/schedule` + `@nestjs/throttler`
- Endpoints: routines CRUD, instances, completions, behavior batch, reminders, adaptive
- Jobs: `GenerateInstancesForDate` (23:55), `DispatchTodayReminders` (every 5m), `RunAdaptiveAnalysis` (03:00)

### Phase 5g — HTTP repositories + Capacitor push real (Pending)
- `*-http.repository.ts` mirror of `*-local.repository.ts`
- Swap binding in `app.providers.ts`
- `@capacitor/push-notifications`: backend dispatches via FCM/APNs

### Phase 5h — Rebrand: TaskMaster → ControlMaster (Pending)
- Rename package.json, capacitor.config.ts, angular.json, dist/
- `com.centur.controlmaster` bundle id
- `routinesV2Enabled` flag, deprecation warning in /habits
- Migration v2→v3: cleanup legacy Habit keys

### Phase 6 — Iter 1 (Completed) — Elevated Design System
- ✅ Zoneless change detection (`provideExperimentalZonelessChangeDetection`)
- ✅ `OnPush` strict on 100 % of components
- ✅ `BehaviorSubject` count = 0; `signal` / `computed` / `linkedSignal` / `effect` throughout
- ✅ `@defer (on idle; prefetch on idle)` for `<app-ai-coach-chat />`
- ✅ Tailwind v4 `@theme` with full `oklch()` token palette + dual `data-control-state` flip
- ✅ Glassmorphism erased (`backdrop-blur` = 0 in the live tree)
- ✅ `ConvictionButtonComponent` with press-and-hold UX
- ✅ Brand-alias indirection so 118 `indigo-*` / `purple-*` references retokenize with zero template churn

### Phase 6 — Iter 2 (Pending)
- Self-hosted brutalist typography (monospace display + Inter body)
- Hero gradient refactor toward fully solid Quiet UI surfaces
- Additional `@defer` blocks on `profile-page`, `habit-detail-page`, `routine-form-page`
- PWA with Service Worker (cache-first + network-first)
- Push notifications for reminders (Capacitor)
- Virtual scrolling for long lists

## Contributing

1. Fork the repo
2. Create a branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

TaskMaster — Transform your habits, transform your life

---

## ☕ Support the project

TaskMaster is and will remain an open-source project. However, keeping the infrastructure running, covering AI API costs (Claude and Gemini) and dedicating time to new features like the **Real Rewards Shop** takes resources.

If you find value in this tool and want to help it keep growing, any donation is hugely appreciated.

| Platform | Link |
|----------|------|
| **PayPal** | [Donate here](https://www.paypal.com/donate/?hosted_button_id=DQ6ZXFQMBALKL) |

> **Note:** Your support directly funds AI credits so more users can enjoy personalized insights and the AI Coach.

---

# TaskMaster — Plataforma de Habitos y Rutinas con IA y Gamificacion

TaskMaster es una plataforma inteligente para construir buenos habitos, estructurar rutinas multi-tarea y romper patrones nocivos. Potenciada por IA (Anthropic Claude / Google Gemini) y un sistema de gamificacion con puntos canjeables por premios reales. Construida con **Angular 19 Zoneless**, **Tailwind v4 con tokens oklch** y lista para ejecutarse como app movil nativa via Capacitor.

> [Read in English](#taskmaster--ai-powered-habit--routine-platform-with-gamification)

## Filosofia de diseno — Determinismo sobre dopamina

El software de tracking de habitos tiene un modo de fallo por defecto: confunde **motivacion** (un truco externo) con **agencia** (una capacidad interna). El resultado es una caminadora de insignias, rachas, notificaciones push y bucles de refuerzo dopaminergico que entrenan al usuario a depender de la app en lugar de si mismo. La app se convierte en la adiccion que prometia curar.

<img width="1337" height="600" alt="image" src="https://github.com/user-attachments/assets/31142994-e4c9-4892-8e2e-1666146e61f3" />

TaskMaster es una plataforma inteligente para adoptar buenos habitos y dejar malos habitos, potenciada con IA (Anthropic Claude / Google Gemini) y un sistema de gamificacion con puntos canjeables por premios reales. Construida con Angular 19 y preparada para ejecutarse como app movil nativa con Capacitor.

En terminos termodinamicos: una persona sin rutinas deriva hacia la entropia. Una rutina es **energia direccional aplicada para mantener orden estructural**. El trabajo de la interfaz no es celebrar la energia gastada, sino reflejar la reduccion del ruido — mientras mas silenciosa se vuelve la interfaz, mas ha ganado el usuario. La recompensa no es la proxima notificacion; es la desaparicion del sistema del dia del usuario.

Esta postura fuerza una arquitectura especifica. Una app motivacional puede permitirse ser descuidada porque compensa en la capa de dopamina. Un motor de auditoria no puede — cada imprecision es una mentira que el usuario terminara cazando. De ahi los cuatro mandatos siguientes.

Cuatro mandatos innegociables guian cada decision tecnica:

1. **Reactividad Zoneless**. Sin la hipervigilancia de `zone.js`. El framework solo reacciona a lo que se emitio explicitamente por el grafo de signals. Resultado: bundle inicial 30 kB mas ligero, arranque 40–60 % mas rapido, deteccion de cambios determinista.
2. **Signals de grano fino**. `signal` / `computed` / `linkedSignal` en todas partes; `effect` reservado para puentes de infraestructura (DOM, storage). `BehaviorSubject` y pipes `async` erradicados del codebase.
3. **Carga atomica diferida**. `@defer` con placeholders dimensionados para las vistas pesadas — CLS = 0, intencionalidad obligatoria para consumir un byte extra.
4. **Quiet UI sobre paleta oklch**. Tailwind v4 CSS-first con `@theme`, colores `oklch()` perceptualmente uniformes, estado dual (`action` / `calm`) que voltea la paleta entera cuando se cumplen los mandatos del dia. Cero glassmorphism. Contraste solido y brutalista sobre decoracion translucida.

El artefacto visible de esta doctrina es el **conviction-button**: las tareas se completan con press-and-hold sostenido, no con un click. La friccion es una feature, no un bug — las acciones de alto impacto deben sentirse materialmente distintas a descartar una notificacion.

## Tabla de contenidos
- [Filosofia de diseno](#filosofia-de-diseno--determinismo-sobre-dopamina)
- [Estado del proyecto](#estado-del-proyecto)
- [Novedades — Fase 6 Iter 1 (Elevated Design System)](#novedades--fase-6-iter-1-elevated-design-system)
- [Novedades — Iter 1 de elevacion](#novedades--iter-1-de-elevacion)
- [Caracteristicas](#caracteristicas)
  - [Sistema de habitos](#sistema-de-habitos)
  - [Gamificacion](#gamificacion)
  - [Inteligencia Artificial](#inteligencia-artificial)
  - [Dashboard](#dashboard-1)
  - [UI/UX](#uiux-1)
- [Stack tecnologico](#stack-tecnologico)
- [Arquitectura](#arquitectura)
- [Instalacion y scripts](#instalacion-y-scripts)
- [Capacitor (Android/iOS)](#capacitor-androidios-1)
- [Roadmap](#roadmap-1)
- [Contribuir](#contribuir)
- [Apoya el proyecto](#-apoya-el-proyecto)

## Estado del proyecto

| Fase | Descripcion | Estado |
|------|-------------|--------|
| Fase 1 | Fundacion (arquitectura, routing, modelos) | Completada |
| Fase 2 | Sistema de habitos (CRUD, rachas, calendario) | Completada |
| Fase 3 | Gamificacion (XP, niveles, logros, desafios) | Completada |
| Fase 4 | Integracion IA (Anthropic Claude + Google Gemini) | Completada |
| Fase 4.1 | **Elevacion pre-backend — Iter 1 (fundacion IA)** | **Completada** |
| Fase 4.2 | Elevacion pre-backend — Iter 2–7 | En progreso |
| Fase 5a | Modelos de dominio Routine + repositorios localStorage | **Completada** |
| Fase 5b | Servicios de rutinas + adaptador Habit→Routine | **Completada** |
| Fase 5c | UI feature `routines/` (index, hoy, detalle, form) | **Completada** |
| Fase 5d | Behavior tracking + reminders programados | **Completada** |
| Fase 5e | Motor adaptativo + tools IA para rutinas + elevacion UI/UX | **Completada** |
| Fase 5f | Backend NestJS scaffolding | Pendiente |
| Fase 5g | Repositorios HTTP + push real Capacitor | Pendiente |
| Fase 5h | Rebrand: TaskMaster → ControlMaster | Pendiente |
| Fase 6 — Iter 1 | **Elevated Design System (Zoneless + Signals + @defer + Quiet UI)** | **Completada** |
| Fase 7 — MVP | **MVP offline-first (PIN auth, onboarding, PWA, backup)** | **Completada** |
| Fase 6 — Iter 2 | Virtual scrolling, push notifications, PWA cache avanzado | Pendiente |

## Novedades — Fase 7 (MVP offline-first)

La aplicación corre como producto autocontenido mientras se construye el backend — sin red para ningún flujo core, sin terceros para nada salvo llamadas opcionales a IA.

### Auth — PIN + biométrico
- **PIN de 6 dígitos** (configurable 4–8) creado durante el onboarding via [`AuthService.setupPin()`](src/app/core/services/auth.service.ts). El PIN nunca se persiste; solo se almacena `salt` + `SHA-256(clave-derivada-PBKDF2)` en `localStorage['auth.user']`.
- **PBKDF2 (250k iter, SHA-256) → AES-GCM-256** en [`CryptoService`](src/app/core/services/crypto.service.ts). La clave derivada vive solo en una signal privada tras el unlock; se borra en `lock()` y en `visibilitychange → hidden`.
- **Escalera de cooldowns** ante intentos fallidos: 3 → 30 s, 6 → 5 min, 9 → 30 min, 10 → reset obligado.
- **[`BiometricService`](src/app/core/services/biometric.service.ts)** stub: web devuelve `web-no-op`, bridge nativo queda pendiente para el build de Capacitor. El lock page oculta el botón biométrico cuando no está disponible.
- **[`authGuard`](src/app/core/guards/auth.guard.ts)** protege todas las rutas autenticadas. `/lock` y `/onboarding/*` lo evitan. Lock-on-background cableado en [`AppComponent`](src/app/app.component.ts) — `visibilitychange → hidden` invoca `auth.lock()`.

### Wizard de onboarding
- Flujo de 6 pasos en [`/onboarding/*`](src/app/features/onboarding/onboarding.routes.ts): Bienvenida (nombre) → Objetivos (chips multi-select) → Plantillas (0–3 rutinas seed) → IA opcional → Configurar PIN (doble confirmación) → Listo.
- [`OnboardingShellComponent`](src/app/features/onboarding/components/onboarding-shell/onboarding-shell.component.ts) reutilizable provee la barra de progreso + navegación.
- [`OnboardingService`](src/app/core/services/onboarding.service.ts) mantiene el draft como signal; `complete()` invoca `AuthService.setupPin` + `RoutineService.create` por cada plantilla seleccionada.

### Catálogo de rutinas
- **10 rutinas pre-construidas** en [`TemplateCatalogService`](src/app/core/services/template-catalog.service.ts): matinal, bajada nocturna, entrenamiento, deep work, hidratación, gratitud, revisión semanal, lectura, frío + respiración, stack post-entreno.

### PWA — instalable, offline-first
- `@angular/service-worker` registrado via [`provideServiceWorker`](src/app/app.config.ts) con `registerWhenStable:30000`.
- [`ngsw-config.json`](ngsw-config.json) precachea el app shell, lazy-cachea assets, performance-cachea Google Fonts por 30 días.
- [`public/manifest.webmanifest`](public/manifest.webmanifest) con iconos SVG (any + maskable), display standalone, theme color derivado de oklch.
- [`PwaInstallService`](src/app/core/services/pwa-install.service.ts) captura `beforeinstallprompt`, expone signal `canInstall` y método `prompt()`; el dismiss persiste 7 días.

### Backup / restore / reset
- [`BackupService.exportToBundle()`](src/app/core/services/backup.service.ts) recorre `localStorage`, captura todas las claves de la app (habits, routines, gamification, etc.), excluye explícitamente `auth.*` para preservar la seguridad at-rest tras importar.
- `downloadAsJson()` arma un Blob y dispara descarga (`taskmaster-backup-YYYY-MM-DD.json`).
- `importFromFile(File)` valida `app === 'TaskMaster'` y `schemaVersion` antes de limpiar las claves exportables y restaurar; rechaza schemas futuros o bundles de otras apps.
- `clearAll()` es la opción nuclear destructiva usada por **Reiniciar aplicación**; el record de auth también se borra, redirige al onboarding y fuerza recarga.
- Los tres están cableados en [`profile-page`](src/app/features/profile/pages/profile-page/profile-page.component.ts) bajo la card **Datos y cuenta**.

### Verificación
- `npm run build:prod` → verde. Bundle inicial **107 kB transfer (413 kB raw)** con service worker. SW emite en `dist/todo-app/browser/ngsw-worker.js`.
- `npm test` → **102/103 verde** (1 spec pre-existente date-sensitive del habit-insight, no relacionado).
- 12 specs nuevos: 4 para `CryptoService`, 8 para `AuthService`, 3 para `TemplateCatalogService`, 5 para `BackupService`.

### Fuera de scope para el MVP (post-MVP)
- Perfiles múltiples en el mismo dispositivo.
- Recuperación de PIN (pérdida = reset; documentado en el copy del onboarding).
- Sync entre dispositivos y backend NestJS (Fase 5f–g).
- Bridge nativo biométrico (`@aparajita/capacitor-biometric-auth`).
- Tipografía brutalista self-hosted y refactor pleno de hero-gradients (diferido de Fase 6 Iter 1).

## Instalación del MVP

### Como PWA
1. `npm run build:prod`
2. Servir `dist/todo-app/browser/` por HTTPS (o `localhost`).
3. Abrir en Chrome / Edge / Safari → aparece el prompt de instalación (o menú del navegador → *Instalar TaskMaster*).
4. La app abre standalone; funciona offline tras la primera visita.

### Como app Android (Capacitor)
```bash
# Setup único (requiere Android Studio instalado)
npm i @capacitor/android@latest
npx cap add android

# Cada release
npm run build:prod
npx cap sync android
npm run cap:android   # abre Android Studio → Run / build APK
```

### iOS (sólo macOS)
Mismo flujo que Android, cambia `android` por `ios`, requiere Xcode.

## Novedades — Fase 6 Iter 1 (Elevated Design System)

La aplicacion fue reescrita de extremo a extremo en tres capas — **ingenieria** (el sustrato de deteccion de cambios), **estetica** (el material visual) y **atencion** (lo que se le pide al usuario que consuma) — para que cada una exprese la misma postura subyacente: el framework reacciona solo a lo que se le pidio explicitamente, la paleta se mantiene perceptualmente honesta, y no se carga un solo byte de JavaScript antes de que la intencion del usuario lo exija.

### Capa A — Ingenieria: determinismo Zoneless
- **`provideExperimentalZonelessChangeDetection()`** en [src/app/app.config.ts](src/app/app.config.ts). `zone.js` removido de `package.json` y de los polyfills de `angular.json` (retencion solo en test para preservar compatibilidad de TestBed con los 80+ specs existentes).
- **`ChangeDetectionStrategy.OnPush`** en el **100 % de los componentes** (55/55), incluyendo el folder legacy `todo/`.
- **Conteo de `BehaviorSubject` = 0**. [`UiPreferencesService`](src/app/core/services/ui-preferences.service.ts) y [`TodoService`](src/app/core/services/todo.service.ts) reescritos con `signal` / `computed` / `effect`; se preserva una fachada Observable via `toObservable` para compatibilidad hacia atras.
- Servicios que exponen estado (`HabitService`, `RoutineService`, `RoutineInstanceService`, `AdaptiveRecommendationsService`, `GamificationService`) auditados — todos ya signal-based; los metodos en la frontera HTTP conservan `Observable<T>` por la excepcion explicita de la doctrina.
- **`linkedSignal`** introducido en el nuevo [`ControlStateService`](src/app/core/services/control-state.service.ts) — deriva `action | calm` desde `HabitService.todayProgress()` + `RoutineInstanceService.todayInstances()`, acepta override manual que se auto-resetea cuando la fuente vuelve a emitir.

### Capa B — Estetica: Tailwind v4 `@theme` + oklch + Quiet UI
- [src/styles.css](src/styles.css) refactorizado a `@theme` CSS-first con paleta completa de tokens `oklch()`: `surface-bg/fg/muted/border/subtle`, `conviction-core/strong/soft/fg`, `control-pass/fail`, `entropy-warn`, `audit-info`. Todos los hex hardcodeados removidos.
- **Estado dual**. `:root[data-control-state="calm"]` voltea la paleta entera — el tema calma se activa cuando los mandatos del dia estan satisfechos, impulsado por un `effect()` en `ControlStateService` que puentea a `document.documentElement.dataset.controlState`.
- **Truco de alias de marca**: `--color-indigo-{50,100,500,600,700,800}` y `--color-purple-{500,600,700}` redirigen a `var(--color-conviction-*)`. Las 118 utilidades existentes `bg-indigo-600` / `text-indigo-700` / etc. en 38 archivos heredan el tema dual **sin tocar una sola plantilla**.
- **Glassmorphism erradicado** en el arbol vivo. Conteo de `backdrop-blur` en codigo no-legacy = 0. Los overlays de modal y level-up usan `color-mix(in oklch, var(--color-surface-fg) 65 %, transparent)` para fondos opacos al ojo.
- **Sombras pesadas reducidas**. `shadow-xl` / `shadow-2xl` → `shadow-sm` / `shadow-md` en achievement-toast, ai-coach-chat, level-up-modal. Bordes de 1–2 px reemplazan los trucos de elevacion.

### Capa C — Economia de la atencion: vistas diferidas + UX de ElementInternals
- **`@defer (on idle; prefetch on idle)`** envuelve `<app-ai-coach-chat />` en [`AppComponent`](src/app/app.component.ts). El modulo de 50 kB del chat sale del bundle inicial y se precarga cuando el hilo principal queda idle.
- **`NgOptimizedImage`** — no aplicable (el repo usa cero etiquetas `<img>`; todos los iconos son emoji o SVG inline).
- **`ConvictionButtonComponent`** en [src/app/shared/components/ui/conviction-button/](src/app/shared/components/ui/conviction-button/). Press-and-hold de 600 ms con un anillo `conic-gradient` que se llena via `performance.now()` + `requestAnimationFrame`. Soporte de teclado (`Space`/`Enter` para mantener). Reemplaza el checkbox en [`TaskRowComponent`](src/app/features/routines/components/task-row/task-row.component.ts). El API ElementInternals fue investigado pero requiere `customElements.define()` — fuera de scope para componentes Angular; la UX de friccion (el verdadero mandato) se preserva via signals + pointer events.

### Verificacion
- `npm run build:prod` → verde. Bundle inicial **103 kB transfer (400 kB raw)**; lazy chunks separados por ruta + AI coach.
- `npm test` → **83 / 83 verde**.
- Contraste (oklch): estado action ~17:1, estado calm ~13:1, conviction-core sobre surface ~4.5:1 (WCAG AA).

### Trade-offs y trabajo abierto
- **API ElementInternals**: el mandato original pedia asociacion nativa con formularios via `attachInternals()`. Ese API requiere registrar el componente con `customElements.define(...)`, cosa que los componentes Angular no son por defecto. Envolver el proyecto en Angular Elements solo para este control forzaria una concesion framework-wide a cambio de un solo hook de validacion. La UX de friccion — el punto real — se preserva con signals + pointer events; la integracion del API queda diferida hasta que aparezca un segundo caso de uso que la justifique.
- **Polyfill de tests**: `zone.js/testing` se conserva solo en la config de Karma (no en el bundle de runtime) para mantener corriendo los 80+ specs existentes sin reescribirlos. El runtime es totalmente Zoneless; el harness de tests es una excepcion controlada y acotada.
- **`equal: byId` en arrays de entidades**: tentador como atajo de memoizacion pero semanticamente erroneo — cuando una entidad muta in-place conservando el mismo id, el signal suprimiria el cambio. La igualdad por referencia (default) es el primitivo correcto para arrays de entidades mutables.

## Novedades — Iter 1 de elevacion

La capa de IA paso de respuestas solo-texto a una capa real de ejecucion. Resumen:

- **Tool-use nativo en ambos proveedores**. El chat del coach ya llama a `create_habit`, `adjust_habit` y `archive_habit` via Claude Tools API y Gemini Function Calling con un catalogo unico agnostico.
- **`HabitInsightEngineService`**: signals deterministicos (mejor dia de la semana, mejor hora, habito ancla, habitos en riesgo, semanas/meses perfectos, categoria fuerte/debil) alimentan cada prompt con datos reales — se acabaron los numeros inventados.
- **Prompts extraidos** a `src/app/core/prompts/` (system, coach, insight, recommendation) con un bloque de patrones que inyecta los insights al contexto del modelo.
- **Action chips** en el chat: cuando la IA ejecuta una tool, aparece un chip clickeable debajo de la respuesta con el resumen del cambio (estado exito/error + link al recurso creado).
- **Loop de tools** con budget (max 5 turnos de tool-call, `maxTokens` subido a 2048 cuando hay tools activas).
- **Dispatcher** (`AIActionDispatcherService`) que valida argumentos, llama a las variantes Observable de `HabitService` (`createHabitReturning`, `updateHabitReturning`, `archiveHabitReturning`) y correlaciona resultados por `toolCallId`.
- **Interface + injection token `AICoachRepository`** listos para persistencia multi-sesion (implementacion en Iter 4).
- **Deuda removida**: hardcode de `perfectWeeks/perfectMonths` en dashboard reemplazado por signals del engine; `gamification.service` ya no escribe `localStorage` directo (va por repo via nuevo `saveChallenges`); boilerplate de `app.component.html` borrado.
- **Tests unitarios**: specs Jasmine/Karma para `xp.utils`, `streak.utils` y `HabitInsightEngineService`.

## Novedades — Elevacion Phase 5 (Evolucion a Routine Tracker)

El modelo de dominio evoluciono de `Habit` plano + `HabitCompletion` a un pipeline estructurado `Routine → Task → RoutineInstance → TaskCompletion`, absorbiendo las mejores ideas del plan "Control" sin reescribir el frontend.

- **Modelo de dominio Routine** (`src/app/models/routine.model.ts`): union discriminada `ScheduleConfig` (daily/weekly/monthly/custom cron), `RoutineInstance` con ciclo de estados (Pending → InProgress → Completed | Skipped | Missed), tracking de completado por tarea con `completion_score`.
- **Pipeline de behavior tracking** (`BehaviorTrackerService`): cola debounce (1.5s), flush batch al repositorio, handler `visibilitychange` → `navigator.sendBeacon` preparado para swap a HTTP. Enum `BehaviorEventType` cubre 11 tipos de eventos.
- **Reminders programados** (`ScheduledReminderService`): materializa `ScheduledReminder[]` desde `ReminderPreference` por rutina, integra Capacitor `LocalNotifications` como canal local.
- **6 nuevos repositorios** detras de InjectionTokens: `RoutineRepository`, `RoutineInstanceRepository`, `TaskCompletionRepository`, `BehaviorRepository`, `ReminderRepository`, `RoutineStreakRepository` — todos con implementaciones localStorage y specs completos.
- **RoutineAdapterService**: `Habit` legado coexiste como `Routine` virtual de 1 tarea. Dashboard, achievements e IA tools siguen funcionando durante la transicion.
- **Feature `routines/`** con rutas lazy-loaded: index (grid de cards), hoy (checklist agregada), detalle (instancia + task rows), crear/editar (formulario multi-step con tabs Basics / Schedule / Tasks).
- **Componentes UI**: `RoutineCard`, `TaskRow`, `StreakBadge`, `CompletionRing` (SVG), `BottomNav` mobile-first, `EmptyState` reutilizable.

## Novedades — Fase 5e (Motor adaptativo + elevacion UI/UX)

El dominio de rutinas paso de tracker pasivo a coach adaptativo:

- **`AdaptiveRecommendationsService`**: detecta drift de horario (hora dominante de los completions vs `timeWindowStart` programado), rutinas perdidas (3+ dias programados sin completar) y celebraciones de racha pendientes. `runAll()` es single-flight, expone signal `proposedSuggestions`.
- **`AdaptiveSuggestion` + repositorio**: payloads de union discriminada (`time_window_adjust` | `streak_celebration` | `missed_routine` | `task_reorder`), repo localStorage con dedup via `hasOpenForRoutineAndType`, snapshot del schedule previo para revert.
- **5 nuevas tools IA** (8 totales en el catalogo): `create_routine`, `complete_task`, `accept_time_window_adjustment`, `dismiss_adaptive_suggestion`, `celebrate_streak`. El dispatcher valida args, llama al servicio correcto y expone resourceRoute `/routines/:id` en los action chips.
- **Trigger app-open + intervalo**: `app.component` corre `runAll()` en init, en `visibilitychange → visible`, y cada 30 min mientras la app este foreground.
- **Elevacion UI/UX** de `routines/`:
  - Heros con gradiente por pagina (slate→violet en index, indigo→fuchsia en hoy, color de rutina en detalle).
  - `routines-today` agrupa por franja horaria (Manana/Tarde/Noche/Flexible) con stats card y saludo contextual.
  - Skeleton loader en primer paint, suggestion cards con paletas (amber/emerald/indigo) y slide-up animation.
  - `routine-detail` integra `AdaptiveSuggestionCardComponent`, reemplaza `confirm()` nativo por `app-modal`, footer sticky de acciones, dispara eventos `BehaviorTrackerService` (routine_opened, task_checked, suggestion_accepted/dismissed).
- **Specs**: `adaptive-recommendations.service.spec.ts` cubre creacion de celebracion de racha, propuesta de time-window con threshold de muestras, agregacion de `runAll`, y aplicacion de time-window con snapshot.

## Caracteristicas

### Sistema de habitos
- Crear, editar, archivar y eliminar habitos
- Tipos: **construir** buenos habitos o **dejar** malos habitos
- Frecuencias: diario, entre semana, fines de semana, semanal, custom
- 7 categorias: salud, ejercicio, productividad, mindfulness, social, aprendizaje, custom
- Tracking de completados con historial
- Rachas con calculo inteligente por frecuencia (dias no programados no rompen la cadena)
- Calendario heatmap estilo GitHub
- Tasa de completado y estadisticas

### Tracker de Rutinas (Fase 5 — Fase 5e completada)
- Crear, editar y eliminar **rutinas multi-tarea** (no solo habitos individuales)
- **Tareas por rutina** con orden, estimacion de duracion, y horas sugeridas adaptativas
- **Instancias de rutina** por dia: ciclo de estado (Pendiente → En progreso → Completada | Saltada | Perdida)
- Tracking de completado por tarea con **puntaje de finalizacion** (0-100)
- **Rachas por rutina**: actual, maxima, celebracion pendiente
- Tipos de horario: diario, semanal (elegir dias), mensual (dia del mes), cron personalizado
- **Pipeline de tracking de comportamiento**: 11 tipos de eventos con flush por lotes
- **Reminders programados** materializados por rutina desde preferencias, con integracion Capacitor LocalNotifications
- **Coexistencia legado**: habitos antiguos funcionan como rutinas virtuales de 1 tarea via adaptador

### Gamificacion
- **Sistema de XP**: gana experiencia al completar habitos
- **Niveles**: del Novato (1) al Leyenda (10) con progresion exponencial
- **16 logros** predefinidos en 6 categorias (rachas, consistencia, variedad, hitos, explorador, nivel)
- **Desafios semanales** generados automaticamente
- **Puntos canjeables** que se ganan al subir de nivel
- **Feedback visual**: popups de XP flotantes, modal de level-up con particulas, toasts de logros desbloqueados

### Inteligencia Artificial
- **Multi-proveedor**: Anthropic Claude y Google Gemini con cambio dinamico
- **Tool-use nativo** (Iter 1): la IA puede crear, ajustar y archivar habitos directamente desde el chat
- **Action chips**: cada accion de la IA aparece como chip clickeable con enlace al recurso
- **Insight diario**: analisis personalizado respaldado por signals reales del motor de insights
- **Sugerencias IA**: recomendaciones de nuevos habitos basadas en tu perfil y patrones detectados
- **Coach IA**: chat conversacional para motivacion, consejos y analisis (ahora con ejecucion de acciones)
- **Fallback offline**: mensajes motivacionales e insights contextuales cuando no hay API key configurada
- **Configuracion flexible**: elige proveedor, modelo y API key desde el perfil
- **Modelos soportados**: Claude Sonnet 4, Claude Haiku 4.5, Gemini 2.0 Flash, Gemini 2.5 Pro/Flash

### Dashboard
- Saludo personalizado con hora del dia
- Barra de XP con nivel actual
- Estadisticas rapidas (habitos hoy, completados, puntos, mejor racha)
- Barra de progreso diario
- Desafios activos
- Lista de habitos de hoy con toggle rapido
- Vista de mejores rachas

### UI/UX
- Navegacion con sidebar (desktop) y bottom nav (mobile)
- Routing lazy-loaded para cada seccion
- Animaciones fluidas (fade-in, slide-up, bounce, shimmer)
- Sistema de notificaciones toast
- Modales reutilizables
- Soporte para accesibilidad (`prefers-reduced-motion`)
- Componentes responsivos

## Stack tecnologico

| Tecnologia | Uso |
|------------|-----|
| **Angular 19.2 Zoneless** | Framework frontend — 100 % standalone components, `OnPush` universal, sin `zone.js` en el bundle de runtime |
| TypeScript 5.7 | Tipado estatico end-to-end |
| **Tailwind CSS v4** con `@theme` | Utility-first, config CSS-first, paleta **`oklch()`** perceptualmente uniforme |
| **Angular Signals** + `linkedSignal` + `effect` | Estado reactivo fine-grained; las unicas instancias de `effect()` puentean a DOM (`data-control-state`) y storage |
| RxJS 7 | Solo en repositorios HTTP-boundary (forma Observable es el API de Angular HTTP) |
| `@angular/core/rxjs-interop` | `toSignal` / `toObservable` para puentear consumidores legacy |
| Jasmine + Karma | Testing unitario (83 specs, todos verdes) |
| localStorage | Persistencia temporal (hasta Fase 5g) |
| Capacitor | Apps nativas Android/iOS |
| `@capacitor/local-notifications` | Materializacion de reminders programados (Fase 5d) |

## Arquitectura

```
src/app/
  core/
    interfaces/          # Contratos de repositorios (InjectionToken)
    repositories/        # Implementaciones localStorage
    services/            # Logica de negocio (Signals-based)
      habit-insight-engine.service.ts   # motor de patrones deterministico
      ai-action-dispatcher.service.ts   # ejecutor de tool-calls
      ai.service.ts                     # tool loop + snapshot
      routine.service.ts                # Phase 5b — CRUD rutinas + signals
      routine-instance.service.ts       # Phase 5b — instancias + completado de tareas
      behavior-tracker.service.ts     # Phase 5d — eventos batch debounce
      scheduled-reminder.service.ts   # Phase 5d — materializacion de reminders
      control-state.service.ts        # Fase 6 — linkedSignal `action | calm` + effect puente DOM
    utils/               # Utilidades (fechas, rachas, XP)
    providers/
      ai/
        anthropic.provider.ts           # reescrito — bloques tool-use
        gemini.provider.ts              # reescrito — functionCall/functionResponse
        tools/                          # NUEVO — catalogo + translators
    prompts/                            # NUEVO — builders de prompts extraidos
  models/                # Tipos del dominio (ai.model extendido con tool types)
  shared/
    components/
      layout/            # App shell, sidebar, bottom nav
      ui/                # Reusables (toast, modal, progress-bar, ai-coach-chat...)
                         # conviction-button/ — Fase 6 — press-and-hold (friccion = feature)
    pipes/
  features/
    dashboard/
    habits/                  # Legado — coexiste durante transicion
    routines/                # Phase 5c — index, hoy, detalle, form, analytics
    achievements/
    rewards/
    profile/
```

### Modelos de dominio (Phase 5a)
- `src/app/models/routine.model.ts` — `Routine`, `Task`, `RoutineInstance`, `TaskCompletion`, `RoutineStreak`, `ScheduleConfig` union discriminada
- `src/app/models/behavior.model.ts` — `BehaviorEventType` enum, `UserBehaviorEvent`
- `src/app/models/reminder.model.ts` — `ReminderPreference`, `ScheduledReminder`, `ReminderChannel`, `ReminderStatus`

### Patrones clave
- **Repository Pattern**: capa de datos desacoplada detras de injection tokens, localStorage hoy — swap a backend manana
- **Zoneless + Signals + OnPush**: reactividad fine-grained, sin tree-traversal de `zone.js`
- **`linkedSignal` para estado derivado-escribible**: `ControlStateService` es el ejemplo canonico — `action | calm` derivado del cumplimiento, con override manual que se auto-resetea al cambiar la fuente
- **`effect()` reservado para puentes de infraestructura**: DOM (`data-control-state`), `localStorage`, `Capacitor.Preferences`. Nunca para propagar estado entre componentes.
- **Tokens de diseno CSS-first**: un solo flip de `:root[data-control-state]` arrastra el tema entero; cero JS en runtime para cambiar colores
- **Granularidad `@defer`**: modulos pesados (AI coach) salen del bundle inicial y se precargan cuando el navegador queda idle
- **Lazy loading**: cada feature carga bajo demanda
- **Standalone components**: sin NgModules, imports explicitos
- **Tools IA agnosticas del proveedor**: un catalogo, translators por proveedor (`toAnthropicTools`, `toGeminiTools`)
- **Friccion como feature**: `ConvictionButtonComponent` requiere press-and-hold sostenido para completar acciones de alto impacto

## Instalacion y scripts

```bash
# Instalar dependencias
npm install

# Desarrollo
npm start

# Build produccion
npm run build:prod

# Otros scripts
npm run build          # build estandar
npm run watch          # build en watch
npm test               # tests unitarios (Karma)
```

## Capacitor (Android/iOS)

Capacitor esta integrado. Archivo: `capacitor.config.ts` con `webDir: dist/todo-app/browser`.

```bash
# Instalacion inicial de plataformas (una sola vez)
npm i @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios

# Flujo de actualizacion
npm run build:prod
npx cap sync

# Abrir proyectos nativos
npm run cap:android   # Android Studio
npm run cap:ios       # Xcode (macOS)

# Diagnostico
npx cap doctor
```

### Notas para Windows
- Ejecutar comandos de Capacitor en PowerShell o CMD (evitar Git Bash)
- Si aparece `spawn EINVAL`, asegurarse de no usar Git Bash
- `webDir` = `dist/todo-app/browser` en `capacitor.config.ts`

## Roadmap

### Fase 4.1 — Iter 1 (Completada)
- Fundacion IA con tool-use nativo
- `HabitInsightEngineService` alimentando todos los prompts
- Prompts extraidos, action chips en el chat, deuda removida
- Tests unitarios para insight engine + xp/streak utils

### Fase 4.2 — Iter 2–7 (En progreso)
- **Iter 2**: Dashboard vivo (hero card, focus-today, sparklines SVG, barras por dia)
- **Iter 3**: Habitos profundos (wizard, templates, tabs de detalle, creacion via IA)
- **Iter 4**: Coach de verdad (persistencia multi-sesion, weekly review, chat streaming)
- **Iter 5**: Gamificacion con alma (catalogo de recompensas con temas/avatares/titulos, logros con tiers, modales de milestone de racha)
- **Iter 6**: Perfil + journeys + onboarding (dark mode, onboarding, journeys 21/30/66 dias)
- **Iter 7**: Mobile polish (notificaciones locales, haptics, modales custom sobre confirms nativos)

### Fase 5a — Modelos de dominio Routine + repositorios localStorage (Completada)
- `Routine`, `Task`, `RoutineInstance`, `TaskCompletion`, `RoutineStreak`, `ScheduleConfig` union discriminada
- `BehaviorEventType`, `UserBehaviorEvent`
- `ReminderPreference`, `ScheduledReminder`, `ReminderChannel`, `ReminderStatus`
- 6 nuevas interfaces de repositorio + implementaciones localStorage con InjectionTokens

### Fase 5b — Servicios de rutinas + adaptador Habit→Routine (Completada)
- `RoutineService` con signals: activeRoutines, todayRoutines, filteredRoutines
- `RoutineInstanceService` con getOrCreateForDate, toggleTaskCompletion, recalculo completionScore
- `RoutineAdapterService`: `Habit` legado coexiste como `Routine` virtual de 1 tarea
- `MigrationService` v1→v2: inicializa nuevas claves localStorage

### Fase 5c — Feature `routines/` UI (Completada)
- `routines.routes.ts`: index, hoy, nueva, :id/edit, :id
- Paginas: `RoutinesIndexPageComponent`, `RoutinesTodayPageComponent`, `RoutineDetailPageComponent`, `RoutineFormPageComponent`
- Componentes: `RoutineCard`, `TaskRow`, `StreakBadge`, `CompletionRing` (SVG), `BottomNav`
- Formulario multi-step: Basics / Schedule / Tasks tabs

### Fase 5d — Behavior tracking + reminders programados (Completada)
- `BehaviorTrackerService`: cola debounce (1.5s), flush batch a `BehaviorRepository`, handler `visibilitychange`
- `ScheduledReminderService`: materializa reminders desde preferencias, integracion Capacitor `LocalNotifications`
- 11 tipos de eventos trackeados

### Fase 5e — Motor adaptativo + tools IA para rutinas + elevacion UI/UX (Completada)
- `AdaptiveRecommendationsService`: `updateSuggestedTimes`, `flagMissedRoutines`, `flagStreakCelebrations`, `adjustTimeWindows`, `runAll()` con guard single-flight
- Modelo `AdaptiveSuggestion` + `IAdaptiveSuggestionRepository` + impl localStorage con dedup
- 5 nuevas tools IA conectadas al dispatcher: `create_routine`, `complete_task`, `accept_time_window_adjustment`, `dismiss_adaptive_suggestion`, `celebrate_streak`
- `AdaptiveSuggestionCardComponent` (Aceptar/Revertir/Descartar) integrado en detalle de rutina
- Trigger: en `app-open`, en `visibilitychange → visible`, e intervalo cada 30 min (un job backend lo reemplazara en Fase 5f)
- Elevacion UI/UX de `routines/`: heros con gradiente, skeleton loaders, agrupacion por franja horaria en Hoy, footer de acciones sticky + modal personalizado en detalle, integracion `BehaviorTrackerService`

### Fase 5f — Backend NestJS scaffolding (Pendiente)
- NestJS + TypeORM + PostgreSQL + JWT + `@nestjs/schedule` + `@nestjs/throttler`
- Endpoints: routines CRUD, instancias, completions, behavior batch, reminders, adaptativo
- Jobs: `GenerateInstancesForDate` (23:55), `DispatchTodayReminders` (cada 5m), `RunAdaptiveAnalysis` (03:00)

### Fase 5g — Repositorios HTTP + push real Capacitor (Pendiente)
- `*-http.repository.ts` espejo de `*-local.repository.ts`
- Cambio de binding en `app.providers.ts`
- `@capacitor/push-notifications`: backend dispatches via FCM/APNs

### Fase 5h — Rebrand: TaskMaster → ControlMaster (Pendiente)
- Renombrar package.json, capacitor.config.ts, angular.json, dist/
- Bundle id `com.centur.controlmaster`
- Flag `routinesV2Enabled`, warning de deprecacion en /habits
- Migracion v2→v3: limpieza de claves legado Habit

### Fase 6 — Iter 1 (Completada) — Elevated Design System
- ✅ Zoneless change detection (`provideExperimentalZonelessChangeDetection`)
- ✅ `OnPush` estricto en el 100 % de los componentes
- ✅ Conteo de `BehaviorSubject` = 0; `signal` / `computed` / `linkedSignal` / `effect` en toda la app
- ✅ `@defer (on idle; prefetch on idle)` para `<app-ai-coach-chat />`
- ✅ Tailwind v4 `@theme` con paleta completa de tokens `oklch()` + flip dual `data-control-state`
- ✅ Glassmorphism erradicado (`backdrop-blur` = 0 en el arbol vivo)
- ✅ `ConvictionButtonComponent` con UX press-and-hold
- ✅ Indireccion por alias de marca: 118 referencias `indigo-*` / `purple-*` re-tokenizan sin tocar plantillas

### Fase 6 — Iter 2 (Pendiente)
- Tipografia brutalista self-hosted (display monoespaciada + Inter en body)
- Refactor de los hero gradients hacia superficies Quiet UI totalmente solidas
- Bloques `@defer` adicionales en `profile-page`, `habit-detail-page`, `routine-form-page`
- PWA con Service Worker (cache-first + network-first)
- Push notifications para recordatorios (Capacitor)
- Virtual scrolling para listas largas

## Contribuir

1. Fork el repositorio
2. Crea una branch (`git checkout -b feature/nueva-feature`)
3. Commit tus cambios (`git commit -m 'Add nueva feature'`)
4. Push a la branch (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

---

TaskMaster — Transforma tus habitos, transforma tu vida

---

## ☕ Apoya el proyecto

TaskMaster es y seguira siendo un proyecto de codigo abierto. Sin embargo, mantener la infraestructura, cubrir los costos de las APIs de Inteligencia Artificial (Claude y Gemini) y dedicar tiempo a desarrollar nuevas funciones como la **Tienda de Premios Reales** requiere recursos.

Si encuentras valor en esta herramienta y quieres ayudar a que siga creciendo, cualquier donacion es enormemente agradecida.

| Plataforma | Enlace |
|------------|--------|
| **PayPal** | [Haz una donacion aqui](https://www.paypal.com/donate/?hosted_button_id=DQ6ZXFQMBALKL) |

> **Nota:** Tu apoyo ayuda directamente a financiar los creditos de IA para que mas usuarios puedan disfrutar de los insights personalizados y el Coach IA.

---

<!--
  =================================================================
  EASTER EGG — Rebrand ControlMaster
  =================================================================

  Si estas leyendo esto, has encontrado el Easter Egg oficial.

  TaskMaster esta evolucionando hacia ControlMaster.
  El nombre cambia, pero la mision sigue igual:
  ayudarte a tomar el CONTROL de tus rutinas, habitos y dia a dia
  con inteligencia adaptativa y gamificacion.

  Phase 5h (el rebrand final) desbloqueara:
  - com.centur.controlmaster bundle ID
  - "ControlMaster" en tu pantalla de inicio
  - El mismo corazon de IA, ahora con un nombre que dice lo que hace.

  Mientras tanto... sigue construyendo esas rutinas.
  Cada checkmark es un paso hacia el control total.

  #ControlIsComing

  =================================================================
-->
