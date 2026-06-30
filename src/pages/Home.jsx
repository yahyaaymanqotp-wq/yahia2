import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Store, MapPin, Star, TrendingUp, Sparkles, ShoppingCart } from 'lucide-react'

export default function Home() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchShops()
  }, [])

  async function fetchShops() {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (!error) setShops(data || [])
    setLoading(false)
  }

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-white text-xl font-bold mt-6 animate-pulse text-center">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6 animate-in fade-in slide-in-from-top duration-700">
            <Sparkles className="text-yellow-400" size={18} />
            <span className="text-white/90 text-sm font-medium">اكتشف أفضل المحلات في فاقوس</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 mb-6 animate-gradient bg-300%">
            سوق فاقوس
          </h1>
          
          <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            كل اللي تحتاجه في مكان واحد. تسوق من أفضل المحلات المحلية بسهولة
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن محل أو فئة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-5 rounded-2xl bg-black/40 backdrop-blur-2xl border-2 border-white/20 text-white text-lg placeholder:text-white/40 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all"
                />
                <TrendingUp className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shops Grid */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Store className="text-purple-400" />
            <span>المحلات المتاحة</span>
            <span className="text-sm px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
              {filteredShops.length}
            </span>
          </h2>
        </div>

        {filteredShops.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Store className="text-white/30" size={40} />
            </div>
            <p className="text-white/60 text-xl">مفيش محلات مطابقة للبحث</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop, index) => (
              <Link
                key={shop.id}
                to={`/shop/${shop.id}`}
                className="group relative animate-in fade-in slide-in-from-bottom duration-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                
                {/* Card */}
                <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:-translate-y-2">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                     src={shop.logo_url || shop.image_url || 'https://via.placeholder.com/400x200'}
                      alt={shop.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    {/* Category Badge */}
                    {shop.category && (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-purple-600/90 backdrop-blur-xl text-white text-xs font-bold">
                        {shop.category}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {shop.name}
                    </h3>
                    
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">
                      {shop.description || 'لا يوجد وصف متاح'}
                    </p>

                    <div className="flex items-center gap-4 text-white/50 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        <span>{shop.address || 'فاقوس'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-400 fill-yellow-400" />
                        <span>4.5</span>
                      </div>
                    </div>

                    {/* Hover Button */}
                    <div className="mt-6 overflow-hidden">
                      <div className="transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-center">
                          عرض المحل ←
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
{/* زر السلة الثابت للموبايل */}
<Link
  to="/Cart"
  className="fixed bottom-6 left-6 z-50 md:hidden w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
>
  <ShoppingCart size={28} />
</Link>
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
          background-size: 200% 200%;
        }
      `}</style>
    </div>
  )
}