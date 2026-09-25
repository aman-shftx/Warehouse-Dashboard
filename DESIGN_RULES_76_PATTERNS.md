# 📘 The Complete 76 UX Pattern Breakdowns & Design System Rules
> Sourced directly from **designmotionhq.com** (All 76 video breakdowns, key insights, and Do/Don't engineering rules).
> A master reference for building high-performance, dense, non-AI-looking interfaces.

---

## 📑 Table of Contents by Functional Category

1. [Data Tables, Search & Data Display (Patterns 1–10)](#1-data-tables-search--data-display)
2. [Visual Hierarchy, Depth & Styling (Patterns 11–26)](#2-visual-hierarchy-depth--styling)
3. [Speed, Feedback & Loading States (Patterns 27–42)](#3-speed-feedback--loading-states)
4. [Forms, Inputs & Validation (Patterns 43–57)](#4-forms-inputs--validation)
5. [Navigation, Modals & User Control (Patterns 58–76)](#5-navigation-modals--user-control)

---

## Data Tables, Search & Data Display

### 1. Data Table
- **Slug**: `data-table`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Numbers must line up — use tabular figures and right-align numeric columns so every digit sits on the same grid. Proportional, left-aligned digits jitter and can't be compared at a glance.
- Freeze what you navigate by: keep the header sticky on vertical scroll and freeze the first column on horizontal scroll, each with a subtle shadow so labels never scroll out of reach.
- Treat density as a token, not a guess — one control switching row heights (e.g. 36 / 48 / 60px) gives a predictable rhythm. Zebra stripes help at comfortable spacing; collapse to a single hairline as rows compact.
- Make the whole row the selection target — full tint + an accent left bar + the checkbox — instead of a tiny checkbox-only hit area that's easy to miss.
- Signal partial selection with a select-all state that morphs empty → indeterminate (dash) → checked, so bulk actions read at a glance.

**Do:**
- ✅ Right-align numeric columns with tabular figures so values form a scannable vertical grid.
- ✅ Keep the header sticky and freeze the first column so labels stay anchored while scrolling.
- ✅ Expose row density as one token-driven control for consistent, predictable spacing.

**Don't:**
- ❌ Ship a binary sort that strips the original order with no way back to natural sequence.
- ❌ Rely on a tiny checkbox-only hit target when the entire row could be clickable.

---

### 2. Charts That Lie
- **Slug**: `charts-that-lie`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Match the chart to the question. Bars compare values, lines show change over time, and pie charts fall apart past ~5 slices. The question picks the form, not your taste.
- Aspect ratio rewrites the trend. The same rising series looks flat when squished and like a spike when stretched — balance it so the average slope sits near 45° and reads honestly.
- Maximize the data-ink ratio. Strip gridlines, drop shadows, 3D skew, and boxed legends, then label the line directly. Every remaining pixel should carry data.
- Color is encoding, not decoration. Use one hero color to spotlight the series that matters, and choose categorical, sequential, or diverging scales to fit the data type.
- Title the chart with the takeaway, not the metric. "Revenue flat since March" tells the story; "Quarterly revenue" makes the reader hunt for it.

**Do:**
- ✅ Start every bar chart's y-axis at zero, no exceptions.
- ✅ Pick the chart type from the question you're answering.
- ✅ Spotlight the one series that matters with a single accent color.

**Don't:**
- ❌ Truncate or crop an axis to exaggerate small differences.
- ❌ Add gridlines, shadows, or 3D effects that encode no data.
- ❌ Reach for a pie chart when you have more than five slices.

---

### 3. Search Experience System
- **Slug**: `search-experience-system`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- An empty field isn't empty. Load recent searches the moment the user focuses the bar so a single tap refills it and friction drops to zero.
- Rank autocomplete by clicks, not alphabet, and tag each suggestion with a category badge. Three sharp results beat ten noisy ones.
- Make the whole flow keyboard-driven: arrow keys move through results, Enter selects, Escape closes.
- Keep the focus ring visible at every step — invisible focus quietly breaks both keyboard navigation and accessibility.
- Zero results should never be a dead end. Offer popular searches, category jumps, or alternate spellings so users recover at the exact moment they'd otherwise bounce.

**Do:**
- ✅ Write descriptive placeholder text that hints at what's actually searchable
- ✅ Surface recent searches on focus so returning users refill the bar in one tap
- ✅ Turn zero-result screens into recovery paths with suggestions and category jumps

**Don't:**
- ❌ Ship a bare "Search" as your only placeholder
- ❌ Sort autocomplete alphabetically instead of by popularity
- ❌ Leave a "No matches" screen as a dead end

---

### 4. Filter Chips
- **Slug**: `filter-chips`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Make the combination logic legible: OR within a group widens the net (more colors = more matches), AND across groups narrows it (adding a size filters the set down).
- Update the result count on the same frame as the tap. If the number doesn't move, users read it as 'nothing happened' and tap twice.
- Always ship a single clear-all reset. Stacked filters trap users, and one tap back to zero is the escape hatch — pair it with a live count so the reset is legible.
- When chips outrun the screen, keep them in one horizontal scrolling row with a right-edge fade that hints at more. Wrapping into a multi-row wall buries the results below the fold.
- Pin active filters in a sticky summary bar on top so users can always see why the list shrank.

**Do:**
- ✅ Update the result count instantly on every tap, same frame as the state change
- ✅ Give each chip clearly distinct idle, active, and disabled states
- ✅ Offer a single clear-all reset paired with a live result count

**Don't:**
- ❌ Let active chips look identical to idle ones — the filter reads as broken
- ❌ Wrap overflowing chips into a multi-row wall that pushes results off-screen
- ❌ Leave the count unchanged after a tap — users assume it failed and tap again

---

### 5. Pagination
- **Slug**: `pagination`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Cursor pagination stays stable: it anchors to a specific row instead of a numeric position, so inserts and deletes never create duplicates.
- Three patterns fit different jobs — numbered for jumping to any page, load-more for on-demand appends, infinite scroll for continuous feeds.
- Never render every page link. Truncate to first, last, current, and its immediate neighbors, using an ellipsis for the gaps.
- Keep the page number in the URL (?page=500) so a refresh stays put and the view becomes a shareable link.
- When users return from a detail view, restore their scroll position instead of dumping them back at the top of the list.

**Do:**
- ✅ Reach for cursor pagination when rows are inserted or deleted often, to avoid duplicates and skips
- ✅ Persist the current page in the URL so refreshes and shared links land on the same page
- ✅ Collapse long page ranges to first, last, current, and neighbors with an ellipsis

**Don't:**
- ❌ Render hundreds of numbered links — they spill off-screen and overwhelm
- ❌ Reset an infinite-scroll list to the top when the user comes back from a detail view

---

### 6. Bulk Actions
- **Slug**: `bulk-actions`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Name the number. When select-all only grabs the rows on screen, offer 'Select all 247 matching' instead of a bare 'all' that hides the true scope.
- Keep the count honest as context shifts. Change a filter and the label should re-read live (from 247 matching down to 96) so people act on the real set.
- Selection is state, not the DOM. Shift-click picks a range, and the selected ids survive paging because they live in application state, not in the visible rows.
- For destructive bulk actions, skip the confirm modal. Echo the count, run the action immediately, and offer a 10 second undo with a draining countdown ring.

**Do:**
- ✅ Give the header checkbox all three states and let the partial dash resolve to select-all.
- ✅ Spell out the exact count in the affordance, like 'Select all 247 matching'.
- ✅ Swap destructive confirm dialogs for an undo window that echoes what you deleted.

**Don't:**
- ❌ Ship a two-state header checkbox that skips the indeterminate dash.
- ❌ Label bulk selection with a vague 'all' that hides how many rows you touched.
- ❌ Store the selection in the DOM, where it silently resets the moment someone changes page.

---

### 7. Command Palette
- **Slug**: `command-palette`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Group results into labeled sections (Recent, Actions, Pages) so a long flat list becomes scannable structure instead of an undifferentiated wall.
- Make it fully keyboard-driven: arrows move the highlight, Enter runs the selected command, Esc closes — never force the user back to the mouse.
- Never open to a blank void. Prefill recent or suggested commands so people have a starting point before they type a single character.
- For async commands, show an inline spinner and keep the palette open — load results in place rather than freezing the whole screen.
- Support nested commands: one command can drill into a sub-menu with a breadcrumb, and Esc walks back exactly one level.

**Do:**
- ✅ Match queries as fuzzy subsequences so "stg" still finds "Settings"
- ✅ Prefill recent and suggested commands so the palette opens with something to act on
- ✅ Drive everything from the keyboard — arrows to move, Enter to run, Esc to go back

**Don't:**
- ❌ Require exact substring matches — "stg" ≠ "Settings" leaves users staring at "No results"
- ❌ Open to a blank "No results" void with nothing to select
- ❌ Freeze the whole screen while an async command loads instead of spinning inline

---

### 8. Inline Editing
- **Slug**: `inline-editing`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Keep every pixel in place during the swap. Same font, same size, same padding, with the border going from transparent to accent. One jump and the illusion collapses.
- Enter commits, Escape cancels, and everyone agrees on that. Blur is the contested one: some apps save on click-away, others discard. Pick one rule and never break it.
- Save optimistically: the text updates on screen while the request is still in flight. If the server fails, roll back, keep the draft, and say why.
- Match the editing mode to the cost of a typo. Make every cell editable when mistakes are cheap, or require an explicit Edit action when they are expensive.

**Do:**
- ✅ Signal editability on hover with a pencil icon or a soft background tint.
- ✅ Update the UI immediately, then roll back and keep the draft if the save fails.
- ✅ Keep font, size, and padding identical between the text and the input.

**Don't:**
- ❌ Leave editable text with zero affordance, so users cannot tell it is editable.
- ❌ Change what blur does from one screen to the next (save here, discard there).

---

### 9. Serial Position
- **Slug**: `serial-position`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Treat the first and last slots as bookends — your highest-value content earns those positions, not the buried middle.
- Navbars: lead with the logo (primacy) and close with the primary CTA (recency); secondary links can sit in the forgettable middle.
- Landing pages: open with your strongest USP and end with your strongest proof — testimonials, metrics, guarantees — so the memorable slots do the selling.
- Onboarding flows: the first slide should hook and the last should deliver the payoff; middle steps carry setup nobody will recall verbatim.
- Item order is a design decision, not an afterthought — anything important dropped into the low-recall middle quietly loses impact.

**Do:**
- ✅ Anchor your single most important item at both the start and the end of a sequence
- ✅ Order menus so the logo leads and the primary CTA closes
- ✅ Open with your best value proposition and finish with your strongest proof

**Don't:**
- ❌ Bury critical CTAs or key information in the middle of a list, where recall is lowest
- ❌ Order items arbitrarily and assume every position is remembered equally

---

### 10. Empty States
- **Slug**: `empty-states`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Write like a product, not a log file. Swap corporate error copy ("No items found. Result set empty.") for a warm, human line that matches your brand voice.
- Every empty state needs a primary action — not a "Try refreshing" button, but the next step the user would take if they knew what to do (e.g. "+ New project").
- There are four kinds of empty: first run, no results, error, and filtered-out. Each deserves its own copy and CTA — don't ship one generic screen for all of them.
- The empty state is your best onboarding moment. Show a ghost preview of what a real item will look like to teach the feature before users ever touch it.

**Do:**
- ✅ Add a small illustration or icon so the screen reads as intentional, not broken
- ✅ Give every empty state one clear primary CTA that points to the next real step
- ✅ Tailor the copy and action to the context — first run, no results, error, or filtered-out

**Don't:**
- ❌ Leave a bare "No data" or blank body with no visual or guidance
- ❌ Rely on a generic "Try refreshing" as the only available action
- ❌ Write cold, log-file copy like "ERROR 404 — Result set empty."

---


## Visual Hierarchy, Depth & Styling

### 11. Reverse-Engineered Linear
- **Slug**: `reverse-engineered-linear`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Depth comes from value, not blur. Kill the shadows and stack three background values (base, surface, raised surface) separated by a 1px border at 8% white. Hover changes the surface value, not the elevation. Flat surfaces look engineered, shadows look decorated.
- One color, used twice. Indigo on the selected row and the primary button, nowhere else. Status is a grey icon, not a colored pill. Seven colors collapse to one and the UI instantly looks deliberate.
- Every action shows its shortcut. C creates, Cmd K searches. Hover feedback lands in about 80ms and transitions stay under 150ms, with no bounce or overshoot. The UI answers before you finish the gesture.
- A 4px grid does the rest. 16px icons centered on the text line, labels left, numbers and dates right, nothing centered. Alignment is invisible when right and loud when wrong.

**Do:**
- ✅ Build depth from three stacked background values plus a hairline border (rgba white at 8%), and change the surface value on hover.
- ✅ Print the keyboard shortcut next to every action, and keep hover feedback near 80ms with transitions under 150ms.
- ✅ Left-align labels and ids, right-align numbers and dates, and center icons on the text line using a 4px grid.

**Don't:**
- ❌ Use drop shadows to separate rows, panels, or the sidebar.
- ❌ Encode status or priority with colored pills when a grey icon says the same thing.
- ❌ Let transitions bounce, overshoot, or drag past 150ms.

---

### 12. De-AI Landing Hero
- **Slug**: `de-ai-landing-hero`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- The purple blob behind everything is a gradient smear added because the page needs energy from somewhere. Use a neutral background and put the only color on the product screenshot and one primary button: one accent, zero blobs.
- Two equal buttons ("Get started" and "Learn more", same size, side by side) split the click. Keep one primary button and turn the second into a text link with an arrow, moving the visual weight from 50/50 to roughly 90/10.
- Fake social proof ("Trusted by 10,000+ users" above five grey logos) is a number nobody can check next to logos nobody recognizes. Replace it with one quote: a name, a role, and a result with a unit, such as closing the month in three hours instead of a week.
- Three feature cards with an icon in a circle and one word each (Fast, Secure, Easy) appear on every generated page. Replace the row with one product screenshot and three annotations pointing at real UI elements.
- Every fix follows the same rule: the generated hero decorates because it has nothing concrete to show. Swap each decoration for the product itself and the AI look disappears.

**Do:**
- ✅ Name the outcome in the headline and the audience in the subtitle.
- ✅ Give the product screenshot and the primary button the only accent color on the page.
- ✅ Quote one customer with a role and a measurable result.

**Don't:**
- ❌ Fill the headline with adjectives like supercharge, seamless, or powerful.
- ❌ Place two identical buttons side by side.
- ❌ Ship the icon-in-a-circle feature row with one-word labels.

---

### 13. Visual Hierarchy
- **Slug**: `visual-hierarchy`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Spend color like currency — keep the interface neutral and reserve one accent for the single most important action. A rainbow of colors flattens everything into noise.
- Contrast separates roles: a bold white heading against muted body copy, or a filled primary button next to a ghost secondary, makes the priority obvious at a glance.
- Whitespace is a signal, not filler. Give the hero element breathing room and keep secondary items compact — intentional spacing reads as importance.
- Font weight builds reading order without changing size: heavy for headings (800), regular for body (400), light for captions (300).
- No single rule carries a layout — size, color, contrast, whitespace, and weight stack to make one clear focal point.

**Do:**
- ✅ Reserve one accent color for the one action you want users to take
- ✅ Make the headline about twice the size of the body text around it
- ✅ Give the most important element more padding than everything else

**Don't:**
- ❌ Color every element differently — it turns hierarchy into visual noise
- ❌ Lean on size alone; combine it with weight, contrast, and spacing
- ❌ Cram everything at equal emphasis so nothing stands out

---

### 14. Depth Layers
- **Slug**: `depth-layers`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Layered shadows beat a single drop shadow: stack a tight one (~2px), a mid spread (~12px), and a large ambient one (~32px) to mimic how real light falls off.
- Parallax scroll sells distance by moving layers at different speeds — background slow, midground medium, foreground fastest (roughly 1x / 2.5x / 5x).
- Z-translation on hover makes an element react to the cursor: lift it toward the viewer with translateZ plus a slight scale(1.03) and a soft glow.
- Depth also lives in the border and shadow intensity, not just position — brightening the border on hover reinforces the lift.
- Stack all three techniques and the interface reads as fully dimensional while still feeling flat and clean.

**Do:**
- ✅ Stack multiple shadows at increasing blur and offset instead of one flat drop shadow
- ✅ Keep hover lifts subtle — a few pixels plus ~3% scale reads as physical, not cartoonish
- ✅ Vary scroll speed per layer so background, mid, and foreground imply real distance

**Don't:**
- ❌ Redesign the layout or palette to fake depth when three properties already do it
- ❌ Push parallax offsets or hover scale so far they pull attention off the content

---

### 15. Border Radius
- **Slug**: `border-radius`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Pull every value from one radius scale (4 · 8 · 12 · 16 · 24) instead of picking numbers per component — consistency is what makes UI look expensive.
- Scale radius with element size: tooltips ~4px, inputs ~8px, cards ~12px, modals ~16px, panels ~24px. Bigger surfaces earn bigger corners.
- Radius carries personality — small/sharp reads corporate, large/round reads friendly. Pick the range that matches your brand's tone.
- The difference is subtle but felt: off-scale, mismatched corners are exactly what separates "something's wrong here" from polished.

**Do:**
- ✅ Derive the inner radius from the outer radius minus padding so nested corners stay concentric.
- ✅ Commit to a single radius scale and reuse it across every component.
- ✅ Scale radius with element size — larger surfaces get larger corners.

**Don't:**
- ❌ Pick radius values at random for each component.
- ❌ Nest a rounded card inside another without adjusting the inner corner.
- ❌ Mix a playful, oversized radius into a brand meant to feel serious — or the reverse.

---

### 16. Perfect Card
- **Slug**: `perfect-card`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Build a real type hierarchy — push the title to 600 weight and ~38px, then shrink the body and drop it to 55% opacity so the eye lands on the title first.
- Stack two shadows for believable depth: a tight, darker one for contrast plus a wide, soft one for ambient elevation.
- Add a hairline border at roughly 12% opacity to define the card's edge against a dark background.
- A hover state — lift the card ~8px, scale to 1.02, and deepen the shadow — signals it's clickable and adds the final layer of polish.
- Same content, four changes: spacing, typography, shadows, and hover are the entire gap between a card that looks free and one that looks premium.

**Do:**
- ✅ Layer a tight shadow for contrast with a soft ambient one for depth, plus a subtle border around 12% opacity.
- ✅ Set the description to ~55% opacity so the title clearly wins the hierarchy.
- ✅ Give the card a hover lift (~8px up, slight scale, deeper shadow) so it feels interactive.

**Don't:**
- ❌ Cram content against the edges with tiny padding and near-zero border-radius — it reads as an unstyled default.
- ❌ Give the title and body the same weight and full opacity, so nothing guides the eye.

---

### 17. Dark Mode
- **Slug**: `dark-mode`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Signal elevation with layered surfaces: each step up gets a lighter grey (base → surface → elevated), the way shadows do the job in light mode.
- Desaturate accent colors by roughly 20%. Full-saturation buttons and highlights vibrate and strain the eye against a dark background.
- Never use pure white text. #FFFFFF glares on dark UI — calibrate it down to a soft off-white for comfortable reading.
- Build text hierarchy with opacity, not new colors: high-emphasis, medium, and disabled text simply step down in white opacity.

**Do:**
- ✅ Base your darkest layer on a near-black grey like #121212, then lighten each surface as it elevates.
- ✅ Desaturate accent colors so buttons and highlights sit calmly against the background.
- ✅ Dim body text to a soft off-white and use opacity tiers to separate emphasis levels.

**Don't:**
- ❌ Use pure black (#000000) as the background — it flattens elevation and hides shadows.
- ❌ Ship fully saturated accent colors — they buzz and read as cheap on dark UI.
- ❌ Set text to pure white (#FFFFFF) — the glare fatigues the eyes over time.

---

### 18. Golden Ratio
- **Slug**: `golden-ratio`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Build a spacing scale by multiplying a base unit by 1.618: 8 → 13 → 21 → 34 → 55. Every gap relates to the next, so the UI feels deliberate.
- Split the screen at the golden ratio — roughly 62% / 38%. Give primary content the larger panel and secondary actions the smaller one.
- Step your type scale by the same factor: 16px body, 26px subheading, 42px heading, 68px display. One rhythm ties the whole hierarchy together.
- It isn't just theory — teams like Stripe, Linear and Airbnb lean on the same proportional system to look polished.

**Do:**
- ✅ Multiply one base unit by
- ✅ Split layouts at
- ✅ Round the results to clean pixel values your grid can actually use.

**Don't:**
- ❌ Pick gaps and font sizes arbitrarily — inconsistent proportions are what read as cheap.
- ❌ Apply the ratio so rigidly it fights real content or your existing 8px grid.

---

### 19. Grid System
- **Slug**: `grid-system`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Use column ratios to structure the page: 4:8 for a sidebar plus content, 6:6 for an even split, 3:9 for a narrow nav beside a wide canvas.
- Gutters set the mood as much as the columns do — 8px reads dense and technical, 24px feels balanced and clean, 40px gives an editorial, premium feel.
- Stay responsive by dropping columns at each breakpoint: 12 at desktop, 6 on tablet, 4 on large phones, down to a single stacked column on the smallest screens.
- Once the grid is solid, break it on purpose — let a hero image bleed full-width or push a pull quote into the margin for deliberate emphasis.
- Alignment is what separates polished from amateur: chaotic, slightly-rotated elements snapped to shared column edges instantly read as designed.

**Do:**
- ✅ Anchor every element to shared column edges so the layout reads as intentional
- ✅ Match gutter width to the mood — tight for dense dashboards, wide for editorial
- ✅ Collapse columns at each breakpoint (12 → 6 → 4 → 1) so content reflows cleanly

**Don't:**
- ❌ Break the grid before you've established it — a bleed only reads as intentional against order
- ❌ Reach for arbitrary widths when a clean column ratio like 4:8 or 6:6 already fits

---

### 20. Shadow Elevation
- **Slug**: `shadow-elevation`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- The tight contact shadow (~0 1px 3px) anchors the element to the surface — it's what makes the card feel physically placed rather than floating.
- A subtle colored glow (a low-opacity blur in an accent hue) adds a premium, branded feel that plain black shadows can't.
- Match the glow color to the product context — purple for creative tools, blue for fintech, green for health — so elevation reinforces brand identity.
- A 3D lift (perspective + a small rotateX + translateZ) adds genuine depth beyond a flat drop shadow, making the surface read as tilted toward the viewer.
- Elevation is a hierarchy signal: the more elevated an element, the more important it reads — which is why a premium tier looks lifted while a basic one stays flat.

**Do:**
- ✅ Layer three shadows — tight contact, mid-distance, and wide soft spread — for believable depth.
- ✅ Tint the glow to your brand accent so elevation reinforces identity.
- ✅ Reserve the strongest elevation for the elements that matter most.

**Don't:**
- ❌ Rely on a single flat drop shadow for every surface.
- ❌ Treat shadows as decoration — they communicate depth and hierarchy.

---

### 21. Design Tokens
- **Slug**: `design-tokens`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Structure tokens in three layers — primitives (raw values), semantic (meaning), and component (usage) — each referencing the layer above.
- Change one primitive and it cascades through every component that points to it: one edit instead of 47 hunted-down values.
- Define a scale and snap everything to it. A stray 13px padding or 17px gap collapses to 12 and 16, so consistency stops being a guess.
- Dark mode isn't inverting colors — it's swapping one token set for another. Same components, alias tokens, a completely different feel.
- Tokens are your single source of truth for color, spacing, and type — the design system is only as strong as they are.

**Do:**
- ✅ Name tokens by role —
- ✅ Layer tokens primitives → semantic → component so a single change cascades
- ✅ Snap arbitrary spacing and font sizes onto a fixed scale

**Don't:**
- ❌ Bake literal values into names like
- ❌ Treat dark mode as inverting colors instead of swapping token sets
- ❌ Hardcode raw values across components instead of referencing tokens

---

### 22. Design System Kit
- **Slug**: `design-system-kit`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Build a numbered color scale (100–900) so every shade is systematic instead of a lucky guess, then map it to semantic names such as brand, success, and error.
- Define a type scale with fixed sizes and weights. Same size and weight everywhere means no hierarchy; a real scale separates heading from body at a glance.
- Base spacing on a 4px scale — space-1=4 up to space-16=64. Random gaps like 7px, 23px, or 11px read as sloppy, while scale-based gaps feel deliberate.
- Standardize components as variants, sizes, and states: primary/secondary/ghost/destructive buttons, small/medium/large sizing, and default/focus/error/disabled inputs.
- Match motion to intent — ease-out to enter, ease-in-out to move, ease-in to exit — and keep a duration scale from 100ms micro-interactions to 500ms complex transitions.

**Do:**
- ✅ Store every value as a named token so color, type, and spacing stay consistent across the app
- ✅ Build numbered scales (color 100–900, spacing 4→64) so choices are systematic, not improvised
- ✅ Tie easing and duration to the interaction's intent — entering, moving, or leaving

**Don't:**
- ❌ Hardcode raw hex or pixel values inline
- ❌ Pick spacing by eye, 7px here and 23px there
- ❌ Give every text the same size and weight, killing all hierarchy

---

### 23. Color Accessibility
- **Slug**: `color-accessibility`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Know the WCAG thresholds: aim for 4.5:1 on body text and 3:1 on large text. Below 3:1 the text degrades from 'large-only' to flat-out invisible.
- Most failures hide in 'decorative' muted grays — nav links, card labels, and secondary headings routinely sit at 1.5–2:1 and quietly fall below the line.
- Never encode meaning with color alone: for the ~8% of users with color vision deficiency, a red error and a green success collapse into the same muddy tone.
- Add a second signal alongside every color cue — an icon on error text, trend arrows on stats, or textures/patterns in charts — so the message survives when the color doesn't.
- A full pass is cheap: darken or lighten muted text to clear the ratio, then bolt an icon onto each state. Same layout, dramatically more readable.

**Do:**
- ✅ Check every text-on-background pair against WCAG — 4.5:1 for body copy, 3:1 for large text
- ✅ Pair color with an icon, label, or pattern so state survives color blindness
- ✅ Lighten or darken 'muted' secondary text until it clears the contrast threshold

**Don't:**
- ❌ Rely on red-vs-green alone to separate errors from success
- ❌ Ship low-contrast grays for nav links and card labels just because they look sleek

---

### 24. Gradient Design
- **Slug**: `gradient-design`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Keep lightness moving in one direction. A gradient that gets darker, then lighter, then darker again reads as banding.
- Gradients work best as ambiance, not surface: a soft radial glow behind content beats a full-bleed linear wash on top of it.
- Subtle grain on top of a gradient hides banding on cheap displays and adds perceived texture.

**Do:**
- ✅ stay within 60° of hue travel, add 2–3% noise, and test on a low-quality screen.

**Don't:**
- ❌ put body text directly on a gradient's mid-transition zone — contrast is unpredictable there.

---

### 25. Icon Design Rules
- **Slug**: `icon-design-rules`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Grid alignment keeps icons crisp: snap every shape to a 24px grid (16px for dense UI), because sub-pixel drift blurs edges and kills sharpness.
- Stroke consistency is the fastest tell of quality: hold a single 2px weight across the whole set — mixed weights look like four different icon libraries mashed together.
- Bounding box stays fixed even when the shape changes: give every icon the same container so sizing reads even and toolbars stay legible.
- Fill vs outline is a set-wide commitment, not a per-icon choice: pick one strategy and stick to it — a random mix has no visual rule holding it together.

**Do:**
- ✅ Scale circular and organic icons 5–8% larger than square ones so they optically match
- ✅ Snap every icon to a 24px grid (16px for dense UI) to keep edges crisp
- ✅ Hold one stroke weight — 2px — across the entire set

**Don't:**
- ❌ Size icons by raw math — equal boxes make round shapes look small
- ❌ Mix fill and outline styles at random; commit to one strategy for the set
- ❌ Let icons float at loose sizes — inconsistent bounding boxes make toolbars unreadable

---

### 26. Gestalt Laws
- **Slug**: `gestalt-laws`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Similarity — elements sharing a property (color, shape, size) read as one group; recoloring rows instantly splits a flat grid into Navigation, Content, and Actions.
- Continuity — the eye follows the smoothest path, so aligning items on a shared axis lets it flow, while scattered placement forces it to jump around erratically.
- Figure-Ground — blurring and dimming the background pushes a modal forward as the focal 'figure', which is what makes a dialog feel deliberate instead of floating.
- Common Region — a shared border or container groups elements even when they sit far apart; wrapping settings in cards signals belonging without moving them closer.
- These laws are pre-attentive: the brain groups and completes automatically, so working with them makes a layout feel instantly organized rather than busy.

**Do:**
- ✅ Give related items a shared property — color, shape, or size — so they read as one group at a glance.
- ✅ Align related controls on a common axis so the eye flows down a single clean path.
- ✅ Wrap loosely-placed elements in a bordered card when proximity alone can't group them.

**Don't:**
- ❌ Scatter navigation or list items at varied angles and positions — the eye jumps and nothing reads as connected.
- ❌ Lean on a modal alone without dimming what's behind it; it competes with the background instead of standing out.

---


## Speed, Feedback & Loading States

### 27. Doherty Threshold
- **Slug**: `doherty-threshold`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Response time splits into zones — under 200ms feels instant, 200–400ms is tolerable, and over 400ms starts breaking engagement.
- What matters is perceived speed, not raw speed — the real work can take longer as long as the interface reacts within the threshold.
- Skeleton loading paints placeholder shapes the instant a screen opens, so it never looks frozen while data arrives.
- Optimistic UI updates the screen as if the action already succeeded, then reconciles only if the server rejects it.
- Progress feedback — spinners, progress bars, inline status — keeps an unavoidable wait feeling responsive instead of stalled.

**Do:**
- ✅ Give visible feedback within 400ms of any interaction, even if it's just a skeleton or acknowledgment
- ✅ Update the interface optimistically for actions that almost always succeed
- ✅ Show progress feedback whenever the real work has to exceed the threshold

**Don't:**
- ❌ Leave the screen blank or frozen while data loads in the background
- ❌ Wait for a server round-trip before giving any visual response

---

### 28. Behind the Button
- **Slug**: `behind-the-button`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- The server re-runs every check the client already did, only stricter. Never trust the client: anyone can forge a request, so re-compute the total from your own catalog instead of believing the price the browser sent.
- Wrap the related writes (order, items, inventory, payment) in one transaction. If a single row fails, every row rolls back, so an order never lands half-written. All of it, or none of it.
- When the response returns, repaint the UI with server truth, the real order ID the server created, not a value you guessed locally.
- Optimistic UI fits cheap, reversible actions: a like, a favorite, a rename can repaint instantly and reconcile in the background. Money is different, so hold the spinner until the server actually confirms.

**Do:**
- ✅ Validate on the client for speed and on the server for trust, never one instead of the other.
- ✅ Re-compute prices and totals server-side from your own source of truth.
- ✅ Wrap multi-row writes in one transaction so any failure rolls back the whole thing.

**Don't:**
- ❌ Trust values the client sends, including the price, since a request is trivial to forge.
- ❌ Reach for optimistic UI on payments or other irreversible actions; make them earn the spinner.

---

### 29. Optimistic UI
- **Slug**: `optimistic-ui`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- The brain reads anything under 400ms as instant; a spinner past that threshold makes the action feel broken.
- When the request fails, roll back the UI cleanly — undo the like, restore the count, as if it never happened.
- The core bet: trust the success case (which is almost always what happens) and handle the rare failure gracefully.
- Reserve it for reversible, low-stakes actions — likes, toggles, reorders — where an occasional rollback costs nothing.

**Do:**
- ✅ Update the interface immediately, then reconcile with the real server response behind the scenes.
- ✅ Roll back to the previous state the moment a request fails, so the UI never lies for long.
- ✅ Apply it to reversible interactions like likes, favorites, and list reordering.

**Don't:**
- ❌ Use it for payments, transfers, or anything you can't safely undo.
- ❌ Show a charge, booking, or confirmation before the server has actually cleared it.

---

### 30. Skeleton Loading
- **Slug**: `skeleton-loading`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Skeleton screens preview the shape of the incoming content — avatar circle, text bars, image block — so the brain starts parsing the layout before the data arrives.
- The shimmer sweep matters: a static skeleton reads as "broken", an animated one reads as "in progress".
- Match the skeleton to the real content dimensions. A skeleton that jumps to a different layout on load is worse than a spinner.
- For actions the user just performed (posting, liking), skip loading states entirely — render the result optimistically and reconcile in the background.

**Do:**
- ✅ shape skeletons to mirror the final layout, animate them, and keep them under ~2 seconds before showing partial content.

**Don't:**
- ❌ use skeletons for sub-300ms loads (flash of skeleton is noise) or mix spinners and skeletons in the same view.

---

### 31. Loading States System
- **Slug**: `loading-states-system`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Skeletons are for when you know the content's shape — cards, lists, articles — and the wait exceeds ~300ms. They set the right expectation by previewing the layout that's about to load.
- Spinners fit short waits of unknown duration, under ~3s (a button saving, a small fetch). Never stretch one across a full-page load — an endless spinner with no context reads as frozen.
- Progress bars belong to waits over ~3s where you know the percentage — uploads, installs, exports. Pair the bar with real meta (time remaining, speed) so the number earns the user's trust.
- Optimistic UI is the pro move for reversible actions like likes, saves, and bookmarks: update the interface instantly, then reconcile with the server in the background and only surface an error if the sync fails.
- Under ~300ms, show nothing at all. A brief flash of a loading state feels more broken than a slight delay — the eye registers the flicker as a glitch, not as feedback.

**Do:**
- ✅ Pick the pattern from what you know: known shape → skeleton, known percentage → progress, short unknown wait → spinner.
- ✅ Apply the response instantly for reversible actions, then sync in the background and roll back only on failure.
- ✅ Let sub-300ms responses land with no loading indicator at all.

**Don't:**
- ❌ Reach for a skeleton on every fetch regardless of the content shape or how long it takes.
- ❌ Cover a whole page with a spinner for long or open-ended loads.
- ❌ Flash any loading state for a response that resolves in under 300ms.

---

### 32. Error States
- **Slug**: `error-states`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Let severity drive the surface. Minor issues stay inline, transient ones surface as a toast, and blocking failures earn a modal. The more an error interrupts the user, the more space it should occupy — and the reverse.
- Every error needs an exit. A dead-end 'OK' button leaves people stuck. Give a real way out — a Retry, a link to support, or expandable technical details for those who want to dig in.
- Write copy for humans, not machines. 'Error 500 — An error occurred' tells the user nothing. Say what broke, why, and what to do next in plain, specific language.
- Prevent errors before they happen. Live inline validation — checking each rule as the user types and turning criteria green — stops most mistakes before submit. Validating only on submit just tells people they failed after the fact.
- Keep field-level validation small, inline, and specific — anchored to the input it describes, not floating in a generic alert.

**Do:**
- ✅ Offer a clear recovery action on every error — retry, undo, or a path to help.
- ✅ Match the surface to severity: inline for field errors, toast for transient issues, modal for true blockers.
- ✅ Validate inline as the user types so problems surface before submit.

**Don't:**
- ❌ Ship dead-end errors whose only option is 'OK'.
- ❌ Surface raw codes like 'Error 500' or 'An error occurred' with no guidance.
- ❌ Interrupt a minor validation slip with a full-screen modal.

---

### 33. Toast Notifications
- **Slug**: `toast-notifications`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Match dismiss timing to severity: routine info auto-dismisses in ~4s, warnings hold ~7s, and critical errors stay until the user acknowledges them.
- Cap the stack at 3 visible toasts — newest enters at the bottom, older ones float up and out, and the rest queue. Spring motion keeps the shuffle readable.
- Always give a way out: a close button on desktop, swipe-to-dismiss on mobile, and a timer that pauses on hover so people can finish reading.
- Color-code by type (info, success, warning, error) but never rely on color alone — pair each with an icon and accent border, since ~6% of users can't tell the colors apart.

**Do:**
- ✅ Anchor toasts bottom-right on desktop and to the top edge on mobile
- ✅ Pause the auto-dismiss countdown while the user hovers so they have time to read
- ✅ Reinforce each type's color with a matching icon and left accent border

**Don't:**
- ❌ Place toasts in the screen center, where they block the content users are working on
- ❌ Auto-dismiss critical errors — hold them until the user acknowledges
- ❌ Show more than three toasts at once; queue the rest instead of piling them up

---

### 34. Undo UX
- **Slug**: `undo-ux`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Soft delete means the file left the screen, not the database. Set a deleted flag, keep it in trash for thirty days, then purge. Deletion is a state, not an event.
- Friction belongs only where there's no way back. For truly irreversible actions, make users earn it — GitHub requires typing the repo name before deleting it.
- One undo is a toast; a stack is a time machine. An undo stack lets Cmd+Z walk back through every step in order, the way Figma remembers everything you did.
- Delayed send turns a delay into a feature. Gmail holds your email for ten seconds after send — long enough to catch the typo, the wrong recipient, or the reply-all disaster.
- Show the countdown. A visible timer on the undo toast (a draining ring or bar) tells users exactly how long their second chance lasts.

**Do:**
- ✅ Execute the action immediately, then offer a time-limited undo with a visible countdown
- ✅ Soft-delete with a recovery window (e.g. 30 days in trash) before permanent purge
- ✅ Reserve heavy friction like type-to-confirm for genuinely irreversible actions

**Don't:**
- ❌ Block every destructive action behind an "Are you sure?" dialog
- ❌ Hard-delete data from the database the moment the user clicks
- ❌ Make the undo window so short users can't realistically react

---

### 35. Notification System
- **Slug**: `notification-system`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- The trigger picks the volume. Let the event's severity decide the surface: a low-priority "new message" fits a toast, a degraded-service warning a banner, a blocking "card declined" error a modal, and a passive unread count a badge.
- Persistence is part of the contract. Toasts auto-dismiss in a few seconds (and should offer undo), banners stay until manually cleared, modals block until the user acts, and badges sit quietly until the count is resolved.
- Stack behavior separates good from broken. Several toasts can stack and breathe; several modals become a trainwreck — blocking dialogs must never queue on top of each other.
- Over-escalating backfires: route everything to the loudest surface and you get zero attention, because users learn to tune the noise out.

**Do:**
- ✅ Map each notification's severity to the surface that matches it — toast, banner, modal, or badge.
- ✅ Let toasts auto-dismiss with an undo affordance, and reserve modals for actions that genuinely must block.
- ✅ Stack low-priority notifications so they breathe instead of piling up on screen.

**Don't:**
- ❌ Route every alert to the most intrusive surface — over-escalation trains users to ignore all of them.
- ❌ Queue multiple modals on top of each other; blocking dialogs stacked together are a trainwreck.
- ❌ Use a blocking modal for a low-severity, purely informational message.

---

### 36. Animation Timing
- **Slug**: `animation-timing`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Exits should be faster than entrances: pair a 250ms entrance with a ~150ms exit so dismissals feel snappy instead of dragging.
- Feedback on taps and button presses must fire in under 100ms — anything slower reads as lag, even when the action itself is instant.
- Attention-grabbing motion like notifications can run longer, 500–800ms, and use a bounce or overshoot to pull the eye.
- Stagger list items about 50ms apart — 30ms blurs them into one blob, 100ms makes the whole list crawl in.
- Match the easing curve to intent: ease-out for entrances, and reserve springs and bounce for moments that genuinely need attention.

**Do:**
- ✅ Use ease-out curves for entrances so motion decelerates into place
- ✅ Make exits roughly 40% faster than their entrance so dismissals feel instant
- ✅ Keep tap and press feedback under 100ms so the interface feels alive

**Don't:**
- ❌ Stretch entrances past ~300ms — they start to feel sluggish and in the way
- ❌ Use symmetric in/out timing — a matched-length exit feels like the UI is dragging
- ❌ Reach for linear easing on entrances — it reads mechanical and cheap

---

### 37. Easing Curves
- **Slug**: `easing-curves`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Linear moves at a constant speed. It looks mechanical and cheap, so reserve it for continuous motion like spinners or marquees — never for UI that starts and stops.
- Ease-out starts fast then decelerates into place. It's the safest default for elements entering the screen because it mirrors how real objects settle.
- Spring overshoots slightly then settles, adding a bounce that reads as alive and premium — ideal for button presses, modals, and playful confirmations.
- Apply the same handful of curves everywhere: button press, card cascade, sheet open. Consistent easing is a big part of why an interface feels coherent instead of stitched together.
- Stagger list and card entrances a few frames apart so they cascade in, rather than snapping onto the screen as one rigid block.

**Do:**
- ✅ Default to ease-out for elements entering the screen so they decelerate naturally into place.
- ✅ Add a subtle spring overshoot to presses, modals, and confirmations to make the UI feel alive.
- ✅ Stagger card and list entrances a few frames apart for a cascade instead of a single hard snap.

**Don't:**
- ❌ Reach for linear easing on UI that starts and stops — it reads as mechanical and cheap.
- ❌ Push spring stiffness or bounce so high the element wobbles; a little overshoot sells premium, too much feels broken.

---

### 38. Scroll-Driven Animations
- **Slug**: `scroll-driven-animations`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- animation-range sets the exact trigger point, so an animation can fire on entry, on exit, or anywhere in between the scroll.
- view() targets individual elements — each card or image animates the moment it enters the viewport, entirely on autopilot.
- Parallax that once took ~30 lines of JS and a scroll-event listener is now pure CSS: give layers different speeds with zero dependencies.
- Layer these on top of position: sticky to build shrinking headers, reading-progress bars, and sidebars that transform as you scroll.

**Do:**
- ✅ Reach for
- ✅ Combine sticky positioning with a scroll timeline for shrinking headers and reading-progress bars.

**Don't:**
- ❌ Hand-roll parallax or reveals with a scroll listener and
- ❌ Pull in a JS animation library for effects the browser handles in a couple of CSS lines.

---

### 39. Card Hover Anatomy
- **Slug**: `card-hover-anatomy`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Claim the cursor: a pulsing accent border or a gradient sweep around the edge stops the card looking flat and signals it's interactive.
- Cascade the actions: reveal hidden buttons (favorite, cart, share) staggered ~60ms apart, anchored at the bottom. A reveal adds an affordance, not a new layout.
- Push against the glass: scale the image to ~1.05 inside an overflow-hidden frame while the container stays fixed — the product presses outward instead of resizing the card.
- The trap — keep the geometry: never scale the whole card. That shifts neighbors and breaks the grid. Animate the content, hold the footprint.

**Do:**
- ✅ Lift the card ~8px and grow its shadow together, using ~200ms ease-out for a sense of weight.
- ✅ Stagger revealed actions ~60ms apart and anchor them to the card's bottom edge.
- ✅ Scale the image to ~1.05 inside an overflow-hidden frame while the container holds still.

**Don't:**
- ❌ Scale the entire card — it shifts neighboring cards and breaks the grid layout.
- ❌ Stack action buttons over the title or let them spill outside the card boundary.
- ❌ Time the lift too fast (twitchy) or too slow (stuck) — 200ms is the sweet spot.

---

### 40. Hover Trap
- **Slug**: `hover-trap`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Never bury a primary action behind hover. Hover should surface extras only, never something the user cannot otherwise reach.
- Give hover-only actions a touch-reachable home: put them in the card, behind a swipe, or inside a bottom sheet.
- Gate hover styles with @media (hover: hover) instead of sniffing the user agent, so a tablet with a mouse still gets the full treatment.
- Pair it with pointer: coarse to grow controls when the pointer is a thumb rather than a mouse.
- A 20px icon passes design review but misses the thumb. Pad the hit area to 44px and keep the glyph small.

**Do:**
- ✅ Reveal only secondary extras on hover, keeping every primary action reachable by tap
- ✅ Gate hover effects behind
- ✅ Pad tap targets to 44px while keeping the visible icon around 20px

**Don't:**
- ❌ Hide primary actions behind a hover state that touch users can never trigger
- ❌ Detect touch by sniffing the user agent instead of querying the pointer
- ❌ Size the tap target to the 20px icon and leave the thumb missing

---

### 41. Focus States
- **Slug**: `focus-states`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- A proper focus ring needs three things: 2px thickness, a 2px offset, and enough contrast to stay visible on both light and dark backgrounds.
- :focus-visible tells mouse and keyboard apart — a click gets no ring, a Tab press gets one — so keyboard users can navigate without cluttering the pointer experience.
- Focus follows the DOM order, not your visual layout. Reorder columns with CSS and Tab starts teleporting across the page — keep visual order and DOM order in sync.
- Inside a modal, trap the focus: Tab should cycle through the dialog and wrap around, and Escape should close it and hand focus back to the element that opened it.
- A skip link jumps past dozens of nav links in a single keypress. Keep it invisible until focused, and make it the first element on the page.

**Do:**
- ✅ Replace a removed outline with a custom ring — 2px thick, offset, and contrasting on every background
- ✅ Reach for
- ✅ Place a skip link as the first focusable element, hidden until focused

**Don't:**
- ❌ Set
- ❌ Reorder content with CSS and let the DOM order drift from the visual order
- ❌ Let a modal leak focus to the page behind it, or drop focus when it closes

---

### 42. Zeigarnik Effect
- **Slug**: `zeigarnik-effect`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- A progress meter stuck at 80% creates return pressure; a checklist shown as 100% done gives the user no reason to come back.
- In onboarding, deliberately leave one box unchecked — the visible gap nudges people to return and finish setup instead of vanishing.
- Profile-completion meters are the everyday version big platforms lean on: '80% done' becomes a persistent, low-friction pull.
- The effect only fires for outcomes the user actually wants — a fake 'reading progress' bar on a marketing email creates zero pull.
- Think of the mechanic as a loop: open it, let it pull, bring them back — open loop → pull → return.

**Do:**
- ✅ Leave a visible gap — an unchecked box or an 80%% meter — to invite users back
- ✅ Tie the unfinished progress to an outcome the user genuinely cares about
- ✅ Keep the remaining percentage salient so the open loop stays top of mind

**Don't:**
- ❌ Close every loop at 100%% — a fully finished state removes any reason to return
- ❌ Manufacture progress on chores nobody asked for, like a reading bar on a marketing email

---


## Forms, Inputs & Validation

### 43. Form Field States
- **Slug**: `form-field-states`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- At rest, keep the label outside the field with helper text below it. A placeholder-as-label vanishes the moment someone starts typing.
- On focus, make the active target obvious with a focus ring of at least 3:1 contrast. A soft blue glow looks pretty but fails accessibility checks.
- For errors, combine color + icon + message together — a border-only red is invisible to the ~12% of users with color-vision deficiency. Name what's wrong and how to fix it.
- Confirm success inside the field, where the user's attention already is. Toasts steal focus and disappear before they're read.
- Keep disabled and loading visually distinct: disabled uses a grayscale fill with a not-allowed cursor, while loading shows an in-field spinner and blocks input to prevent double submits.

**Do:**
- ✅ Place the label above the field and helper text below, so nothing disappears on input
- ✅ Signal every error with color, an icon, and a written message at once
- ✅ Disable the input and show a spinner during async checks to stop double submits

**Don't:**
- ❌ Use a placeholder as the label — it vanishes as soon as typing begins
- ❌ Rely on a border-only red for errors; roughly 12% of users won't perceive it
- ❌ Fake a disabled state with opacity 0.5 — it reads as a loading state instead

---

### 44. Form Validation Timing
- **Slug**: `form-validation-timing`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Validating on every keystroke is too early — it flags a field as wrong before they've even finished typing the word.
- The sweet spot is on blur: check a field the moment focus leaves it, so feedback lands after they're done but before they submit.
- Once a field has errored, switch to live validation for that field so the error clears the instant they correct it.
- Success is feedback too — a green check tells users a field is right, not only when something's wrong.

**Do:**
- ✅ Validate a field on blur, once the user has moved on from it.
- ✅ After a field errors, revalidate live so the message clears the moment it's fixed.
- ✅ Confirm correct fields with a green check, not just flag the broken ones.

**Don't:**
- ❌ Hold every error until submit and reveal them all at once.
- ❌ Fire red errors on each keystroke before the user finishes typing.

---

### 45. Autosave
- **Slug**: `autosave-ux`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Model the status indicator as a state machine with clear states: typing, saving, saved, offline, error. Users trust the pill more than the feature itself, so never let it read 'Saved' when the write never landed.
- When the connection drops, push every edit into a local queue and surface a badge counting what is pending. On reconnect, drain the queue in order, oldest first.
- Two tabs on one document means last write wins can silently erase an hour of someone's work. Merge concurrent changes or warn the user, but never overwrite in silence.
- Guard the exit. If unsaved work exists, use the browser's beforeunload prompt to intercept the closing tab. One ugly dialog beats an afternoon retyped.

**Do:**
- ✅ Debounce writes so one clean save fires after a pause (around 800ms), not on every keystroke.
- ✅ Queue edits locally while offline and replay them oldest first once the connection returns.
- ✅ Keep the status honest by mapping it to explicit states and updating it in real time.

**Don't:**
- ❌ Let the pill show 'Saved' when the change never reached the server.
- ❌ Overwrite a concurrent edit silently; merge the changes or warn instead.
- ❌ Let a tab close on unsaved work without a confirmation dialog.

---

### 46. Input Masking
- **Slug**: `input-masking`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- The leading digit names the brand — 4 is Visa, 5 is Mastercard, 3 is Amex. Surface the matching card mark inline as the user types.
- When you auto-insert a separator, keep the caret right after the character just typed. Jumping it to the end of the field is disorienting and breaks editing.
- Validate on blur, not on keystroke. Flagging "Invalid card" while someone is mid-entry reads as premature; stay neutral until they leave the field, then confirm success.
- Strip junk on paste. When a value arrives with dashes or spaces, clean it and reformat to your own grouping instead of rejecting it.
- Show formatted, store raw. Render the grouped value for the user, but persist the unformatted digits (no spaces or dashes) as the stored value.

**Do:**
- ✅ Group long numbers into fixed chunks so they stay readable as they're typed
- ✅ Detect the card brand from the leading digit and show its mark inline
- ✅ Reformat pasted values instead of erroring on their separators

**Don't:**
- ❌ Let the caret jump to the end when a separator is auto-inserted
- ❌ Flag a validation error on the first keystroke instead of waiting for blur
- ❌ Save the formatting characters with the value — keep the stored data raw

---

### 47. OTP Input
- **Slug**: `otp-input`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Auto-advance focus as each digit lands, and make backspace on an empty box jump back to the previous one and clear it — so correcting a typo never traps the cursor.
- Model the field as one string, not six independent values. useState("847291") beats useState(["","","","","",""]); the boxes are just a view of a single source of truth.
- On mobile, wire up inputmode="numeric" and autocomplete="one-time-code" so the OS surfaces the SMS code as a one-tap autofill above the keypad.
- Throttle resend behind a visible 30s countdown. Without it, impatient users spam the button, hit 429 Too Many Requests, and get temporarily banned by the server.
- Give instant feedback on submit: a wrong code shakes and clears back to focus, a correct code locks each box green with a check and a 'Verified' state.

**Do:**
- ✅ Store the full code as a single string and render the six boxes as a view of it
- ✅ Strip non-digits from pasted input and spread the code across every box automatically
- ✅ Gate the resend button behind a visible countdown timer to avoid rate-limit bans

**Don't:**
- ❌ Rely on one wide input — pasted codes with spaces overflow and choke it
- ❌ Leave a wrong code sitting silently — shake, clear, and refocus instead

---

### 48. Password Field UX
- **Slug**: `password-field-ux`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Show the requirements checklist as they type and tick each rule green before they hit submit — never reveal the rules only after a failed attempt.
- A live strength meter coaches in real time: a growing bar says "almost," while post-submit errors only punish after the fact.
- Add an eye toggle to unmask the field — masked dots cause silent typos users can't catch.
- Never block paste — password managers fill longer, stronger passwords than anyone types by hand.
- The strongest pattern is to offer a generated password: one tap for a unique, saved, never-reused credential.

**Do:**
- ✅ Surface a live checklist and strength meter that update on every keystroke
- ✅ Offer a visibility toggle plus a one-tap generated password
- ✅ Allow paste so password managers can fill strong credentials

**Don't:**
- ❌ Hide the rules until after submit, then punish with red errors
- ❌ Treat a capital-and-symbol checkbox as proof of real strength
- ❌ Block paste or force users to retype long passwords manually

---

### 49. File Upload UX
- **Slug**: `file-upload-ux`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- A dropzone has to answer back the moment a file hovers over it. Border, glow, and copy shift give three signals before the drop, so users never hesitate over a dead zone.
- A spinner hides the truth. Show percent complete and time remaining so the user can decide to wait or walk away.
- When an upload dies at 90%, never make them start over. Inline retry keeps the file loaded and resumes in one tap.
- A filename is not feedback. Show the thumbnail, type, and size as visual proof you received the right file.
- In a multi-file queue, each item gets its own progress and its own retry — one failure never blocks the other nine.

**Do:**
- ✅ React to drag-over with a border, glow, and copy change before the drop
- ✅ Show percent complete and estimated time remaining during upload
- ✅ Offer inline retry that keeps the file loaded so one tap resumes

**Don't:**
- ❌ Rely on a spinner that hides how far along the upload really is
- ❌ Force users to re-select and start over after a failed upload
- ❌ Treat a bare filename as confirmation the right file arrived

---

### 50. Range Sliders
- **Slug**: `range-sliders`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Fill the track. The filled length left of the thumb is the value, readable at a glance. A bare, unfilled track forces users to eyeball the thumb position and guess.
- Make the whole row draggable. A 4px hairline is a moving target that cursors keep missing — expand the hit area to the full row so grabbing the slider is effortless.
- Snap to steps when clean values matter. Free continuous dragging lands on ugly numbers like 47.3; snapping to defined increments (with visible ticks) keeps values round — nobody wants 47.3.
- Float the value in a tooltip above the thumb while dragging, so the exact number stays visible right where the eye already is.
- Support a two-thumb range with a filled band between the handles for min/max cases like price filters, and make it keyboard-operable: arrows step by one, Home and End jump to the extremes.

**Do:**
- ✅ Show a filled track plus a live readout so the value is legible without guessing
- ✅ Expand the drag target to the full row instead of just the thin track
- ✅ Snap to steps and float a value tooltip above the thumb while dragging

**Don't:**
- ❌ Rely on a 4px hairline as the only hit target
- ❌ Leave a slider continuous when users need clean, round values
- ❌ Ship a slider that can't be driven with arrow keys, Home, and End

---

### 51. Date Pickers
- **Slug**: `date-pickers`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- For custom ranges, make selection legible: hovering paints a live preview, the first click locks the start, the second locks the end, and the edges stay draggable to refine without starting over.
- Show two months side by side so a range can cross the month boundary naturally — never force users to click "next" four times to reach a nearby date. Widen to three months on large screens.
- Support the full keyboard: arrows move focus across the grid, users can type the date directly, Enter confirms, Escape closes, Page Up jumps a month, and Shift+Page Up jumps a year.
- Mobile is not a popover. Use a full-screen sheet that scrolls vertically, keep today anchored at the top, and place a large confirm button at the bottom within thumb reach.

**Do:**
- ✅ Lead with presets for common ranges and keep a custom option only for the exceptions
- ✅ Render two calendar months at once so ranges can span the month boundary
- ✅ Wire up the full keyboard — typing, arrow navigation, Enter/Escape, and month/year jumps

**Don't:**
- ❌ Force repeated "next" clicks to reach a month that's only a few weeks away
- ❌ Shrink the desktop popover onto mobile instead of using a full-screen sheet

---

### 52. Stepper Wizard
- **Slug**: `stepper-wizard`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Group fields by context, not by count — Personal, Shipping, Payment, Review. Each step should earn its own screen; splits made on an arbitrary number feel random.
- Always show progress. Pick one indicator — a linear bar, numbered dots, or step labels — so users can feel the end getting close.
- Validate inside each step, not at the end. A bad email on step one shouldn't surface on step four; block the Next button while a field is still invalid.
- Prefer inline errors over final-screen rejection — an immediate red message beats bouncing users all the way back after they thought they were finished.
- Persist state on every step change. Back navigation and a page refresh must preserve entered data — lose the form once and you lose the user.

**Do:**
- ✅ Split forms into steps grouped by meaning like Personal, Payment or Review, not by an arbitrary field count.
- ✅ Show a progress indicator and validate each field within its own step.
- ✅ Save entered data so Back and Refresh never wipe the user's progress.

**Don't:**
- ❌ Surface a step-one error only once the user reaches the final step.
- ❌ Let a refresh or the Back button discard everything already typed.
- ❌ Stack twelve fields into one scrolling wall when they can be chunked into steps.

---

### 53. Toggle Anatomy
- **Slug**: `toggle-anatomy`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- A good toggle morphs, it doesn't snap — animate the flip over ~250ms with an ease-out curve instead of jumping instantly between on and off.
- Four properties change at once during the flip: rail color, knob position (translateX), knob shadow, and the state label — all moving together, not in sequence.
- Build in accessibility: Space toggles the control when focused, a visible focus ring shows keyboard position, and aria-checked lets screen readers announce the state.
- For async toggles, go optimistic — flip immediately on click, spin a loader inside the knob while the request is pending, then roll back (with a shake and an error toast) if the server fails.

**Do:**
- ✅ Morph rail color, knob position, shadow, and label together over ~250ms with an ease-out curve.
- ✅ Flip optimistically, show a spinner inside the knob while pending, and roll back on failure.
- ✅ Support Space to toggle, a visible focus ring, and aria-checked for screen readers.

**Don't:**
- ❌ Snap the knob instantly between states — the hard jump reads as broken, not responsive.
- ❌ Leave the toggle ambiguous during a network request — an un-spun switch looks stuck.
- ❌ Ship a toggle that only responds to a mouse click and skips keyboard and screen-reader users.

---

### 54. Color Picker UX
- **Slug**: `color-picker-ux`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Offer OKLCH next to hex. Hex is for machines; OKLCH's lightness, chroma, and hue let you change one number and get a predictable shade.
- Give the picker memory: recent swatches and saved palettes put your last five picks one tap away instead of re-hunting each time.
- Show a live contrast ratio at pick time, not in review — a badge that flips red to green kills failing pairs before they ship.
- Preview alpha over a checkerboard on both light and dark backgrounds. Transparency lies on a white canvas, so check it before you commit.
- Turn one pick into a system: generate tints and shades from a single hue to produce ten tokens from one decision.

**Do:**
- ✅ Expose human-readable formats like OKLCH so one value maps to a predictable shade
- ✅ Surface recent swatches and saved palettes so past picks stay one tap away
- ✅ Validate contrast live while picking, with a badge that reads red or green

**Don't:**
- ❌ Preview alpha only on white — a checkerboard reveals the true transparency
- ❌ Ship a bare gradient-and-slider picker with no memory, contrast check, or palette output

---

### 55. Microcopy
- **Slug**: `microcopy`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Turn errors into help. "Invalid input" tells the user nothing; "That email's taken — want to log in?" names the problem and offers the next move.
- Empty states are onboarding, not dead ends. Instead of a blank inbox, show the first step the user can take right now.
- Placeholder text is not a label. It vanishes the moment they start typing, leaving fields unidentified — keep a persistent label above the input.
- Write like a person. No real human says "operation failed" — match the tone a helpful colleague would use.
- Copy carries as much weight as layout: labels, errors, empty states, and tone shape whether the interface feels usable or hostile.

**Do:**
- ✅ Label actions with the reward the user gets ("Create my free account"), not the system verb
- ✅ Turn error messages into a next step ("That email's taken — want to log in?")
- ✅ Fill empty states with the first useful action, not a blank screen

**Don't:**
- ❌ Rely on placeholder text as a stand-in for a persistent field label
- ❌ Ship system-speak like "Invalid input" or "operation failed"

---

### 56. Settings System
- **Slug**: `settings-system`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Group by task, not org chart. A flat list of twenty rows becomes three scannable sections the moment it mirrors user intent instead of your data model.
- Make it searchable. Power users never scroll, they search, and one query beats digging through six nested menus.
- Give every changed value a modified indicator plus a per-setting reset, so someone can revert one override without nuking the rest.
- Quarantine destructive actions. Put delete behind a visual wall at the bottom of the page, and gate it behind typing the exact resource name so a stray click can't fire it.
- Collapse advanced options behind an expandable section, keeping the common path short while the depth stays one click away.

**Do:**
- ✅ Match a setting's apply model to its stakes: instant for low-risk toggles, explicit save for identity.
- ✅ Require typing the resource name before an irreversible delete goes through.
- ✅ Surface a reset affordance next to any value the user has changed.

**Don't:**
- ❌ Pour every option into one flat list ordered by your schema.
- ❌ Let irreversible actions fire on a single unguarded click.
- ❌ Bury settings in nested menus when a search box would find them instantly.

---

### 57. CSS Has Selector
- **Slug**: `css-has-selector`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Validation without a handler: .field:has(:user-invalid) turns the border, label and icon at once. No onChange, no error state in React. The browser already knows the email is wrong, so let it drive the styling.
- Escalate to the form: form:has(:user-invalid) button { opacity: .4 } greys out the submit button while any field is invalid. One rule, zero derived state.
- Layout follows the DOM: .app:has(aside) { grid-template-columns: 280px 1fr } grows a column when a sidebar renders and collapses when it is removed. No showSidebar prop to thread through.
- Quantity queries live in CSS: .grid:has(&gt; :nth-child(n + 5)) tightens gap, padding and font size across all cards the moment a fifth one arrives. No counting items in JavaScript.
- The document reacts to a modal: body:has(dialog[open]) { overflow: hidden } locks scroll and a second rule dims the app behind it. Close the dialog and everything reverts on its own. No cleanup effect.

**Do:**
- ✅ Reach for
- ✅ Use
- ✅ Put the rule on the container so border, label and icon all update from one selector.

**Don't:**
- ❌ Mirror DOM state into React state just to toggle a class the browser can already compute.
- ❌ Write a cleanup effect for scroll lock or dimming that a
- ❌ Count children in JavaScript to pick a layout when a quantity query does it in one rule.

---


## Navigation, Modals & User Control

### 58. Modal Hierarchy
- **Slug**: `modal-hierarchy`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- A modal takes over the screen with a full scrim and centers a single decision. Reserve it for critical or destructive choices (like "Delete account?") that must be answered before anything else.
- A bottom sheet is the mobile-first default: it slides up from the bottom edge, supports a drag handle and snap points, and keeps the screen behind it partly visible so users don't lose context.
- A drawer is an edge-anchored panel for navigation — it slides in from the side, dims only the area it covers, and leaves the app alive behind it.
- A popover anchors to the element that triggered it and stays small and contextual (~200px). Use it for lightweight menus and quick actions, never for blocking flows.
- Match weight to intent: modals interrupt, popovers and sheets stay non-blocking. Reaching for a modal when a popover would do adds friction to routine actions.

**Do:**
- ✅ Ask "does this block the user?" before picking any overlay.
- ✅ Reserve modals for critical or destructive decisions that demand a response.
- ✅ Anchor popovers to their trigger and keep them small and contextual.

**Don't:**
- ❌ Reach for a modal when a lightweight sheet or popover would do the job.
- ❌ Use a full-screen scrim for a routine, non-blocking action.
- ❌ Bury navigation inside a blocking overlay — use an edge drawer instead.

---

### 59. Navigation Patterns
- **Slug**: `navigation-patterns`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- A persistent sidebar is the desktop answer for hierarchical content with 5+ sections — keep it in view, since collapsing it by default kills discoverability.
- The hamburger is secondary navigation, never primary. It's acceptable on mobile, but hiding the menu on desktop drops engagement ~56%.
- A command palette (Cmd K) is a search-driven accelerator for power users — pair it with visible nav, because new users don't know it exists.
- Breadcrumbs only earn their space when the hierarchy runs deeper than 2 levels; on flat structures they add noise instead of orientation.
- Choose by platform and depth, not taste — the whole set is one system, not five interchangeable options.

**Do:**
- ✅ Match the pattern to the platform: bottom tabs on mobile, a persistent sidebar on desktop.
- ✅ Keep primary destinations visible — 3-5 for tabs, 5+ sections to justify a sidebar.
- ✅ Reserve breadcrumbs for hierarchies deeper than two levels.

**Don't:**
- ❌ Hide primary navigation in a hamburger — engagement drops 40-56%.
- ❌ Make a command palette the only path to a feature; new users won't discover it.
- ❌ Add breadcrumbs to a flat structure where they're just visual noise.

---

### 60. Tabs System
- **Slug**: `tabs-system`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- When tabs overflow one screen, never wrap to a second line. Scroll horizontally, add edge fades to hint at what's off-screen, and put chevron buttons on desktop.
- Make it keyboard-operable: arrows move between tabs, Home jumps to first, End to last, and Tab exits to the next focusable group.
- The focus ring and the active state must never share a color — otherwise keyboard users can't tell where they are versus what's selected.
- Content should never hard-cut on switch. Fade out, pause ~80ms, fade in, and match panel heights so nothing shifts.
- Mobile isn't a shrunk desktop: use a segmented control under 5 tabs, a bottom sheet over 5, never a scaled-down bar.

**Do:**
- ✅ Slide the active indicator with a spring, timed to match the content fade
- ✅ Scroll an overflowing tab row horizontally with edge fades and desktop chevrons
- ✅ Give the focus ring and active state distinct colors

**Don't:**
- ❌ Wrap an overflowing tab row onto a second line
- ❌ Hard-cut content on switch — fade out, pause, fade in instead
- ❌ Reuse the desktop tab bar shrunk down on mobile

---

### 61. Bottom Sheets
- **Slug**: `bottom-sheets`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Anchor menus and actions to the bottom of the screen, where the thumb naturally rests, instead of the top-right corner most navs default to.
- Unlike a full modal that blocks everything, a bottom sheet keeps the underlying page visible so users never lose their place.
- Add snap points so the sheet can rest half-open or expand to full height, matching how much content the user actually needs.
- Support drag-to-dismiss — a downward gesture maps to the sheet's direction and needs no tiny close target to hit.
- Dim the background with a scrim and lock body scroll so only the sheet moves, keeping focus on the active task.

**Do:**
- ✅ Place primary actions within thumb reach at the bottom of the screen
- ✅ Keep the page visible behind the sheet to preserve context
- ✅ Offer snap points and drag-to-dismiss for flexible, gesture-friendly height

**Don't:**
- ❌ Bury frequent menus in the top-right dead zone on tall phones
- ❌ Block the whole screen with a full modal when a sheet would do
- ❌ Leave the background scrollable while the sheet is open

---

### 62. Context Menu
- **Slug**: `context-menu`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Twelve flat actions read as noise. Group by intent and split with dividers: pair Rename with Duplicate, Share with Copy link, and isolate Delete at the bottom in red.
- Submenus die the instant the cursor drifts off the row. Draw an invisible safe triangle from cursor to submenu so the menu holds while you move diagonally toward it. That is hover intent.
- Power users never aim. Arrows walk the list, letters jump (press D, land on Duplicate), and Escape closes one level, not the whole menu.
- Mobile has no right click. A long press opens the same actions as a bottom sheet: one menu system, two triggers.

**Do:**
- ✅ Measure available space and flip the menu so it always opens inside the viewport.
- ✅ Group actions by intent with dividers, and set the destructive action apart at the bottom in red.
- ✅ Add a safe triangle from cursor to submenu so it survives a diagonal move.

**Don't:**
- ❌ Close a submenu the moment the cursor leaves the row, ignoring the diagonal path toward it.
- ❌ Dump a dozen ungrouped actions into one flat, unscannable list.
- ❌ Ship right-click only; wire a long press to the same actions on mobile.

---

### 63. Dropdown Design
- **Slug**: `dropdown-design`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Flip on edge — when there isn't enough room below the trigger, open the menu upward so it never clips off-screen.
- Keyboard support isn't optional: arrow keys move the highlight, Enter selects the item, and Esc closes the menu.
- Once a list passes ~10 items, add a search field so users filter instead of scroll-hunting.
- Animate the open in around 150ms — 50ms feels instant and cheap, 500ms drags and feels sluggish.

**Do:**
- ✅ Give the trigger a 48px touch target, a clear caret, and a visible hover state.
- ✅ Open the menu upward when space below the trigger runs out.
- ✅ Wire up arrow keys, Enter, and Esc for full keyboard control.

**Don't:**
- ❌ Ship a 30px, low-contrast trigger with no hover feedback.
- ❌ Let a long menu clip off the bottom of the viewport.
- ❌ Animate slower than ~150ms — or with no transition at all.

---

### 64. Accordion Disclosure
- **Slug**: `accordion-disclosure`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Drive the chevron rotation from the same timing curve as the panel. Even ~10 frames of lag between the two reads as broken, not smooth.
- Decide single vs multi open: an accordion lets one panel open at a time, a disclosure lets many stay open. Sequential steps stay single; FAQ lists let several breathe.
- The header is a &lt;button&gt;, not a &lt;div&gt;. Wire aria-expanded to reflect state and aria-controls to point at the panel, so Enter/Space toggle it and the focus ring shows.
- When an item near the bottom expands, anchor the tapped header so the list doesn't jump under the user, and stagger the revealed content in.

**Do:**
- ✅ Drive chevron rotation and panel height from one shared timing curve so they move as a unit
- ✅ Render the header as a real
- ✅ Match open behavior to content — one-at-a-time for steps, many-open for FAQ lists

**Don't:**
- ❌ Animate
- ❌ Let the chevron trail the panel; even a few frames of lag feels janky
- ❌ Let the list scroll-jump when a lower item expands — keep the tapped header anchored

---

### 65. Destructive Actions
- **Slug**: `destructive-actions`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Name the action on the button itself. Delete project / Keep project beats a generic Yes / No, because the verb is the warning and nobody reads 'Are you sure?'.
- Never place a destructive button where confirm usually lives. Muscle memory clicks primary spots blind, so moving delete elsewhere keeps autopilot from reaching it.
- Red is a budget: spend it on destruction only. A red logout button cries wolf, and then the real delete looks routine.
- Bury deletion in a bordered, labeled danger zone at the bottom of the page. Geography itself becomes friction that slows the hand.
- Give irreversible deletions a cooldown: schedule it with a grace period (for example 14 days to cancel). Time is the last line of defense.

**Do:**
- ✅ Name the destructive action on the button so the verb itself does the warning.
- ✅ Reserve red for destructive actions only, and add friction like a hold gesture or a danger zone.
- ✅ Give irreversible deletions a cancelable cooldown before they take effect.

**Don't:**
- ❌ Place destructive buttons where the confirm button usually sits.
- ❌ Rely on a generic 'Are you sure?' dialog that nobody actually reads.
- ❌ Spread red across logout, badges, and alerts until delete looks routine.

---

### 66. Disabled Buttons
- **Slug**: `disabled-buttons`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Pointer events are dead on a disabled element, so a tooltip meant to explain the block never fires. The reason is unreachable by design.
- Greyed-out labels usually fail contrast. A disabled state can land near 1.9:1, well under the 4.5:1 threshold, so the text is hard to read on top of being blocked.
- Keep the button live and validate on click instead. Light up the fields that are blocking submit, then move focus to the first one so the path forward is visible.
- Disabled and loading are different states. During a request, hold focus, show a spinner, and report aria-busy; greying the button out throws the user's place away.

**Do:**
- ✅ Keep the button enabled, validate on click, then flag the blocking fields and move focus to the first one.
- ✅ For async actions, use a busy state that holds focus, spins, and sets aria-busy.
- ✅ Name the blocker in reachable text, not a tooltip attached to a dead control.

**Don't:**
- ❌ Disable submit and leave the user to guess what is missing.
- ❌ Rely on a tooltip to explain a disabled control, since pointer events never fire on it.
- ❌ Treat loading as disabled; greying out mid-request drops focus and the user's place.

---

### 67. Tooltip Design
- **Slug**: `tooltip-design`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Anchor the tooltip to its trigger with an arrow. Without one, a floating label sitting above a row of icons leaves users guessing which element it actually describes.
- Flip the tooltip to the opposite side when the trigger sits near a viewport edge — otherwise it gets clipped off-screen instead of staying readable.
- Make it dismissible everywhere: mouse leave, the Escape key, focus out (blur), and a tap outside should all close it. Every escape route matters.
- Keep the copy tight — cap the width around 300px and hold it to one sentence. If you need a documentation paragraph, it's not a tooltip anymore.

**Do:**
- ✅ Wait ~300ms before revealing a hover tooltip
- ✅ Point at the trigger with an arrow so the reference is unambiguous
- ✅ Flip position near viewport edges to prevent clipping

**Don't:**
- ❌ Fire instantly on every cursor graze
- ❌ Cram multi-line, documentation-length text into a single tooltip

---

### 68. Swipe Actions
- **Slug**: `swipe-actions`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Destructive swipes need friction: a full swipe that instantly deletes is a data-loss bug waiting to happen. Reveal the button on partial swipe, require a tap (or full-swipe + undo toast) to commit.
- Color-code by consequence: neutral actions on surface tones, destructive on red — and keep the mapping consistent across every list in the app.
- Never make swipe the only path. Every swipe action needs a visible fallback (long-press menu, detail-view button) for discoverability and accessibility.

**Do:**
- ✅ pair each swipe action with an undo window, and keep left/right semantics consistent app-wide.

**Don't:**
- ❌ hide more than two actions per side — beyond that, users can't build muscle memory.

---

### 69. Drag and Drop
- **Slug**: `drag-and-drop`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Drop zones speak first. Reveal where the item will land before release, not after — the drag should never feel like a guess.
- Match the drop-zone cue to its scope: an insertion line to slot between existing items, a filled highlight to land inside a whole column.
- On structured surfaces, snap the item to the nearest valid slot; reserve free positioning for canvases where any coordinate is valid.
- While dragging on a snapping surface, expose the valid target slots (dashed outlines) so the destination is never ambiguous.
- A drag is easy to fumble. Pair every drop with a short undo toast (~5 seconds) so a wrong move costs one click, not a redo.

**Do:**
- ✅ Confirm pickup with scale, shadow, and tilt together so the grab reads instantly
- ✅ Highlight the exact drop target during the drag, before the user lets go
- ✅ Offer a brief undo after a drop so a misdrop is one click to reverse

**Don't:**
- ❌ Snap a released card into place with no lift or shadow — it feels like nothing happened
- ❌ Force pixel-precise placement when snapping to a valid slot would do the work
- ❌ Make a wrong drop permanent with no way to reverse it

---

### 70. Live Cursors
- **Slug**: `live-cursors`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Give every user a color hashed from their ID, not assigned at random. The same person keeps the same color across sessions, so you can track identity from the corner of your eye.
- An avatar stack with an overflow counter (three faces, then a +5) signals presence before anyone edits or speaks. You feel the room before you read a single name.
- When someone selects an element, lock it and outline it in their color. Two people editing one shape is a corrupted shape, so the lock prevents the conflict before it can exist.
- Follow mode binds your viewport to another user's: click their avatar and their pans and zooms drive your screen. It replaces a screen share for live design review.

**Do:**
- ✅ Interpolate cursor positions between server ticks so movement reads as smooth motion at 60fps.
- ✅ Derive user color from a stable hash of the ID so it survives across sessions.
- ✅ Lock an element the instant it is selected and badge it in the editor's color.

**Don't:**
- ❌ Render cursors at the raw server tick rate, which makes them jump between points.
- ❌ Assign colors randomly per session, which resets identity every time someone rejoins.
- ❌ Allow two users to edit the same element at once.

---

### 71. Star Rating
- **Slug**: `star-rating`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Keep the preview state separate from the committed value. When the pointer leaves without clicking, snap the display back to the saved rating; a naive build leaves it stuck on the last hovered star.
- For averages, render fractional stars — a 4.4 is four full stars plus a fifth clipped to 44%. Rounding it up to five full stars is a lie that inflates perceived quality.
- Stagger the fill ~30ms per star, left to right. Popping all five at once feels flat and lifeless; the sequential sweep feels alive.
- Use fractional fill for input precision too — clumsy whole-star jumps read as cheap next to a smooth half-star land.
- Stars are the input; pair them with a summary view (an average ring plus a distribution breakdown) to communicate the aggregate score at a glance.

**Do:**
- ✅ Fill stars ahead of the cursor on hover so the value previews before commit
- ✅ Render partial fills so a 4.4 shows four stars plus a 44%-filled fifth
- ✅ Stagger the fill roughly 30ms per star, left to right, when a rating commits

**Don't:**
- ❌ Round averages up to full stars — it misrepresents the real score
- ❌ Leave the preview stuck on the hovered value after the pointer leaves
- ❌ Pop all five stars simultaneously — it reads as flat and dead

---

### 72. Peak-End Rule
- **Slug**: `peak-end-rule`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Two flows with an identical average satisfaction are remembered completely differently based on how they finish — same middle, opposite memory.
- Engineer at least one intentional peak: a surprise upgrade, a free perk, a moment of delight. One delight outweighs five neutral steps.
- The ending carries disproportionate weight — a joyful last screen beats a flat, cold confirmation for the exact same effort.
- The reverse also holds: a broken or error-filled final step tanks the memory of an otherwise smooth experience.
- Stop trying to make every step equally good — concentrate your effort on the peak and the end.

**Do:**
- ✅ Engineer a deliberate peak — a surprise or moment of delight partway through the flow.
- ✅ End on a high note: celebrate success on the last screen instead of a flat confirmation.
- ✅ Audit the final interaction of every flow — it weighs heaviest in what users remember.

**Don't:**
- ❌ Spread effort evenly across every step while neglecting the finish.
- ❌ Let a flow end on friction, an error, or a cold dead-end.

---

### 73. Proximity Rule
- **Slug**: `proximity-rule`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- You rarely need borders, boxes, or dividers to create structure — spacing does the grouping by itself.
- The trick is contrast: make the gap within a group smaller than the gap between groups. Equal spacing everywhere flattens the hierarchy and everything reads as one undifferentiated block.
- In forms, tighten related fields (~12px) and open up section breaks (~40px) so 'Personal Info' and 'Payment' visibly separate without a single line.
- In toolbars and nav, group controls by function — navigate, actions, system — instead of laying them out in one evenly-spaced row.
- Same content, more clarity: a flat list of eight sidebar links becomes scannable the moment it's split into labeled groups like Dashboard, Management, and Account.

**Do:**
- ✅ Keep spacing within a group tighter than the spacing between groups
- ✅ Group form fields and nav items by function or meaning
- ✅ Let whitespace carry the grouping before reaching for borders or dividers

**Don't:**
- ❌ Space every element equally — it erases hierarchy and forces users to parse everything at once
- ❌ Reach for boxes and dividers when a larger gap would communicate the same grouping

---

### 74. Von Restorff Effect
- **Slug**: `von-restorff`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- It only works against a uniform baseline — three identical cards give the eye nowhere to go. Contrast is relative, so keep everything else calm and change just one thing.
- In pricing, isolate the target plan: scale it up, add a "Most Popular" badge, and dim the alternatives so the choice steers itself.
- Break the pattern with a single CTA — one "Get Started" button lifted by color, scale, and glow pulls attention (heat maps concentrate right on it) while nav links recede.
- In forms, emphasize the primary action and mute the secondary ones, so the next step is never in question.
- Differentiate with more than color — combine scale, elevation, and glow so the standout reads reliably, including for color-blind users.

**Do:**
- ✅ Isolate the one action you want taken, using scale, color, and a badge against a uniform baseline
- ✅ Keep surrounding elements visually quiet so the highlighted one truly stands out
- ✅ Limit emphasis to a single element per view — target plan, primary CTA, or main form button

**Don't:**
- ❌ Highlight two or three elements at once — competing emphasis cancels the effect entirely
- ❌ Ship identical options and hope users pick the one you actually want them to choose
- ❌ Lean on color alone; pair it with scale or elevation so the contrast holds up

---

### 75. Z-Index Mastery
- **Slug**: `z-index-mastery`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- Every stacking context is its own universe. A child at z-index: 9999 can never climb above its parent's siblings — if the parent sits below, the child sits below too, no matter how huge the number.
- A z-index arms race (9999, then 99999) is a symptom, not a fix — the real culprit is almost always an unexpected stacking context somewhere up the tree.
- isolation: isolate spins up a fresh stacking context in one line, so a component's internal layers stop leaking out and z-fighting with the rest of the page.
- Stop guessing at the order — Chrome DevTools' Layers panel renders the page in 3D so you can see which element actually sits on top.

**Do:**
- ✅ Give an element
- ✅ Reach for
- ✅ Open DevTools' Layers panel to inspect the real 3D stack instead of trial-and-error.

**Don't:**
- ❌ Escalate to
- ❌ Assume a bigger z-index always wins; it only ranks siblings inside the same stacking context.

---

### 76. Landing Page Skeleton
- **Slug**: `landing-page-skeleton`
- **Video Breakdown**: [Watch Video on Instagram](https://www.instagram.com/designmotionhq/)

**Key Insights & Reasoning:**
- The hero has to answer three questions in ~3 seconds: what you offer, who it's for, and why they should care. Headline + subhead + one CTA, nothing more.
- Put social proof right after the hero, not buried at the bottom — visitors decide whether to trust you almost immediately. Logos, one testimonial, one hard number.
- Agitate the problem before pitching the solution. No felt pain means no reason to care about the cure, so name the real cost in time, money, and frustration.
- Sell outcomes, not features: cap it at three benefits and frame each as a result — "save 10 hours a week" beats "advanced automation."
- Repeat the exact same CTA at the top and bottom — same color, same copy. Repetition converts the scroller who wasn't ready the first time.

**Do:**
- ✅ Lead the hero with a headline, subhead, and a single clear call to action
- ✅ Place proof (logos, testimonials, a key metric) directly below the hero
- ✅ Frame benefits as concrete outcomes and keep them to three max

**Don't:**
- ❌ Use carousels or sliders in the hero — they hide the one message that matters
- ❌ Bury social proof at the bottom of the page where nobody scrolls to it
- ❌ Jump straight to the solution before establishing the pain it solves

---

