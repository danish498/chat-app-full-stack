"use client";

import React from "react";
import { applyAccentTheme, getStoredAccentThemeId } from "../lib/accentTheme";

export function AccentThemeLoader() {
  React.useEffect(() => {
    applyAccentTheme(getStoredAccentThemeId());
  }, []);

  return null;
}

