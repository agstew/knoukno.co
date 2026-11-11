'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { clearSession, getSession } from '../lib/auth-client'
import { businessNavigation, businessViewHref, publicNavigation } from '../lib/navigation'

export default function SiteNav({ loginHref = '/login', registerHref = '/register', onBusinessView, beforeLeave }) {
  const router = useRouter()
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const refresh = () => setSignedIn(Boolean(getSession()?.token))
    refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const allowLeave = () => !beforeLeave || beforeLeave()

  function logout() {
    if (!allowLeave()) return
    clearSession()
    setSignedIn(false)
    router.replace('/login')
  }

  return <nav className="main-nav site-navigation" aria-label={signedIn ? 'Business navigation' : 'Main navigation'}>
    {signedIn ? <>
      {businessNavigation.map((item) => onBusinessView
        ? <button type="button" className="site-nav-link" key={item.view} onClick={() => onBusinessView(item.view)}>{item.label}</button>
        : <Link key={item.view} href={businessViewHref(item.view)} onClick={(event) => { if (!allowLeave()) event.preventDefault() }}>{item.label}</Link>)}
      <button type="button" className="nav-logout" onClick={logout}>Logout</button>
    </> : publicNavigation.map((item) => <Link key={item.label} href={item.label === 'Login' ? loginHref : item.label === 'Register' ? registerHref : item.href}>{item.label}</Link>)}
  </nav>
}
