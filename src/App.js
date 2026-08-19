// ** React Imports
import { useState, useEffect, useContext } from 'react'

// ** Router Import
import Router from './router/Router'

// ** Utils
import { isUserLoggedIn } from '@utils'
import { AbilityContext } from '@src/utility/context/Can'
import { refreshCapabilities, capabilitiesToAbility } from '@src/utility/capabilities'

/**
 * Capabilities are re-read from the server on every app load, not only at sign-in.
 *
 * Reading them once at login made the browser's copy permanent for the life of a session:
 * a session created before capabilities existed carried none, and a role changed on the
 * server did not reach a signed-in browser at all. Both surface identically and silently —
 * as a sidebar with fewer items than it should have, and no indication that anything is
 * wrong. An owner sat in front of a one-item menu because of it.
 *
 * The refresh is non-blocking: the app renders immediately from what is already stored, and
 * re-renders if the server disagrees. A failed call changes nothing.
 */
const App = () => {
  const ability = useContext(AbilityContext)
  const [, setRefreshedAt] = useState(null)

  useEffect(() => {
    if (!isUserLoggedIn()) return
    let cancelled = false
    refreshCapabilities().then(capabilities => {
      if (cancelled || !capabilities) return
      ability.update(capabilitiesToAbility(capabilities))
      // Rebuilds the menu, which reads capabilities from storage on every render.
      setRefreshedAt(Date.now())
    })
    return () => {
      cancelled = true
    }
  }, [])

  return <Router />
}

export default App
