import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShoppingCart, MapPin, Phone, ArrowRight, Package, Crown, Sparkles, Star, ShieldCheck, Gem } from 'lucide-react'

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

  function getDiscountPercent(product) {
    if (product.discount_percent && product.discount_percent > 0) return product.discount_percent
    if (product.old_price && parseFloat(product.old_price) > parseFloat(product.price)) {
      const oldP = parseFloat(product.old_price)
      const newP = parseFloat(product.price)
      return Math.round(((oldP - newP) / oldP) * 100)
    }
    return 0
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

  if (shop.is_souq_faqous_shop) {
    return (
      <div className="min-h-screen bg-[#050505] text-white pb-20 relative overflow-hidden" dir="rtl">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#D4AF37]/[0.08] rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#D4AF37]/[0.05] rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4"></div>
        </div>

        <div className="relative bg-black/50 backdrop-blur-2xl border-b border-[#D4AF37]/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-[#D4AF37] transition text-sm group">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#D4AF37]/30 transition"><ArrowRight size={16} /></div>
              العودة
            </Link>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[11px] text-[#D4AF37]"><ShieldCheck size={12} /> متجر موثق من الإدارة</div>
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] text-black text-[11px] font-black tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.5)]"><Crown size={14} className="fill-black" /> OFFICIAL STORE <Sparkles size={12} /></div>
            </div>
          </div>
        </div>

        <div className="relative h-[380px] md:h-[520px] overflow-hidden">
          <img src={shop.cover_image_url || shop.logo_url} className="w-full h-full object-cover scale-105" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/85 to-[#050505]/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 via-transparent to-transparent"></div>

          <div className="absolute inset-0 flex items-end p-4 md:p-10">
            <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-start md:items-end gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] blur-2xl opacity-30 rounded-[2.5rem]"></div>
                <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] p-[3px] bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.4)]">
                  <div className="w-full h-full rounded-[2.3rem] overflow-hidden bg-black p-1">
                    <img src={shop.logo_url} className="w-full h-full object-cover rounded-[2rem]" alt={shop.name} />
                  </div>
                </div>
                <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#D4AF37] border-4 border-[#050505] flex items-center justify-center shadow-xl"><Crown size={20} className="text-black fill-black" /></div>
              </div>
              <div className="flex-1 pb-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight flex items-center gap-4">{shop.name}<Gem size={28} className="text-[#D4AF37] hidden md:block" /></h1>
                <p className="text-[#D4AF37]/80 mt-3 flex items-center gap-2 text-sm font-medium"><span className="w-8 h-[1px] bg-[#D4AF37]/50"></span> متجر خاص تابع لإدارة سوق فاقوس مباشرة <Star size={14} className="fill-[#D4AF37] text-[#D4AF37]" /> {shop.categories?.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 mt-10">
          <div className="rounded-[2.5rem] p-[1px] bg-gradient-to-br from-[#D4AF37]/40 via-[#D4AF37]/10 to-transparent mb-12">
            <div className="rounded-[2.5rem] bg-gradient-to-br from-[#101010]/90 to-[#080808]/90 backdrop-blur-xl p-8 border border-white/[0.03]">
              <div className="flex items-start gap-4"><div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0"><Sparkles size={18} className="text-[#D4AF37]" /></div><p className="text-white/60 leading-8 text-[15px]">{shop.description || 'متجر رسمي معتمد من إدارة سوق فاقوس الإلكتروني'}</p></div>
              <div className="flex flex-wrap gap-3 mt-8">{shop.address && <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#D4AF37]/[0.06] border border-[#D4AF37]/15 text-sm"><MapPin size={16} className="text-[#D4AF37]" />{shop.address}</div>}{shop.phone && <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 text-sm" dir="ltr"><Phone size={16} className="text-white/40" />{shop.phone}</div>}</div>
            </div>
          </div>

          <div className="flex items-end justify-between mb-8">
            <h2 className="text-4xl font-black">منتجاتنا <span className="text-[#D4AF37]">الخاصة</span></h2>
            <div className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-sm text-white/40">{products.length} منتج حصري</div>
          </div>

          {products.length === 0? (
            <div className="text-center py-24 rounded-[2.5rem] bg-[#0a0a0a] border border-[#D4AF37]/10"><Package size={60} className="text-[#D4AF37]/20 mx-auto mb-4" /><p className="text-white/30">لا يوجد منتجات حالياً</p></div>
          ) : (
            /* ✅ تعديل امازون - كروت صغيرة فقط */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
              {products.map((product) => {
                const discountPercent = getDiscountPercent(product)
                const hasDiscount = discountPercent > 0
                const hasImage =!!product.image_url
                return (
                  <div key={product.id} className="group bg-[#141414] border border-white/5 rounded-xl overflow-hidden hover:border-[#D4AF37]/30 transition-all flex flex-col">
                    {hasImage && (
                      <div className="relative bg-white h-[150px] md:h-[165px] flex items-center justify-center p-2 overflow-hidden">
                        <img src={product.image_url} alt={product.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        {hasDiscount && (
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#CC0C39] text-white text-[10px] font-bold">
                            -{discountPercent}%
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-2.5 flex flex-col flex-1">
                      {!hasImage && hasDiscount && (
                        <div className="mb-2 self-start px-2 py-0.5 rounded bg-[#CC0C39] text-white text-[10px] font-bold">
                          خصم {discountPercent}%
                        </div>
                      )}
                      <h3 className="font-medium text-[13px] leading-[1.3] line-clamp-2 min-h-[34px] group-hover:text-[#D4AF37] transition-colors">{product.name}</h3>
                      <p className="text-white/40 text-[11px] mt-1 leading-4 whitespace-pre-wrap break-words line-clamp-2">
                        {product.description || ''}
                      </p>
                      <div className="flex items-baseline gap-1 mt-2">
                        <div className="font-bold text-[15px] text-white">{product.price}</div>
                        <span className="text-[11px] text-white/50">ج.م</span>
                        {product.old_price && <span className="text-white/30 line-through text-[10px] mr-1">{product.old_price}</span>}
                      </div>
                      <button onClick={() => addToCart(product)} disabled={product.stock === 0} className="w-full mt-3 h-8 rounded-full bg-[#FFD814] hover:bg-[#F7CA00] text-black font-bold text-[12px] transition flex items-center justify-center gap-1 disabled:opacity-20"><ShoppingCart size={12} />أضف للسلة</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
          /* ✅ تعديل امازون - كروت صغيرة فقط */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
            {products.map((product) => {
              const discountPercent = getDiscountPercent(product)
              const hasDiscount = discountPercent > 0
              const hasImage =!!product.image_url
              return (
                <div key={product.id} className="bg-[#1E1E1E] border border-[#333] rounded-xl overflow-hidden hover:border-[#D4AF37]/30 transition-all flex flex-col group">
                  {hasImage && (
                    <div className="relative bg-white h-[150px] md:h-[165px] flex items-center justify-center p-2 overflow-hidden">
                      <img src={product.image_url} alt={product.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" loading="lazy" />
                      {hasDiscount && (
                        <span className="absolute top-1.5 right-1.5 bg-[#CC0C39] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          -{discountPercent}%
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-2.5 flex flex-col flex-1">
                    {!hasImage && hasDiscount && (
                      <span className="mb-2 self-start bg-[#CC0C39] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        خصم {discountPercent}%
                      </span>
                    )}
                    <h3 className="text-[13px] font-medium leading-[1.3] line-clamp-2 min-h-[34px]">{product.name}</h3>
                    <p className="text-white/40 text-[11px] mt-1 whitespace-pre-wrap break-words line-clamp-2 leading-4">
                      {product.description || ''}
                    </p>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="font-bold text-[15px] text-[#D4AF37]">{product.price}</span>
                      <span className="text-[11px]">ج.م</span>
                      {product.old_price && <span className="text-white/30 line-through text-[10px] mr-1">{product.old_price}</span>}
                    </div>
                    <button onClick={() => addToCart(product)} disabled={product.stock === 0} className="w-full mt-3 h-8 rounded-full bg-[#D4AF37] text-black font-bold text-[12px] hover:bg-[#D4AF37]/90 transition flex items-center justify-center gap-1"><ShoppingCart size={12} /> أضف للسلة</button>
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