# Sonaro Android Screens Replication Spec

Target: coding agent implementation for pixel-close mobile screen replication.

Global rules:
- Exclude OS/status bar, navigation bar, clock, signal, Wi-Fi, battery, and device chrome.
- Use the screen-specific `rootBackground` as the source of truth. Screens in this file use a white root unless a screen-specific panel overlays it.
- Coordinates and sizes are screenshot-derived reference measurements. Treat unmarked values as normative within a visual tolerance of `±4dp`; values marked `[inferred]` are implementation assumptions.
- Use each screen's declared `referenceSize` for scaling. Treat screenshot pixels as dp-equivalent units: `scaleX = screenWidth / referenceSize.width`, `scaleY = screenHeight / referenceSize.height`, and `scale = Math.min(scaleX, scaleY)` for assets and type.
- All absolute `top`, `left`, `right`, and `bottom` values are measured in the app viewport after OS chrome is excluded. `safeArea = true` means the implementation must avoid device cutouts/insets without double-counting screenshot status-bar space.
- Asset names below are normalized registry keys. Names may describe assets for lookup, but implementation code should not branch on or reconstruct illustration internals.
- Items marked `[inferred]` are not directly inspectable from the screenshot but should be implemented as specified unless product requirements override them.

Route and naming conventions:
- Expo Router route files should use kebab-case path names.
- React component names should use PascalCase screen names.
- Navigation targets in this file map as:
  - `SplashScreen` -> `/splash`
  - `OnboardingIntroScreen` -> `/onboarding-intro`
  - `AuthWelcomeScreen` -> `/auth-welcome`
  - `HowToUseScreen` -> `/how-to-use`

---

## Global Design Tokens

```ts
colors = {
  white: '#FFFFFF',
  black: '#000000',
  primaryNavy: '#0D3B66',
  primaryNavyDark: '#033360',
  accentOrange: '#FF6700',
  accentOrangeLine: '#E98129',
  brandPurple: '#1E169C',
  textMuted: '#6F6F6F',
  cyanSoft: '#A8EEFE',
  cyanSoftLight: '#D0F6FE',
  cyanSoftFaint: '#F3FEFF',
  lightBlueSurface: '#E9EFFD',
  divider: '#FFFFFF',
  buttonBorderDark: '#2A2A2A'
}

spacing = {
  screenHorizontal: 20,
  buttonHorizontal: 16,
  sectionGapSmall: 16,
  sectionGapMedium: 28,
  sectionGapLarge: 44
}

radii = {
  buttonMedium: 8,
  pill: 999,
  bottomPanelTop: 48
}

fonts = {
  display: 'audiowave',
  body: 'audiowave',
  ui: 'audiowave',
  logo: 'audiowave'
}
```

---

# Screen 01: Splash Screen

## Screen Metadata

```ts
screenName = 'SplashScreen'
referenceSize = { width: 440, height: 956 }
rootBackground = colors.white
safeArea = true
```

## Assets

```ts
assets = {
  brandLogoMark: 'asset_brand_logo_mark',
  brandLogoText: 'asset_brand_logo_text',
  diagonalAudioBarsTop: 'vector_diagonal_audio_bars_top',
  diagonalAudioBarsBottom: 'vector_diagonal_audio_bars_bottom'
}
```

## Layout Structure

Root layout:
- `ScreenRoot`: full viewport, white background, position relative, overflow hidden.
- `DecorativeBarsTop`: absolute group near top-left, rotated/slanted vertical rounded bars.
- `BrandBlock`: vertically centered slightly below true center.
- `DecorativeBarsBottom`: absolute group bottom-right, partially clipped by screen edges.

## Layout-Based Positioning

```ts
ScreenRoot {
  width: '100%'
  height: '100%'
  backgroundColor: '#FFFFFF'
  position: 'relative'
  overflow: 'hidden'
}

DecorativeBarsTop {
  position: 'absolute'
  top: 65
  left: -2
  width: 250
  height: 290
  rotation: -14deg
}

BrandBlock {
  position: 'absolute'
  top: 379
  left: 0
  right: 0
  alignItems: 'center'
}

DecorativeBarsBottom {
  position: 'absolute'
  right: -22
  bottom: -22
  width: 245
  height: 285
  rotation: -14deg
}
```

