import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { LogOut, LogIn, Store, Shield, Home as HomeIcon, Menu, X, ShoppingCart, Search, Bell, User, Crown, Info, MessageCircle, Package, Settings, Truck } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const userRole = localStorage.getItem("user_role")
  const adminName = localStorage.getItem("admin_name")
  const shopName = localStorage.getItem("shop_name")
  const companyName = localStorage.getItem("company_name")
  const session = localStorage.getItem("user_role") ? true : false

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const { data, error } = await supabase
   .from('categories')
   .select('*')
   .order('display_order')

    if (!error) {
      console.log('Categories from Supabase:', data)
      setCategories(data || [])
    }
  }

  function handleLogout() {
    localStorage.clear()
    setMobileMenuOpen(false)
    navigate("/login")
    window.location.reload()
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
          userRole={userRole}
          adminName={adminName}
          shopName={shopName}
          companyName={companyName}
          handleLogout={handleLogout}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          categories={categories}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <main className="relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!session? <Login /> : <Navigate to="/" replace />} />
            <Route path="/shop/:id" element={<ShopPage />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/about" element={<About />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />

            <Route
              path="/admin"
              element={
                userRole === "admin"
               ? <AdminDashboard />
                  : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/shop-dashboard"
              element={
                userRole === "shop"
               ? <ShopDashboard />
                  : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/delivery-dashboard"
              element={
                userRole === "delivery"
               ? <DeliveryDashboard />
                  : <Navigate to="/login" replace />
              }
            />

            <Route path="*" element={<div className="p-8 text-center text-2xl text-white">404 - الصفحة غير موجودة</div>} />
          </Routes>
        </main>

        <BottomNav userRole={userRole} />

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

function Navbar({ session, userRole, adminName, shopName, companyName, handleLogout, mobileMenuOpen, setMobileMenuOpen, categories, searchTerm, setSearchTerm }) {
  const navigate = useNavigate()

  function handleSearch(e) {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

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
                <h1 className="text-xl font-bold text-[#D4AF37]">سوق فاقوس</h1>
                <p className="text-xs text-gray-400">تجربة تسوق متكاملة</p>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {userRole === 'admin' && (
              <Link
                to="/admin"
                className="hidden md:flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/30 transition"
              >
                <Shield size={16} />
                <span>الأدمن</span>
              </Link>
            )}

            {userRole === 'shop' && (
              <Link
                to="/shop-dashboard"
                className="hidden md:flex items-center gap-1 px-3 py-2 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold hover:bg-[#D4AF37]/30 transition"
              >
                <Settings size={16} />
                <span>لوحة المحل</span>
              </Link>
            )}

            {userRole === 'delivery' && (
              <Link
                to="/delivery-dashboard"
                className="hidden md:flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-bold hover:bg-blue-500/30 transition"
              >
                <Truck size={16} />
                <span>لوحة التوصيل</span>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full bg-[#1E1E1E] border border-[#333] rounded-xl py-3 px-4 pr-12 text-sm focus:outline-none focus:border-[#D4AF37] placeholder:text-gray-500"
            />
            <Search className="absolute right-4 top-3.5 text-gray-500" size={20} />
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
              {categories.slice(0, 6).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/?category=${cat.slug}`)}
                  className="px-3 py-1.5 bg-[#1E1E1E] border border-[#333] rounded-lg text-xs text-gray-400 hover:border-[#D4AF37] hover:text-[#D4AF37] transition whitespace-nowrap"
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {mobileMenuOpen && (
          <div className="py-4 space-y-2 border-t border-[#333] animate-in slide-in-from-top duration-300">
            {session && (
              <div className="px-4 py-3 bg-[#1E1E1E] rounded-xl mb-2">
                <p className="text-[#D4AF37] text-sm font-bold flex items-center gap-2">
                  <User size={16} />
                  {adminName || shopName || companyName || 'مستخدم'}
                </p>
                {userRole === 'shop' && shopName && (
                  <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                    <Store size={12} />
                    {shopName}
                  </p>
                )}
                {userRole === 'delivery' && companyName && (
                  <p className="text-blue-400 text-xs mt-1 flex items-center gap-1">
                    <Truck size={12} />
                    {companyName}
                  </p>
                )}
                {userRole === 'admin' && (
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

            <MobileMenuLink to="/cart" setMobileMenuOpen={setMobileMenuOpen}>
              <ShoppingCart size={18} />
              <span>السلة</span>
            </MobileMenuLink>

            {userRole === 'admin' && (
              <MobileMenuLink to="/admin" setMobileMenuOpen={setMobileMenuOpen}>
                <Shield size={18} />
                <span>لوحة الأدمن</span>
              </MobileMenuLink>
            )}

            {userRole === 'shop' && (
              <MobileMenuLink to="/shop-dashboard" setMobileMenuOpen={setMobileMenuOpen}>
                <Settings size={18} />
                <span>لوحة المحل</span>
              </MobileMenuLink>
            )}

            {userRole === 'delivery' && (
              <MobileMenuLink to="/delivery-dashboard" setMobileMenuOpen={setMobileMenuOpen}>
                <Truck size={18} />
                <span>لوحة التوصيل</span>
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

function BottomNav({ userRole }) {
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
      <NavItem to="/cart" icon={ShoppingCart} label="سلة التسوق" />
      <NavItem to="/" icon={HomeIcon} label="الرئيسية" />
      <NavItem to="/complaints" icon={MessageCircle} label="الشكاوى" />
      <NavItem to="/track-order" icon={Package} label="تتبع الطلب" />
    </div>
  )
}

export default App