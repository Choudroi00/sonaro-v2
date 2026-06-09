import type { AudioRecorder } from 'expo-audio';
import type { Href } from 'expo-router';
import type { AudioAnalysisInput } from '@/features/sonaro/use-audio-analysis-store';

import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import brandLogoMark from '@/assets/brand/asset_brand_logo_mark.png';
import authHeroIllustration from '@/assets/illustrations/illustration_auth_hero.png';
import gearsLoadingIllustration from '@/assets/illustrations/illustration_gears_loading.png';
import onboardingIntroIllustration from '@/assets/illustrations/illustration_onboarding_intro.png';
import { FocusAwareStatusBar, Image } from '@/components/ui';
import { useAudioAnalysisStore } from '@/features/sonaro/use-audio-analysis-store';
import { classifyBraking, classifyIdle, classifyStartup } from '@/lib/ai/models';
import { useIsFirstTime } from '@/lib/hooks';
import type { ModelClassificationResult } from '@/lib/ai/models';

const MAX_RECORDING_SECONDS = 60;

const colors = {
  white: '#FFFFFF',
  black: '#000000',
  navy: '#0D3B66',
  deepNavy: '#14476F',
  analysisBlue: '#1B5084',
  orange: '#FF6700',
  red: '#FF0000',
  warningRed: '#E6002E',
  yellow: '#FFF500',
  instructionYellow: '#E8E600',
  muted: '#747474',
  cyan: '#A5F3F1',
  purple: '#A44BFF',
  bluePurple: '#5E6DFF',
};

const font = 'Audiowide';

type RecordingFlowArgs = {
  recorder: AudioRecorder;
  router: { replace: (href: Href) => void };
  setAnalysisInput: (input: AudioAnalysisInput) => void;
};

async function pickAudioFile(): Promise<AudioAnalysisInput | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: ['audio/wav', 'audio/x-wav', 'audio/wave'],
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];

  if (!asset) {
    throw new Error('No audio file was selected.');
  }

  return {
    kind: 'file',
    mimeType: asset.mimeType,
    name: asset.name,
    size: asset.size,
    uri: asset.uri,
  };
}

