import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShoppingCart, Menu, X, Store, Search } from 'lucide-react'

function Navbar() {
  const [categories, setCategories] = useState([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadCategories()
    loadCartCount()

    // تحديث عدد السلة كل ما تتغير
    window.addEventListener('cartUpdated', loadCartCount)
    window.addEventListener('storage', loadCartCount)

    return () => {
      window.removeEventListener('cartUpdated', loadCartCount)
      window.removeEventListener('storage', loadCartCount)
    }
  }, [])

  async function loadCategories() {
    const { data, error } = await supabase
     .from('categories')
     .select('*')
     .order('display_order')

    if (!error && data) {
      console.log('Navbar Categories:', data)
      setCategories(data)
    } else {
      console.error('Error loading categories:', error)
    }
  }

  function loadCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const count = cart.reduce((sum, item) => sum + item.quantity, 0)
    setCartCount(count)
  }

  function handleSearch(e) {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`)
      setSearchTerm('')
      setIsMenuOpen(false)
    }
  }

  return (
    <nav className="bg-[#1E1E1E] border-b border-[#333] sticky top-0 z-40" dir="rtl">
      <div className="max-w-7xl mx-auto px-4">

        {/* الصف الأول - اللوجو والبحث والسلة */}
        <div className="flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <Store className="text-[#D4AF37]" size={28} />
            <span className="text-xl md:text-2xl font-bold text-[#D4AF37]">حلوان ماركت</span>
          </Link>

          {/* البحث - ديسكتوب */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full bg-[#121212] border border-[#333] rounded-xl py-2 px-4 pr-10 text-sm text-white focus:outline-none focus:border-[#D4AF37] placeholder:text-gray-500"
            />
            <Search className="absolute right-3 top-2.5 text-gray-500" size={18} />
          </div>

          <div className="flex items-center gap-2">
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
              {isMenuOpen? <X className="text-white" size={24} /> : <Menu className="text-white" size={24} />}
            </button>
          </div>
        </div>

        {/* البحث - موبايل */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full bg-[#121212] border border-[#333] rounded-xl py-2 px-4 pr-10 text-sm text-white focus:outline-none focus:border-[#D4AF37] placeholder:text-gray-500"
            />
            <Search className="absolute right-3 top-2.5 text-gray-500" size={18} />
          </div>
        </div>

        {/* الصف الثاني - الأقسام ديسكتوب */}
        <div className="hidden md:flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
          <Link
            to="/"
            className="px-4 py-2 rounded-lg text-white hover:bg-[#2a2a2a] transition whitespace-nowrap font-bold"
          >
            الرئيسية
          </Link>
          {categories.map(category => (
            <Link
              key={category.id}
              to={`/?category=${category.slug}`}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-[#D4AF37] hover:bg-[#2a2a2a] transition whitespace-nowrap flex items-center gap-2"
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
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
            <div className="border-t border-[#333] my-2"></div>
            {categories.length === 0? (
              <div className="px-4 py-3 text-gray-500 text-sm">جاري تحميل الأقسام...</div>
            ) : (
              categories.map(category => (
                <Link
                  key={category.id}
                  to={`/?category=${category.slug}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg text-gray-400 hover:text-[#D4AF37] hover:bg-[#2a2a2a] transition mb-1 flex items-center gap-2"
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </Link>
              ))
            )}
          </div>
        )}

      </div>
    </nav>
  )
}

export default Navbar