## Component-Based Sections

### DecorativeAudioBars

Use five vertical rounded bars with varying opacity.

```ts
DecorativeAudioBars.props = {
  barWidth: 18,
  borderRadius: 999,
  color: '#A8EEFE',
  bars: [
    { height: 42, opacity: 0.16, offsetX: 0, offsetY: 132 },
    { height: 102, opacity: 0.40, offsetX: 47, offsetY: 88 },
    { height: 207, opacity: 0.70, offsetX: 96, offsetY: 0 },
    { height: 151, opacity: 0.78, offsetX: 150, offsetY: 58 },
    { height: 285, opacity: 0.90, offsetX: 204, offsetY: -42 }
  ]
}
```

Bottom group mirrors the same component with similar sizing. Bottom bars are clipped by viewport.

### BrandLogo

Preferred implementation: render a composed logo component from the separate mark and text assets below. If a combined logo asset exists, it may replace the two-asset composition only if it preserves the same bounding box and internal spacing.

```ts
BrandLogo.props = {
  markAsset: 'asset_brand_logo_mark',
  markWidth: 215,
  markHeight: 215,
  textAsset: 'asset_brand_logo_text',
  textWidth: 224,
  textHeight: 50,
  gap: 16
}
```

Fallback implementation if logo text is rendered:

```ts
LogoText {
  text: 'SONARO'
  color: '#1E169C'
  fontFamily: fonts.logo
  fontWeight: 700
  fontSize: 50
  letterSpacing: -1
  lineHeight: 56
}
```

## Interactions

- No visible interaction.
- Auto-transition to `/onboarding-intro` after `1600ms`. `[inferred]`

## Implementation Assumptions

- Exact brand mark geometry should come from a vector asset, not reconstructed manually.
- Splash transition timing is not visible; use the specified `1600ms` assumption.

---

# Screen 02: Onboarding Intro Screen

## Screen Metadata

```ts
screenName = 'OnboardingIntroScreen'
referenceSize = { width: 447, height: 978 }
rootBackground = colors.white
safeArea = true
```

## Assets

```ts
assets = {
  onboardingIntroIllustration: 'illustration_onboarding_intro'
}
```

## Layout Structure

Root layout:
- `ScreenRoot`: full viewport, white background.
- `ContentColumn`: centered vertical column.
- `HeroIllustration`: large centered illustration in upper half.
- `TextBlock`: centered title and paragraph.
- `PrimaryCTA`: bottom-aligned full-width button with side margins.

## Layout-Based Positioning

```ts
ScreenRoot {
  width: '100%'
  height: '100%'
  backgroundColor: '#FFFFFF'
  paddingHorizontal: 20
  position: 'relative'
}

HeroIllustration {
  position: 'absolute'
  top: 127
  left: 42
  width: 364
  height: 350
  resizeMode: 'contain'
}

TextBlock {
  position: 'absolute'
  top: 570
  left: 20
  right: 20
  alignItems: 'center'
}

PrimaryCTA {
  position: 'absolute'
  left: 20
  right: 14
  bottom: 131
  height: 57
}
```

## Component-Based Sections

### HeroIllustration

```ts
Image.props = {
  source: 'illustration_onboarding_intro',
  width: 364,
  height: 350,
  resizeMode: 'contain',
  accessibilityLabel: 'onboarding-intro-illustration'
}
```

### Heading

```ts
Heading.props = {
  text: 'Hear the Problem\nBefore It Breaks',
  fontFamily: fonts.display,
  fontSize: 27,
  lineHeight: 38,
  fontWeight: 600,
  color: '#000000',
  textAlign: 'center',
  letterSpacing: 0
}
```

### Description

