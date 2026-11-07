import { navItems } from '../data/siteData'

export function Title() {
  return (
    <header className="site-header">
      <div className="brand-wrap">
        <a href="#home" className="brand-mark">
          knoukno<span>.co</span>
        </a>
      </div>

      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <a key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>

      <a href="#login" className="nav-cta">
        Login
      </a>
    </header>
  )
}
