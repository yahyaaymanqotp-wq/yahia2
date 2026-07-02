import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Store, Plus, X, Upload, Trash2, Lock, ClipboardList, CheckCircle, XCircle, Eye } from 'lucide-react'

const ADMIN_PASSWORD = 'youssef2024'

function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('shops')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    address: '',
    phone: '',
    image_url: '',
    ownerUsername: '',
    ownerPassword: '',
    ownerFullName: ''
  })

  useEffect(() => {
    if (localStorage.getItem('admin_access') === 'true') {
      setIsLoggedIn(true)
      loadData()
    } else {
      setLoading(false)
    }
  }, [])

  function handleLogin(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('admin_access', 'true')
      setIsLoggedIn(true)
      loadData()
    } else {
      alert('الباسورد غلط')
    }
  }

  async function loadData() {
    const [catsRes, shopsRes, ordersRes] = await Promise.all([
      supabase.from('categories').select('*').order('display_order'),
      supabase.from('shops').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*, shops(name)').order('created_at', { ascending: false })
    ])

    if (catsRes.data) setCategories(catsRes.data)
    if (shopsRes.data) setShops(shopsRes.data)
    if (ordersRes.data) setOrders(ordersRes.data)
    setLoading(false)
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('اختر صورة فقط')
      return
    }

    setUploadingImage(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `shops/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
   .from('shops')
   .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
   .from('shops')
   .getPublicUrl(fileName)

      setFormData({...formData, image_url: publicUrl })
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('فشل رفع الصورة: ' + error.message)
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleAddShop(e) {
    e.preventDefault()

    if (!formData.name ||!formData.category ||!formData.ownerUsername ||!formData.ownerPassword) {
      alert('املأ اسم المحل والقسم واليوزرنيم والباسورد')
      return
    }

    if (formData.ownerPassword.length < 6) {
      alert('الباسورد لازم 6 حروف على الأقل')
      return
    }

    setSubmitting(true)

    try {
      // 1. انشئ المحل
      const { data: shopData, error: shopError } = await supabase
   .from('shops')
   .insert({
          name: formData.name,
          category: formData.category,
          description: formData.description || null,
          address: formData.address || null,
          phone: formData.phone || null,
          image_url: formData.image_url || null,
          is_active: true
        })
   .select()
   .single()

      if (shopError) throw shopError

      // 2. انشئ حساب لصاحب المحل
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `${formData.ownerUsername}@local.app`,
        password: formData.ownerPassword,
        options: {
          data: {
            username: formData.ownerUsername,
            full_name: formData.ownerFullName || formData.name,
            role: 'shop_owner'
          }
        }
      })

      if (authError) {
        await supabase.from('shops').delete().eq('id', shopData.id)
        if (authError.message.includes('already registered')) {
          throw new Error('اليوزرنيم ده موجود بالفعل')
        }
        throw authError
      }

      if (!authData.user) throw new Error('فشل إنشاء الحساب')

      // 3. اربط المحل باليوزر
      await supabase
   .from('shops')
   .update({ owner_id: authData.user.id })
   .eq('id', shopData.id)

      // 4. حدث الـ profile
      await supabase
   .from('profiles')
   .update({
          role: 'shop_owner',
          shop_id: shopData.id
        })
   .eq('id', authData.user.id)

      alert(`✅ تم إضافة المحل والحساب بنجاح!\n\nاسم المحل: ${formData.name}\nاليوزرنيم: ${formData.ownerUsername}\nالباسورد: ${formData.ownerPassword}`)

      setFormData({
        name: '',
        category: '',
        description: '',
        address: '',
        phone: '',
        image_url: '',
        ownerUsername: '',
        ownerPassword: '',
        ownerFullName: ''
      })
      setShowAdd(false)
      loadData()

    } catch (error) {
      console.error('Error:', error)
      alert('خطأ: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteShop(id) {
    if (!confirm('متأكد من الحذف؟')) return
    await supabase.from('shops').delete().eq('id', id)
    loadData()
  }

  async function updateOrderStatus(orderId, newStatus) {
    const { error } = await supabase
 .from('orders')
 .update({ status: newStatus })
 .eq('id', orderId)

    if (error) {
      alert('فشل تحديث الطلب')
      return
    }

    loadData()
    setSelectedOrder(null)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4" dir="rtl">
        <div className="bg-[#1E1E1E] rounded-2xl p-8 max-w-md w-full border border-[#333]">
          <div className="text-center mb-6">
            <Lock className="mx-auto text-[#D4AF37] mb-4" size={48} />
            <h1 className="text-2xl font-bold text-white">لوحة تحكم الأدمن</h1>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="الباسورد"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white mb-4"
              autoFocus
            />
            <button type="submit" className="w-full bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold">
              دخول
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#121212] text-white text-xl">جاري التحميل...</div>
  }

  return (
    <div className="min-h-screen bg-[#121212] p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#D4AF37] mb-2">لوحة التحكم</h1>
            <p className="text-gray-400">إدارة المحلات والطلبات</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('admin_access')
              setIsLoggedIn(false)
            }}
            className="bg-red-500/20 text-red-400 px-6 py-2 rounded-lg font-bold"
          >
            خروج
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('shops')}
            className={`px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'shops'
          ? 'bg-[#D4AF37] text-black'
                : 'bg-[#1E1E1E] text-gray-400 hover:bg-[#2a2a2a]'
            }`}
          >
            <Store size={20} />
            المحلات ({shops.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
          ? 'bg-[#D4AF37] text-black'
                : 'bg-[#1E1E1E] text-gray-400 hover:bg-[#2a2a2a]'
            }`}
          >
            <ClipboardList size={20} />
            الطلبات ({orders.length})
          </button>
        </div>

        {activeTab === 'shops' && (
          <>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold mb-6 flex items-center gap-2"
            >
              <Plus size={20} />
              إضافة محل جديد
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map(shop => (
                <div key={shop.id} className="bg-[#1E1E1E] rounded-xl p-6 border border-[#333] hover:border-[#D4AF37]/50 transition">
                  {shop.image_url? (
                    <img src={shop.image_url} alt={shop.name} className="w-full h-40 object-cover rounded-lg mb-4" />
                  ) : (
                    <div className="w-full h-40 bg-[#121212] rounded-lg mb-4 flex items-center justify-center">
                      <Store className="text-gray-600" size={48} />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">{shop.name}</h3>
                  <p className="text-[#D4AF37] text-sm mb-2">
                    {categories.find(c => c.slug === shop.category)?.name || shop.category}
                  </p>
                  {shop.description && <p className="text-gray-400 text-sm mb-4 line-clamp-2">{shop.description}</p>}

                  <button
                    onClick={() => deleteShop(shop.id)}
                    className="w-full bg-red-500/20 text-red-400 px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    حذف
                  </button>
                </div>
              ))}
            </div>

            {shops.length === 0 && (
              <div className="text-center py-12 bg-[#1E1E1E] rounded-xl border border-[#333]">
                <Store className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-gray-400">لا توجد محلات</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <div className="bg-[#1E1E1E] rounded-xl border border-[#333] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#121212]">
                  <tr>
                    <th className="text-right p-4 text-gray-400 font-bold">رقم الطلب</th>
                    <th className="text-right p-4 text-gray-400 font-bold">المحل</th>
                    <th className="text-right p-4 text-gray-400 font-bold">العميل</th>
                    <th className="text-right p-4 text-gray-400 font-bold">الإجمالي</th>
                    <th className="text-right p-4 text-gray-400 font-bold">الحالة</th>
                    <th className="text-right p-4 text-gray-400 font-bold">التاريخ</th>
                    <th className="text-right p-4 text-gray-400 font-bold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-t border-[#333] hover:bg-[#121212]/50">
                      <td className="p-4 text-white">#{order.id.slice(0, 8)}</td>
                      <td className="p-4 text-white">{order.shops?.name || 'غير محدد'}</td>
                      <td className="p-4 text-gray-400">{order.customer_name}</td>
                      <td className="p-4 text-[#D4AF37] font-bold">{order.total_amount} ج.م</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          order.status === 'completed'? 'bg-green-500/20 text-green-400' :
                          order.status === 'cancelled'? 'bg-red-500/20 text-red-400' :
                          order.status === 'preparing'? 'bg-blue-500/20 text-blue-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {order.status === 'pending'? 'قيد الانتظار' :
                           order.status === 'preparing'? 'قيد التحضير' :
                           order.status === 'completed'? 'مكتمل' :
                           order.status === 'cancelled'? 'ملغي' : order.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(order.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                          <Eye size={16} />
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {orders.length === 0 && (
              <div className="text-center py-12">
                <ClipboardList className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-gray-400">لا توجد طلبات</p>
              </div>
            )}
          </div>
        )}

        {showAdd && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#1E1E1E] rounded-2xl p-6 max-w-lg w-full border border-[#333] my-8">
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#D4AF37]">إضافة محل جديد</h2>
                <button onClick={() => setShowAdd(false)}><X className="text-gray-400" size={24} /></button>
              </div>

              <form onSubmit={handleAddShop} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">صورة المحل *</label>
                  <label className="w-full bg-[#121212] border border-[#333] border-dashed rounded-xl px-4 py-8 cursor-pointer hover:border-[#D4AF37] transition flex flex-col items-center justify-center gap-2">
                    {uploadingImage? (
                      <span className="text-[#D4AF37]">جاري الرفع...</span>
                    ) : formData.image_url? (
                      <>
                        <img src={formData.image_url} alt="Preview" className="w-32 h-32 rounded-lg object-cover" />
                        <span className="text-sm text-gray-400">اضغط لتغيير الصورة</span>
                      </>
                    ) : (
                      <>
                        <Upload className="text-gray-400" size={32} />
                        <span className="text-gray-400">اضغط لاختيار صورة من التلفون</span>
                        <span className="text-xs text-gray-500">أي حجم</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                <input
                  type="text"
                  placeholder="اسم المحل *"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white"
                />

                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white"
                >
                  <option value="">-- اختر القسم ({categories.length} متاح) --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>

                <textarea
                  placeholder="وصف المحل"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white"
                  rows="3"
                />

                <input
                  type="text"
                  placeholder="العنوان"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white"
                />

                <input
                  type="tel"
                  placeholder="الهاتف"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white"
                />

                <div className="border-t border-[#333] pt-4">
                  <h3 className="text-lg font-bold text-[#D4AF37] mb-4">بيانات صاحب المحل</h3>

                  <input
                    type="text"
                    placeholder="اسم صاحب المحل"
                    value={formData.ownerFullName}
                    onChange={(e) => setFormData({...formData, ownerFullName: e.target.value})}
                    className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white mb-4"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="اليوزرنيم *"
                      required
                      value={formData.ownerUsername}
                      onChange={(e) => setFormData({...formData, ownerUsername: e.target.value})}
                      className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white"
                    />

                    <input
                      type="text"
                      placeholder="الباسورد *"
                      required
                      value={formData.ownerPassword}
                      onChange={(e) => setFormData({...formData, ownerPassword: e.target.value})}
                      className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white"
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={uploadingImage || submitting}
                    className="flex-1 bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                  >
                    {submitting? 'جاري الإضافة...' : 'إضافة المحل'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-6 py-3 rounded-xl bg-[#333] text-white font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E1E1E] rounded-2xl p-6 max-w-2xl w-full border border-[#333]">
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#D4AF37]">تفاصيل الطلب #{selectedOrder.id.slice(0, 8)}</h2>
                <button onClick={() => setSelectedOrder(null)}><X className="text-gray-400" size={24} /></button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">العميل</p>
                    <p className="text-white font-bold">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">الهاتف</p>
                    <p className="text-white font-bold">{selectedOrder.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">الإجمالي</p>
                    <p className="text-[#D4AF37] font-bold text-xl">{selectedOrder.total_amount} ج.م</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">الحالة الحالية</p>
                    <p className="text-white font-bold">{selectedOrder.status}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                  className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  قيد التحضير
                </button>
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                  className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  تم التوصيل
                </button>
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                  className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <XCircle size={18} />
                  إلغاء الطلب
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default AdminDashboard