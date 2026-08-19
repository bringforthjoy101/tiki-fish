// Capabilities come from GET /me and are the single source of truth for what this admin may
// do. The API enforces them server-side; everything here only decides what to render, so a
// mistake in this file hides a button, it does not open a door.
//
// Grammar is `resource.action`, exactly two segments, which maps straight onto a CASL rule:
//     'expenses.create' -> { action: 'create', subject: 'expenses' }
// That is why the capability strings are shaped the way they are.

import { Storage, apiRequest } from './Utils'

/** CASL rules for a capability list. */
export const capabilitiesToAbility = (capabilities = []) => {
  const rules = capabilities
    .map((c) => {
      const [subject, action] = String(c).split('.')
      return subject && action ? { action, subject } : null
    })
    .filter(Boolean)

  // Everyone who is signed in can read the auth pages; without this the router bounces a
  // freshly-logged-in user straight back to the login screen.
  rules.push({ action: 'read', subject: 'Auth' })
  return rules
}

export const getCapabilities = () => {
  try {
    const userData = Storage.getItem('userData')
    return Array.isArray(userData?.capabilities) ? userData.capabilities : []
  } catch (e) {
    return []
  }
}

/** Does the signed-in admin hold this capability? */
export const can = (capability) => getCapabilities().includes(capability)

/** Any one of them. Use for a menu entry that several screens live under. */
export const canAny = (...capabilities) => {
  const held = getCapabilities()
  return capabilities.some((c) => held.includes(c))
}

/**
 * Re-read capabilities from the server and store them.
 *
 * Login is not the only moment they can change, and it must not be the only moment they are
 * read. A session created before capabilities existed carries none, and a role changed on the
 * server does not reach a signed-in browser until that person happens to sign in again -
 * which is exactly how an owner came to sit in front of a sidebar containing one item.
 *
 * Returns the capability list, or null when the call failed. NULL IS NOT AN EMPTY LIST: the
 * caller must leave whatever it already had in place. Treating a failed request as "this
 * admin may do nothing" is what turned a transient error into an empty menu with no
 * explanation.
 */
export const refreshCapabilities = async () => {
  const userData = Storage.getItem('userData')
  if (!userData?.accessToken) return null

  try {
    const response = await apiRequest({ url: '/me', method: 'GET' }, null)
    if (!response?.data?.status) return null
    const capabilities = response.data.data?.capabilities
    if (!Array.isArray(capabilities)) return null

    Storage.setItem('userData', {
      ...userData,
      role: response.data.data.role ?? userData.role,
      accessRole: response.data.data.accessRole ?? userData.accessRole,
      capabilities,
      ability: capabilitiesToAbility(capabilities)
    })
    return capabilities
  } catch (e) {
    // Deliberately quiet and deliberately non-destructive - the stored session stands.
    console.error('Could not refresh capabilities:', e)
    return null
  }
}
