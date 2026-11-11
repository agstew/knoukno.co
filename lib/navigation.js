export const publicNavigation = [
  { label: 'Home', href: '/' },
  { label: 'Login', href: '/login' },
  { label: 'Register', href: '/register' },
  { label: 'Price', href: '/#price' },
]

export const businessNavigation = [
  { label: 'Title', view: 'titles' },
  { label: 'Dashboard', view: 'dashboard' },
  { label: 'Grade', view: 'grade' },
  { label: 'Rated', view: 'rated' },
  { label: 'Average', view: 'average' },
]

export function businessViewFromSearch(search) {
  const view = new URLSearchParams(search).get('view')
  return businessNavigation.some((item) => item.view === view) ? view : 'titles'
}

export function businessViewHref(view) {
  if (!businessNavigation.some((item) => item.view === view)) throw new Error('Invalid business view.')
  return view === 'titles' ? '/business' : `/business?view=${view}`
}
