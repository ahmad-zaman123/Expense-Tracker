import { useState } from "react"

import { DEMO_EMAIL, deviceCredential, disableFingerprint, enableFingerprint, useFingerprintAvailable, wasCancelled } from "../auth/fingerprint"
import { formatError } from "../utils/errors"

const FINGERPRINT =
  "M12 11a3 3 0 0 0-3 3c0 2.5-.5 4-1.5 5.5M12 7a7 7 0 0 0-7 7c0 1.5-.2 3-.7 4M12 3a11 11 0 0 1 11 11c0 2-.3 3.5-.8 5M15 14c0 3-.7 5-2 7M9 3.5A11 11 0 0 0 1 14"

/** A menu entry to turn fingerprint sign-in on or off for this device. Only appears in the installed app. */
export default function FingerprintMenuItem({ user }) {
  const available = useFingerprintAvailable()
  const [on, setOn] = useState(() => Boolean(deviceCredential()))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  if (!available || user?.email === DEMO_EMAIL) return null

  async function toggle() {
    setBusy(true)
    setMessage("")
    try {
      if (on) await disableFingerprint()
      else await enableFingerprint()
      setOn(!on)
    } catch (err) {
      if (!wasCancelled(err)) setMessage(formatError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" role="menuitem" className="pitem" onClick={toggle} disabled={busy}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={FINGERPRINT} />
        </svg>
        {busy ? "Working…" : on ? "Turn off fingerprint on this device" : "Turn on fingerprint"}
      </button>
      {message ? (
        <p className="hint" role="alert" style={{ margin: "0 10px 6px" }}>
          {message}
        </p>
      ) : null}
    </>
  )
}