```ts
Description.props = {
  text: 'Sonaro listens to your engine and detects early warning signs\nthrough sound analysis, helping you identify potential issues\nbefore they turn into serious and costly failures.',
  fontFamily: fonts.body,
  fontSize: 15,
  lineHeight: 24,
  fontWeight: 600,
  fontStyle: 'italic',
  color: '#6F6F6F',
  textAlign: 'center',
  marginTop: 44
}
```

### PrimaryButton

```ts
PrimaryButton.props = {
  text: 'Get Started',
  height: 57,
  borderRadius: 8,
  backgroundColor: '#0D3B66',
  textColor: '#FFFFFF',
  fontFamily: fonts.ui,
  fontSize: 16,
  fontWeight: 700,
  activeOpacity: 0.85
}
```

## Interactions

```ts
onGetStartedPress = navigateTo('/auth-welcome') // [inferred]
```

## Implementation Assumptions

- Illustration must be provided as a raster/vector asset using the normalized name.

---

# Screen 03: Auth Welcome Screen

## Screen Metadata

```ts
screenName = 'AuthWelcomeScreen'
referenceSize = { width: 430, height: 956 }
rootBackground = colors.white
safeArea = true
```

## Assets

```ts
assets = {
  authHeroIllustration: 'illustration_auth_hero',
  googleIcon: 'icon_google',
  guestIcon: 'icon_guest'
}
```

## Layout Structure

Root layout:
- `ScreenRoot`: white background, full viewport.
- `HeaderContent`: top title, subtitle, centered hero image.
- `AuthPanel`: dark navy rounded top panel anchored to bottom.
- `AuthActions`: stacked buttons inside bottom panel.
- `Divider`: horizontal white line between guest and how-to-use action.

## Layout-Based Positioning

```ts
ScreenRoot {
  width: '100%'
  height: '100%'
  backgroundColor: '#FFFFFF'
  position: 'relative'
  overflow: 'hidden'
}

HeaderContent {
  position: 'absolute'
  top: 117
  left: 0
  right: 0
  alignItems: 'center'
}

AuthHeroIllustration {
  marginTop: 24
  width: 315
  height: 304
  resizeMode: 'contain'
}

AuthPanel {
  position: 'absolute'
  left: 0
  right: 0
  bottom: 0
  height: 367
  backgroundColor: '#0D3B66'
  borderTopLeftRadius: 48
  borderTopRightRadius: 48
  paddingTop: 23
  paddingHorizontal: 16
}
```

## Component-Based Sections

### Title

```ts
Title.props = {
  text: 'Welcome to Sonaro',
  fontFamily: fonts.display,
  fontSize: 29,
  lineHeight: 36,
  fontWeight: 700,
  color: '#000000',
  textAlign: 'center'
}
```

### Subtitle

```ts
Subtitle.props = {
  text: 'AI-powered engine sound\ndiagnostics',
  fontFamily: fonts.display,
  fontSize: 22,
  lineHeight: 32,
  fontWeight: 500,
  color: '#FF6700',
  textAlign: 'center',
  marginTop: 25
}
```

### AuthHeroIllustration

```ts
Image.props = {
  source: 'illustration_auth_hero',
  width: 315,
  height: 304,
  resizeMode: 'contain',
  accessibilityLabel: 'auth-hero-illustration'
}
```

### AuthPanel

```ts
AuthPanel.props = {
  backgroundColor: '#0D3B66',
  borderTopLeftRadius: 48,
  borderTopRightRadius: 48,
  paddingHorizontal: 16,
  paddingTop: 23
}
```

### GoogleButton

```ts
GoogleButton.props = {
  text: 'Continue with Google',
  icon: 'icon_google',
  height: 69,
  borderRadius: 999,
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  fontFamily: fonts.ui,
  fontSize: 22,
  fontWeight: 400,
  iconSize: 32,
  iconPosition: { left: 35 },
  contentAlignment: 'center',
  activeOpacity: 0.85
}
```

### GuestButton

