# Sonaro Unified Design Aesthetic

This document consolidates the primitive replication notes in `.spec/docs/` into one product-level design guide for Sonaro's Android screens. It describes the visual language, reusable aesthetic rules, and per-screen mood so future implementation work stays coherent across the app.

Source primitives:

- `.spec/docs/sonaro_screens_replication.md`
- `.spec/docs/sonaro_screens_replication_2.md`
- `.spec/docs/sonaro_screen_with_animations.md`

Do not implement OS status bars, Android navigation bars, device chrome, browser chrome, clocks, signal icons, Wi-Fi icons, battery indicators, or screenshot capture artifacts.

---

## 1. Design Intent

Sonaro should feel like a focused engine-diagnostics instrument: technical, direct, high-contrast, and slightly futuristic, without becoming visually cold. The app combines automotive warning language with soft audio-analysis visuals.

The core aesthetic is built from three ideas:

- Diagnostic clarity: screens should communicate status instantly through strong color fields, centered hierarchy, and large typography.
- Audio intelligence: sound analysis is represented with waveform bars, glowing orbs, soft cyan accents, and animated pulse behavior.
- Automotive urgency: orange, red, navy, and yellow are used like dashboard signals: safe, processing, warning, and critical states.

The design is intentionally bold and simple. Each screen has few elements, large empty space, and a clear primary visual anchor.

---

## 2. Brand Personality

Use these adjectives as the north star for UI decisions:

- Technical
- Confident
- Alert
- Clean
- High-contrast
- Slightly futuristic
- Utility-first
- Friendly enough for non-experts

Avoid these qualities:

- Generic SaaS minimalism
- Soft pastel wellness styling
- Dense automotive dashboard simulation
- Overly realistic mechanical textures
- Decorative complexity that competes with the diagnosis result

---

## 3. Global Visual System

### 3.1 Color Language

Sonaro uses a compact, signal-based palette.

```ts
colors = {
  white: '#FFFFFF',
  black: '#000000',

  navy: '#0D3B66',
  navyDeep: '#033360',
  analysisBlue: '#1B5084',
  recordingBlue: '#14476F',

  orange: '#FF6700',
  orangeLine: '#E98129',
  redCritical: '#FF0000',
  redWarning: '#E6002E',
  yellowSignal: '#FFF500',
  yellowInstruction: '#E8E600',

  cyanSoft: '#A8EEFE',
  cyanText: '#A5F3F1',
  cyanLight: '#D0F6FE',
  cyanFaint: '#F3FEFF',

  purpleBrand: '#1E169C',
  purpleOrb: '#A44BFF',
  blueOrb: '#5E6DFF',

  textMuted: '#6F6F6F',
  bodyGray: '#747474',
  buttonBorderDark: '#2A2A2A'
}
```

Color roles:

- White backgrounds are used for onboarding, instructions, and pre-diagnosis education.
- Navy and analysis blue represent technical analysis, recording, and trusted machine processing.
- Orange represents action, warning, and issue selection.
- Red represents critical attention states only.
- Yellow is used sparingly for result emphasis and urgent instructional text.
- Cyan and purple represent sound, AI, and audio-reactive feedback.

Do not introduce additional brand colors unless a new state cannot be represented by the existing palette.

### 3.2 Typography

The app uses `audiowave` as the primary display, body, and UI font. This gives every screen the same technical identity.

Typography should be large, centered, and sparse. Most screens use one title, one short subtitle or status, and one main visual element.

```ts
fonts = {
  display: 'audiowave',
  body: 'audiowave',
  ui: 'audiowave',
  logo: 'audiowave'
}
```

General type rules:

- Use explicit line height instead of relying on defaults.
- Use slight letter spacing on headings and buttons, around `0.2dp` when unspecified.
- Preserve centered text alignment for status, onboarding, loading, and result screens.
- Use left alignment only for instructional body content.
- Use tabular numbers for timers to prevent jitter.
- Prefer corrected product copy from the primitive specs over screenshot typos.

Representative sizes:

```ts
typeScale = {
  logo: 50,
  timer: 39,
  resultTitle: 26,
  screenTitle: 24,
  onboardingTitle: 27,
  authTitle: 29,
  instructionTitle: 23,
  bodyLarge: 23,
  buttonLarge: 22,
  buttonDefault: 16,
  caption: 15
}
```

### 3.3 Shape And Surfaces

