import { useState } from "react"

import { DEMO_EMAIL, deviceCredential, dismissOffer, enableFingerprint, offerDismissed, useFingerprintAvailable, wasCancelled } from "../auth/fingerprint"
import { formatError } from "../utils/errors"
import { Button } from "./ui.jsx"

/** A one-time, dismissible offer to use the fingerprint next time. Installed app only. */
export default function FingerprintOffer({ user }) {
  const available = useFingerprintAvailable()
  const [hidden, setHidden] = useState(() => Boolean(deviceCredential()) || offerDismissed())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  if (!available || hidden || user?.email === DEMO_EMAIL) return null

  async function turnOn() {
    setBusy(true)
    setError("")
    try {
      await enableFingerprint()
      setHidden(true)
    } catch (err) {
      if (!wasCancelled(err)) setError(formatError(err))
    } finally {
      setBusy(false)
    }
  }

  function notNow() {
    dismissOffer()
    setHidden(true)
  }

  return (
    <div className="fp-offer" role="region" aria-label="Fingerprint sign-in">
      <p>
        <strong>Sign in with your fingerprint?</strong> Skip typing your password on this device.
      </p>
      {error ? <p className="fp-error">{error}</p> : null}
      <div className="fp-actions">
        <Button type="button" onClick={turnOn} disabled={busy}>
          {busy ? "Working…" : "Turn on"}
        </Button>
        <button type="button" className="text-btn" onClick={notNow} disabled={busy}>
          Not now
        </button>
      </div>
    </div>
  )
}
