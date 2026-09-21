import { useEffect, useState } from 'react'

/**
 * Hash routing, on purpose. AppleCider ships as a static bundle that people
 * drop on GitHub Pages, S3 or a USB stick — none of which can be asked to
 * rewrite unknown paths to index.html. Hashes just work everywhere.
 */

export type Route =
  | { name: 'landing' }
  | { name: 'files'; folderId: string | null; view: 'all' | 'recent' | 'starred' | 'trash' }
  | { name: 'editor'; docId: string }
  | { name: 'audit' }

export function parse(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '')
  const [path] = raw.split('?')
  const parts = path.split('/').filter(Boolean)

  if (parts[0] === 'files') {
    const second = parts[1]
    if (second === 'recent' || second === 'starred' || second === 'trash') {
      return { name: 'files', folderId: null, view: second }
    }
    return { name: 'files', folderId: second ?? null, view: 'all' }
  }
  if (parts[0] === 'd' && parts[1]) return { name: 'editor', docId: parts[1] }
  if (parts[0] === 'audit' && import.meta.env.DEV) return { name: 'audit' }
  return { name: 'landing' }
}

export const href = {
  landing: () => '#/',
  files: (folderId?: string | null) => (folderId ? `#/files/${folderId}` : '#/files'),
  view: (v: 'recent' | 'starred' | 'trash') => `#/files/${v}`,
  editor: (docId: string) => `#/d/${docId}`,
}

export function navigate(to: string) {
  if (location.hash === to) return
  location.hash = to
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(location.hash))
  useEffect(() => {
    const onHash = () => setRoute(parse(location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}

/** Scroll to the top whenever the route changes — expected on a landing page. */
export function useScrollReset(key: string) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [key])
}
