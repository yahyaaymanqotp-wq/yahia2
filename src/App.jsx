import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { LogOut, LogIn, Store, Shield, Home as HomeIcon, Menu, X, ShoppingCart } from 'lucide-react'
import DeliveryDashboard from "./pages/DeliveryDashboard";
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ShopDashboard from './pages/ShopDashboard.jsx'
import ShopPage from './pages/ShopPage.jsx'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    getCurrentSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          await getProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function getCurrentSession() {
    const {
      data: { session }
    } = await supabase.auth.getSession()

    setSession(session)
    if (session?.user) {
      await getProfile(session.user.id)
    }
    setLoading(false)
  }

  async function getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.log(error)
      return
    }
    setProfile(data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setProfile(null)
    setMobileMenuOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-pink-500/20 border-b-pink-500 rounded-full animate-spin animation-delay-150"></div>
          <p className="text-white text-xl font-bold mt-6 animate-pulse text-center">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden" dir="rtl">
        
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-40 left-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        </div>

        <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyek0zNiAxNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 pointer-events-none"></div>

        <div className="relative min-h-screen">
          
          <Navbar 
            session={session} 
            profile={profile} 
            handleLogout={handleLogout}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />

          <main className="relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
              <Route path="/shop/:id" element={<ShopPage />} />
              <Route
                path="/admin"
                element={
                  profile?.role === 'admin'
                    ? <AdminDashboard profile={profile} />
                    : <Navigate to="/" replace />
                }
              />
              <Route
                path="/shop-dashboard"
                element={
                  profile?.role === 'shop_owner'
                    ? <ShopDashboard profile={profile} />
                    : <Navigate to="/" replace />
                }
              />
              <Route path="/Cart" element={<Cart />} />
              <Route path="/Checkout" element={<Checkout />} />
              <Route path="/delivery" element={<DeliveryDashboard />} />
              <Route path="*" element={<div className="p-8 text-center text-2xl text-white">404 - الصفحة غير موجودة</div>} />
            </Routes>
          </main>

          <footer className="relative mt-20 border-t border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="text-center">
                <p className="text-white/60 text-sm">
                  © 2026 سوق فاقوس - كل الحقوق محفوظة
                </p>
                <p className="text-white/40 text-xs mt-2">
                  صُنع بـ ❤️ في فاقوس
                </p>
              </div>
            </div>
          </footer>

        </div>
      </div>
    </BrowserRouter>
  )
}

function Navbar({ session, profile, handleLogout, mobileMenuOpen, setMobileMenuOpen }) {
  const location = useLocation()
  
  const isActive = (path) => location.pathname === path
  
  const NavLink = ({ to, children, icon: Icon }) => (
    <Link
      to={to}
      onClick={() => setMobileMenuOpen(false)}
      className={`group relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
        isActive(to)
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
          : 'text-white/80 hover:text-white hover:bg-white/10'
      }`}
    >
      {Icon && <Icon size={18} />}
      <span>{children}</span>
      {!isActive(to) && (
        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-20 transition-opacity"></span>
      )}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-2xl shadow-2xl shadow-purple-500/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">

          <Link to="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <Store className="text-white" size={24} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-300% animate-gradient">
                سوق فاقوس
              </h1>
              <p className="text-xs text-white/50 font-medium">متجرك الأول</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" icon={HomeIcon}>الرئيسية</NavLink>
            <NavLink to="/Cart" icon={ShoppingCart}>
              السلة
            </NavLink>

            {profile?.role === 'admin' && (
              <NavLink to="/admin" icon={Shield}>لوحة الأدمن</NavLink>
            )}

            {profile?.role === 'shop_owner' && (
              <NavLink to="/shop-dashboard" icon={Store}>لوحة المحل</NavLink>
            )}

            {session && (
              <div className="flex items-center gap-3 mr-4 pr-4 border-r border-white/10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-50"></div>
                  <div className="relative px-4 py-2 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
                    <p className="text-white text-sm font-bold">{profile?.full_name || 'مستخدم'}</p>
                    <p className="text-white/60 text-xs">{profile?.email}</p>
                  </div>
                </div>
              </div>
            )}

            {!session ? (
              <Link
                to="/login"
                className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg shadow-green-500/50 hover:shadow-green-500/80 hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <LogIn size={18} />
                <span>تسجيل الدخول</span>
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold shadow-lg shadow-red-500/50 hover:shadow-red-500/80 hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <LogOut size={18} />
                <span>تسجيل الخروج</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-white/10 animate-in slide-in-from-top duration-300">
            <NavLink to="/" icon={HomeIcon}>الرئيسية</NavLink>
            <NavLink to="/Cart" icon={ShoppingCart}>
              السلة
            </NavLink>
            {profile?.role === 'admin' && (
              <NavLink to="/admin" icon={Shield}>لوحة الأدمن</NavLink>
            )}

            {profile?.role === 'shop_owner' && (
              <NavLink to="/shop-dashboard" icon={Store}>لوحة المحل</NavLink>
            )}

            {session && (
              <div className="px-4 py-3 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
                <p className="text-white text-sm font-bold">{profile?.full_name || 'مستخدم'}</p>
                <p className="text-white/60 text-xs mt-1">{profile?.email}</p>
              </div>
            )}

            {!session ? (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold"
              >
                <LogIn size={18} />
                <span>تسجيل الدخول</span>
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold"
              >
                <LogOut size={18} />
                <span>تسجيل الخروج</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default App