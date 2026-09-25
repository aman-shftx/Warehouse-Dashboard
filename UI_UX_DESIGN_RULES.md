# 🎨 UI/UX Design System & Engineering Rules
> Sourced and synthesized from **designmotionhq.com** (UX Engine, 76 UI Pattern Breakdowns, Reverse-Engineered Linear, and De-AI Design Systems).
> **Purpose**: A comprehensive guide for building fast, high-density, professional web applications that feel engineered, human, and distinctly non-AI.

---

## 1. The Core Philosophy: "Stop Shipping Database-Shaped Interfaces"

AI code generators typically produce "schema browsers" — dumping 12 raw database columns into a table, placing Edit next to Delete with equal weight, burying search, and calling it a dashboard. 

### Golden Rules:
1. **Build for User Intent, Not the Database Schema**:
   - Don't display every column in the table. Show the **4 to 6 columns** the operator needs to make a decision.
   - Secondary fields belong in a detail sheet, drawer, or expandable row.
2. **Search is Primary, Not an Afterthought**:
   - Put search front and center. It is what users open the page to do.
3. **Destructive Actions Require Friction**:
   - Never put Delete/Archive right next to Edit with equal visual prominence.
   - Put destructive actions in an overflow menu (`...`) with typed confirmation or a two-step dialog.
4. **Concrete Over Adjectives**:
   - Avoid generic AI buzzwords: *"Supercharge your warehouse operations with AI insights"*.
   - Use concrete, outcome-driven language: *"704,495 units across 345 SKUs. 12 items need reorder."*

---

## 2. Visual Character & The "Reverse-Engineered Linear" Standard

Why do tools like Linear, GitHub, and Stripe feel expensive and fast? Five exact engineering decisions:

### Rule 2.1: Density Reads as Competence
- Use **13px (`text-[13px]`) font size** for data rows, with line-height tight (`leading-5`).
- Pull letter spacing in slightly: `tracking-[-0.01em]` or `tracking-tight`.
- Target **32px to 36px row heights** in tables, not 60px padding.
- *Result*: A user sees 15–20 rows on a standard laptop screen without scrolling, giving an instant command-center feel.

### Rule 2.2: Depth Comes from Value, Not Blur
- **Kill drop shadows on interior elements**: No `shadow-lg` or blurry drop shadows on tables, panels, or sidebars.
- **Stack 3 Background Tonal Values**:
  1. `Base Background` (e.g., `#090d16` in dark mode, or `#f8fafc` in light mode)
  2. `Surface / Card` (e.g., `#0f172a` dark, `#ffffff` light)
  3. `Raised Surface / Hover` (e.g., `#1e293b` dark, `#f1f5f9` light)
- **Use Hairline Borders**: Separate layers with a 1px border at 6% to 10% opacity (`border-slate-200/80` or `border-white/10`).
- **Hover changes tone, not elevation**: Hover states should gently shift background lightness (`hover:bg-slate-50`), never pop out with a huge shadow. Flat surfaces look engineered; shadows look decorated.

### Rule 2.3: One Color, Used Twice
- **Spend color like currency**:
  - Pick **one single accent color** (e.g., Indigo `#6366f1` or Emerald `#10b981`).
  - Use it exclusively on:
    1. The primary call-to-action button.
    2. The selected/active state (e.g. active tab, active nav item).
- **No Rainbow Status Badges**:
  - Don't use 7 different bright neon pills for statuses.
  - Collapse status indicators to subtle, muted badges or small grey/monochrome icons. Reserve red exclusively for true blockers or 0-stock emergencies.

### Rule 2.4: Micro-Feedback & The 100ms Budget (Doherty Threshold)
- Every user action must acknowledge interaction within **100ms**:
  - Hover feedback: ~**80ms**.
  - Transitions: strictly **under 150ms** (`transition-all duration-150`).
  - **No spring bounce or sluggish easing**: Snappy, linear, or ease-out curves only. The UI should answer before the user's hand finishes the gesture.
- Show keyboard shortcut hints where applicable (`⌘K` for search, `Esc` to close).

