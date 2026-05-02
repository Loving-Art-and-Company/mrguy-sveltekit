---
project: Mr. Guy Backoffice Suite
surfaces:
  - admin dashboard
  - bookings admin
  - revenue and business views
colors:
  workspaceBg: "#f3f4f6"
  sidebarNavy: "#1a1a2e"
  textPrimary: "#1a1a2e"
  textSecondary: "#6b7280"
  cardWhite: "#ffffff"
  activeAccent: "#e94560"
  infoBlue: "#3b82f6"
  successGreen: "#10b981"
  warningAmber: "#f59e0b"
typography:
  display: "system sans, utilitarian"
  body: "system sans"
spacing:
  compact: "0.75rem to 1rem"
  section: "1.5rem to 2rem"
radius:
  control: "0.5rem"
  card: "0.75rem"
elevation:
  card: "0 1px 3px rgba(0, 0, 0, 0.1)"
  hover: "0 4px 12px rgba(0, 0, 0, 0.15)"
---

# Design System: Mr. Guy Backoffice Suite

## Overview

This UI should feel operational, fast, and obvious. It inherits brand trust from the public site, but the admin is flatter, denser, and more utilitarian. The goal is to help one operator see bookings, money, and next actions without visual noise.

## Color Rules

- `sidebarNavy` defines the admin shell and navigation anchor.
- `activeAccent` marks the current route and urgent action states.
- White cards sit on a light gray workspace so dense information stays readable.
- Semantic colors should be used for status meaning, not decoration.

## Typography Rules

- Use clean system sans typography with medium-to-bold weights for hierarchy.
- Headings should be direct and functional.
- Small labels and metadata should remain readable on first scan.

## Layout Principles

- Sidebar navigation should stay stable and predictable.
- Top-level pages should open with a quick read on the current state, then fast actions.
- Favor grids, summary cards, and short tables over elaborate storytelling panels.
- The UI should work on mobile, but desktop operator flow is the main case.

## Elevation and Shape

- Cards use light shadows and modest rounding.
- Interactions should feel responsive, not animated for effect.
- White-on-gray contrast should do most of the visual separation work.

## Components

### Sidebar

- Dark navy base, light text, one strong accent for the active route.
- Icons can be emoji or simple glyphs if they improve scan speed.

### Summary Cards

- Use icon + title + number patterns.
- Numbers should dominate; supporting labels stay small and muted.

### Quick Actions

- Use simple tiles with a clearly differentiated primary action.
- Keep the action list short and tied to real operator tasks.

## Do

- Optimize for scan speed, task completion, and low cognitive load.
- Let status colors mean something consistent.
- Keep dense information visually calm.

## Do Not

- Do not import the public marketing site's gradients and flourish into the admin.
- Do not bury common actions in decorative layouts.
- Do not make the sidebar or stats cards visually ambiguous.
