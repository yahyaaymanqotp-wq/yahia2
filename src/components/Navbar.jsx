import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShoppingCart, Store, LogOut, User } from 'lucide-react'
  const navigate = useNavigate()
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }
  return (
    <nav className="bg-emerald-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
            <Store size={28} />
            سوق فاقوس
          </Link>
          
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <span className="text-sm">مرحبا، {profile?.full_name}</span>
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="bg-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-800">
                    لوحة الأدمن
                  </Link>
                )}
                {profile?.role === 'shop_owner' && (
                  <Link to="/shop-dashboard" className="bg-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-800">
                    لوحة المحل
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-1 bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600">
                  <LogOut size={18} /> خروج
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="bg-white text-emerald-600 px-4 py-2 rounded-lg hover:bg-gray-100">
                  دخول
                </Link>
                <Link to="/signup" className="bg-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-800">
                  حساب جديد
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