### Rule 2.5: The 4px Grid & Strict Alignment
- **Labels, titles, and IDs**: Always **left-aligned**.
- **Quantities, metrics, and dates**: Always **right-aligned** (enables rapid eye scanning of decimal digits).
- **Never center numbers in data tables**: Centered numbers make scanning digit magnitudes impossible.
- **Icons**: Standardize to 16px (`w-4 h-4`) or 14px (`w-3.5 h-3.5`), vertically centered on the text cap-height.

---

## 3. Data Visualization: "Charts That Lie (and How to Tell the Truth)"

Charts are functional communication tools, not decorative graphs:

1. **Y-Axis Always Starts at Zero**:
   - Truncating a baseline to exaggerate a small variance turns a +3% wiggle into an apparent crisis or 300% spike. Never truncate bar charts.
2. **Aspect Ratio Dictates Perception**:
   - Don't stretch a time series chart across 100% width if the data is sparse, and don't squash it so trends look like cliffs. Aim for an average trend slope near **45°**.
3. **Maximize the Data-Ink Ratio**:
   - Strip boxed legends, dark heavy gridlines, background gradients, and 3D tilts.
   - Use ultra-light hairline gridlines (`#f1f5f9` or `#e2e8f0` with `strokeDasharray="3 3"`).
   - Label lines directly or show clean, single-point tooltips.
4. **Headline the Chart with the Takeaway**:
   - Bad: *"Warehouse Volume"*
   - Good: *"Overall Stock Volume: 704,495 units across 73 recorded dates"*

---

## 4. Search Experience as a System

Search is not just an `<input />`; it is a multi-state system:

1. **Descriptive Placeholder Copy**:
   - Bad: `placeholder="Search..."`
   - Good: `placeholder="Search by SKU code, product title, brand..."` (teaches users what attributes are indexed).
2. **Keyboard-First**:
   - Pressing `/` or `⌘K` immediately focuses search.
   - `Escape` clears the query and returns focus to the table.
3. **Instant Debounced Feedback**:
   - Client-side or instant server-filtered reaction within 150ms.
4. **Zero Results Recovery**:
   - Never show a dead-end screen with just "No data".
   - Always provide:
     - The exact phrase searched: *"No products matching 'xyz'"*
     - Clear recovery CTA: *"Clear search and reset filters"* button.

---

## 5. State Completeness: The 5 Fundamental Component States

Every component must explicitly handle and design all five states:

| State | Design Requirement |
|---|---|
| **1. Ideal / Populated** | Clean density, left-aligned text, right-aligned numbers, single accent color. |
| **2. Loading** | Match layout geometry (clean skeleton matching table rows), no layout shifts, no solitary spinning wheel in a blank desert. |
| **3. Empty (First Run)** | Informative icon, clear explanation, primary CTA to add/sync data. |
| **4. Empty (Filtered / No Results)** | Clarify that data exists but filters are too strict; include a 1-click "Reset Filters" action. |
| **5. Error / Offline** | Clear non-technical explanation, retry button, preserved user input. |

---

## 6. De-AI Design Checklist (Audit Before Shipping)

Before finishing any screen, run this **10-point De-AI checklist**:

- [ ] **No gradient purple/pink blobs** as decorative background smears.
- [ ] **No 12-column unreadable table**: Columns prioritized by business importance.
- [ ] **No twin equal buttons**: Only 1 primary button; secondary actions are subtle ghost/outline buttons.
- [ ] **No fake social proof or buzzwords**: Real units, real dates, real SKU codes.
- [ ] **Data alignment verified**: Numbers and dates right-aligned; text left-aligned.
- [ ] **Typography scale tight**: 11px captions, 13px table data, 14px body, 18px–20px page titles (no giant 48px headlines on utility pages).
- [ ] **Interactions under 150ms**: Zero sluggish bounce animations.
- [ ] **Focus rings visible**: Accessible, crisp focus rings on inputs and buttons (`ring-2 ring-indigo-500/20`).
- [ ] **Empty states provide a way out**: 1-click reset or action button.
- [ ] **Lineup Test**: If placed alongside 10 cookie-cutter AI apps, does this UI look like a bespoke, engineered tool built by a domain expert?
