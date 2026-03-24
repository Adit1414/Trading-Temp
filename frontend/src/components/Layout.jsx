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
      {/* Sidebar spacer for desktop */}
      <div className="hidden md:block w-20 shrink-0"></div>

      {/* Sidebar */}
      <aside className="group fixed top-0 left-0 h-screen w-20 hover:w-64 transition-all duration-300 border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] flex flex-col shrink-0 z-50 overflow-hidden shadow-2xl md:shadow-none hover:shadow-black/50 overflow-y-auto">
        {/* Brand */}
        <div className="p-5 border-b border-[var(--color-border)]/50 flex items-center justify-start h-[76px] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0 mx-auto">
              <span className="text-white font-bold text-xl leading-none">N</span>
            </div>
            <h1 className="text-[18px] font-bold text-white tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Numatix
            </h1>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-x-hidden">
          {NAV_MENU.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex items-center gap-4 px-3.5 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-primary)]/5 text-white'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-overlay)] hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={22}
                    className={`shrink-0 ${
                      isActive ? 'text-[var(--color-primary-light)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-muted)]'
                    }`}
                  />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                    {item.name}
                  </span>
                  {isActive && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)] shadow-[0_0_8px_rgba(167,139,250,0.8)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-[var(--color-border)]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-[var(--color-border)] rounded-full bg-[var(--color-surface-overlay)] flex items-center justify-center overflow-hidden shrink-0 ml-[4px]">
              <span className="text-sm font-bold text-white leading-none">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pl-1">
              <p className="text-sm font-semibold text-white truncate">{user?.email || 'Guest User'}</p>
              <p className="text-xs text-[var(--color-primary-light)] truncate font-medium">Pro Plan</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-2 mr-1 rounded-lg text-[var(--color-text-muted)] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors opacity-0 group-hover:opacity-100 duration-300 shrink-0"
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
