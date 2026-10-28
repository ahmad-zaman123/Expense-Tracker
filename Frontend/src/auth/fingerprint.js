import { browserSupportsWebAuthn, platformAuthenticatorIsAvailable, startAuthentication, startRegistration } from "@simplewebauthn/browser"
import { useEffect, useState } from "react"

import { listPasskeys, loginOptions, loginVerify, registerOptions, registerVerify, removePasskey } from "../api/passkeys"
import { isInstalledApp } from "../utils/installedApp"

// Fingerprint sign-in is offered only in the installed app. These two flags are per device:
// which passkey this device registered, and whether the person said "not now" to the offer.
const DEVICE_KEY = "fingerprint_credential"
const DISMISSED_KEY = "fingerprint_offer_dismissed"

export const DEMO_EMAIL = "demo@expense-tracker.app"

const read = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage blocked: the feature just stays off */
  }
}

// After a deliberate sign-out the sign-in page must not pop the fingerprint prompt by itself.
// Kept for the browser session (not in router state, which the sign-in redirect can lose).
const SIGNED_OUT_KEY = "fingerprint_signed_out"
export const markSignedOut = () => {
  try {
    sessionStorage.setItem(SIGNED_OUT_KEY, "1")
  } catch {
    /* ignore */
  }
}
export const clearSignedOut = () => {
  try {
    sessionStorage.removeItem(SIGNED_OUT_KEY)
  } catch {
    /* ignore */
  }
}
export const signedOutDeliberately = () => {
  try {
    return sessionStorage.getItem(SIGNED_OUT_KEY) === "1"
  } catch {
    return false
  }
}

export const deviceCredential = () => read(DEVICE_KEY)
export const offerDismissed = () => read(DISMISSED_KEY) === "1"
export const dismissOffer = () => write(DISMISSED_KEY, "1")

/** Installed app + a browser that can do WebAuthn + a built-in fingerprint or face sensor. */
export async function fingerprintAvailable() {
  if (!isInstalledApp() || !browserSupportsWebAuthn()) return false
  try {
    return await platformAuthenticatorIsAvailable()
  } catch {
    return false
  }
}

export function useFingerprintAvailable() {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    let alive = true
    fingerprintAvailable().then((ok) => alive && setAvailable(ok))
    return () => {
      alive = false
    }
  }, [])
  return available
}

/** A short name for this device, shown in the device list. */
function deviceLabel() {
  const ua = navigator.userAgent
  if (/iphone/i.test(ua)) return "iPhone"
  if (/ipad/i.test(ua)) return "iPad"
  if (/android/i.test(ua)) return "Android phone"
  if (/windows/i.test(ua)) return "Windows PC"
  if (/mac/i.test(ua)) return "Mac"
  return "This device"
}

/** True when the person closed or declined the system prompt, which isn't an error worth showing. */
export const wasCancelled = (err) => err?.name === "NotAllowedError" || err?.name === "AbortError"

export async function enableFingerprint() {
  const optionsJSON = await registerOptions()
  const credential = await startRegistration({ optionsJSON })
  const saved = await registerVerify(credential, deviceLabel())
  write(DEVICE_KEY, saved.credential_id)
}

export async function disableFingerprint() {
  const mine = deviceCredential()
  const device = (await listPasskeys()).find((p) => p.credential_id === mine)
  if (device) await removePasskey(device.id)
  write(DEVICE_KEY, null)
}

/** The system fingerprint prompt, then our JWT pair (stored by loginVerify). */
export async function fingerprintLogin() {
  const optionsJSON = await loginOptions()
  const credential = await startAuthentication({ optionsJSON })
  try {
    return await loginVerify(credential)
  } catch (err) {
    // The server no longer knows this device (removed elsewhere), so stop offering the button.
    if (err.status === 401) write(DEVICE_KEY, null)
    throw err
  }
}
