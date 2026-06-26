
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Search,
  Store,
  UtensilsCrossed,
  Coffee,
  ShoppingBag
} from 'lucide-react'
import { Link } from 'react-router-dom'
export default function Home() {
  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchShops()
    fetchCategories()
  }, [])

  async function fetchShops() {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error(error)
      return
    }

    setShops(data || [])
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id')

    if (error) {
      console.error(error)
      return
    }

    setCategories(data || [])
  }

  const filteredShops = shops.filter(shop =>
    shop.name?.toLowerCase().includes(search.toLowerCase())
  )

  const getCategoryIcon = (name) => {
    if (name?.includes('مطعم')) return <UtensilsCrossed size={24} />
    if (name?.includes('كافيه')) return <Coffee size={24} />
    if (name?.includes('ملابس')) return <ShoppingBag size={24} />
    return <Store size={24} />
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white">

        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-24 text-center">

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
            سوق فاقوس
          </h1>

          <p className="text-xl md:text-2xl mb-10 text-white/90">
            جميع المطاعم والمحلات والخدمات في مكان واحد
          </p>

          <div className="max-w-3xl mx-auto relative">
            <input
              type="text"
              placeholder="ابحث عن مطعم أو محل أو متجر..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-16 rounded-full px-8 pr-14 text-gray-900 text-lg shadow-2xl outline-none"
            />

            <Search
              size={24}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>

        </div>
      </section>

      {/* الأقسام */}
      <section className="max-w-7xl mx-auto px-4 py-12">

        <h2 className="text-4xl font-bold mb-8 text-gray-800">
          الأقسام
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">

          {categories.map(category => (
            <div
              key={category.id}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 mx-auto">
                {getCategoryIcon(category.name)}
              </div>

              <h3 className="text-center font-bold text-gray-800">
                {category.name}
              </h3>
            </div>
          ))}

        </div>
      </section>

      {/* المحلات */}
      <section className="max-w-7xl mx-auto px-4 pb-20">

        {categories.map(category => {

          const categoryShops = filteredShops.filter(
            shop => Number(shop.category_id) === Number(category.id)
          )

          if (!categoryShops.length) return null

          return (
            <div key={category.id} className="mb-16">

              <div className="flex items-center justify-between mb-8">

                <div className="flex items-center gap-3">

                  <div className="bg-emerald-500 text-white p-3 rounded-xl">
                    {getCategoryIcon(category.name)}
                  </div>

                  <h2 className="text-3xl font-bold text-gray-800">
                    {category.name}
                  </h2>

                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">

                {categoryShops.map(shop => (

                  <div
                    key={shop.id}
                    className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                  >

                    <div className="relative">

                      <img
                        src={
                          shop.logo_url ||
                          shop.banner_url ||
                          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'
                        }
                        alt={shop.name}
                        className="w-full h-52 object-cover"
                      />

                      <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                        مفتوح الآن
                      </span>

                    </div>

                    <div className="p-5">

                      <h3 className="font-bold text-xl text-gray-800 mb-2">
                        {shop.name}
                      </h3>

                      <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                        {shop.description ||
                          'أفضل المنتجات والخدمات بأفضل الأسعار'}
                      </p>

                      <div className="flex justify-between items-center">

                        <span className="text-yellow-500 font-bold">
                          ★ 4.8
                        </span>

                        <Link
  to={`/shop/${shop.id}`}
  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold transition"
>
  زيارة المتجر
</Link>
                      </div>

                    </div>

                  </div>

                ))}

              </div>

            </div>
          )
        })}

      </section>

    </div>
  )
}