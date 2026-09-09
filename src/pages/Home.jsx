import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Store, MapPin, Search, Shirt, Utensils, Smartphone, Gem, Sofa, Dumbbell, Package, Crown, Sparkles, Star, ShieldCheck } from 'lucide-react'

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

  // ✅ التقسيم الجديد بس - نفس الكود بتاعك
  const souqFaqousShops = filteredShops.filter(shop => shop.is_souq_faqous_shop === true)
  const regularShops = filteredShops.filter(shop => shop.is_souq_faqous_shop!== true)

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

      {/* سوق فاقوس الإلكتروني - التصميم الفخم */}
      {souqFaqousShops.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mb-20">
          <div className="relative rounded-[2.5rem] p-[1px] bg-gradient-to-br from-[#D4AF37] via-[#D4AF37]/40 to-transparent">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0a0a0a]">
              <div className="absolute inset-0">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#D4AF37]/20 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[100px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#D4AF37]/5 via-transparent to-[#D4AF37]/5 blur-3xl"></div>
                <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`}}></div>
              </div>

              <div className="relative p-7 md:p-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#D4AF37] blur-xl opacity-50 rounded-3xl"></div>
                      <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#D4AF37] to-[#a68a2d] text-black flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.5)]">
                        <Crown size={36} />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-black border-2 border-[#D4AF37] rounded-full flex items-center justify-center">
                        <Star size={10} className="text-[#D4AF37] fill-[#D4AF37]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                          <span className="bg-gradient-to-b from-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent">سوق فاقوس</span>
                          <span className="text-white mr-2">الإلكتروني</span>
                        </h2>
                        <Sparkles size={22} className="text-[#D4AF37] animate-pulse" />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                          <ShieldCheck size={14} className="text-[#D4AF37]" />
                          <span className="text-xs font-bold text-[#D4AF37]">متاجرنا الخاصة</span>
                        </div>
                        <p className="text-white/50 text-sm">متاجر خاصة تابعة لإدارة سوق فاقوس مباشرة</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                      <span className="text-white/70 text-sm font-medium">{souqFaqousShops.length} متجر خاص بالسوق</span>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#b8962e] text-black text-xs font-black tracking-widest">OFFICIAL</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {souqFaqousShops.map((shop) => (
                    <Link key={shop.id} to={`/shop/${shop.id}`} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/30 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                      <div className="relative bg-gradient-to-br from-[#1E1E1E] to-[#141414] border border-[#D4AF37]/20 rounded-3xl overflow-hidden group-hover:border-[#D4AF37]/60 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(212,175,55,0.15)]">
                        <div className="relative h-48 overflow-hidden">
                          <img src={shop.logo_url || 'https://placehold.co/400x200/1E1E1E/D4AF37?text=سوق+فاقوس'} alt={shop.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent"></div>
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black px-3.5 py-1.5 rounded-full text-[11px] font-black shadow-[0_4px_15px_rgba(212,175,55,0.4)]">
                            <Crown size={12} className="fill-black" /> متجر السوق
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="text-[18px] font-bold text-white group-hover:text-[#D4AF37] transition-colors">{shop.name}</h3>
                          <p className="text-white/40 text-[13px] mt-2 line-clamp-2">{shop.description || 'متجر خاص تابع لإدارة سوق فاقوس مباشرة'}</p>
                          <div className="flex items-center gap-1.5 text-white/30 text-xs mt-4">
                            <MapPin size={12} /><span>{shop.address || 'إدارة سوق فاقوس'}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shops Grid */}
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">
          المحلات
          <span className="text-sm px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] mr-3">
            {regularShops.length}
          </span>
        </h2>

        {regularShops.length === 0? (
          <div className="text-center py-20 bg-[#1E1E1E] rounded-2xl border border-[#333]">
            <Store className="text-[#D4AF37]/40 mx-auto mb-4" size={60} />
            <p className="text-white/60 text-xl">لا يوجد محلات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {regularShops.map((shop) => (
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