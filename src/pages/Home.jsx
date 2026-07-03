import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Store, MapPin, Search, Shirt, Utensils, Smartphone, Gem, Sofa, Dumbbell, Package } from 'lucide-react'

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('الكل')

  useEffect(() => {
    fetchCategories()
    fetchShops()

    const shopsSubscription = supabase
    .channel('shops_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, fetchShops)
    .subscribe()

    return () => shopsSubscription.unsubscribe()
  }, [])

  useEffect(() => {
    const categorySlug = searchParams.get('category')
    if (categorySlug && categories.length > 0) {
      const cat = categories.find(c => c.slug === categorySlug)
      if (cat) setActiveCategory(cat.name)
    }
  }, [searchParams, categories])

  async function fetchCategories() {
    const { data } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })
    if (data) setCategories(data)
  }

  async function fetchShops() {
    try {
      const { data, error } = await supabase
      .from('shops')
      .select(`*, categories(id, name, icon, slug)`)
      .eq('is_active', true)
      .order('rating', { ascending: false })

      if (error) throw error
      setShops(data || [])
    } catch (err) {
      console.error('Error loading shops:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredShops = shops.filter(shop => {
    const matchesSearch =!searchTerm ||
      shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = activeCategory === 'الكل' ||
      shop.categories?.name === activeCategory

    return matchesSearch && matchesCategory
  })

  function getCategoryIcon(iconStr) {
    const iconMap = {
      '🍔': Utensils, '👕': Shirt, '📱': Smartphone, '💍': Gem, '🛋️': Sofa, '⚽': Dumbbell,
      'Utensils': Utensils, 'Shirt': Shirt, 'Smartphone': Smartphone, 'Gem': Gem, 'Home': Sofa, 'Package': Package
    }
    return iconMap[iconStr] || Store
  }

  const allCategories = [
    { id: 'all', name: 'الكل', icon: Store },
  ...categories.map(cat => ({...cat, icon: getCategoryIcon(cat.icon)}))
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-[#D4AF37] text-xl">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-20" dir="rtl">
      {/* Hero */}
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black text-[#D4AF37] mb-6">
            سوق فاقوس
          </h1>
          <p className="text-xl text-white/60 mb-12">
            اكتشف أفضل المحلات في فاقوس
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ابحث عن محل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-[#333] rounded-2xl py-4 pr-12 pl-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 justify-center flex-wrap">
            {allCategories.map((cat) => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.name
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                    isActive
                  ? 'bg-[#D4AF37] text-black'
                      : 'bg-[#1E1E1E] border border-[#333] text-white/70 hover:border-[#D4AF37]/40'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm">{cat.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Shops Grid */}
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">
          المحلات
          <span className="text-sm px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] mr-3">
            {filteredShops.length}
          </span>
        </h2>

        {filteredShops.length === 0? (
          <div className="text-center py-20 bg-[#1E1E1E] rounded-2xl border border-[#333]">
            <Store className="text-[#D4AF37]/40 mx-auto mb-4" size={60} />
            <p className="text-white/60 text-xl">لا يوجد محلات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredShops.map((shop) => (
              <Link
                key={shop.id}
                to={`/shop/${shop.id}`}
                className="group bg-[#1E1E1E] border border-[#333] rounded-3xl overflow-hidden hover:border-[#D4AF37]/30 transition-all hover:scale-[1.02] hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={shop.logo_url || 'https://placehold.co/400x200/1E1E1E/D4AF37?text=محل'}
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent"></div>

                  {shop.categories && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#D4AF37] text-black text-xs font-bold">
                      {shop.categories.name}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#D4AF37] transition-colors">
                    {shop.name}
                  </h3>
                  <p className="text-white/50 text-sm mb-3 line-clamp-2">
                    {shop.description || 'لا يوجد وصف'}
                  </p>
                  <div className="flex items-center gap-2 text-white/40 text-sm">
                    <MapPin size={16} />
                    <span>{shop.address || 'فاقوس'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}