/** True when the site is running as an installed app (home-screen icon or desktop window), not in a browser tab. */
export function isInstalledApp() {
  return Boolean(window.matchMedia?.("(display-mode: standalone)").matches) || window.navigator.standalone === true
}
