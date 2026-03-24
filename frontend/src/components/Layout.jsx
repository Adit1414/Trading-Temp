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
    <div className="min-h-screen flex bg-[#020617]">

      {/* Sidebar */}
      <aside className="w-[240px] bg-[#0B1220] border-r border-white/5 flex flex-col">

        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center">
              <span className="text-white font-bold">N</span>
            </div>
            <h1 className="text-white font-semibold text-lg">Numatix</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {NAV_MENU.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-purple-500/15 text-purple-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={20} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white truncate">
              {user?.email || 'User'}
            </span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

    </div>
  )
}