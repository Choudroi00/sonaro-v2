# Sonaro Recording Screen Replication Spec

## Screen: `recording-screen`

Purpose: live audio recording interface used before AI engine sound analysis.

Source: uploaded screencast `Screencast From 2026-06-04 19-46-32.webm`.

Non-replicable capture elements excluded: phone frame, device notch/dynamic island, OS status icons, system time, browser/player chrome.

Implementation assumptions:
- Expo Router path: `/recording`.
- Coordinates are measured in the app viewport after phone frame and OS chrome are excluded.
- Use `screenWidth / 388` for horizontal scaling and `screenHeight / 807` for vertical positioning. Preserve button sizes and touch targets before compressing vertical gaps on shorter devices.
- Any remaining `px` suffix in this spec means a dp-equivalent screenshot reference unit.
- The recording flow starts before this screen is shown. The timer counts active recording duration upward from the current recording session.
- The center microphone button pauses/resumes recording. The stop button ends recording and navigates to `/analysis-loading`.

---

## 1. Design Tokens

```yaml
screen:
  reference_size: 388x807dp
  app_background: "#14476F" # deep navy blue [inferred from video]
  safe_area:
    top: 32px [inferred]
    horizontal: 20px [inferred]
    bottom: 28px [inferred]

colors:
  background_primary: "#14476F"
  text_primary: "#FFFFFF"
  text_secondary: "#EAF6FF"
  text_muted: "#BFD3E3"
  icon_dark: "#111111"
  button_surface: "#FFFFFF"
  orb_core: "transparent"
  orb_stroke_primary: "#A44BFF"
  orb_stroke_secondary: "#5E6DFF"
  orb_glow: "rgba(164, 75, 255, 0.55)"
  bottom_blur_warm: "rgba(255, 150, 95, 0.45)" [inferred]
  bottom_blur_cool: "rgba(166, 221, 255, 0.35)" [inferred]

font:
  family: "audiowave"
  weights:
    regular: 400
    medium: 500
    semibold: 600
    bold: 700

text_styles:
  language_label:
    size: 18px
    weight: 400
    line_height: 24px
    color: text_primary
  timer:
    size: 39px
    weight: 400
    line_height: 48px
    color: text_primary
    letter_spacing: -0.5px [inferred]
  orb_label:
    size: 16px
    weight: 700
    line_height: 19px
    color: text_primary
    text_transform: uppercase
    text_align: center
  record_name:
    size: 16px
    weight: 400
    line_height: 22px
    color: text_primary
  metadata:
    size: 16px
    weight: 400
    line_height: 22px
    color: text_primary
  control_icon:
    size: 28px
    color: icon_dark

radius:
  side_button: 25px
  center_button: 999px

shadows:
  control_button:
    offset_x: 0px
    offset_y: 6px
    blur: 10px
    spread: 0px
    color: "rgba(0, 0, 0, 0.18)" [inferred]
  orb_glow:
    offset_x: 0px
    offset_y: 0px
    blur: 18px
    spread: 2px
    color: orb_glow
```

---

## 2. Asset References

Use normalized names only. Replace with actual vector/icon files in implementation.

```yaml
assets:
  icon_chevron_down:
    type: vector_icon
    size: 16x16dp
    stroke_width: 1.5px
    color: text_muted
  icon_edit_small:
    type: vector_icon
    size: 14x14dp
    stroke_width: 1.5px
    color: text_primary
  icon_microphone:
    type: vector_icon
    size: 34x34dp
    stroke_width: 2px
    color: icon_dark
  icon_stop_rounded:
    type: vector_icon
    size: 34x34dp
    stroke_width: 2px
    color: icon_dark
  icon_close:
    type: vector_icon
    size: 25x25dp
    stroke_width: 1.5px
    color: icon_dark
  animated_audio_orb:
    type: animated_vector
    base_size: 190x150dp
    normalized_name: animated_audio_orb
  bottom_ambient_blur:
    type: decorative_gradient
    normalized_name: bottom_ambient_blur
```

---

## 3. Layout Structure

```yaml
root:
  component: RecordingScreen
  layout: full_screen
  background_color: background_primary
  overflow: hidden
  padding_horizontal: 20px
  padding_top: 36px [inferred]
  padding_bottom: 32px [inferred]

sections:
  - HeaderLanguageSelector
  - TimerDisplay
  - AnimatedAudioOrb
  - RecordingMetadata
  - ControlButtons
  - BottomAmbientBlur
```

### Vertical Positioning

