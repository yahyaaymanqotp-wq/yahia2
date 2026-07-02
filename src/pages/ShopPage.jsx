import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Store, MapPin, Phone, Package, DollarSign, ShoppingCart, ArrowRight, Image as ImageIcon } from 'lucide-react'

export default function ShopPage() {
  const { id } = useParams()
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadShop()
    loadProducts()
    // هات السلة من localStorage
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]")
    setCart(savedCart)
  }, [id])

  async function loadShop() {
    const { data, error } = await supabase
     .from('shops')
     .select('*, profiles!shops_owner_id_fkey(username, full_name)')
     .eq('id', id)
     .single()

    if (error) {
      console.error('Shop error:', error)
    } else {
      setShop(data)
    }
    setLoading(false)
  }

  async function loadProducts() {
    const { data, error } = await supabase
     .from('products')
     .select('*')
     .eq('shop_id', id)
     .eq('is_active', true)
     .order('created_at', { ascending: false })

    if (!error) {
      // رتب: اللي بصورة الأول وكبير، اللي بدون صورة في الآخر وصغير
      const withImage = data.filter(p => p.image_url)
      const withoutImage = data.filter(p =>!p.image_url)
      setProducts([...withImage,...withoutImage])
    }
  }

  function addToCart(product) {
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]")
    const index = currentCart.findIndex((item) => item.id === product.id)

    if (index!== -1) {
      currentCart[index].quantity += 1
    } else {
      currentCart.push({
       ...product,
        quantity: 1,
        shop_id: shop.id,
        shop_name: shop.name,
        shop_phone: shop.phone || "",
        shop_address: shop.address || "",
      })
    }

    localStorage.setItem("cart", JSON.stringify(currentCart))
    setCart(currentCart)
    alert("✅ تمت إضافة المنتج إلى السلة")
  }

  if (loading ||!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="w-20 h-20 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white" dir="rtl">
      {/* غلاف المحل */}
      <div className="relative h-64 md:h-80 bg-gradient-to-b from-[#D4AF37]/20 to-[#121212]">
        {shop.image_url && (
          <img
            src={shop.image_url}
            alt={shop.name}
            className="w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end gap-4">
              {shop.image_url && (
                <img
                  src={shop.image_url}
                  alt={shop.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-[#D4AF37] object-cover shadow-2xl"
                />
              )}
              <div className="flex-1 pb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{shop.name}</h1>
                {shop.category && (
                  <span className="inline-block bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-1 rounded-lg text-sm font-bold">
                    {shop.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* معلومات المحل */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            {shop.description && (
              <div className="md:col-span-3">
                <p className="text-gray-300 leading-relaxed">{shop.description}</p>
              </div>
            )}

            {shop.address && (
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-[#D4AF37] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400 mb-1">العنوان</p>
                  <p className="font-medium">{shop.address}</p>
                </div>
              </div>
            )}

            {shop.phone && (
              <div className="flex items-start gap-3">
                <Phone size={20} className="text-[#D4AF37] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400 mb-1">التليفون</p>
                  <a href={`tel:${shop.phone}`} className="font-medium hover:text-[#D4AF37] transition">
                    {shop.phone}
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Store size={20} className="text-[#D4AF37] mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-400 mb-1">صاحب المحل</p>
                <p className="font-medium">{shop.profiles?.full_name || shop.profiles?.username}</p>
              </div>
            </div>
          </div>
        </div>

        {/* المنتجات */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Package size={28} className="text-[#D4AF37]" />
            <h2 className="text-2xl font-bold">منتجات المحل ({products.length})</h2>
          </div>

          {products.length === 0? (
            <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-12 text-center">
              <Package size={64} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">لسه مفيش منتجات في المحل ده</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`bg-[#1E1E1E] border border-[#333] rounded-2xl overflow-hidden hover:border-[#D4AF37] transition group ${
                   !product.image_url? 'scale-90' : ''
                  }`}
                >
                  {product.image_url? (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">
                            نفذت الكمية
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-32 bg-[#121212] flex items-center justify-center">
                      <ImageIcon size={32} className="text-gray-700" />
                    </div>
                  )}

                  <div className="p-4">
                    <h3 className="font-bold mb-1 line-clamp-1">{product.name}</h3>

                    {product.description && product.image_url && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{product.description}</p>
                    )}

                    {product.category && (
                      <span className="inline-block bg-[#333] text-gray-400 px-2 py-0.5 rounded text-xs mb-2">
                        {product.category}
                      </span>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 text-[#D4AF37] font-bold">
                        <DollarSign size={16} />
                        <span>{product.price}</span>
                      </div>

                      <button
                        disabled={product.stock === 0}
                        onClick={() => addToCart(product)}
                        className="bg-[#D4AF37] text-black p-2 rounded-lg hover:bg-[#D4AF37]/90 transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>

                    {product.stock > 0 && product.stock < 10 && (
                      <p className="text-xs text-orange-500 mt-2">متبقي {product.stock} فقط</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}