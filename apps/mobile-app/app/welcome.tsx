import { useMemo, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "@/components/ui/BrandMark";
import { useSession } from "@/context/SessionProvider";
import { FIRST_100_PROMO_CODE, mobileOnboardingSlides } from "@/lib/onboarding-copy";
import { colors, hairline, radius, shadows, spacing } from "@/theme/tokens";

const assets = {
  upload: require("../assets/onboarding/slides/upload-photo.webp"),
  flow: require("../assets/onboarding/slides/flow-photo.webp"),
  privacy: require("../assets/onboarding/slides/privacy-photo.png"),
  future: require("../assets/onboarding/slides/future-photo.webp"),
  paywall: require("../assets/onboarding/slides/paywall-photo.webp"),
} as const;

const resultVideo = require("../assets/onboarding/slides/result-photo.mp4");

const toneStyles = {
  coral: { backgroundColor: "#fff1ed", borderColor: "#ffb8a5", accent: "#ff5b3d" },
  blue: { backgroundColor: "#eef7ff", borderColor: "#a9d8ff", accent: "#42a5ff" },
  sand: { backgroundColor: "#fff7e8", borderColor: "#ead4aa", accent: "#d8a947" },
  pink: { backgroundColor: "#fff0f7", borderColor: "#ffb7dc", accent: colors.pink },
} as const;

export default function WelcomeScreen() {
  const router = useRouter();
  const { completeOnboardingStep } = useSession();
  const [activeIndex, setActiveIndex] = useState(0);
  const { height, width } = useWindowDimensions();
  const activeSlide = mobileOnboardingSlides[activeIndex];
  const tone = toneStyles[activeSlide.tone];
  const cardHeight = useMemo(() => Math.min(height - 32, 760), [height]);
  const imageHeight = useMemo(() => {
    const compactHeight = Math.max(188, height * 0.31);
    return Math.round(Math.min(compactHeight, width * 0.86, 310));
  }, [height, width]);

  function openAuth() {
    completeOnboardingStep("welcome");
    router.replace("/auth");
  }

  function openTrial() {
    completeOnboardingStep("welcome");
    router.replace("/auth?next=/paywall");
  }

  function skipOnboarding() {
    completeOnboardingStep("welcome");
    router.replace("/auth?next=/paywall");
  }

  function nextSlide() {
    if (activeIndex < mobileOnboardingSlides.length - 1) {
      setActiveIndex((value) => value + 1);
      return;
    }
    openAuth();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.card, { minHeight: cardHeight, backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <BrandMark size={34} />
            <Text style={styles.brandText}>Я на стиле</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="У меня есть аккаунт" onPress={openAuth} style={styles.loginButton}>
            <Text style={styles.loginText}>Войти</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <OnboardingMedia slide={activeSlide} imageHeight={imageHeight} />

          <View style={styles.content}>
            <View style={styles.counterRow}>
              <View style={[styles.heartBadge, { backgroundColor: tone.accent }]}>
                <Feather name="heart" size={16} color={colors.white} />
              </View>
              <Text style={styles.counter}>{activeIndex + 1} / {mobileOnboardingSlides.length}</Text>
              <Text style={styles.promo}>{FIRST_100_PROMO_CODE}</Text>
            </View>

            <Text style={styles.title}>{activeSlide.title}</Text>
            <Text style={styles.text}>{activeSlide.text}</Text>

            <View style={styles.bullets}>
              {activeSlide.bullets.map((bullet) => (
                <View key={bullet} style={styles.bullet}>
                  <Feather name="check" size={14} color={tone.accent} />
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>

            {activeSlide.footnote ? <Text style={styles.footnote}>{activeSlide.footnote}</Text> : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.dots} accessibilityLabel="Экраны онбординга">
            {mobileOnboardingSlides.map((slide, index) => (
              <Pressable
                key={slide.id}
                accessibilityRole="button"
                accessibilityLabel={`Открыть экран ${index + 1}`}
                onPress={() => setActiveIndex(index)}
                style={[styles.dot, activeIndex === index && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            {activeSlide.cta === "trial" ? (
              <Button label="Подключить trial" size="lg" onPress={openTrial} style={styles.primaryButton} />
            ) : (
              <Button label="Дальше" size="lg" onPress={nextSlide} style={styles.primaryButton} />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={activeIndex === 0 ? "Пропустить" : "Назад"}
              onPress={() => (activeIndex === 0 ? skipOnboarding() : setActiveIndex((value) => value - 1))}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>{activeIndex === 0 ? "Пропустить" : "Назад"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: "center",
    padding: spacing.md,
  },
  card: {
    flex: 1,
    borderRadius: 34,
    borderWidth: hairline,
    overflow: "hidden",
    ...shadows.card,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  brandText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: colors.black,
  },
  loginButton: {
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  loginText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: colors.black,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  image: {
    overflow: "hidden",
    borderRadius: 28,
    justifyContent: "space-between",
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  mediaFill: {
    ...StyleSheet.absoluteFillObject,
  },
  imageInner: {
    borderRadius: 28,
  },
  imageLabel: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  imageLabelText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    color: colors.black,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  photoCaption: {
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: spacing.md,
  },
  photoCaptionTop: {
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.eyebrow,
  },
  photoCaptionTitle: {
    marginTop: 4,
    fontFamily: "Manrope_300Light",
    fontSize: 25,
    lineHeight: 28,
    color: colors.black,
  },
  content: {
    paddingTop: spacing.lg,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heartBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: colors.black,
  },
  promo: {
    marginLeft: "auto",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: "#8b3c2c",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  title: {
    marginTop: spacing.lg,
    fontFamily: "Manrope_300Light",
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -0.7,
    color: colors.black,
  },
  text: {
    marginTop: spacing.md,
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    lineHeight: 23,
    color: colors.muted,
  },
  bullets: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  bullet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: hairline,
    borderColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  bulletText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: colors.black,
  },
  footnote: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: hairline,
    borderColor: "#ead4aa",
    backgroundColor: "rgba(255,255,255,0.72)",
    padding: spacing.md,
    fontFamily: "Manrope_400Regular",
    fontSize: 11,
    lineHeight: 17,
    color: colors.muted,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  dots: {
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.black,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    minWidth: 96,
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  secondaryText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.pink,
  },
});

function OnboardingMedia({ slide, imageHeight }: { slide: (typeof mobileOnboardingSlides)[number]; imageHeight: number }) {
  const player = useVideoPlayer(slide.asset === "result" ? resultVideo : null, (instance) => {
    instance.loop = true;
    instance.muted = true;
    if (slide.asset === "result") {
      instance.play();
    }
  });

  if (slide.asset === "result") {
    return (
      <View style={[styles.image, { height: imageHeight }]}>
        <VideoView
          player={player}
          style={styles.mediaFill}
          nativeControls={false}
          contentFit="contain"
          allowsFullscreen={false}
        />
        <MediaOverlay slide={slide} />
      </View>
    );
  }

  return (
    <ImageBackground
      source={assets[slide.asset]}
      resizeMode="contain"
      style={[styles.image, { height: imageHeight }]}
      imageStyle={styles.imageInner}
    >
      <MediaOverlay slide={slide} />
    </ImageBackground>
  );
}

function MediaOverlay({ slide }: { slide: (typeof mobileOnboardingSlides)[number] }) {
  return (
    <>
      <View style={styles.imageLabel}>
        <Text style={styles.imageLabelText}>виртуальная примерочная</Text>
      </View>
      <View style={styles.photoCaption}>
        <Text style={styles.photoCaptionTop}>{slide.eyebrow}</Text>
        <Text style={styles.photoCaptionTitle}>{slide.title}</Text>
      </View>
    </>
  );
}
