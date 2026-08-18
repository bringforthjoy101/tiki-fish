// Capabilities come from GET /me and are the single source of truth for what this admin may
// do. The API enforces them server-side; everything here only decides what to render, so a
// mistake in this file hides a button, it does not open a door.
//
// Grammar is `resource.action`, exactly two segments, which maps straight onto a CASL rule:
//     'expenses.create' -> { action: 'create', subject: 'expenses' }
// That is why the capability strings are shaped the way they are.

import { Storage } from './Utils'

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
