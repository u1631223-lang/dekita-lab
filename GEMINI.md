# Gemini Code Assistant Context

This document provides context for the Gemini code assistant to understand the "Dekita Lab" project.

## Interaction Guidelines

-   **Language:** Please conduct all interactions in **Japanese**. (ユーザーとのやり取りは、すべて日本語で行ってください。)

## Project Overview

**Dekita Lab** is a neuroscience-informed learning game prototype for children aged 4–7. Its core purpose is to deliver joyful "できた！" (I did it!) moments while reassuring caregivers.

-   **Phase 1 Goal**: A web-based MVP featuring two mini-games:
    -   **Rhythm Tap** (Auditory Memory)
    -   **Pair Match** (Visuospatial Memory)
-   **Core Features**: The application includes adaptive difficulty, multi-sensory rewards, and a caregiver-facing progress summary.
-   **Long-term Vision**: Evolve into a PWA and potentially native apps, with a privacy-first design (conscious of COPPA/GDPR).

## Project Structure

The project is structured as a monorepo using pnpm workspaces.

-   `front/`: The main web client application.
-   `docs/`: Project documentation, including architecture, requirements, and design materials.
-   `backend/`: (Planned) For future API development.
-   `ops/`: (Planned) For deployment and CI scripts.

## Tech Stack

-   **Frontend**: **Vite, React 18, and TypeScript**.
-   **State Management**: **Zustand** for global state, with data persisted to IndexedDB via `idb-keyval`.
-   **Styling**: **Tailwind CSS** with PostCSS.
-   **Audio**: `howler.js` for managing sound effects.
-   **Internationalization (i18n)**: `react-i18next`.
-   **Testing**:
    -   **Vitest** for unit and logic tests.
    -   **Playwright** for end-to-end and UI flow tests.
    -   **Storybook** for UI component development and review.
-   **Tooling**: `pnpm` for package management, with ESLint, Prettier, and Stylelint for code quality.

## Building and Running

-   **Install Dependencies:**
    ```bash
    pnpm install
    ```
-   **Run Development Server:**
    ```bash
    pnpm --filter front dev
    ```
-   **Build for Production:**
    ```bash
    pnpm --filter front build
    ```
-   **Run Tests:**
    -   Unit Tests (Vitest): `pnpm --filter front test`
    -   UI/E2E Tests (Playwright): `pnpm --filter front test:ui`
-   **Run Storybook:**
    ```bash
    pnpm --filter front storybook
    ```

## Development Conventions

-   **TypeScript First**: The project uses strict TypeScript. Game modules adhere to a shared interface (`init`, `startRound`, `evaluate`, `cleanup`).
-   **UI/UX Principles**:
    -   Aim for WCAG 2.1 AA accessibility standards (e.g., contrast, large touch targets).
    -   Reward feedback (visual, auditory) should occur within 0.5 seconds of the user's action.
-   **Linting**: Enforced via `pnpm --filter front lint`.
-   **Documentation**: Key decisions and plans are kept in the `docs/` directory.

## External Services
- name: Serena MCP
  type: http
  description: AIプロジェクト管理用MCPサーバー
  endpoint: http://localhost:11434
  auth: none