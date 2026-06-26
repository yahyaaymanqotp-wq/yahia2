import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

import Home from './pages/Home'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ShopDashboard from './pages/ShopDashboard'
import ShopPage from './pages/ShopPage'
function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-2xl">
        جاري التحميل...
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 relative overflow-hidden">

        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-20 w-96 h-96 bg-pink-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative min-h-screen backdrop-blur-xl bg-black/10">

          {/* Navbar */}
          <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between h-16">

                <Link
                  to="/"
                  className="text-2xl font-bold text-white"
                >
                  سوق فاقوس
                </Link>

                <div className="flex items-center gap-3">

                  <Link
                    to="/"
                    className="text-white hover:text-yellow-300 transition"
                  >
                    الرئيسية
                  </Link>

                  {profile?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition"
                    >
                      لوحة الأدمن
                    </Link>
                  )}

                  {profile?.role === 'shop_owner' && (
                    <Link
                      to="/shop-dashboard"
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      لوحة المحل
                    </Link>
                  )}

                  {session && (
                    <span className="text-white text-sm bg-white/10 px-3 py-2 rounded-xl">
                      {profile?.full_name || profile?.email}
                    </span>
                  )}

                  {!session ? (
                    <Link
                      to="/login"
                      className="px-5 py-2 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition"
                    >
                      تسجيل الدخول
                    </Link>
                  ) : (
                    <button
                      onClick={handleLogout}
                      className="px-5 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition"
                    >
                      تسجيل الخروج
                    </button>
                  )}

                </div>

              </div>
            </div>
          </nav>

          <main>

            <Routes>

              <Route
                path="/"
                element={<Home />}
              />

              <Route
                path="/login"
                element={<Login />}
              />

              <Route
                path="/shop/:id"
                element={<ShopPage />}
              />

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

            </Routes>

          </main>

        </div>
      </div>
    </BrowserRouter>
  )
}

export default App