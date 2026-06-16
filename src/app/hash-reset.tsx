"use client";

import { useEffect } from "react";

export function HashReset() {
  useEffect(() => {
    if (window.location.pathname === "/" && window.location.hash) {
      history.replaceState(null, "", "/");
      window.scrollTo({ left: 0, top: 0 });
    }
  }, []);

  return null;
}
