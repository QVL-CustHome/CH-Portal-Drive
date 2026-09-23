import { useEffect, useState } from "react";
import { createCanopTheme } from "canopui";

export const MOBILE_BREAKPOINT = 768;

const mobileMediaQuery = createCanopTheme()
  .breakpoints.down(MOBILE_BREAKPOINT)
  .replace("@media ", "");

function matchesMobile(): boolean {
  return typeof window !== "undefined" && window.matchMedia(mobileMediaQuery).matches;
}

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(matchesMobile);

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileMediaQuery);
    const onChange = () => setMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return mobile;
}
