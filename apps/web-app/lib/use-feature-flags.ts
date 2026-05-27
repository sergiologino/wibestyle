"use client";

import { useEffect, useState } from "react";
import type { FeatureFlag } from "@wibestyle/shared-types";
import { DEFAULT_FEATURE_FLAGS } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";

export function useFeatureFlags() {
  const { api } = useAppSession();
  const [flags, setFlags] = useState(DEFAULT_FEATURE_FLAGS);

  useEffect(() => {
    let active = true;
    api.getFeatures()
      .then((payload) => {
        if (active) setFlags({ ...DEFAULT_FEATURE_FLAGS, ...payload.flags });
      })
      .catch(() => {
        if (active) setFlags(DEFAULT_FEATURE_FLAGS);
      });
    return () => {
      active = false;
    };
  }, [api]);

  return flags;
}

export function useFeatureEnabled(flag: FeatureFlag) {
  const flags = useFeatureFlags();
  return Boolean(flags[flag]);
}
