import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { supabase } from './lib/supabase'
import { LogOut, LogIn, Store, Shield, Home as HomeIcon, Menu, X, ShoppingCart, Search, Bell, Heart, User, Tag, LayoutGrid, MapPin, Settings, Crown, Info, MessageCircle, Package, Phone } from 'lucide-react'
import DeliveryDashboard from "./pages/DeliveryDashboard"
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ShopDashboard from './pages/ShopDashboard.jsx'
import ShopPage from './pages/ShopPage.jsx'
import Complaints from './pages/Complaints.jsx'
import About from './pages/About.jsx'
import TrackOrder from './pages/TrackOrder.jsx'

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return
      setSession(session)
      if (session?.user) {
        getProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mountedRef.current) return
        setSession(session)
        if (session?.user) {
          await getProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  // التوجيه التلقائي حسب الرول
  useEffect(() => {
    if (loading ||!profile) return

    const currentPath = location.pathname
    console.log('Current profile:', profile)

    if (profile.role === 'admin' && (currentPath === '/' || currentPath === '/login')) {
      navigate('/admin', { replace: true })
      return
    }

    if (profile.role === 'shop_owner' && profile.shop_id && (currentPath === '/' || currentPath === '/login')) {
      navigate('/shop-dashboard', { replace: true })
      return
    }
  }, [profile, loading, location.pathname, navigate])

  async function getProfile(userId) {
    const { data, error } = await supabase
.from('profiles')
.select('*, shops(id, name)')
.eq('id', userId)
.single()

    if (error) {
      console.log('Profile error:', error)
      setLoading(false)
      return
    }
    console.log('Profile loaded:', data)
    if (mountedRef.current) {
      setProfile(data)
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setProfile(null)
    setMobileMenuOpen(false)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin"></div>
          <p className="text-white text-xl font-bold mt-6 animate-pulse text-center">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white relative overflow-hidden" dir="rtl">
      <div className="relative min-h-screen pb-20">

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
            <Route path="/login" element={!session? <Login /> : <Navigate to="/" replace />} />
            <Route path="/shop/:id" element={<ShopPage />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/about" element={<About />} />
            <Route path="/track-order" element={<TrackOrder />} />
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
                profile?.role === 'shop_owner' && profile?.shop_id
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

        <BottomNav profile={profile} />

      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

function Navbar({ session, profile, handleLogout, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <nav className="sticky top-0 z-50 bg-[#121212] border-b border-[#333]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          <button className="text-[#D4AF37]">
            <Bell size={24} />
          </button>

          <Link to="/" className="text-center">
            <div className="flex items-center gap-2">
              <div className="text-[#D4AF37] text-2xl font-bold">▼</div>
              <div>
                <h1 className="text-xl font-bold text-[#D4AF37]">مول فاقوس</h1>
                <p className="text-xs text-gray-400">تجربة تسوق متكاملة</p>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className="hidden md:flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/30 transition"
              >
                <Shield size={16} />
                <span>الأدمن</span>
              </Link>
            )}

            {profile?.role === 'shop_owner' && profile?.shop_id && (
              <Link
                to="/shop-dashboard"
                className="hidden md:flex items-center gap-1 px-3 py-2 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold hover:bg-[#D4AF37]/30 transition"
              >
                <Settings size={16} />
                <span>لوحة المحل</span>
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#D4AF37]"
            >
              {mobileMenuOpen? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <div className="pb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث عن منتجات، محلات أو عروض..."
              className="w-full bg-[#1E1E1E] border border-[#333] rounded-xl py-3 px-4 pr-12 text-sm focus:outline-none focus:border-[#D4AF37] placeholder:text-gray-500"
            />
            <Search className="absolute right-4 top-3.5 text-gray-500" size={20} />
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="py-4 space-y-2 border-t border-[#333] animate-in slide-in-from-top duration-300">
            {session && (
              <div className="px-4 py-3 bg-[#1E1E1E] rounded-xl mb-2">
                <p className="text-[#D4AF37] text-sm font-bold flex items-center gap-2">
                  <User size={16} />
                  {profile?.username || profile?.full_name || 'مستخدم'}
                </p>
                {profile?.role === 'shop_owner' && profile?.shops && (
                  <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                    <Store size={12} />
                    {profile.shops.name}
                  </p>
                )}
                {profile?.role === 'admin' && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <Crown size={12} />
                    أدمن النظام
                  </p>
                )}
              </div>
            )}

            <MobileMenuLink to="/" setMobileMenuOpen={setMobileMenuOpen}>
              <HomeIcon size={18} />
              <span>الرئيسية</span>
            </MobileMenuLink>

            <MobileMenuLink to="/Cart" setMobileMenuOpen={setMobileMenuOpen}>
              <ShoppingCart size={18} />
              <span>السلة</span>
            </MobileMenuLink>

            {profile?.role === 'admin' && (
              <MobileMenuLink to="/admin" setMobileMenuOpen={setMobileMenuOpen}>
                <Shield size={18} />
                <span>لوحة الأدمن</span>
              </MobileMenuLink>
            )}

            {profile?.role === 'shop_owner' && profile?.shop_id && (
              <MobileMenuLink to="/shop-dashboard" setMobileMenuOpen={setMobileMenuOpen}>
                <Settings size={18} />
                <span>لوحة المحل</span>
              </MobileMenuLink>
            )}

            {session? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-red-600 text-white font-bold"
              >
                <LogOut size={18} />
                <span>تسجيل الخروج</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-[#D4AF37] text-black font-bold"
              >
                <LogIn size={18} />
                <span>تسجيل الدخول</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

function MobileMenuLink({ to, children, setMobileMenuOpen }) {
  return (
    <Link
      to={to}
      onClick={() => setMobileMenuOpen(false)}
      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1E1E1E] text-white hover:bg-[#2a2a2a] transition"
    >
      {children}
    </Link>
  )
}

function BottomNav({ profile }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isActive = (path) => location.pathname === path

  const NavItem = ({ to, icon: Icon, label }) => (
    <button
      onClick={() => navigate(to)}
      className={`flex flex-col items-center gap-1 ${
        isActive(to)? 'text-[#D4AF37]' : 'text-gray-500'
      }`}
    >
      {label === 'الرئيسية'? (
        <div className="bg-[#D4AF37] rounded-full p-3 -mt-6">
          <Icon size={24} className="text-black" />
        </div>
      ) : (
        <Icon size={22} />
      )}
      <span className="text-xs">{label}</span>
    </button>
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-[#333] flex justify-around items-center py-2 z-50">
      <NavItem to="/about" icon={Info} label="نبذة عنا" />
      <NavItem to="/Cart" icon={ShoppingCart} label="سلة التسوق" />
      <NavItem to="/" icon={HomeIcon} label="الرئيسية" />
      <NavItem to="/complaints" icon={MessageCircle} label="الشكاوى" />
      <NavItem to="/track-order" icon={Package} label="تتبع الطلب" />
    </div>
  )
}

export default App