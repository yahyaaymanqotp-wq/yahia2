import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShoppingCart, Menu, X, Store } from 'lucide-react'

function Navbar() {
  const [categories, setCategories] = useState([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    loadCategories()
    loadCartCount()
    
    // تحديث عدد السلة كل ما تتغير
    window.addEventListener('cartUpdated', loadCartCount)
    return () => window.removeEventListener('cartUpdated', loadCartCount)
  }, [])

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('display_order')
    
    if (data) setCategories(data)
  }

  function loadCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const count = cart.reduce((sum, item) => sum + item.quantity, 0)
    setCartCount(count)
  }

  return (
    <nav className="bg-[#1E1E1E] border-b border-[#333] sticky top-0 z-40" dir="rtl">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* الصف الأول - اللوجو والسلة */}
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Store className="text-[#D4AF37]" size={28} />
            <span className="text-2xl font-bold text-[#D4AF37]">حلوان ماركت</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              to="/cart" 
              className="relative bg-[#121212] p-3 rounded-lg hover:bg-[#2a2a2a] transition"
            >
              <ShoppingCart className="text-[#D4AF37]" size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden bg-[#121212] p-3 rounded-lg"
            >
              {isMenuOpen ? <X className="text-white" size={24} /> : <Menu className="text-white" size={24} />}
            </button>
          </div>
        </div>

        {/* الصف الثاني - الأقسام ديسكتوب */}
        <div className="hidden md:flex items-center gap-2 pb-3 overflow-x-auto">
          <Link
            to="/"
            className="px-4 py-2 rounded-lg text-white hover:bg-[#2a2a2a] transition whitespace-nowrap font-bold"
          >
            الرئيسية
          </Link>
          {categories.map(category => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-[#D4AF37] hover:bg-[#2a2a2a] transition whitespace-nowrap"
            >
              {category.name}
            </Link>
          ))}
        </div>

        {/* منيو الموبايل */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-[#333] pt-4">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-white hover:bg-[#2a2a2a] transition font-bold mb-2"
            >
              الرئيسية
            </Link>
            {categories.map(category => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-gray-400 hover:text-[#D4AF37] hover:bg-[#2a2a2a] transition mb-1"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}

      </div>
    </nav>
  )
}

export default Navbar