The UI uses simple geometric surfaces with strong contrast.

```ts
radii = {
  smallCard: 7,
  buttonMedium: 8,
  bottomPanelTop: 48,
  pill: 999,
  recordingSideButton: 25,
  circle: 999
}
```

Surface roles:

- Full-bleed background color carries most screen emotion.
- Bottom panels can use large top radii to create a grounded control zone.
- Primary CTAs use pill or medium-rounded shapes depending on the screen family.
- Status badges use compact rectangular forms with `7dp` radius.
- Recording controls use white floating buttons with soft shadows.

### 3.4 Spacing And Layout

Most screens are composed as a single centered vertical story.

Common rules:

- Keep root screens full viewport height and width.
- Use absolute positioning for pixel-close replication screens when needed.
- Use `16dp` to `20dp` horizontal margins for buttons and content blocks.
- Preserve large vertical gaps; whitespace is part of the aesthetic.
- Keep illustrations centered horizontally.
- On shorter devices, preserve touch target sizes before compressing vertical gaps.
- Use screen-specific reference sizes from primitive docs for high-fidelity implementation.

Reference scaling:

```ts
scaleX = screenWidth / referenceSize.width
scaleY = screenHeight / referenceSize.height
scale = Math.min(scaleX, scaleY)
```

Primary reference canvases:

- `440x956dp` for most static screens.
- `447x978dp` for onboarding intro.
- `430x956dp` for auth welcome.
- `388x807dp` for the recording screen from video capture.
- `440x1102dp` content reference for the scrollable how-to-use screen.

### 3.5 Illustration Style

Illustrations are central to the app and should be treated as assets, not reconstructed in code.

Visual qualities:

- Clean vector or vector-like raster artwork.
- High-contrast shapes.
- Automotive and mechanical motifs.
- Limited internal detail.
- Bright accent colors against simple backgrounds.
- Centered composition with clear silhouette.

Normalized asset names from primitives:

```ts
assets = {
  brandLogoMark: 'asset_brand_logo_mark',
  brandLogoText: 'asset_brand_logo_text',
  diagonalAudioBarsTop: 'vector_diagonal_audio_bars_top',
  diagonalAudioBarsBottom: 'vector_diagonal_audio_bars_bottom',
  onboardingIntroIllustration: 'illustration_onboarding_intro',
  authHeroIllustration: 'illustration_auth_hero',
  googleIcon: 'icon_google',
  guestIcon: 'icon_guest',
  warningIllustration: 'illustration_warning_triangle_sparkles',
  scoreRingIcon: 'icon_score_ring_60',
  gearsLoadingIllustration: 'illustration_gears_loading',
  waveformLoadingBars: 'vector_waveform_loading_bars',
  normalEngineCarIllustration: 'illustration_car_front_normal',
  attentionEngineCarIllustration: 'illustration_car_engine_attention',
  animatedAudioOrb: 'animated_audio_orb',
  bottomAmbientBlur: 'bottom_ambient_blur'
}
```

### 3.6 Controls

Controls should look large, simple, and obvious.

Button rules:

- Minimum touch height is `48dp`.
- Full-width CTAs use `16dp` to `20dp` side margins.
- Press feedback should be subtle: opacity around `0.85` or scale around `0.98`.
- Disabled state uses opacity around `0.55` and blocks interaction.
- Do not add hidden tap targets to purely informational status screens.

Button families:

- Navy rectangular CTA: serious primary action, used for onboarding and record-again flows.
- Orange pill CTA: guest or warning action, used inside the auth panel.
- White pill CTA: external auth action, especially Google sign-in.
- Black pill CTA: secondary information action, used for how-to-use.
- White floating recording controls: tactile audio-recorder controls on blue background.

---

## 4. Motion Language

Motion should reinforce audio processing and interaction feedback. It should not distract from diagnostic status.

### 4.1 Splash Transition

The splash screen is static and brand-first. Auto-transition to onboarding after approximately `1600ms` unless product flow overrides it.

### 4.2 Loading Motion

The loading screen may animate gears and waveform bars.

Recommended loading animation:

- Waveform bars scale vertically between `0.65` and `1.15`.
- Duration ranges from `600ms` to `900ms`.
- Stagger each bar by about `80ms`.
- Use `easeInOut`.
- Gear rotation can be subtle and continuous if the asset supports it.

### 4.3 Recording Orb Motion

