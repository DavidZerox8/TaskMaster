# TaskMaster — AI-Powered Habit Platform with Gamification

TaskMaster is an intelligent platform for building good habits and breaking bad ones, powered by AI (Anthropic Claude / Google Gemini) and a gamification system with points redeemable for real rewards. Built with Angular 19 and ready to ship as a native mobile app via Capacitor.

> [Leer en Español](#taskmaster--plataforma-de-habitos-con-ia-y-gamificacion)

## Table of contents
- [Project status](#project-status)
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
| Phase 6 | Performance, PWA and polish | Pending |

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
| Angular 19.2 | Frontend framework (standalone components, Signals, OnPush) |
| TypeScript | End-to-end static typing |
| Tailwind CSS v4 | Utility-first styling (config-in-CSS) |
| Angular Signals | Reactive state |
| RxJS | Repository layer (Observable-based) |
| Jasmine + Karma | Unit testing |
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
- **Signals + OnPush**: fine-grained reactivity without zone.js overhead
- **Lazy loading**: every feature loads on demand
- **Standalone components**: no NgModules, explicit imports
- **Provider-agnostic AI tools**: single catalog, per-provider translators (`toAnthropicTools`, `toGeminiTools`)

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

### Phase 6 — Performance, PWA and polish
- Zoneless change detection (experimental)
- `@defer` blocks for heavy-component lazy load
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

# TaskMaster — Plataforma de Habitos con IA y Gamificacion

TaskMaster es una plataforma inteligente para adoptar buenos habitos y dejar malos habitos, potenciada con IA (Anthropic Claude / Google Gemini) y un sistema de gamificacion con puntos canjeables por premios reales. Construida con Angular 19 y preparada para ejecutarse como app movil nativa con Capacitor.

> [Read in English](#taskmaster--ai-powered-habit-platform-with-gamification)

## Tabla de contenidos
- [Estado del proyecto](#estado-del-proyecto)
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
| Fase 6 | Rendimiento, PWA y polish | Pendiente |

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
| Angular 19.2 | Framework frontend (standalone components, Signals, OnPush) |
| TypeScript | Tipado estatico end-to-end |
| Tailwind CSS v4 | Utility-first (config en CSS) |
| Angular Signals | Estado reactivo |
| RxJS | Capa de repositorios (Observable-based) |
| Jasmine + Karma | Testing unitario |
| localStorage | Persistencia temporal (hasta Fase 5) |
| Capacitor | Apps nativas Android/iOS |

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
- **Signals + OnPush**: reactividad fine-grained sin overhead de zone.js
- **Lazy loading**: cada feature carga bajo demanda
- **Standalone components**: sin NgModules, imports explicitos
- **Tools IA agnosticas del proveedor**: un catalogo, translators por proveedor (`toAnthropicTools`, `toGeminiTools`)

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

### Fase 6 — Rendimiento, PWA y polish
- Zoneless change detection (experimental)
- `@defer` blocks para lazy load de componentes pesados
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
