import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { LayoutDashboard, TrendingUp, Bot, Sparkles, Settings, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

const NAV_MENU = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Backtest', path: '/backtests', icon: TrendingUp },
  { name: 'Trading Bots', path: '/bots', icon: Bot },
  { name: 'Strategies', path: '/strategies', icon: Sparkles },
  { name: 'Settings', path: '/settings', icon: Settings },
]
export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out.')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-surface)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-[var(--color-border)]/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-white tracking-wide">Numatix</h1>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_MENU.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-primary)]/5 text-white'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-overlay)]/40 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={isActive ? 'text-[var(--color-primary-light)]' : 'text-[var(--color-text-muted)]'} />
                  {item.name}
                  {isActive && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)] shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-[var(--color-border)]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-[var(--color-border)] rounded-full bg-[var(--color-surface-overlay)] flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-xs font-semibold text-white">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.email || 'Alex Trader'}</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">Pro Plan</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-[var(--color-text-muted)] hover:text-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