```ts
GuestButton.props = {
  text: 'Continue as a Guest',
  icon: 'icon_guest',
  height: 69,
  borderRadius: 999,
  backgroundColor: '#FF6700',
  textColor: '#FFFFFF',
  fontFamily: fonts.ui,
  fontSize: 22,
  fontWeight: 400,
  iconSize: 32,
  iconColor: '#6F6F6F',
  iconPosition: { left: 36 },
  contentAlignment: 'center',
  marginTop: 14,
  activeOpacity: 0.85
}
```

### Divider

```ts
Divider.props = {
  height: 4,
  backgroundColor: '#FFFFFF',
  opacity: 1,
  marginTop: 23,
  marginHorizontal: -7
}
```

### HowToUseButton

```ts
HowToUseButton.props = {
  text: 'How to use',
  height: 65,
  borderRadius: 999,
  backgroundColor: '#000000',
  borderWidth: 4,
  borderColor: '#2A2A2A',
  textColor: '#FFFFFF',
  fontFamily: fonts.ui,
  fontSize: 22,
  fontWeight: 400,
  marginTop: 24,
  activeOpacity: 0.85
}
```

## Interactions

```ts
onGooglePress = startGoogleAuth() // [inferred]
onGuestPress = continueAsGuest() // [inferred]
onHowToUsePress = navigateTo('/how-to-use') // [inferred]
```

Button states `[inferred]`:
- Pressed: reduce opacity to `0.85` or scale to `0.98`.
- Disabled: reduce opacity to `0.55`, block press handler.
- Loading Google: keep button size, show spinner near text or replace icon.

## Implementation Assumptions

- Google icon source should use official Google mark asset.
- Guest icon must come from the `icon_guest` asset registry entry; do not recreate its vector path inline.
- Auth panel height should remain `367dp` at the `430x956` reference size. On shorter devices, preserve button heights first, reduce top header spacing second, and allow the panel height to expand only enough to clear the safe-area bottom inset.

---

# Implementation Notes

## Suggested Component Tree

```tsx
<AppScreen name="SplashScreen">
  <DecorativeAudioBars variant="top" />
  <BrandLogo />
  <DecorativeAudioBars variant="bottom" />
</AppScreen>

<AppScreen name="OnboardingIntroScreen">
  <HeroIllustration name="illustration_onboarding_intro" />
  <TextBlock>
    <ScreenHeading />
    <ScreenDescription />
  </TextBlock>
  <PrimaryButton />
</AppScreen>

<AppScreen name="AuthWelcomeScreen">
  <HeaderContent>
    <ScreenTitle />
    <ScreenSubtitle />
    <HeroIllustration name="illustration_auth_hero" />
  </HeaderContent>
  <AuthPanel>
    <AuthButton variant="google" />
    <AuthButton variant="guest" />
    <Divider />
    <AuthButton variant="howToUse" />
  </AuthPanel>
</AppScreen>
```

## Asset Registry

```ts
assetRegistry = {
  asset_brand_logo_mark: require('@/assets/brand/brand-logo-mark.svg'),
  asset_brand_logo_text: require('@/assets/brand/brand-logo-text.svg'),
  illustration_onboarding_intro: require('@/assets/illustrations/onboarding-intro.png'),
  illustration_auth_hero: require('@/assets/illustrations/auth-hero.png'),
  icon_google: require('@/assets/icons/google.svg'),
  icon_guest: require('@/assets/icons/guest.svg')
}
```

## Responsive Rules

```ts
scaleX = screenWidth / referenceSize.width
scaleY = screenHeight / referenceSize.height
scale = Math.min(scaleX, scaleY)

// Use each screen's declared referenceSize for high-fidelity replication.
// On shorter devices, reduce hero image height first, then vertical gaps.
// Keep buttons full width with 16-20dp side margins.
```

## Accessibility

- All touch targets must remain at least `48dp` high.
- Buttons need accessible labels equal to their visible text.
- Decorative bars should be hidden from screen readers.
- Hero illustrations should use neutral labels or be hidden if purely decorative. `[inferred]`
