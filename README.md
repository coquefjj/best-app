# BEST app

A simple installable web app (PWA) that tracks Fernando's 100-day hybrid athletic plan: workouts, food/macros, daily behaviors, and progress.

Built with React + TypeScript + Vite. Data is stored locally on your device (no backend, no account). Meant to be installed to your phone's home screen from Chrome ("Add to Home screen") for an app-like experience, offline included.

## Screens

- **Today** — day X of 100, today's session, mobility + quick habits, protein/calorie progress.
- **Workout** — the day's strength exercises (with interchangeable variants like "RDL or single-leg RDL", last-time weight/reps shown as a placeholder) or the day's aerobic/conditioning modality picker.
- **Food** — log meals manually or from saved meals; totals vs. today's protein/calorie target (targets shift on hard training days).
- **Habits** — water, sleep, resting heart rate, morning weight, phone/reading/meditation/alcohol checkboxes, and the every-2-week waist check-in.
- **Progress** — weekly adherence, weight trend, waist trend, and an overreaching alarm if resting heart rate is climbing.

The plan itself (weekly template, exercises, phases, nutrition targets) is encoded in `src/data/plan.ts`, straight from the uploaded 100-day plan.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Roadmap

- Native Android wrapper (Capacitor) for Health Connect / Zepp sync and automatic screen-time tracking.
- AI-assisted food logging from a typed description.
