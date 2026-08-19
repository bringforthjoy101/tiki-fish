// ** React Imports
import { useContext } from 'react'
import { AbilityContext } from '@src/utility/context/Can'

/**
 * Return which component to render based on it's data/context
 * @param {Object} item nav menu item
 */
export const resolveVerticalNavMenuItemComponent = item => {
  if (item.header) return 'VerticalNavMenuSectionHeader'
  if (item.children) return 'VerticalNavMenuGroup'
  return 'VerticalNavMenuLink'
}

/**
 * Return which component to render based on it's data/context
 * @param {Object} item nav menu item
 */
export const resolveHorizontalNavMenuItemComponent = item => {
  if (item.children) return 'HorizontalNavMenuGroup'
  return 'HorizontalNavMenuLink'
}

/**
 * Check if nav-link is active
 * @param {Object} link nav-link object
 */
// export const isNavLinkActive = (link, currentURL, match) => {
//   // return currentURL === link || (URLParams && Object.keys(URLParams).length && currentURLFilter === item.navLink)
//   const getFirstObjProp = obj => obj[Object.keys(obj)[0]]
//   return (
//     currentURL === link ||
//     (match !== null && match !== undefined && match.url === `${link}/${getFirstObjProp(match.params)}`)
//   )
// }

export const isNavLinkActive = (link, currentURL, routerProps) => {
  return (
    currentURL === link ||
    (routerProps && routerProps.meta && routerProps.meta.navLink && routerProps.meta.navLink === link)
  )
  // return currentURL === link
}

/**
 * Check if nav group is
 * @param {Array} children Group children
 */
// export const isNavGroupActive = (children, currentURL, match) => {
//   return children.some(child => {
//     // If child have children => It's group => Go deeper(recursive)
//     if (child.children) {
//       return isNavGroupActive(child.children, currentURL, match)
//     }
//     // else it's link => Check for matched Route
//     return isNavLinkActive(child.navLink, currentURL, match)
//   })
// }
export const isNavGroupActive = (children, currentURL, routerProps) => {
  return children.some(child => {
    // If child have children => It's group => Go deeper(recursive)
    if (child.children) {
      return isNavGroupActive(child.children, currentURL, routerProps)
    }
    // else it's link => Check for matched Route
    return isNavLinkActive(child.navLink, currentURL, routerProps)
  })
}

/**
 * Search for parent object
 * @param {Array} navigation Group children
 * @param {string} currentURL current URL
 */
// export const search = (navigation, currentURL, match) => {
//   let result
//   navigation.some(child => {
//     let children
//     // If child have children => It's group => Go deeper(recursive)
//     if (child.children && (children = search(child.children, currentURL, match))) {
//       return (result = {
//         id: child.id,
//         children
//       })
//     }

//     // else it's link => Check for matched Route
//     if (isNavLinkActive(child.navLink, currentURL, match)) {
//       return (result = {
//         id: child.id
//       })
//     }
//   })
//   return result
// }

export const search = (navigation, currentURL, routerProps) => {
  let result
  navigation.some(child => {
    let children
    // If child have children => It's group => Go deeper(recursive)
    if (child.children && (children = search(child.children, currentURL, routerProps))) {
      return (result = {
        id: child.id,
        children
      })
    }

    // else it's link => Check for matched Route
    if (isNavLinkActive(child.navLink, currentURL, routerProps)) {
      return (result = {
        id: child.id
      })
    }
  })
  return result
}

/**
 * Loop through nested object
 * @param {object} obj nested object
 */
export const getAllParents = (obj, match) => {
  const res = []
  const recurse = (obj, current) => {
    for (const key in obj) {
      const value = obj[key]
      if (value !== undefined) {
        if (value && typeof value === 'object') {
          recurse(value, key)
        } else {
          if (key === match) {
            res.push(value)
          }
        }
      }
    }
  }
  recurse(obj)
  return res
}

/**
 * Is this nav item visible to the signed-in admin?
 *
 * An item that declares neither `action` nor `resource` is NOT gated here. None of this
 * application's nav items declare them, and until abilities became granular that did not
 * matter: login granted { action: 'manage', subject: 'all' }, which CASL matches against
 * anything at all - including the `can(undefined, undefined)` this function used to ask.
 * The moment abilities were built from real capabilities that call started returning false
 * for every item, and the entire sidebar rendered empty for every user.
 *
 * What is offered is decided in navigation/vertical/index.js, from the capabilities GET /me
 * returned; what is permitted is decided server-side by requireCapability(). This check is a
 * third mechanism the template provides for items that opt into it, and an item that opts
 * out of it must not thereby disappear. The same reasoning guards FinalRoute in
 * src/router/Router.js, which had the identical defect.
 */
const isItemVisible = (ability, item) => {
  if (!(item.action && item.resource)) return true
  return ability.can(item.action, item.resource)
}

export const canViewMenuGroup = item => {
  const ability = useContext(AbilityContext)
  // ! This same logic is used in canViewHorizontalNavMenuGroup and canViewHorizontalNavMenuHeaderGroup. So make sure to update logic in them as well
  const hasAnyVisibleChild = item.children && item.children.some(i => isItemVisible(ability, i))

  // ** If resource and action is defined in item => Return based on children visibility (Hide group if no child is visible)
  // ** Else check for ability using provided resource and action along with checking if has any visible child
  if (!(item.action && item.resource)) {
    return hasAnyVisibleChild
  }
  return ability.can(item.action, item.resource) && hasAnyVisibleChild
}

export const canViewMenuItem = item => {
  const ability = useContext(AbilityContext)
  return isItemVisible(ability, item)
}