The recording orb is the most expressive motion in the app. It should behave like an audio-reactive glowing ring.

Orb style:

- Purple-blue gradient stroke.
- Transparent center.
- Soft glow around the ring.
- Center label reads `RECORDING\nSOUND`.
- Shape morphs between circle, horizontal oval, and slightly tilted organic oval.

Core motion:

- Main morph loop around `2400ms`.
- Glow pulse around `1200ms`.
- Long visibility cycle around `8200ms`.
- Text fades with orb visibility but remains stable and centered while visible.

The orb must not be a static image. Use animated SVG, animated vector paths, or an equivalent vector/canvas implementation.

### 4.4 Interaction Motion

Control press feedback should feel tactile but restrained.

```ts
pressFeedback = {
  scaleDown: 0.95,
  opacityDown: 0.88,
  durationDown: 90,
  durationUp: 140,
  easing: 'easeOut'
}
```

---

## 5. Screen Families

### 5.1 Brand And Onboarding Screens

Screens: splash, onboarding intro, auth welcome, how-to-use.

Aesthetic:

- White-led composition.
- Large centered illustrations.
- Navy and orange brand contrast.
- Friendly education copy.
- Spacious vertical layout.

These screens should feel approachable and explanatory, not urgent.

### 5.2 Audio Capture And Analysis Screens

Screens: recording, analysis loading.

Aesthetic:

- Deep blue backgrounds.
- White type.
- Cyan or purple audio accents.
- Centered instrument-like elements.
- Motion communicates live processing.

These screens should feel active, technical, and focused.

### 5.3 Diagnostic Result Screens

Screens: engine status normal, engine status attention, multiple issues.

Aesthetic:

- Strong status colors.
- Minimal text.
- Large result badges or issue cards.
- Automotive warning palette.
- No extra decoration beyond the main diagnostic illustration.

These screens should communicate the result immediately.

---

## 6. Screen Aesthetic Notes

### 6.1 Splash Screen

Purpose: brand entry.

Visual character:

- Pure white background.
- Purple Sonaro logo centered slightly below vertical center.
- Soft cyan diagonal audio bars in top-left and bottom-right corners.
- Decorative bars are oversized, partially clipped, and low-pressure.

Key aesthetic rule: the splash should feel clean and sonic, not automotive or warning-heavy yet.

### 6.2 Onboarding Intro Screen

Purpose: explain the product promise.

Visual character:

- White background with one large upper illustration.
- Centered black headline: `Hear the Problem\nBefore It Breaks`.
- Muted gray italic explanatory copy.
- Navy full-width CTA at the lower portion of the screen.

Key aesthetic rule: the screen should feel educational and reassuring, with a strong but calm call to action.

### 6.3 Auth Welcome Screen

Purpose: present entry options.

Visual character:

- White top area with centered welcome title, orange subtitle, and hero illustration.
- Dark navy bottom panel anchored to the bottom with large rounded top corners.
- Large pill buttons stacked vertically.
- White Google button, orange guest button, black how-to-use button.
- White divider inside the navy panel.

Key aesthetic rule: the panel should feel like a solid control console while the top remains welcoming.

### 6.4 How To Use Screen

Purpose: explain recording and diagnosis steps.

Visual character:

- White scrollable page.
- Centered black title: `how to use`.
- Orange numbered step titles.
- Gray large body text with generous line height and left indentation.

Key aesthetic rule: this is the only text-heavy screen, so preserve readability and spacing over decorative density.

### 6.5 Recording Screen

Purpose: live audio recording before analysis.

Visual character:

- Full deep navy-blue background.
- Small language selector in the top-left.
- Large centered timer near the top.
- Animated purple-blue audio orb in the middle.
- Recording name and metadata centered below the orb.
- Three bottom controls: stop left, large mic center, close right.
- Soft warm/cool ambient blur near the bottom edge.

Key aesthetic rule: this screen should feel like a live diagnostic instrument. The glowing orb is the emotional center and the timer is the functional anchor.

### 6.6 Analysis Loading Screen

Purpose: communicate active AI processing.

Visual character:

- Full analysis-blue background.
- Centered gears illustration in upper-middle screen.
- White loading title: `Analyzing engine sound...`.
- Cyan subtitle: `This will only take a few seconds`.
- Waveform bars below the text.

Key aesthetic rule: the screen should look busy only through controlled animation, not through additional UI elements.

### 6.7 Engine Status Normal Screen

