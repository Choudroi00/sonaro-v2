# Sonaro Android Screen Replication Specs - Additional Screens

Target: coding agent implementation for full-screen Android app replication.

Global rule: exclude native status bar, navigation bar, device time, signal, Wi-Fi, and battery from implementation. All coordinates below are based on the visible screenshot canvas.

Shared app assumptions:
- Canvas width: `440dp` screenshot reference for all screens in this file.
- Base screen height: `956dp`, except `how_to_use_screen` with `1102dp` scroll/content reference.
- Primary display font: `audiowave` (project global font).
- Text should use explicit letter spacing close to screenshot appearance, especially headings and buttons.
- Images and illustrations must be referenced by normalized asset names only. Asset names may be descriptive for lookup, but code should not reconstruct illustration internals.
- Coordinates are app-viewport measurements after OS chrome is excluded. Use `screenWidth / 440` for horizontal scaling and `screenHeight / 956` for fixed-height screens unless a screen declares a different content height.
- Any remaining `px` suffix in this spec means a dp-equivalent screenshot reference unit.
- Use corrected product copy defined in this spec. Apparent screenshot typos are not normative unless explicitly marked `screenshot-copy`.
- Expo Router route files should use kebab-case names: `/multiple-issues`, `/how-to-use`, `/analysis-loading`, `/engine-status-normal`, and `/engine-status-attention`.

---

## 1. `multiple_issues_screen`

### Purpose
Shows a warning state after analysis when multiple engine issues are detected. User selects one issue card to view instructions or can record again.

### Design Tokens

```ts
const multipleIssuesTokens = {
  colors: {
    backgroundTop: '#FFFFFF',
    backgroundBottom: '#FF6700',
    primaryOrange: '#FF6700',
    orangeCard: '#FF6700',
    orangeCardShadow: 'rgba(80, 40, 20, 0.35)',
    warningRed: '#E6002E',
    instructionYellow: '#E8E600',
    white: '#FFFFFF',
    navyButton: '#0F4778',
    navyButtonText: '#FFFFFF',
    cardText: '#FFFFFF',
    scoreYellow: '#F7F13A',
    scorePurple: '#7A3FF2',
    scorePink: '#FF4D9D'
  },
  typography: {
    fontFamily: 'audiowave',
    warningTitle: { size: 20, weight: 600, lineHeight: 26, letterSpacing: 0.2 },
    subtitle: { size: 19, weight: 500, lineHeight: 26, letterSpacing: 0.3 },
    issueTitle: { size: 18, weight: 700, lineHeight: 24, letterSpacing: 0.2 },
    button: { size: 16, weight: 600, lineHeight: 22, letterSpacing: 0.2 },
    score: { size: 15, weight: 700, lineHeight: 18, letterSpacing: 0 }
  },
  radius: {
    card: 7,
    button: 8,
    scoreCircle: 999
  },
  shadow: {
    card: '0px 7px 10px rgba(74, 38, 21, 0.35)',
    text: '1px 2px 3px rgba(0,0,0,0.35)',
    button: 'none'
  },
  spacing: {
    screenPaddingX: 16,
    topContentOffset: 80,
    cardGap: 37,
    cardHeight: 76,
    buttonHeight: 56
  }
}
```

### Asset Props

```ts
const assets = {
  warningIllustration: {
    name: 'illustration_warning_triangle_sparkles',
    type: 'vector-or-png',
    width: 142,
    height: 131,
    resizeMode: 'contain'
  },
  scoreRingIcon: {
    name: 'icon_score_ring_60',
    type: 'vector-or-png',
    width: 50,
    height: 50,
    resizeMode: 'contain'
  }
}
```

### Layout Structure

```txt
ScreenRoot
└─ BackgroundLayer
   ├─ top white area: y=0 to ~570
   └─ bottom orange area: starts ~570, fills bottom
└─ ContentContainer
   ├─ WarningIllustration
   ├─ TitleText
   ├─ InstructionText
   ├─ IssueList
   │  ├─ IssueCard #1
   │  ├─ IssueCard #2
   │  └─ IssueCard #3
   └─ RecordAgainButton
```

### Layout Positioning

