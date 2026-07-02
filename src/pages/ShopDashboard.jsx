import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Package, Image as ImageIcon, Trash2, Edit, DollarSign, Box } from 'lucide-react'

export default function ShopDashboard({ profile }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    stock: ''
  })

  useEffect(() => {
    if (profile?.shop_id) {
      loadProducts()
    }
  }, [profile])

  async function loadProducts() {
    setLoading(true)
    const { data, error } = await supabase
     .from('products')
     .select('*')
     .eq('shop_id', profile.shop_id)
     .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading products:', error)
    } else {
      // رتب: اللي بصورة الأول وكبير، اللي بدون صورة في الآخر وصغير
      const withImage = data.filter(p => p.image_url)
      const withoutImage = data.filter(p =>!p.image_url)
      setProducts([...withImage,...withoutImage])
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.name ||!formData.price) {
      alert('املأ اسم المنتج والسعر على الأقل')
      return
    }

    const productData = {
      shop_id: profile.shop_id,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      image_url: formData.image_url || null,
      category: formData.category,
      stock: parseInt(formData.stock) || 0
    }

    try {
      if (editingProduct) {
        // تحديث
        const { error } = await supabase
         .from('products')
         .update(productData)
         .eq('id', editingProduct.id)

        if (error) throw error
        alert('تم تحديث المنتج')
      } else {
        // إضافة
        const { error } = await supabase
         .from('products')
         .insert(productData)

        if (error) throw error
        alert('تم إضافة المنتج')
      }

      resetForm()
      loadProducts()
    } catch (error) {
      alert('خطأ: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      category: '',
      stock: ''
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
      image_url: product.image_url || '',
      category: product.category || '',
      stock: product.stock || ''
    })
    setShowAddProduct(true)
  }

  async function handleDelete(productId) {
    if (!confirm('متأكد عايز تمسح المنتج؟')) return

    const { error } = await supabase
     .from('products')
     .delete()
     .eq('id', productId)

    if (error) {
      alert('خطأ في المسح: ' + error.message)
    } else {
      alert('تم المسح')
      loadProducts()
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">

        {/* الهيدر */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">لوحة المحل</h1>
            <p className="text-gray-400">مرحبا {profile?.username}</p>
          </div>
          <button
            onClick={() => setShowAddProduct(!showAddProduct)}
            className="flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#D4AF37]/90 transition"
          >
            <Plus size={20} />
            <span>إضافة منتج</span>
          </button>
        </div>

        {/* فورم إضافة/تعديل منتج */}
        {showAddProduct && (
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-[#D4AF37]">
              {editingProduct? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-400">اسم المنتج *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:outline-none"
                    placeholder="مثال: عطر فاخر"
                    required
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
                    placeholder="99.99"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-2 text-gray-400">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:outline-none"
                    placeholder="وصف المنتج"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-400">رابط الصورة</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:outline-none"
                    placeholder="https://... (اختياري)"
                  />
                  <p className="text-xs text-gray-500 mt-1">لو فاضي المنتج هيبقى صغير في الآخر</p>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-400">الكمية</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-400">القسم</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:outline-none"
                    placeholder="مثال: رجالي، حريمي"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#D4AF37] text-black py-3 rounded-xl font-bold hover:bg-[#D4AF37]/90 transition"
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

        {/* عرض المنتجات */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Package size={24} className="text-[#D4AF37]" />
            منتجاتك ({products.length})
          </h2>

          {loading? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400 mt-4">جاري التحميل...</p>
            </div>
          ) : products.length === 0? (
            <div className="text-center py-12 text-gray-400">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>لسه مضفتش منتجات. ضيف أول منتج</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`bg-[#121212] border border-[#333] rounded-2xl overflow-hidden hover:border-[#D4AF37] transition ${
                   !product.image_url? 'scale-90 opacity-80' : ''
                  }`}
                >
                  {product.image_url? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-[#1E1E1E] flex items-center justify-center">
                      <ImageIcon size={32} className="text-gray-600" />
                    </div>
                  )}

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.description}</p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1 text-[#D4AF37] font-bold">
                        <DollarSign size={16} />
                        <span>{product.price}</span>
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
        </div>
      </div>
    </div>
  )
}