```yaml
positions:
  HeaderLanguageSelector:
    x: 36px from app viewport left
    y: 44px from app viewport top [inferred]
    width: auto
    height: 24px
    alignment: left

  TimerDisplay:
    top: 84px from app viewport top [inferred]
    center_x: true
    height: 50px

  AnimatedAudioOrb:
    top: 210px
    center_x: true
    width: 190px
    height: 150px

  RecordingMetadata:
    top: 431px
    center_x: true
    width: content
    height: 48px
    gap: 4px

  ControlButtons:
    top: 522px
    height: 154px
    width: 100%
    layout: horizontal_anchor

  BottomAmbientBlur:
    position: absolute
    left: 0
    right: 0
    bottom: 0
    height: 120px
```

---

## 4. Component Specifications

## 4.1 `HeaderLanguageSelector`

```yaml
component: HeaderLanguageSelector
layout:
  direction: row
  align_items: center
  gap: 6px
  position: top_left
content:
  label: "En"
  trailing_icon: icon_chevron_down
style:
  label_style: language_label
interaction:
  on_press: open_language_picker
states:
  default:
    opacity: 1
  pressed:
    opacity: 0.75 [inferred]
```

## 4.2 `TimerDisplay`

```yaml
component: TimerDisplay
content:
  text_format: "HH:MM:SS"
  captured_values:
    - "00:01:54"
    - "00:01:55"
    - "00:01:56"
    - "00:01:58"
style:
  text_style: timer
  text_align: center
layout:
  center_x: true
behavior:
  update_interval: 1000ms
  count_direction: up [inferred]
  source: active_recording_duration
```

## 4.3 `AnimatedAudioOrb`

```yaml
component: AnimatedAudioOrb
layout:
  center_x: true
  width: 190px
  height: 150px
  margin_top_from_timer: 38px [inferred]
content:
  center_text: "RECORDING\nSOUND"
  asset: animated_audio_orb
style:
  center_text_style: orb_label
  center_text_opacity:
    initial: 0.08
    active: 1
  ring:
    stroke_width: 4px
    gradient: ["#5E6DFF", "#A44BFF", "#C06DFF"] [inferred]
    glow: true
    blur: 12px
```

### Orb Shape States Observed

```yaml
states:
  faint_state:
    time_range: "around 00:00-00:01s and 00:07s+"
    opacity: 0.05-0.15
    text_opacity: 0.03-0.12
    ring_visibility: barely_visible

  circular_state:
    time_range: "around 00:02s"
    width: 160px
    height: 160px
    border_radius: 999px
    opacity: 0.95
    text_opacity: 1

  oval_horizontal_state:
    time_range: "around 00:04s"
    width: 188px
    height: 128px
    border_radius: 999px
    opacity: 0.9
    text_opacity: 1

  tilted_organic_state:
    time_range: "continuous between states"
    transform:
      rotate: -4deg to 5deg
      scale_x: 0.92 to 1.08
      scale_y: 0.82 to 1.08
```

## 4.4 `RecordingMetadata`

```yaml
component: RecordingMetadata
layout:
  direction: column
  align_items: center
  gap: 4px
content:
  row_1:
    text: "Record 1"
    trailing_icon: icon_edit_small
  row_2:
    text: "2.1 MB, M4a,44.1KHz"
style:
  row_1_text_style: record_name
  row_2_text_style: metadata
  color: text_primary
interaction:
  row_1_press: rename_recording [inferred]
```

## 4.5 `ControlButtons`

```yaml
component: ControlButtons
layout:
  position: absolute_bottom_area [inferred]
  height: 154px
  horizontal:
    left_button:
      x: 27px
      y: 72px within control area
    center_button:
      center_x: true
      y: 0px within control area
    right_button:
      right: 34px
      y: 72px within control area
```

### `SideControlButton`

```yaml
component: SideControlButton
variants:
  stop:
    icon: icon_stop_rounded
    action: stop_recording
  close:
    icon: icon_close
    action: cancel_recording
size:
  width: 86px
  height: 82px
style:
  background: button_surface
  border_radius: 25px
  shadow: control_button
interaction:
  pressed:
    scale: 0.96 [inferred]
    opacity: 0.9 [inferred]
```

### `PrimaryMicButton`

```yaml
component: PrimaryMicButton
icon: icon_microphone
size:
  width: 94px
  height: 94px
style:
  background: button_surface
  border_radius: 999px
  shadow: control_button
interaction:
  on_press: pause_or_resume_recording
  pressed:
    scale: 0.95 [inferred]
```

## 4.6 `BottomAmbientBlur`

