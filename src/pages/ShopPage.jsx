import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShoppingCart, MapPin, Phone, ArrowRight, DollarSign, Package, ArrowLeft } from 'lucide-react'

export default function ShopPage() {
  const { id } = useParams()
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchShopData()
  }, [id])

  async function fetchShopData() {
    try {
      setLoading(true)
      setError(null)

      const { data: shopData, error: shopError } = await supabase
  .from('shops')
  .select('*, categories(name, icon)')
  .eq('id', id)
  .eq('is_active', true)
  .single()

      if (shopError) throw new Error('المحل غير موجود')
      if (!shopData) throw new Error('المحل غير موجود')

      setShop(shopData)

      const { data: productsData, error: productsError } = await supabase
  .from('products')
  .select('*')
  .eq('shop_id', id)
  .eq('is_active', true)
  .order('created_at', { ascending: false })

      if (productsError) throw productsError

      const withImage = productsData?.filter(p => p.image_url) || []
      const withoutImage = productsData?.filter(p =>!p.image_url) || []
      setProducts([...withImage,...withoutImage])

    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find(item => item.product_id === product.id)

    if (existing) {
      existing.quantity += 1
    } else {
      cart.push({
        product_id: product.id,
        shop_id: product.shop_id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        shop_name: shop.name,
        quantity: 1
      })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    alert('تم إضافة المنتج للسلة ✅')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-[#D4AF37] text-xl">جاري التحميل...</div>
      </div>
    )
  }

  if (error ||!shop) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white" dir="rtl">
        <div className="text-center">
          <Package size={60} className="text-[#D4AF37]/40 mx-auto mb-4" />
          <h1 className="text-3xl mb-4">المحل غير موجود</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <Link to="/" className="inline-flex items-center gap-2 text-[#D4AF37] hover:underline">
            <ArrowRight size={20} />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-20" dir="rtl">
      <div className="bg-[#1E1E1E] border-b border-[#333] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-[#D4AF37] transition">
            <ArrowRight size={20} />
            العودة للمحلات
          </Link>
        </div>
      </div>

      <div className="relative h-64 bg-gradient-to-b from-[#D4AF37]/20 to-[#121212]">
        {shop.cover_image_url && (
          <img src={shop.cover_image_url} className="w-full h-full object-cover opacity-30" alt="" />
        )}
        <div className="absolute inset-0 flex items-end p-6">
          <div className="max-w-7xl mx-auto w-full flex items-end gap-6">
            <img
              src={shop.logo_url || 'https://placehold.co/120/1E1E1E/D4AF37?text=محل'}
              className="w-32 h-32 rounded-2xl border-4 border-[#121212] object-cover"
              alt={shop.name}
            />
            <div className="flex-1 pb-4">
              <h1 className="text-4xl font-bold text-white mb-2">{shop.name}</h1>
              <p className="text-white/60">{shop.categories?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6 mb-8">
          <p className="text-white/70 mb-4">{shop.description || 'لا يوجد وصف'}</p>
          <div className="flex flex-wrap gap-6 text-sm text-white/60">
            {shop.address && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#D4AF37]" />
                <span>{shop.address}</span>
              </div>
            )}
            {shop.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-[#D4AF37]" />
                <span dir="ltr">{shop.phone}</span>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-6">
          المنتجات
          <span className="text-sm px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] mr-3">
            {products.length}
          </span>
        </h2>

        {products.length === 0? (
          <div className="text-center py-20 bg-[#1E1E1E] rounded-2xl border border-[#333]">
            <Package className="text-[#D4AF37]/40 mx-auto mb-4" size={60} />
            <p className="text-white/60 text-xl">لا يوجد منتجات حالياً</p>
            <p className="text-white/40 text-sm mt-2">صاحب المحل لم يضف منتجات بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const hasImage =!!product.image_url;
              const hasDiscount = product.discount_percent > 0 || (product.old_price && parseFloat(product.old_price) > parseFloat(product.price));
              const discountLabel = product.discount_percent? `${product.discount_percent}% خصم` : product.old_price? `خصم ${(parseFloat(product.old_price) - parseFloat(product.price)).toFixed(0)} ج.م` : null;

              return (
                <div
                  key={product.id}
                  className="bg-[#1E1E1E] border border-[#333] rounded-3xl overflow-hidden hover:border-[#D4AF37]/30 transition-all hover:scale-[1.02] flex flex-col"
                >
                  {hasImage && (
                    <div className="relative h-48 overflow-hidden bg-[#121212]">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {hasDiscount && (
                        <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {discountLabel}
                        </span>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">
                            نفذت الكمية
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
                      {product.name}
                    </h3>

                    {!hasImage && product.description && (
                      <p className="text-white/50 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    {hasImage && (
                      <p className="text-white/50 text-sm mb-4 line-clamp-2 h-10">
                        {product.description || 'لا يوجد وصف'}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[#D4AF37] font-bold text-2xl">
                          <span>{product.price}</span>
                          <span className="text-sm">ج.م</span>
                        </div>
                        {product.old_price && parseFloat(product.old_price) > parseFloat(product.price) && (
                          <span className="text-white/30 line-through text-sm">{product.old_price} ج.م</span>
                        )}
                      </div>
                      <div className="text-white/40 text-sm">
                        {product.stock} متاح
                      </div>
                    </div>

                    {!hasImage && hasDiscount && (
                      <div className="mb-3">
                        <span className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full">
                          {discountLabel}
                        </span>
                      </div>
                    )}

                    {hasImage && product.stock === 0? null :!hasImage && product.stock === 0? (
                      <div className="w-full px-4 py-3 rounded-xl bg-red-500/20 text-red-400 font-bold text-center">نفذت الكمية</div>
                    ) : null}

                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className="w-full mt-auto px-4 py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#D4AF37]/90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart size={18} />
                      أضف للسلة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}