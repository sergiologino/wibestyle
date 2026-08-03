import { useEffect, useState } from "react";
import { Alert } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useSession } from "@/context/SessionProvider";
import { Button } from "@/components/ui/Button";
import { getAppBaseUrl } from "@/lib/config";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { readVisitorId, trackMobileMarketingEvent } from "@/lib/marketing-visitor";

WebBrowser.maybeCompleteAuthSession();

type MobileIdFallbackButtonProps = {
  referralCode?: string;
  nextParam?: string;
};

/**
 * Mobile ID has no native React Native SDK in the current integration. Keep it
 * as an explicit fallback only; the primary SMS entry remains fully native.
 */
export function MobileIdFallbackButton({ referralCode, nextParam }: MobileIdFallbackButtonProps) {
  const { api } = useSession();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    void api.getMobileIdStatus()
      .then((status) => {
        if (active) setEnabled(status.enabled);
      })
      .catch(() => {
        if (active) setEnabled(false);
      });
    return () => {
      active = false;
    };
  }, [api]);

  async function openMobileId() {
    setLoading(true);
    try {
      const returnUrl = Linking.createURL("auth/mobile-id/callback", {
        queryParams: nextParam ? { next: nextParam } : undefined,
      });
      const bridgeUrl = new URL(`${getAppBaseUrl()}/auth/mobile-id`);
      bridgeUrl.searchParams.set("returnUrl", returnUrl);
      if (referralCode) bridgeUrl.searchParams.set("ref", referralCode);
      if (nextParam) bridgeUrl.searchParams.set("next", nextParam);
      const visitorId = await readVisitorId();
      if (visitorId) bridgeUrl.searchParams.set("visitorId", visitorId);
      bridgeUrl.searchParams.set("deviceId", await getOrCreateDeviceId());

      void trackMobileMarketingEvent("signup_started", { method: "mobile_id_fallback" });
      await WebBrowser.openAuthSessionAsync(bridgeUrl.toString(), returnUrl);
    } catch {
      // The primary SMS method remains available even if the optional widget cannot open.
      Alert.alert("Mobile ID недоступен", "Попробуйте основной вход по SMS-коду ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) return null;

  return (
    <Button
      label="Другой способ: SMS Aero Mobile ID"
      variant="ghost"
      loading={loading}
      disabled={loading}
      onPress={() => void openMobileId()}
    />
  );
}
