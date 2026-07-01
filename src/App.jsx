import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { LogOut, LogIn, Store, Shield, Home as HomeIcon, Menu, X, ShoppingCart, Search, Bell, Heart, User, Tag, LayoutGrid, MapPin } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin"></div>
          <p className="text-white text-xl font-bold mt-6 animate-pulse text-center">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
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

          <BottomNav />

        </div>
      </div>
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
                <p className="text-[10px] text-gray-400">تجربة تسوق متكاملة</p>
              </div>
            </div>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#D4AF37]"
          >
            {mobileMenuOpen? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Search Bar */}
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
            <MobileMenuLink to="/" setMobileMenuOpen={setMobileMenuOpen}>الرئيسية</MobileMenuLink>
            <MobileMenuLink to="/Cart" setMobileMenuOpen={setMobileMenuOpen}>السلة</MobileMenuLink>
            {profile?.role === 'admin' && (
              <MobileMenuLink to="/admin" setMobileMenuOpen={setMobileMenuOpen}>لوحة الأدمن</MobileMenuLink>
            )}
            {profile?.role === 'shop_owner' && (
              <MobileMenuLink to="/shop-dashboard" setMobileMenuOpen={setMobileMenuOpen}>لوحة المحل</MobileMenuLink>
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
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-green-600 text-white font-bold"
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
      className="block px-4 py-3 rounded-xl bg-[#1E1E1E] text-white hover:bg-[#2a2a2a] transition"
    >
      {children}
    </Link>
  )
}

function BottomNav() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
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
      <span className="text-[10px]">{label}</span>
    </Link>
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-[#333] flex justify-around items-center py-2 z-50">
      <NavItem to="/profile" icon={User} label="حسابي" />
      <NavItem to="/Cart" icon={Heart} label="المفضلة" />
      <NavItem to="/" icon={HomeIcon} label="الرئيسية" />
      <NavItem to="/offers" icon={Tag} label="العروض" />
      <NavItem to="/categories" icon={LayoutGrid} label="الأقسام" />
    </div>
  )
}

export default App