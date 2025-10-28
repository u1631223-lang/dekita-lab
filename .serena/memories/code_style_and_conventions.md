# Code Style & Conventions
- TypeScript-first with strict typings; mini-game modules implement shared interface (`init/startRound/evaluate/cleanup`).
- Zustand stores for explicit state; IndexedDB persistence via idb-keyval with graceful fallback.
- UI aims for WCAG 2.1 AA contrast, large touch targets, bilingual text using react-i18next.
- Reward logic enforces multi-sensory feedback under 0.5s and variable-ratio reinforcement.
- Documentation kept in `docs/`; tickets tracked in `docs/tickets.md` with status updates tied to project purpose.