import { apiRequest, setTokens } from "./client"

export const registerOptions = () => apiRequest("/auth/passkey/register/options/", { method: "POST" })

export const registerVerify = (credential, label) =>
  apiRequest("/auth/passkey/register/verify/", { method: "POST", body: { credential, label } })

export const loginOptions = () => apiRequest("/auth/passkey/login/options/", { method: "POST", auth: false })

export async function loginVerify(credential) {
  const data = await apiRequest("/auth/passkey/login/verify/", { method: "POST", auth: false, body: { credential } })
  setTokens({ access: data.access, refresh: data.refresh })
  return data
}

export const listPasskeys = () => apiRequest("/auth/passkeys/")

export const removePasskey = (id) => apiRequest("/auth/passkeys/" + id + "/", { method: "DELETE" })
