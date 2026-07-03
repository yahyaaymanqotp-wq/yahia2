import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Package, Image as ImageIcon, Trash2, Edit, DollarSign, Box, ShoppingCart, TrendingUp, ClipboardList, Eye, Upload, X, LogOut } from 'lucide-react'

export default function ShopDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [shop, setShop] = useState(null)

  const shopId = localStorage.getItem('shop_id')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    old_price: '',
    discount_percent: '',
    image_url: '',
    stock: '',
    category: ''
  })

  useEffect(() => {
    if (!shopId) {
      window.location.href = '/login'
      return
    }
    loadShopData()
    loadData()
    
    const channel = supabase.channel(`shop_${shopId}`)
   .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `shop_id=eq.${shopId}`
      }, loadOrders)
   .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'products',
        filter: `shop_id=eq.${shopId}`
      }, loadProducts)
   .subscribe()

    return () => channel.unsubscribe()
  }, [shopId])

  async function loadShopData() {
    const { data, error } = await supabase
   .from('shops')
   .select('*')
   .eq('id', shopId)
   .single()
    
    if (!error) {
      setShop(data)
      localStorage.setItem('shop_name', data.name)
    }
  }

  async function loadData() {
    await Promise.all([loadProducts(), loadOrders()])
    setLoading(false)
  }

  async function loadProducts() {
    const { data, error } = await supabase
   .from('products')
   .select('*')
   .eq('shop_id', shopId)
   .order('created_at', { ascending: false })

    if (!error) {
      const withImage = data.filter(p => p.image_url)
      const withoutImage = data.filter(p =>!p.image_url)
      setProducts([...withImage,...withoutImage])
    } else {
      console.error('Load products error:', error)
    }
  }

  async function loadOrders() {
    const { data, error } = await supabase
   .from('orders')
   .select(`
        *,
        order_items(*, products(name, image_url))
      `)
   .eq('shop_id', shopId)
   .order('created_at', { ascending: false })
   .limit(50)

    if (!error) setOrders(data || [])
  }

  const stats = {
    totalProducts: products.filter(p => p.is_active).length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.delivery_status === 'pending').length,
    totalSales: orders
   .filter(o => o.delivery_status === 'delivered')
   .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
  }

  async function uploadFile(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `products/${shopId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const { error } = await supabase.storage.from('shop-images').upload(fileName, file)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('shop-images').getPublicUrl(fileName)
    return publicUrl
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      alert('اختر صورة فقط')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة كبير - الحد الأقصى 5MB')
      return
    }

    setUploadingImage(true)
    try {
      const url = await uploadFile(file)
      setFormData({...formData, image_url: url})
    } catch (error) {
      alert('فشل رفع الصورة: ' + error.message)
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.name.trim() ||!formData.price) {
      alert('املأ اسم المنتج والسعر')
      return
    }

    // شيل category لو العمود مش موجود في الداتابيز
    const productData = {
      shop_id: shopId,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: parseFloat(formData.price),
      old_price: formData.old_price? parseFloat(formData.old_price) : null,
      discount_percent: formData.discount_percent? parseInt(formData.discount_percent) : null,
      image_url: formData.image_url || null,
      has_image:!!formData.image_url,
      stock: parseInt(formData.stock) || 0,
      category: formData.category.trim() || null,
      is_active: true
    }

    console.log('Saving product:', productData)

    try {
      if (editingProduct) {
        const { error } = await supabase
       .from('products')
       .update(productData)
       .eq('id', editingProduct.id)
        if (error) throw error
        alert('✅ تم تحديث المنتج')
      } else {
        const { data, error } = await supabase
       .from('products')
       .insert(productData)
       .select()
        
        console.log('Insert response:', { data, error })
        if (error) throw error
        alert('✅ تم إضافة المنتج')
      }

      resetForm()
      loadProducts()
    } catch (error) {
      console.error('Submit error:', error)
      alert('خطأ: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      price: '',
      old_price: '',
      discount_percent: '',
      image_url: '',
      stock: '',
      category: ''
    })
    setShowAddProduct(false)
    setEditingProduct(null)
  }

  function handleEdit(product) {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      old_price: product.old_price || '',
      discount_percent: product.discount_percent || '',
      image_url: product.image_url || '',
      stock: product.stock || '',
      category: product.category || ''
    })
    setShowAddProduct(true)
  }

  async function handleDelete(productId) {
    if (!confirm('متأكد عايز تمسح المنتج؟')) return
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) {
      alert('خطأ في المسح: ' + error.message)
    } else {
      loadProducts()
    }
  }

  async function toggleProductActive(productId, currentState) {
    await supabase.from('products').update({ is_active:!currentState }).eq('id', productId)
    loadProducts()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#121212] text-white">جاري التحميل...</div>

  if (!shopId) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white" dir="rtl">
        <div className="text-center">
          <h1 className="text-3xl mb-4">غير مسجل دخول</h1>
          <button onClick={() => window.location.href = '/login'} className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold">
            تسجيل الدخول
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">لوحة المحل</h1>
            <p className="text-gray-400">مرحبا {shop?.name || 'صاحب المحل'}</p>
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login' }}
            className="bg-red-500/20 text-red-400 px-6 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <LogOut size={18} />
            خروج
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'الرئيسية', icon: TrendingUp },
            { id: 'products', label: 'المنتجات', icon: Package },
            { id: 'orders', label: 'الطلبات', icon: ClipboardList }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id? 'bg-[#D4AF37] text-black' : 'bg-[#1E1E1E] text-gray-400 hover:bg-[#2a2a2a]'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Package} label="المنتجات النشطة" value={stats.totalProducts} color="blue" />
              <StatCard icon={ShoppingCart} label="إجمالي الطلبات" value={stats.totalOrders} color="green" />
              <StatCard icon={TrendingUp} label="طلبات معلقة" value={stats.pendingOrders} color="yellow" />
              <StatCard icon={DollarSign} label="إجمالي المبيعات" value={`${stats.totalSales.toFixed(2)} ج.م`} color="red" />
            </div>

            <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#333]">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ClipboardList className="text-[#D4AF37]" size={24} />
                آخر الطلبات
              </h2>
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="bg-[#121212] rounded-lg p-4 mb-3 border border-[#333]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">طلب #{order.id}</h3>
                      <p className="text-gray-400 text-sm">{order.customer_name} • {order.customer_phone}</p>
                      <p className="text-gray-500 text-xs mt-1">{new Date(order.created_at).toLocaleString('ar-EG')}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[#D4AF37] font-bold text-lg">{order.total_amount} ج.م</p>
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold mt-2 ${
                        order.delivery_status === 'delivered'? 'bg-green-500/20 text-green-400' :
                        order.delivery_status === 'shipping'? 'bg-blue-500/20 text-blue-400' :
                        order.delivery_status === 'preparing'? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {order.delivery_status === 'pending'? 'معلق' :
                         order.delivery_status === 'preparing'? 'تجهيز' :
                         order.delivery_status === 'shipping'? 'شحن' :
                         order.delivery_status === 'delivered'? 'تم' : order.delivery_status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'products' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Package className="text-[#D4AF37]" size={28} />
                منتجاتك ({products.length})
              </h2>
              <button
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#D4AF37]/90 transition"
              >
                <Plus size={20} />
                <span>إضافة منتج</span>
              </button>
            </div>

            {showAddProduct && (
              <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#D4AF37]">
                    {editingProduct? 'تعديل المنتج' : 'إضافة منتج جديد'}
                  </h2>
                  <button onClick={resetForm}><X size={24} className="text-gray-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">اسم المنتج *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">القسم</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:outline-none"
                        placeholder="رجالي، حريمي، أطفال"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">السعر *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">السعر قبل الخصم</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.old_price}
                        onChange={(e) => setFormData({...formData, old_price: e.target.value})}
                        className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">نسبة الخصم %</label>
                      <input
                        type="number"
                        value={formData.discount_percent}
                        onChange={(e) => setFormData({...formData, discount_percent: e.target.value})}
                        className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">الكمية</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-400">الوصف</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:outline-none"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-400">صورة المنتج</label>
                    <div className="flex gap-3">
                      <label className="flex-1 bg-[#121212] border border-[#333] border-dashed rounded-xl px-4 py-6 cursor-pointer hover:border-[#D4AF37] flex flex-col items-center gap-2">
                        {formData.image_url? (
                          <img src={formData.image_url} className="w-32 h-32 rounded-lg object-cover" />
                        ) : (
                          <>
                            <Upload className="text-gray-400" size={32} />
                            <span className="text-gray-400 text-sm">اختر صورة</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      {uploadingImage && <p className="text-[#D4AF37] text-sm">جاري الرفع...</p>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">بدون صورة = حجم صغير في آخر القائمة</p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={uploadingImage}
                      className="flex-1 bg-[#D4AF37] text-black py-3 rounded-xl font-bold hover:bg-[#D4AF37]/90 transition disabled:opacity-50"
                    >
                      {editingProduct? 'تحديث' : 'إضافة'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 bg-[#333] rounded-xl hover:bg-[#444] transition"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto"></div>
              </div>
            ) : products.length === 0? (
              <div className="text-center py-12 text-gray-400">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p>لسه مضفتش منتجات</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-[#1E1E1E] border border-[#333] rounded-2xl overflow-hidden hover:border-[#D4AF37] transition ${
                    !product.image_url? 'scale-90 opacity-80' : ''
                    }`}
                  >
                    {product.image_url? (
                      <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-[#121212] flex items-center justify-center">
                        <ImageIcon size={32} className="text-gray-600" />
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.description}</p>
                      )}

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          {product.old_price && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-gray-500 line-through">{product.old_price}</span>
                              {product.discount_percent && (
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                  {product.discount_percent}%
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[#D4AF37] font-bold text-xl">
                            <DollarSign size={18} />
                            <span>{product.price}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <Box size={14} />
                          <span>{product.stock}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex-1 flex items-center justify-center gap-1 bg-[#D4AF37]/20 text-[#D4AF37] py-2 rounded-lg hover:bg-[#D4AF37]/30 transition text-sm"
                        >
                          <Edit size={14} />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => toggleProductActive(product.id, product.is_active)}
                          className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition ${
                            product.is_active? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="flex items-center justify-center gap-1 bg-red-500/20 text-red-500 px-3 py-2 rounded-lg hover:bg-red-500/30 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <ShoppingCart size={24} className="text-[#D4AF37]" />
              طلبات محلك ({orders.length})
            </h2>

            {orders.length === 0? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                <p>لسه مفيش طلبات</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-[#121212] border border-[#333] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">طلب #{order.id}</h3>
                        <p className="text-sm text-gray-400">{order.customer_name} • {order.customer_phone}</p>
                        <p className="text-xs text-gray-500 mt-1">{order.customer_address}</p>
                      </div>
                      <div className="text-left">
                        <div className="text-2xl font-bold text-[#D4AF37]">{order.total_amount} ج.م</div>
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold mt-2 ${
                          order.delivery_status === 'delivered'? 'bg-green-500/20 text-green-400' :
                          order.delivery_status === 'shipping'? 'bg-blue-500/20 text-blue-400' :
                          order.delivery_status === 'preparing'? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {order.delivery_status === 'pending'? 'معلق' :
                           order.delivery_status === 'preparing'? 'تجهيز' :
                           order.delivery_status === 'shipping'? 'شحن' :
                           order.delivery_status === 'delivered'? 'تم التوصيل' : order.delivery_status}
                        </span>
                      </div>
                    </div>

                    {order.order_items && order.order_items.length > 0 && (
                      <div className="border-t border-[#333] pt-3 mt-3">
                        <p className="text-sm text-gray-400 mb-2">المنتجات:</p>
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm mb-1">
                            <span>{item.product_name} × {item.quantity}</span>
                            <span className="text-[#D4AF37]">{item.subtotal} ج.م</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-3">
                      {new Date(order.created_at).toLocaleString('ar-EG')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/20 text-red-400'
  }
  return (
    <div className="bg-[#1E1E1E] rounded-xl p-6 border border-[#333]">
      <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-4`}>
        <Icon size={24} />
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{label}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}