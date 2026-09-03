export type Route = { name: 'bookings' } | { name: 'detail'; id: string } | { name: 'unknown' }

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '')
  if (path === '' || path === '/') return { name: 'bookings' }
  const detail = /^\/bookings\/([^/?]+)$/.exec(path)
  if (detail) return { name: 'detail', id: decodeURIComponent(detail[1]) }
  return { name: 'unknown' }
}

export function bookingHref(id: string): string {
  return `#/bookings/${encodeURIComponent(id)}`
}

/** A hash router is enough for two routes and needs no server side rewrite rules. */
export function createRouter() {
  let route = $state<Route>(parseRoute(location.hash))

  $effect(() => {
    const onHashChange = () => (route = parseRoute(location.hash))
    window.addEventListener('hashchange', onHashChange)
    onHashChange()
    return () => window.removeEventListener('hashchange', onHashChange)
  })

  return {
    get current() {
      return route
    },
  }
}
