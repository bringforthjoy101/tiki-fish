import { useState, useEffect } from 'react'

/**
 * Which layout the screen should get.
 *
 * 'phone'   < 768px   one card per row, nothing scrolls sideways
 * 'tablet'  768-1023  two cards per row
 * 'desktop' >= 1024   the full data table, unchanged
 *
 * matchMedia rather than a resize listener on window.innerWidth: the browser only fires when the
 * query's answer actually CHANGES, so dragging a window edge does not re-render on every pixel.
 * It also reports correctly on first paint, where a resize listener has nothing to react to yet.
 */
const QUERIES = {
  phone: '(max-width: 767.98px)',
  tablet: '(min-width: 768px) and (max-width: 1023.98px)'
}

const read = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop'
  if (window.matchMedia(QUERIES.phone).matches) return 'phone'
  if (window.matchMedia(QUERIES.tablet).matches) return 'tablet'
  return 'desktop'
}

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState(read)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const lists = Object.values(QUERIES).map(q => window.matchMedia(q))
    const onChange = () => setBreakpoint(read())
    // addListener is the deprecated form, but Safari below 14 has no addEventListener on a
    // MediaQueryList — and this runs on whatever phones the team actually has.
    lists.forEach(l => (l.addEventListener ? l.addEventListener('change', onChange) : l.addListener(onChange)))
    return () => lists.forEach(l => (l.removeEventListener ? l.removeEventListener('change', onChange) : l.removeListener(onChange)))
  }, [])

  return breakpoint
}

export default useBreakpoint