```yaml
component: BottomAmbientBlur
position: absolute_bottom
height: 120px
style:
  type: blurred_gradient_overlay
  blur_radius: 35px [inferred]
  opacity: 0.8
  gradient:
    direction: top_to_bottom
    stops:
      - 0%: "rgba(20, 71, 111, 0)"
      - 55%: "rgba(130, 190, 220, 0.35)"
      - 100%: "rgba(255, 143, 91, 0.45)"
notes:
  - Appears only as a soft decorative glow near the bottom.
  - Should not block button interactions.
```

---

## 5. Animation Replication Spec

## 5.1 Main Orb Loop

The orb is the main animated element. It behaves like an audio-reactive glowing ring, continuously morphing between circle and oval shapes while rotating slightly.

```yaml
animation: audio_orb_loop
applies_to: AnimatedAudioOrb.ring
loop: true
duration: 2400ms [inferred]
easing: easeInOutSine
properties:
  scale_x:
    keyframes: [1.00, 1.12, 0.94, 1.06, 1.00]
  scale_y:
    keyframes: [1.00, 0.82, 1.10, 0.90, 1.00]
  rotate:
    keyframes: [0deg, -5deg, 3deg, 6deg, 0deg]
  opacity:
    keyframes: [0.85, 1.00, 0.90, 1.00, 0.85]
  shadow_blur:
    keyframes: [10px, 20px, 14px, 22px, 10px]
  stroke_width:
    keyframes: [3px, 5px, 4px, 5px, 3px]
```

Implementation note: use an SVG `ellipse` or animated vector path. For smoother organic movement, animate the path `d` value between 3 or 4 prebuilt blob-like oval paths instead of only scaling a circle.

## 5.2 Orb Glow Pulse

```yaml
animation: orb_glow_pulse
applies_to: AnimatedAudioOrb.outer_glow
loop: true
duration: 1200ms [inferred]
easing: easeInOut
properties:
  opacity: [0.45, 0.85, 0.45]
  scale: [0.98, 1.04, 0.98]
  blur_radius: [10px, 18px, 10px]
```

## 5.3 Orb Text Fade

The `RECORDING SOUND` text fades in and out with the orb visibility. In the visible phase, it remains centered and stable while the ring morphs behind it.

```yaml
animation: orb_text_fade
applies_to: AnimatedAudioOrb.center_text
loop: true
duration: 5200ms [inferred]
easing: easeInOut
properties:
  opacity:
    keyframes: [0.08, 1.00, 1.00, 0.08]
    keyframe_offsets: [0, 0.25, 0.70, 1]
```

## 5.4 Long Visibility Cycle

The screencast shows the orb becoming clearly visible for several seconds, then almost disappearing near the end.

```yaml
animation: orb_visibility_cycle
applies_to: AnimatedAudioOrb.container
loop: true
duration: 8200ms [inferred]
easing: easeInOut
properties:
  opacity:
    keyframes: [0.15, 0.95, 1.00, 0.12]
    keyframe_offsets: [0, 0.22, 0.70, 1]
```

## 5.5 Control Button Press Feedback

```yaml
animation: control_button_press
trigger: user_press
applies_to:
  - SideControlButton
  - PrimaryMicButton
duration_down: 90ms
duration_up: 140ms
easing: easeOut
properties:
  scale: 1.0 -> 0.95 -> 1.0
  opacity: 1.0 -> 0.88 -> 1.0
```

## 5.6 Timer Animation

```yaml
animation: timer_tick
trigger: every_1000ms
applies_to: TimerDisplay
behavior:
  - Replace text with new duration value.
  - No visible slide or fade transition observed.
  - Keep layout width stable to avoid horizontal jitter.
implementation:
  use_tabular_numbers: true
  min_width: 170px [inferred]
```

---

## 6. Interaction Map

```yaml
interactions:
  HeaderLanguageSelector:
    tap: open_language_picker

  RecordingMetadata.row_1:
    tap: open_rename_recording_modal [inferred]

  SideControlButton.stop:
    tap: stop_recording_and_continue_to_analysis [inferred]

  PrimaryMicButton:
    tap: pause_or_resume_recording

  SideControlButton.close:
    tap: cancel_recording_and_return_previous_screen [inferred]
```

---

## 7. Replication Notes for Coding Agent

1. Build the screen as a single full-height recording route with fixed blue background.
2. Do not replicate OS status bar, phone frame, notch, or external device chrome.
3. Use the project's global font `audiowave` for all text elements.
4. The orb should not be a static image. Implement it as an animated SVG or canvas element with morphing ellipse/path, purple-blue gradient stroke, and glow pulse.
5. Keep the timer and metadata centered vertically according to the measured positions.
6. Keep the center microphone button larger and higher than the two side buttons.
7. Add a decorative blurred warm/cool glow at the bottom of the screen.
8. Animation durations are normative starting values. Tune only within `±15%` if needed to match the source video during visual QA.
