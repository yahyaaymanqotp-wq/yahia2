import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

export default function ShopDashboard({ profile }) {
  const navigate = useNavigate()

  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])

  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('0')

  useEffect(() => {
    if (profile && profile.role !== 'shop_owner') {
      navigate('/')
      return
    }

    if (profile?.id) {
      fetchShop()
    }
  }, [profile])

  async function fetchShop() {
    const { data } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', profile.id)
      .single()

    setShop(data)

    if (data) {
      fetchProducts(data.id)
    }
  }

  async function fetchProducts(shopId) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    setProducts(data || [])
  }

  async function addProduct(e) {
    e.preventDefault()

    if (!shop) return

    const { error } = await supabase
      .from('products')
      .insert({
        shop_id: shop.id,
        category_id: shop.category_id,
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        is_active: true
      })

    if (error) {
      alert(error.message)
      return
    }

    setName('')
    setDescription('')
    setPrice('')
    setStock('0')

    setShowForm(false)

    fetchProducts(shop.id)
  }

  if (profile?.role !== 'shop_owner') {
    return (
      <div className="p-8 text-center">
        غير مصرح بالدخول
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-8">

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-3xl font-bold">
          لوحة تحكم المحل
        </h1>

        {shop && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-emerald-700"
          >
            <Plus size={20} />
            إضافة منتج
          </button>
        )}

      </div>

      {!shop && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-6 mb-6">
          <p className="text-yellow-800">
            لم يتم ربطك بأي محل حتى الآن. تواصل مع الأدمن.
          </p>
        </div>
      )}

      {showForm && shop && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">

          <h2 className="text-xl font-bold mb-4">
            إضافة منتج جديد
          </h2>

          <form
            onSubmit={addProduct}
            className="grid md:grid-cols-2 gap-4"
          >

            <input
              type="text"
              placeholder="اسم المنتج"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded-lg p-3"
              required
            />

            <input
              type="number"
              placeholder="السعر"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border rounded-lg p-3"
              required
            />

            <textarea
              placeholder="وصف المنتج"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded-lg p-3 md:col-span-2"
            />

            <input
              type="number"
              placeholder="المخزون"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="border rounded-lg p-3"
            />

            <button
              type="submit"
              className="bg-blue-600 text-white rounded-lg p-3"
            >
              حفظ المنتج
            </button>

          </form>

        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="text-xl font-bold mb-4">
          المنتجات
        </h2>

        {products.length === 0 ? (
          <p className="text-gray-500">
            لا توجد منتجات بعد
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {products.map(product => (

              <div
                key={product.id}
                className="border rounded-xl p-4"
              >

                <h3 className="font-bold text-lg mb-2">
                  {product.name}
                </h3>

                <p className="text-gray-500 mb-2">
                  {product.description}
                </p>

                <p className="text-emerald-600 font-bold">
                  {product.price} جنيه
                </p>

                <p className="text-sm text-gray-500">
                  المخزون: {product.stock}
                </p>

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  )
}