Purpose: show no detected abnormal sound.

Visual character:

- Full analysis-blue background.
- Centered normal car illustration.
- White title: `Engine Status`.
- Green rectangular badge: `Normal`.
- Yellow result message: `No abnormal engine\nsounds detected.`

Key aesthetic rule: safe state should still feel technical and high-contrast, not celebratory.

### 6.8 Engine Status Attention Screen

Purpose: show a critical diagnosis requiring attention.

Visual character:

- Full red background.
- Centered attention engine illustration.
- White title: `Engine Status`.
- Orange rectangular badge: `Attention Required`.
- No secondary message or CTA in the primitive spec.

Key aesthetic rule: use red as the whole-screen signal. Do not dilute it with extra panels or decorative elements.

### 6.9 Multiple Issues Screen

Purpose: show multiple detected issues and ask the user to select one.

Visual character:

- White top transitioning into orange bottom.
- Centered warning triangle/sparkle illustration.
- Red warning title: `Multiple issues found`.
- Yellow instruction text: `Select one to view instructions`.
- Orange issue cards with white text and score ring icons.
- Navy `Record Again` button below the cards.

Key aesthetic rule: this screen should feel like an alert list. The orange card stack and bottom orange field should visually pull the user toward selecting an issue.

---

## 7. Shared Component Aesthetics

### 7.1 Screen Root

Every screen should have a clear dominant background and no accidental default surface color. Use `overflow: hidden` on fixed-height visual screens when decorative elements are intentionally clipped.

### 7.2 Centered Asset

Centered assets should preserve their source aspect ratio and use `contain`. They are visual anchors, not layout fillers.

### 7.3 Status Badge

Status badges are compact, rectangular, and centered. They are visual indicators, not tappable controls.

```ts
statusBadge = {
  width: 301,
  height: 63,
  radius: 7,
  textColor: '#FFFFFF',
  textSizeRange: [25, 26],
  fontWeight: 700
}
```

### 7.4 Issue Card

Issue cards are orange, shadowed, and horizontally simple.

```ts
issueCard = {
  height: 76,
  radius: 7,
  backgroundColor: '#FF6700',
  titleColor: '#FFFFFF',
  scoreIconSize: 50,
  shadow: '0px 7px 10px rgba(74, 38, 21, 0.35)'
}
```

### 7.5 Recording Controls

Recording controls should be bright white against deep blue, with dark icons and soft shadows.

```ts
recordingControls = {
  sideButton: { width: 86, height: 82, radius: 25 },
  centerButton: { width: 94, height: 94, radius: 999 },
  backgroundColor: '#FFFFFF',
  iconColor: '#111111',
  shadowColor: 'rgba(0, 0, 0, 0.18)'
}
```

---

## 8. Copy Tone

Copy should be short, concrete, and instructional.

Use:

- `Get Started`
- `Continue with Google`
- `Continue as a Guest`
- `How to use`
- `Analyzing engine sound...`
- `This will only take a few seconds`
- `Engine Status`
- `Normal`
- `Attention Required`
- `Multiple issues found`
- `Select one to view instructions`
- `Record Again`

Avoid:

- Long marketing language in diagnostic screens.
- Casual jokes or playful status messages.
- Extra reassurance on critical warning screens unless product explicitly requires it.
- Preserving screenshot typos when primitive specs provide corrected copy.

---

## 9. Accessibility And Usability

- Keep all touch targets at least `48dp` high.
- Buttons need accessible labels matching visible text.
- Decorative bars and purely decorative glows should be hidden from screen readers.
- Illustrations should have neutral labels or be hidden if decorative.
- Status text must remain readable against strong background colors.
- Do not rely on color alone for diagnosis when real app data is introduced; pair color with text labels like `Normal` and `Attention Required`.
- Preserve timer width with tabular numbers to avoid layout jitter.

---

## 10. Implementation Guardrails

- Use normalized asset names from this document and the primitive specs.
- Use `@/` imports in app code.
- Do not reconstruct detailed illustrations manually in React Native views.
- Do not add extra controls to result screens that were specified as informational only.
- Do not introduce new layout chrome around full-screen status states.
- Keep visual changes minimal when implementing a single screen so it remains aligned with the shared system.
- Prefer per-screen reference scaling from primitive specs for pixel-close replication.
- Preserve button dimensions and safe touch areas before reducing decorative spacing on small screens.
