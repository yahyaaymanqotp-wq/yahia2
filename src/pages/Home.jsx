import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Store, MapPin, Star, TrendingUp, Sparkles, ShoppingCart, Shirt, Utensils, Smartphone, Gem, Sofa, Dumbbell, ChevronLeft, ChevronRight, Package } from 'lucide-react'

export default function Home() {
  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('الكل')

  const categoryRefs = useRef({})
  const categoriesScrollRef = useRef(null)

  useEffect(() => {
    fetchCategories()
    fetchShops()

    const catsSubscription = supabase
  .channel('categories_changes')
  .on('postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => fetchCategories()
      )
  .subscribe()

    const shopsSubscription = supabase
  .channel('shops_changes')
  .on('postgres_changes',
        { event: '*', schema: 'public', table: 'shops' },
        () => fetchShops()
      )
  .subscribe()

    return () => {
      catsSubscription.unsubscribe()
      shopsSubscription.unsubscribe()
    }
  }, [])

  async function fetchCategories() {
    const { data, error } = await supabase
  .from('categories')
  .select('*')
  .order('display_order', { ascending: true })

    if (!error) setCategories(data || [])
  }

  async function fetchShops() {
    const { data, error } = await supabase
  .from('shops')
  .select(`
        *,
        category:categories(id, name, icon, slug)
      `)
  .eq('is_active', true)
  .eq('is_verified', true)
  .order('rating', { ascending: false })

    if (!error) {
      console.log('Shops loaded:', data)
      setShops(data || [])
    } else {
      console.error('Error loading shops:', error)
    }
    setLoading(false)
  }

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function getCategoryIcon(iconStr) {
    const iconMap = {
      '🍔': Utensils,
      '👕': Shirt,
      '📱': Smartphone,
      '💍': Gem,
      '🛋️': Sofa,
      '⚽': Dumbbell,
      '🏪': Store,
      'Utensils': Utensils,
      'Shirt': Shirt,
      'Smartphone': Smartphone,
      'Gem': Gem,
      'Home': Sofa,
      'Package': Package,
      'Store': Store
    }
    return iconMap[iconStr] || Store
  }

  const allCategories = [
    { id: 'all', name: 'الكل', icon: Store, slug: 'all' },
 ...categories.map(cat => ({
   ...cat,
      icon: getCategoryIcon(cat.icon)
    }))
  ]

  const getShopsByCategory = (cat) => {
    if (cat.name === 'الكل' || cat.id === 'all') return filteredShops
    return filteredShops.filter(shop => shop.category?.id === cat.id)
  }

  const scrollToCategory = (catName) => {
    setActiveCategory(catName)
    if (catName === 'الكل') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setTimeout(() => {
        categoryRefs.current[catName]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  const scrollCategories = (direction) => {
    if (categoriesScrollRef.current) {
      const scrollAmount = 200
      categoriesScrollRef.current.scrollBy({
        left: direction === 'left'? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#C9A961]/20 border-t-[#C9A961] rounded-full animate-spin"></div>
          <p className="text-[#C9A961] text-xl font-bold mt-6 animate-pulse text-center">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C9A961]/20 bg-[#1A1A1D]/60 backdrop-blur-xl mb-6">
            <Sparkles className="text-[#C9A961]" size={18} />
            <span className="text-white/80 text-sm font-medium">اكتشف أفضل المحلات في فاقوس</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-[#C9A961] mb-6 tracking-wide">
            سوق فاقوس
          </h1>

          <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            كل اللي تحتاجه في مكان واحد. تسوق من أفضل المحلات المحلية بسهولة
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#C9A961] rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن محل أو فئة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-5 rounded-2xl bg-[#1A1A1D] backdrop-blur-2xl border-2 border-[#C9A961]/20 text-white text-lg placeholder:text-white/30 focus:border-[#C9A961] focus:outline-none focus:ring-4 focus:ring-[#C9A961]/10 transition-all"
                />
                <TrendingUp className="absolute left-6 top-1/2 -translate-y-1/2 text-[#C9A961]/40" size={24} />
              </div>
            </div>
          </div>

          {/* Categories Row */}
          <div className="max-w-4xl mx-auto relative">
            <button
              onClick={() => scrollCategories('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#1A1A1D] border border-[#C9A961]/20 text-[#C9A961] flex items-center justify-center hover:bg-[#C9A961]/10 transition md:hidden"
            >
              <ChevronRight size={18} />
            </button>

            <div
              ref={categoriesScrollRef}
              className="flex items-center gap-3 overflow-x-auto pb-2 px-10 md:px-2 scrollbar-hide scroll-smooth"
            >
              {allCategories.map((cat) => {
                const Icon = cat.icon
                const isActive = activeCategory === cat.name
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.name)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                      isActive
                 ? 'bg-[#C9A961] text-black shadow-lg shadow-[#C9A961]/30'
                        : 'bg-[#1A1A1D] border border-[#C9A961]/20 text-white/70 hover:text-[#C9A961] hover:border-[#C9A961]/40'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-sm">{cat.name}</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => scrollCategories('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#1A1A1D] border border-[#C9A961]/20 text-[#C9A961] flex items-center justify-center hover:bg-[#C9A961]/10 transition md:hidden"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Shops Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {activeCategory === 'الكل'? (
          categories.filter(c => c.slug!== 'all').map((cat) => {
            const catShops = getShopsByCategory(cat)
            const Icon = getCategoryIcon(cat.icon)

            return (
              <div
                key={cat.id}
                ref={el => categoryRefs.current[cat.name] = el}
                className="mb-16 scroll-mt-24"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Icon className="text-[#C9A961]" />
                    <span>{cat.name}</span>
                    <span className="text-sm px-3 py-1 rounded-full bg-[#C9A961]/10 text-[#C9A961]">
                      {catShops.length}
                    </span>
                  </h2>
                </div>

                {catShops.length === 0? (
                  <div className="text-center py-16 bg-[#1A1A1D] rounded-2xl border border-[#C9A961]/10">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#C9A961]/10 flex items-center justify-center">
                      <Icon className="text-[#C9A961]/40" size={32} />
                    </div>
                    <p className="text-white/50 text-lg">لا يوجد محلات في قسم {cat.name} حالياً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catShops.map((shop, index) => (
                      <ShopCard key={shop.id} shop={shop} index={index} />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div
            ref={el => categoryRefs.current[activeCategory] = el}
            className="scroll-mt-24"
          >
            {(() => {
              const selectedCat = categories.find(c => c.name === activeCategory)
              const Icon = selectedCat? getCategoryIcon(selectedCat.icon) : Store
              const catShops = selectedCat? getShopsByCategory(selectedCat) : []

              return (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                      <Icon className="text-[#C9A961]" />
                      <span>{activeCategory}</span>
                      <span className="text-sm px-3 py-1 rounded-full bg-[#C9A961]/10 text-[#C9A961]">
                        {catShops.length}
                      </span>
                    </h2>
                  </div>

                  {catShops.length === 0? (
                    <div className="text-center py-20 bg-[#1A1A1D] rounded-2xl border border-[#C9A961]/10">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#C9A961]/10 flex items-center justify-center">
                        <Store className="text-[#C9A961]/40" size={40} />
                      </div>
                      <p className="text-white/60 text-xl mb-2">لا يوجد محلات في قسم {activeCategory}</p>
                      <p className="text-white/40 text-sm">جرب تبحث في قسم تاني</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {catShops.map((shop, index) => (
                        <ShopCard key={shop.id} shop={shop} index={index} />
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}
      </div>

      {/* زر السلة الثابت للموبايل */}
      <Link
        to="/Cart"
        className="fixed bottom-6 left-6 z-50 md:hidden w-16 h-16 rounded-full bg-[#C9A961] text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
      >
        <ShoppingCart size={28} />
      </Link>

      {/* CSS عادي بدل styled-jsx */}
      <style>{`
 .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
 .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

// كومبوننت كارت المحل
function ShopCard({ shop, index }) {
  return (
    <Link
      to={`/shop/${shop.id}`}
      className="group relative"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="absolute inset-0 bg-[#C9A961] rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>

      <div className="relative bg-[#1A1A1D] border border-[#C9A961]/10 rounded-3xl overflow-hidden hover:border-[#C9A961]/30 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
        <div className="relative h-48 overflow-hidden">
          <img
            src={shop.image_url || 'https://placehold.co/400x200/1A1A1D/C9A961?text=محل'}
            alt={shop.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/40 to-transparent"></div>

          {shop.category && (
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#C9A961] text-black text-xs font-bold flex items-center gap-1">
              <span>{shop.category.name}</span>
            </div>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#C9A961] transition-colors">
            {shop.name}
          </h3>

          <p className="text-white/50 text-sm mb-4 line-clamp-2">
            {shop.description || 'لا يوجد وصف متاح'}
          </p>

          <div className="flex items-center gap-4 text-white/40 text-sm">
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span>{shop.address || 'فاقوس'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={16} className="text-[#C9A961] fill-[#C9A961]" />
              <span className="text-white/60">{shop.rating || 5}</span>
            </div>
          </div>

          <div className="mt-6 overflow-hidden">
            <div className="transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="px-4 py-3 rounded-xl bg-[#C9A961] text-black font-bold text-center">
                عرض المحل ←
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}