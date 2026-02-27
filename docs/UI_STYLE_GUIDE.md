# UI Style Guide (Pokedex Wiki Pro)

This guide defines the visual baseline for new UI work in this project.

## 1. Design Intent
- Keep the interface readable first, decorative second.
- Preserve the Pokedex identity with metallic surfaces, soft glow, and controlled motion.
- Prefer neutral surfaces with accent color highlights instead of fully saturated panels.

## 2. Core Tokens
- Accent color: `--theme-accent`
- Accent soft layer: `--theme-accent-soft`
- Border tone: `--theme-border`
- Rounded card radius: `rounded-2xl`
- Primary component shadow: soft outer shadow + subtle inner highlight

## 3. Cards
- Base state should use one border and one soft shadow.
- Hover state should only slightly increase elevation and border contrast.
- Selected state must include:
  - accent halo
  - side accent rail
  - subtle shine treatment
- Card content should use stable heights when shown in a grid.

## 4. Buttons
- Use pixel font for control buttons (`pixel-font`) when semantically aligned with Pokedex controls.
- Keep one clear primary action per area.
- States required: default, hover, active/pressed, disabled, focus-visible.

## 5. Inputs
- Inputs should keep high contrast text and placeholder.
- Focus should use an accent ring (`theme-accent`) with visible border upgrade.
- Avoid dense control clusters; keep minimum spacing with `gap-2` or higher.

## 6. Badges
- Type badges should remain compact and avoid overflow in cards.
- When embedded in constrained spaces, prefer smaller badge variants (e.g. `h-6`, `text-[8px]`).

## 7. Motion
- Motion must be additive, never distracting.
- Recommended durations:
  - micro interactions: `120ms-180ms`
  - card/surface transitions: `220ms-320ms`
  - decorative loops: `2.4s-6s`
- Always provide reduced-motion fallback with `@media (prefers-reduced-motion: reduce)`.

## 8. Loading States
- Use skeleton placeholders that match final layout dimensions.
- Avoid plain text-only loaders for major modules.
- Keep skeleton animation subtle and consistent across modules.

## 9. Region Color Rules
- Region cards should use neutral base layers with tinted accents.
- Accent color should appear on borders, labels, rails, and progress indicators.
- Avoid fully saturated card backgrounds when multiple region cards are visible at once.

## 10. Implementation Notes
- Shared visual rules belong in `app/globals.css`.
- Reusable loading UI belongs in `components/PokedexSkeletons.tsx`.
- Prefer extending current components over creating duplicate variants.