function useRecordingFlow({ recorder, router, setAnalysisInput }: RecordingFlowArgs) {
  const [busy, setBusy] = React.useState(false);
  const [statusText, setStatusText] = React.useState('Max 60s, WAV file upload supported');
  const autoStopTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoStop = React.useCallback(() => {
    if (autoStopTimeout.current) {
      clearTimeout(autoStopTimeout.current);
      autoStopTimeout.current = null;
    }
  }, []);

  const goToAnalysis = React.useCallback((input: AudioAnalysisInput) => {
    setAnalysisInput(input);
    router.replace('/analysis-loading');
  }, [router, setAnalysisInput]);

  const stopRecording = React.useCallback(async () => {
    if (!recorder.isRecording || busy) {
      return;
    }

    setBusy(true);
    clearAutoStop();

    try {
      const durationMillis = Math.round(recorder.currentTime * 1000);
      await recorder.stop();

      if (!recorder.uri) {
        throw new Error('Recording finished without a file URI.');
      }

      goToAnalysis({
        durationMillis,
        kind: 'recording',
        mimeType: 'audio/mp4',
        name: 'Engine recording.m4a',
        uri: recorder.uri,
      });
    }
    catch (error) {
      setStatusText('Could not stop recording');
      showAudioError('Recording error', error);
    }
    finally {
      setBusy(false);
    }
  }, [busy, clearAutoStop, goToAnalysis, recorder]);

  const startRecording = React.useCallback(async () => {
    if (recorder.isRecording || busy) {
      return;
    }

    setBusy(true);

    try {
      const permission = await requestRecordingPermissionsAsync();

      if (!permission.granted) {
        setStatusText('Microphone permission denied');
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatusText('Recording, stops automatically at 1 min');
      autoStopTimeout.current = setTimeout(() => void stopRecording(), MAX_RECORDING_SECONDS * 1000);
    }
    catch (error) {
      setStatusText('Could not start recording');
      showAudioError('Recording error', error);
    }
    finally {
      setBusy(false);
    }
  }, [busy, recorder, stopRecording]);

  const chooseAudioFile = React.useCallback(async () => {
    if (recorder.isRecording || busy) {
      return;
    }

    setBusy(true);

    try {
      const input = await pickAudioFile();

      if (input) {
        goToAnalysis(input);
      }
    }
    catch (error) {
      setStatusText('Could not open audio file');
      showAudioError('File selection error', error);
    }
    finally {
      setBusy(false);
    }
  }, [busy, goToAnalysis, recorder.isRecording]);

  React.useEffect(() => clearAutoStop, [clearAutoStop]);

  return { busy, chooseAudioFile, startRecording, statusText, stopRecording };
}

function showAudioError(title: string, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Please try again.';
  Alert.alert(title, message);
}

function useScale(referenceWidth = 440, referenceHeight = 956) {
  const { width, height } = useWindowDimensions();
  const scaleX = width / referenceWidth;
  const scaleY = height / referenceHeight;
  const scale = Math.min(scaleX, scaleY);

  return {
    height,
    scale,
    width,
    x: (value: number) => value * scaleX,
    y: (value: number) => value * scaleY,
    s: (value: number) => value * scale,
  };
}

function HiddenChrome() {
  return <FocusAwareStatusBar hidden={true} />;
}

function TechText({
  children,
  color = colors.black,
  size,
  lineHeight,
  weight = '400',
  style,
  align = 'center',
}: {
  align?: 'center' | 'left';
  children: React.ReactNode;
  color?: string;
  lineHeight: number;
  size: number;
  style?: object;
  weight?: '400' | '500' | '600' | '700';
}) {
  return (
    <Text
      style={[
        {
          color,
          fontFamily: font,
          fontSize: size,
          fontWeight: weight,
          lineHeight,
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

function RouteButton({
  label,
  onPress,
  backgroundColor = colors.navy,
  color = colors.white,
  height = 57,
  radius = 8,
  style,
  children,
}: {
  backgroundColor?: string;
  children?: React.ReactNode;
  color?: string;
  height?: number;
  label: string;
  onPress: () => void;
  radius?: number;
  style?: object;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonBase,
        {
          backgroundColor,
          borderRadius: radius,
          height,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {children}
      <TechText color={color} lineHeight={22} size={16} weight="700">
        {label}
      </TechText>
    </Pressable>
  );
}

function DecorativeBars({ bottom = false }: { bottom?: boolean }) {
  const bars = [
    { height: 42, opacity: 0.16, x: 0, y: 132 },
    { height: 102, opacity: 0.4, x: 47, y: 88 },
    { height: 207, opacity: 0.7, x: 96, y: 0 },
    { height: 151, opacity: 0.78, x: 150, y: 58 },
    { height: 285, opacity: 0.9, x: 204, y: -42 },
  ];

  return (
    <View
      pointerEvents="none"
      style={[
        styles.decorativeBars,
        bottom ? styles.decorativeBarsBottom : styles.decorativeBarsTop,
      ]}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      {bars.map(bar => (
        <View
          key={`${bar.x}-${bar.height}`}
          style={[
            styles.decorativeBar,
            {
              height: bar.height,
              left: bar.x,
              opacity: bar.opacity,
              top: bar.y,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function SplashScreen() {
  const router = useRouter();
  const { x, y, s } = useScale(440, 956);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/onboarding-intro');
    }, 1600);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={styles.whiteRoot}>
      <HiddenChrome />
      <View style={{ transform: [{ scale: s(1) }] }}>
        <DecorativeBars />
        <DecorativeBars bottom={true} />
      </View>
      <View style={[styles.splashBrand, { top: y(379) }]}>
        <Image
          accessibilityLabel="Sonaro logo mark"
          contentFit="contain"
          source={brandLogoMark}
          style={{ height: s(215), width: s(215) }}
        />
        <TechText
          color="#1E169C"
          lineHeight={s(56)}
          size={s(50)}
          weight="700"
          style={{ marginTop: y(16) }}
        >
          SONARO
        </TechText>
      </View>
      <View style={{ height: y(1), width: x(1) }} />
    </View>
  );
}

export function OnboardingIntroScreen() {
  const router = useRouter();
  const [, setIsFirstTime] = useIsFirstTime();
  const { s, x, y } = useScale(447, 978);

  return (
    <View style={styles.whiteRoot}>
      <HiddenChrome />
      <Image
        accessibilityLabel="onboarding-intro-illustration"
        contentFit="contain"
        source={onboardingIntroIllustration}
        style={[
          styles.absolute,
          {
            height: y(350),
            left: x(42),
            top: y(127),
            width: x(364),
          },
        ]}
      />
      <View style={[styles.centeredBlock, { left: x(20), right: x(20), top: y(570) }]}>
        <TechText lineHeight={s(38)} size={s(27)} weight="600">
          {'Hear the Problem\nBefore It Breaks'}
        </TechText>
        <TechText
          color="#6F6F6F"
          lineHeight={s(24)}
          size={s(15)}
          weight="600"
          style={{ fontStyle: 'italic', marginTop: y(44) }}
        >
          {
            'Sonaro listens to your engine and detects early warning signs\nthrough sound analysis, helping you identify potential issues\nbefore they turn into serious and costly failures.'
          }
        </TechText>
      </View>
      <RouteButton
        label="Get Started"
        onPress={() => {
          setIsFirstTime(false);
          router.replace('/auth-welcome');
        }}
        style={[
          styles.absolute,
          {
            bottom: y(131),
            left: x(20),
            right: x(14),
          },
        ]}
      />
    </View>
  );
}

function GoogleIcon() {
  return (
    <Svg height={32} viewBox="0 0 32 32" width={32}>
      <Path
        d="M29.1 16.3c0-.9-.1-1.7-.2-2.5H16v5h7.4a6.3 6.3 0 0 1-2.7 4.1v3.4h4.4c2.6-2.4 4-5.8 4-10z"
        fill="#4285F4"
      />
      <Path
        d="M16 29.5c3.7 0 6.8-1.2 9.1-3.3l-4.4-3.4c-1.2.8-2.8 1.3-4.7 1.3-3.6 0-6.6-2.4-7.7-5.6H3.8V22A13.7 13.7 0 0 0 16 29.5z"
        fill="#34A853"
      />
      <Path
        d="M8.3 18.5a8.1 8.1 0 0 1 0-5.1V9.9H3.8a13.5 13.5 0 0 0 0 12.2z"
        fill="#FBBC05"
      />
      <Path
        d="M16 7.8c2 0 3.8.7 5.2 2.1l3.9-3.9A13.1 13.1 0 0 0 16 2.4 13.7 13.7 0 0 0 3.8 9.9l4.5 3.5c1.1-3.2 4.1-5.6 7.7-5.6z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function GuestIcon() {
  return (
    <Svg height={32} viewBox="0 0 32 32" width={32}>
      <Circle cx={16} cy={10} fill="#6F6F6F" r={6} />
      <Path d="M5 29c1.1-6.4 5.2-10 11-10s9.9 3.6 11 10z" fill="#6F6F6F" />
    </Svg>
  );
}

export function AuthWelcomeScreen() {
  const router = useRouter();
  const { s, x, y } = useScale(430, 956);

  return (
    <View style={styles.whiteRoot}>
      <HiddenChrome />
      <View style={[styles.centeredBlock, { top: y(117) }]}>
        <TechText lineHeight={s(36)} size={s(29)} weight="700">
          Welcome to Sonaro
        </TechText>
        <TechText
          color={colors.orange}
          lineHeight={s(32)}
          size={s(22)}
          weight="500"
          style={{ marginTop: y(25) }}
        >
          {'AI-powered engine sound\ndiagnostics'}
        </TechText>
        <Image
          accessibilityLabel="auth-hero-illustration"
          contentFit="contain"
          source={authHeroIllustration}
          style={{ height: y(304), marginTop: y(24), width: x(315) }}
        />
      </View>
      <View
        style={[
          styles.authPanel,
          {
            height: y(367),
            paddingHorizontal: x(16),
            paddingTop: y(23),
          },
        ]}
      >
        <AuthActionButton
          icon={<GoogleIcon />}
          label="Continue with Google"
          onPress={() => router.push('/recording')}
        />
        <AuthActionButton
          backgroundColor={colors.orange}
          color={colors.white}
          icon={<GuestIcon />}
          label="Continue as a Guest"
          onPress={() => router.push('/recording')}
          style={{ marginTop: y(14) }}
        />
        <View style={[styles.authDivider, { marginTop: y(23) }]} />
        <AuthActionButton
          backgroundColor={colors.black}
          color={colors.white}
          label="How to use"
          onPress={() => router.push('/how-to-use')}
          style={{
            borderColor: '#2A2A2A',
            borderWidth: 4,
            height: y(65),
            marginTop: y(24),
          }}
        />
      </View>
    </View>
  );
}

function AuthActionButton({
  backgroundColor = colors.white,
  color = colors.black,
  icon,
  label,
  onPress,
  style,
}: {
  backgroundColor?: string;
  color?: string;
  icon?: React.ReactNode;
  label: string;
  onPress: () => void;
  style?: object;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.authAction,
        { backgroundColor, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {icon ? <View style={styles.authActionIcon}>{icon}</View> : null}
      <TechText color={color} lineHeight={28} size={22}>
        {label}
      </TechText>
    </Pressable>
  );
}

export function HowToUseScreen() {
  const { x, y, s } = useScale(440, 1102);
  const steps = [
    ['Start the Engine', 'Make sure your engine is\nrunning and stable.'],
    ['Record the Sound', 'Tap the Record button and\nhold your phone near the\nengine.'],
    ['Wait for Analysis', 'Sonaro analyzes the sound\nusing AI. This takes a few\nseconds.'],
    ['View the Results', 'Detected issues will appear\nclearly on your screen.'],
    ['Tap for Instructions', 'Select any detected problem\nto see recommendations and\nnext steps.'],
  ];

  return (
    <View style={styles.whiteRoot}>
      <HiddenChrome />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: y(40),
          paddingHorizontal: x(16),
          paddingTop: y(72),
        }}
        showsVerticalScrollIndicator={false}
      >
        <TechText lineHeight={s(31)} size={s(24)} weight="700">
          how to use
        </TechText>
        <View style={{ height: y(38) }} />
        {steps.map(([title, body], index) => (
          <View key={title} style={{ marginBottom: y(14) }}>
            <TechText
              align="left"
              color={colors.orange}
              lineHeight={s(30)}
              size={s(23)}
              weight="600"
            >
              {`${index + 1}. ${title}`}
            </TechText>
            <TechText
              align="left"
              color={colors.muted}
              lineHeight={s(51)}
              size={s(23)}
              weight="600"
              style={{ marginLeft: x(31), marginTop: y(14) }}
            >
              {body}
            </TechText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function RecordingScreen() {
  const router = useRouter();
  const { s, x, y } = useScale(388, 807);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const setAnalysisInput = useAudioAnalysisStore(state => state.setInput);
  const recording = useRecordingFlow({ recorder, router, setAnalysisInput });
  const seconds = recorderState.isRecording
    ? Math.min(MAX_RECORDING_SECONDS, Math.floor(recorderState.durationMillis / 1000))
    : 0;

  const time = React.useMemo(() => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours, minutes, secs].map(value => String(value).padStart(2, '0')).join(':');
  }, [seconds]);

  return (
    <View style={[styles.recordingRoot, { paddingHorizontal: x(20) }]}>
      <HiddenChrome />
      <View style={[styles.languageSelector, { left: x(36), top: y(44) }]}>
        <TechText color={colors.white} lineHeight={s(24)} size={s(18)}>
          En
        </TechText>
        <ChevronDown />
      </View>
      <TechText
        color={colors.white}
        lineHeight={s(48)}
        size={s(39)}
        style={[styles.absoluteCenter, { minWidth: x(170), top: y(84) }]}
      >
        {time}
      </TechText>
      <AnimatedAudioOrb
        paused={!recorderState.isRecording}
        style={{
          height: y(150),
          left: (x(388) - x(190)) / 2,
          top: y(210),
          width: x(190),
        }}
      />
      <View style={[styles.recordingMeta, { top: y(431) }]}>
        <View style={styles.metaRow}>
          <TechText color={colors.white} lineHeight={s(22)} size={s(16)}>
            {recorderState.isRecording ? 'Recording 1' : 'Ready to record'}
          </TechText>
          <EditIcon />
        </View>
        <TechText color={colors.white} lineHeight={s(22)} size={s(16)}>
          {recording.statusText}
        </TechText>
      </View>
      <View pointerEvents="none" style={styles.bottomGlow} />
      <View style={[styles.controlsArea, { height: y(154), top: y(522) }]}>
        <ControlButton
          icon={<StopIcon />}
          label="Stop recording"
          disabled={!recorderState.isRecording || recording.busy}
          onPress={recording.stopRecording}
          style={{ left: x(27), top: y(72) }}
        />
        <ControlButton
          circle={true}
          icon={<MicIcon />}
          label={recorderState.isRecording ? 'Recording' : 'Start recording'}
          disabled={recorderState.isRecording || recording.busy}
          onPress={recording.startRecording}
          size={s(94)}
          style={{ left: (x(388) - s(94)) / 2, top: 0 }}
        />
        <ControlButton
          icon={<FileIcon />}
          label="Choose audio file"
          disabled={recorderState.isRecording || recording.busy}
          onPress={recording.chooseAudioFile}
          style={{ right: x(34), top: y(72) }}
        />
      </View>
    </View>
  );
}

function AnimatedAudioOrb({ paused, style }: { paused: boolean; style: object }) {
  const progress = useSharedValue(0);
  const visibility = useSharedValue(1);

  React.useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    visibility.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [progress, visibility]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: paused ? 0.25 : visibility.value,
    transform: [
      { rotate: `${progress.value * 8 - 4}deg` },
      { scaleX: 0.94 + progress.value * 0.18 },
      { scaleY: 1.08 - progress.value * 0.24 },
    ],
  }));

  return (
    <View style={[styles.audioOrbContainer, style]}>
      <Animated.View style={[styles.audioOrbRing, animatedStyle]}>
        <Svg height="100%" viewBox="0 0 190 150" width="100%">
          <Defs>
            <LinearGradient id="orbGradient" x1="0" x2="1" y1="0" y2="1">
              <Stop offset="0" stopColor={colors.bluePurple} />
              <Stop offset="0.5" stopColor={colors.purple} />
              <Stop offset="1" stopColor="#C06DFF" />
            </LinearGradient>
          </Defs>
          <Ellipse
            cx={95}
            cy={75}
            fill="transparent"
            rx={76}
            ry={58}
            stroke="url(#orbGradient)"
            strokeWidth={4}
          />
        </Svg>
      </Animated.View>
      <TechText
        color={colors.white}
        lineHeight={19}
        size={16}
        weight="700"
        style={styles.audioOrbText}
      >
        {'RECORDING\nSOUND'}
      </TechText>
    </View>
  );
}

function ControlButton({
  circle = false,
  disabled = false,
  icon,
  label,
  onPress,
  size,
  style,
}: {
  circle?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onPress: () => void | Promise<void>;
  size?: number;
  style: object;
}) {
  const width = size ?? 86;
  const height = size ?? 82;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.controlButton,
        {
          borderRadius: circle ? 999 : 25,
          height,
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
          width,
        },
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}

export function AnalysisLoadingScreen() {
  const router = useRouter();
  const analysisInput = useAudioAnalysisStore(state => state.input);
  const setResults = useAudioAnalysisStore(state => state.setResults);
  const { x, y, s } = useScale(440, 956);

  React.useEffect(() => {
    let cancelled = false;

    const runAnalysis = async () => {
      try {
        if (analysisInput) {
          const audioInput = { uri: analysisInput.uri };
          const decodeOpts = { durationMillis: analysisInput.durationMillis };

          const braking = await classifyBraking(audioInput, decodeOpts);
          const startup = await classifyStartup(audioInput, decodeOpts);
          const idle = await classifyIdle(audioInput, decodeOpts);

          setResults([braking, startup, idle]);
        }
      }
      catch (error) {
        console.error('Audio analysis failed', error);
      }

      if (!cancelled) {
        router.replace('/analysis-results');
      }
    };

    const timeout = setTimeout(() => {
      void runAnalysis();
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [analysisInput, router, setResults]);

  return (
    <View style={styles.analysisRoot}>
      <HiddenChrome />
      <Image
        accessibilityLabel="loading-gears-illustration"
        contentFit="contain"
        source={gearsLoadingIllustration}
        style={[
          styles.absolute,
          {
            height: y(205),
            left: (x(440) - x(224)) / 2,
            top: y(193),
            width: x(224),
          },
        ]}
      />
      <TechText
        color={colors.white}
        lineHeight={s(31)}
        size={s(24)}
        weight="700"
        style={[styles.absoluteCenter, { top: y(486) }]}
      >
        Analyzing engine sound...
      </TechText>
      <TechText
        color={colors.cyan}
        lineHeight={s(20)}
        size={s(15)}
        weight="700"
        style={[styles.absoluteCenter, { top: y(548) }]}
      >
        This will only take a few seconds
      </TechText>
      <LoadingWaveform style={{ left: (x(440) - x(244)) / 2, top: y(595), width: x(244) }} />
    </View>
  );
}

function LoadingWaveform({ style }: { style: object }) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: 0.65 + progress.value * 0.5 }],
  }));

  const bars = [56, 96, 132, 154, 118, 88, 142, 100, 70];

  return (
    <View style={[styles.waveform, style]}>
      {bars.map((height, index) => (
        <Animated.View
          key={height}
          style={[
            styles.waveformBar,
            {
              height,
              opacity: index % 2 === 0 ? 1 : 0.68,
            },
            animatedStyle,
          ]}
        />
      ))}
    </View>
  );
}

function StatusBadge({
  backgroundColor,
  label,
  style,
}: {
  backgroundColor: string;
  label: string;
  style?: object;
}) {
  return (
    <View style={[styles.statusBadge, { backgroundColor }, style]}>
      <TechText color={colors.white} lineHeight={34} size={26} weight="700">
        {label}
      </TechText>
    </View>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.round(score * 100);
  const isNormal = label === 'normal' || label === 'normal_engine_startup' || label === 'normal_engine_idle';
  const barColor = isNormal ? '#00792B' : colors.orange;

  return (
    <View style={styles.scoreBarRow}>
      <TechText
        align="left"
        color={colors.white}
        lineHeight={20}
        size={14}
        weight="500"
        style={{ flex: 1 }}
      >
        {label.replace(/_/g, ' ')}
      </TechText>
      <View style={styles.scoreBarTrack}>
        <View style={[styles.scoreBarFill, { backgroundColor: barColor, width: `${pct}%` }]} />
      </View>
      <TechText
        color={colors.white}
        lineHeight={20}
        size={13}
        weight="600"
        style={{ width: 40, textAlign: 'right' }}
      >
        {pct}%
      </TechText>
    </View>
  );
}

function ModelSection({ result }: { result: ModelClassificationResult }) {
  const isNormal = result.label === 'normal' || result.label === 'normal_engine_startup' || result.label === 'normal_engine_idle';
  const badgeColor = isNormal ? '#00792B' : colors.orange;

  const sectionTitle = result.model === 'braking'
    ? 'Braking'
    : result.model === 'startup'
      ? 'Startup'
      : 'Idle';

  return (
    <View style={styles.modelSection}>
      <TechText
        align="left"
        color={colors.cyan}
        lineHeight={24}
        size={18}
        weight="700"
        style={styles.modelSectionTitle}
      >
        {sectionTitle}
      </TechText>
      <StatusBadge
        backgroundColor={badgeColor}
        label={result.label.replace(/_/g, ' ')}
        style={styles.modelSectionBadge}
      />
      {result.labels.map((lbl, idx) => (
        <ScoreBar key={lbl} label={lbl} score={result.rawScores[idx] ?? 0} />
      ))}
    </View>
  );
}

export function AnalysisResultsScreen() {
  const router = useRouter();
  const results = useAudioAnalysisStore(state => state.results);
  const { x, y, s } = useScale(440, 956);

  return (
    <View style={styles.analysisRoot}>
      <HiddenChrome />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: y(40),
          paddingHorizontal: x(16),
          paddingTop: y(60),
        }}
        showsVerticalScrollIndicator={false}
      >
        <TechText
          color={colors.white}
          lineHeight={s(34)}
          size={s(26)}
          weight="700"
          style={{ textAlign: 'center', marginBottom: y(24) }}
        >
          Analysis Results
        </TechText>
        {results.map(r => (
          <ModelSection key={r.model} result={r} />
        ))}
        <RouteButton
          backgroundColor="#0F4778"
          label="Record Again"
          onPress={() => router.replace('/recording')}
          style={{
            height: y(56),
            marginTop: y(24),
          }}
        />
      </ScrollView>
    </View>
  );
}

function ChevronDown() {
  return (
    <Svg height={16} viewBox="0 0 16 16" width={16}>
      <Path d="M4 6l4 4 4-4" fill="none" stroke="#BFD3E3" strokeLinecap="round" strokeWidth={1.5} />
    </Svg>
  );
}

function EditIcon() {
  return (
    <Svg height={14} viewBox="0 0 14 14" width={14}>
      <Path d="M2.2 10.4l-.4 1.8 1.8-.4 6.8-6.8-1.4-1.4z" fill="none" stroke={colors.white} strokeWidth={1.5} />
      <Path d="M8.4 3.2l1.4-1.4 2.4 2.4-1.4 1.4" fill="none" stroke={colors.white} strokeWidth={1.5} />
    </Svg>
  );
}

function StopIcon() {
  return (
    <Svg height={34} viewBox="0 0 34 34" width={34}>
      <Rect fill="#111111" height={18} rx={5} width={18} x={8} y={8} />
    </Svg>
  );
}

function MicIcon() {
  return (
    <Svg height={34} viewBox="0 0 34 34" width={34}>
      <Path d="M17 4a6 6 0 0 0-6 6v7a6 6 0 0 0 12 0v-7a6 6 0 0 0-6-6z" fill="none" stroke="#111111" strokeWidth={2.2} />
      <Path d="M7 16.5a10 10 0 0 0 20 0M17 27v4M12 31h10" fill="none" stroke="#111111" strokeLinecap="round" strokeWidth={2.2} />
    </Svg>
  );
}

function FileIcon() {
  return (
    <Svg height={30} viewBox="0 0 30 30" width={30}>
      <Path
        d="M8 4h9l5 5v17H8z"
        fill="none"
        stroke="#111111"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path d="M17 4v6h5M11 16h8M11 21h6" fill="none" stroke="#111111" strokeLinecap="round" strokeWidth={2} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
  },
  absoluteCenter: {
    left: 0,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
  },
  analysisRoot: {
    backgroundColor: colors.analysisBlue,
    flex: 1,
    overflow: 'hidden',
  },
  audioOrbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  audioOrbRing: {
    ...StyleSheet.absoluteFillObject,
    shadowColor: colors.purple,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
  },
  audioOrbText: {
    position: 'absolute',
  },
  authAction: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    height: 69,
    justifyContent: 'center',
    position: 'relative',
  },
  authActionIcon: {
    left: 35,
    position: 'absolute',
  },
  authDivider: {
    backgroundColor: colors.white,
    height: 4,
    marginHorizontal: -7,
  },
  authPanel: {
    backgroundColor: colors.navy,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  bottomGlow: {
    backgroundColor: 'rgba(255, 143, 91, 0.32)',
    borderTopLeftRadius: 160,
    borderTopRightRadius: 160,
    bottom: -30,
    height: 120,
    left: 0,
    opacity: 0.8,
    position: 'absolute',
    right: 0,
  },
  buttonBase: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  centeredBlock: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    elevation: 6,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: colors.black,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  controlsArea: {
    left: 0,
    position: 'absolute',
    right: 0,
  },
  decorativeBar: {
    backgroundColor: '#A8EEFE',
    borderRadius: 999,
    position: 'absolute',
    width: 18,
  },
  decorativeBars: {
    height: 290,
    position: 'absolute',
    transform: [{ rotate: '-14deg' }],
    width: 250,
  },
  decorativeBarsBottom: {
    bottom: -22,
    right: -22,
  },
  decorativeBarsTop: {
    left: -2,
    top: 65,
  },
  languageSelector: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    position: 'absolute',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  modelSection: {
    marginBottom: 20,
  },
  modelSectionBadge: {
    alignSelf: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    position: 'relative',
  },
  modelSectionTitle: {
    marginBottom: 8,
  },
  recordingMeta: {
    alignItems: 'center',
    gap: 4,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  recordingRoot: {
    backgroundColor: colors.deepNavy,
    flex: 1,
    overflow: 'hidden',
  },
  scoreBarFill: {
    borderRadius: 4,
    height: '100%',
  },
  scoreBarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  scoreBarTrack: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    flex: 2,
    height: 10,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  splashBrand: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  statusBadge: {
    alignItems: 'center',
    borderRadius: 7,
    height: 63,
    justifyContent: 'center',
  },
  waveform: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 154,
    justifyContent: 'space-between',
    position: 'absolute',
  },
  waveformBar: {
    backgroundColor: '#D7E8F6',
    borderRadius: 999,
    width: 14,
  },
  whiteRoot: {
    backgroundColor: colors.white,
    flex: 1,
    overflow: 'hidden',
  },
});