- `ScreenRoot`: width `100%`, height `100%`, background base `#FFFFFF`.
- Gradient/background split: white top, orange from around `y=570px` to bottom. Use vertical gradient `#FFFFFF 0%`, `#FFFFFF 48%`, `#FFB27E 64%`, `#FF6700 78%`, `#FF6700 100%` `[inferred]`.
- `WarningIllustration`: centered horizontally, top `83px`, width `142px`, height `131px`.
- `TitleText`: centered, top `229px`, text `Multiple issues found`, color `#E6002E`.
- `InstructionText`: centered, top `284px`, text `Select one to view instructions`, color `#E8E600`.
- `IssueList`: full width with horizontal padding `16px`, first card top `349px`.
- `IssueCard`: width `calc(100% - 32px)`, height `76px`, background `#FF6700`, radius `7px`, shadow enabled.
- `IssueCard` vertical positions: `349px`, `464px`, `579px`.
- `IssueTitle`: left `27px` inside card, vertically centered, text `Belt noise`, white, text shadow.
- `ScoreRingIcon`: right `18px` inside card, vertically centered, size `50px`.
- `RecordAgainButton`: left/right `16px`, top `692px`, height `56px`, background `#0F4778`, radius `8px`, text `Record Again`.

### Components

#### `IssueCard`

```ts
type IssueCardProps = {
  title: string // default: 'Belt noise'
  score: number // visible score: 60
  onPress: () => void
}
```

Interaction:
- Press card: navigate to instruction/detail screen for selected issue.
- Press feedback: opacity `0.88` or scale `0.98` `[inferred]`.

#### `RecordAgainButton`

Interaction:
- Press: navigate to `/recording` and reset any previous analysis result.
- Disabled state: opacity `0.55`, block press handler, preserve layout size.

### Implementation Assumptions

- No additional behavior is inferred for this screen.
- Score ring is treated as a single asset because exact circular progress angles are not recoverable.
- Product copy uses `Record Again`; the screenshot misspelling is treated as a typo.

---

## 2. `how_to_use_screen`

### Purpose
Static instruction screen explaining how the app records and analyzes engine sound.

### Design Tokens

```ts
const howToUseTokens = {
  colors: {
    background: '#FFFFFF',
    heading: '#000000',
    stepTitle: '#FF6700',
    bodyText: '#747474'
  },
  typography: {
    fontFamily: 'audiowave',
    screenTitle: { size: 24, weight: 700, lineHeight: 31, letterSpacing: 0.2 },
    stepTitle: { size: 23, weight: 600, lineHeight: 30, letterSpacing: 0.2 },
    stepBody: { size: 23, weight: 600, lineHeight: 51, letterSpacing: 0.1 }
  },
  spacing: {
    screenPaddingX: 16,
    contentTop: 74,
    sectionGap: 14,
    titleToFirstStep: 44,
    bodyIndentX: 31,
    stepBodyTopGap: 14,
    paragraphLineGap: 0
  }
}
```

### Layout Structure

```txt
ScreenRoot
└─ ScrollContent
   ├─ ScreenTitle
   ├─ InstructionStep #1
   ├─ InstructionStep #2
   ├─ InstructionStep #3
   ├─ InstructionStep #4
   └─ InstructionStep #5
```

### Layout Positioning

- `ScreenRoot`: white background, width `100%`, minHeight `100%`.
- Content appears under native status area. Do not implement native status elements.
- `ScrollContent`: horizontal padding `16px`, top padding `72px`, bottom padding `40px`.
- `ScreenTitle`: text `how to use`, centered, top `73px`, color black.
- First step title top: `144px`.
- Step title alignment: left `16px`.
- Step body alignment: left `47px`, right padding `20px`, color gray.
- Body lines use large line-height close to `51px`.

### Text Content

```txt
how to use

1. Start the Engine
Make sure your engine is
running and stable.

2. Record the Sound
Tap the Record button and
hold your phone near the
engine.

3. Wait for Analysis
Sonaro analyzes the sound
using AI. This takes a few
seconds.

4. View the Results
Detected issues will appear
clearly on your screen.

5. Tap for Instructions
Select any detected problem
to see recommendations and
next steps.
```

### Components

#### `InstructionStep`

```ts
type InstructionStepProps = {
  index: number
  title: string
  body: string
}
```

Rendering rules:
- Title format: `${index}. ${title}`.
- Title color: `#FF6700`.
- Body begins below title with `14px` gap.
- Body is indented by `31px` relative to title.

### Interactions

- Screen is scrollable if content exceeds device height.
- No buttons or links shown.

### Implementation Assumptions

