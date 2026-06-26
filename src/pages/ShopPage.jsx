import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ShopPage() {
  const { id } = useParams()

  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])

  useEffect(() => {
    loadShop()
    loadProducts()
  }, [])

  async function loadShop() {
    const { data } = await supabase
      .from('shops')
      .select('*')
      .eq('id', id)
      .single()

    setShop(data)
  }

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', id)
      .eq('is_active', true)

    setProducts(data || [])
  }

  if (!shop) {
    return (
      <div className="p-10 text-center">
        جاري التحميل...
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">

      <img
        src={
          shop.image_url ||
          shop.logo_url ||
          shop.banner_url ||
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'
        }
        alt={shop.name}
        className="w-full h-80 object-cover rounded-3xl"
      />

      <h1 className="text-4xl font-bold mt-6 mb-3">
        {shop.name}
      </h1>

      <p className="text-gray-600 mb-10">
        {shop.description}
      </p>

      <h2 className="text-3xl font-bold mb-6">
        المنتجات
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {products.map(product => (

          <div
            key={product.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >

            <img
              src={
                product.images?.[0] ||
                'https://via.placeholder.com/500x300'
              }
              alt={product.name}
              className="w-full h-52 object-cover"
            />

            <div className="p-4">

              <h3 className="font-bold text-lg">
                {product.name}
              </h3>

              <p className="text-gray-500 text-sm mt-2">
                {product.description}
              </p>

              <div className="mt-4 font-bold text-emerald-600">
                {product.price} ج.م
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}