- Exact gradient transition between white and orange is inferred from screenshot.

---

## 3. `analysis_loading_screen`

### Purpose
Shows active analysis/loading state while engine sound is processed.

### Design Tokens

```ts
const analysisLoadingTokens = {
  colors: {
    background: '#1B5084',
    title: '#FFFFFF',
    subtitle: '#A5F3F1',
    waveformLight: '#D7E8F6',
    waveformMuted: '#9DBAD3',
    gearBlack: '#050505',
    gearRust: '#9A514F'
  },
  typography: {
    fontFamily: 'audiowave',
    title: { size: 24, weight: 700, lineHeight: 31, letterSpacing: 0.2 },
    subtitle: { size: 15, weight: 700, lineHeight: 20, letterSpacing: 0.2 }
  },
  spacing: {
    topIllustrationOffset: 191,
    titleTop: 486,
    subtitleTop: 548,
    waveformTop: 595
  }
}
```

### Asset Props

```ts
const assets = {
  gearsLoadingIllustration: {
    name: 'illustration_gears_loading',
    type: 'vector-or-png',
    width: 224,
    height: 205,
    resizeMode: 'contain'
  },
  waveformLoadingBars: {
    name: 'vector_waveform_loading_bars',
    type: 'vector',
    width: 244,
    height: 154,
    resizeMode: 'contain'
  }
}
```

### Layout Structure

```txt
ScreenRoot
└─ CenterStack
   ├─ GearsLoadingIllustration
   ├─ LoadingTitle
   ├─ LoadingSubtitle
   └─ WaveformLoadingBars
```

### Layout Positioning

- `ScreenRoot`: background `#1B5084`, width `100%`, height `100%`.
- `GearsLoadingIllustration`: centered horizontally, top `193px`, width `224px`, height `205px`.
- `LoadingTitle`: top `486px`, centered, text `Analyzing engine sound...`, color white.
- `LoadingSubtitle`: top `548px`, centered, text `This will only take a few seconds`, color cyan.
- `WaveformLoadingBars`: centered horizontally, top `595px`, width `244px`, height `154px`.

### Components

#### `LoadingWaveform`

```ts
type LoadingWaveformProps = {
  animated?: boolean // default true [inferred]
}
```

Suggested animation `[inferred]`:
- Bar scaleY loop between `0.65` and `1.15`.
- Duration `600ms` to `900ms`, staggered by `80ms`.
- Use easing `easeInOut`.

### Interactions

- No direct user interaction.
- Screen should auto-transition after the analysis promise resolves:
  - no issues -> `/engine-status-normal`
  - one urgent issue -> `/engine-status-attention`
  - two or more issues -> `/multiple-issues`
  - analysis error -> return to `/recording` with an error toast

### Implementation Assumptions

- Gear rotation animation is implied but not visible in static screenshot.
- Waveform animation is inferred from loading context.

---

## 4. `engine_status_normal_screen`

### Purpose
Shows successful engine analysis result when no abnormal sounds are detected.

### Design Tokens

```ts
const engineStatusNormalTokens = {
  colors: {
    background: '#1B5084',
    title: '#FFFFFF',
    statusButton: '#00792B',
    statusButtonText: '#FFFFFF',
    resultText: '#FFF500'
  },
  typography: {
    fontFamily: 'audiowave',
    title: { size: 26, weight: 700, lineHeight: 34, letterSpacing: 0.2 },
    status: { size: 26, weight: 700, lineHeight: 34, letterSpacing: 0.2 },
    result: { size: 21, weight: 600, lineHeight: 27, letterSpacing: 0.2 }
  },
  radius: {
    statusButton: 7
  },
  spacing: {
    illustrationTop: 214,
    titleTop: 526,
    buttonTop: 592,
    resultTop: 700
  }
}
```

### Asset Props

```ts
const assets = {
  normalEngineCarIllustration: {
    name: 'illustration_car_front_normal',
    type: 'vector-or-png',
    width: 302,
    height: 246,
    resizeMode: 'contain'
  }
}
```

### Layout Structure

```txt
ScreenRoot
└─ CenterStack
   ├─ NormalEngineCarIllustration
   ├─ SectionTitle
   ├─ NormalStatusBadge
   └─ ResultMessage
```

### Layout Positioning

- `ScreenRoot`: full height, background `#1B5084`.
- `NormalEngineCarIllustration`: centered horizontally, top `213px`, width `302px`, height `246px`.
- `SectionTitle`: top `526px`, centered, text `Engine Status`, color white.
- `NormalStatusBadge`: centered, top `592px`, width `301px`, height `63px`, radius `7px`, background `#00792B`.
- Status text: centered, text `Normal`, white.
- `ResultMessage`: centered, top `699px`, width around `270px`, color yellow, text aligned center.

### Text Content

```txt
Engine Status
Normal
No abnormal engine
sounds detected.
```

### Components

#### `StatusBadge`

```ts
type StatusBadgeProps = {
  variant: 'normal'
  label: 'Normal'
}
```

### Interactions

- No visible button interaction.
- The screen exits only through app-level navigation such as the Android back gesture/button. Do not add hidden tap targets.

### Implementation Assumptions

- Product copy uses `Normal`; the screenshot misspelling is treated as a typo.

---

## 5. `engine_status_attention_screen`

### Purpose
Shows critical/negative engine analysis result requiring attention.

### Design Tokens

```ts
const engineStatusAttentionTokens = {
  colors: {
    background: '#FF0000',
    title: '#FFFFFF',
    statusButton: '#FF6700',
    statusButtonText: '#FFFFFF'
  },
  typography: {
    fontFamily: 'audiowave',
    title: { size: 26, weight: 700, lineHeight: 34, letterSpacing: 0.2 },
    status: { size: 25, weight: 700, lineHeight: 33, letterSpacing: 0.2 }
  },
  radius: {
    statusButton: 7
  },
  spacing: {
    illustrationTop: 173,
    titleTop: 555,
    buttonTop: 624
  }
}
```

### Asset Props

```ts
const assets = {
  attentionEngineCarIllustration: {
    name: 'illustration_car_engine_attention',
    type: 'vector-or-png',
    width: 302,
    height: 342,
    resizeMode: 'contain'
  }
}
```

### Layout Structure

```txt
ScreenRoot
└─ CenterStack
   ├─ AttentionEngineCarIllustration
   ├─ SectionTitle
   └─ AttentionStatusBadge
```

### Layout Positioning

- `ScreenRoot`: full height, background `#FF0000`.
- `AttentionEngineCarIllustration`: centered horizontally, top `173px`, width `302px`, height `342px`.
- `SectionTitle`: centered, top `555px`, text `Engine Status`, white.
- `AttentionStatusBadge`: centered, top `624px`, width `301px`, height `63px`, background `#FF6700`, radius `7px`.
- Status text: centered, text `Attention Required`, white.

### Text Content

```txt
Engine Status
Attention Required
```

### Components

#### `StatusBadge`

```ts
type StatusBadgeProps = {
  variant: 'attention'
  label: 'Attention Required'
}
```

### Interactions

- No visible button interaction.
- Status badge is a visual status indicator, not a tappable control.
- The screen exits only through app-level navigation such as the Android back gesture/button.

### Implementation Assumptions

- No secondary message or CTA is visible; do not add one for screenshot replication.

---

## Shared Component Contracts

### `ScreenRoot`

```ts
type ScreenRootProps = {
  backgroundColor: string
  children: ReactNode
}
```

Implementation rules:
- Use absolute or flex positioning depending on platform.
- Keep screenshot-ratio positioning with responsive scaling from base width `440dp`.
- Exclude OS status/navigation bars.

### `CenteredAsset`

```ts
type CenteredAssetProps = {
  name: string
  width: number
  height: number
  top: number
  resizeMode?: 'contain'
}
```

### `TechText`

```ts
type TechTextProps = {
  children: string
  color: string
  size: number
  weight: number
  lineHeight: number
  align?: 'left' | 'center'
  letterSpacing?: number
}
```

---

## Implementation Notes

- Normalize assets into an `/assets/illustrations` and `/assets/vectors` structure:
  - `illustration_warning_triangle_sparkles`
  - `icon_score_ring_60`
  - `illustration_gears_loading`
  - `vector_waveform_loading_bars`
  - `illustration_car_front_normal`
  - `illustration_car_engine_attention`
- Use a reusable `StatusBadge` component for normal and attention result screens.
- Use a reusable `IssueCard` component for all detected problem rows.
- Use a reusable `InstructionStep` component for the instruction screen.
- Apply responsive scaling by multiplying fixed values with `screenWidth / 440`.
- Use corrected product copy defined in this spec; do not preserve apparent screenshot typos.
