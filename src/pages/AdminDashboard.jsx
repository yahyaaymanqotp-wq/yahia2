import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Store, Truck, Package, Upload, LogOut, Plus, X, Edit, Trash2, DollarSign, TrendingUp, BarChart3 } from 'lucide-react'

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])
  const [deliveryCompanies, setDeliveryCompanies] = useState([])
  const [stats, setStats] = useState({ shops: 0, companies: 0, orders: 0 })
  const [shopSales, setShopSales] = useState({})
  const [companyEarnings, setCompanyEarnings] = useState({})

  const [showAddShop, setShowAddShop] = useState(false)
  const [showAddCompany, setShowAddCompany] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [shopForm, setShopForm] = useState({
    name: '',
    category_id: '',
    description: '',
    address: '',
    phone: '',
    logo_url: '',
    cover_image_url: '',
    username: '',
    password: ''
  })
  const [companyForm, setCompanyForm] = useState({
    name: '',
    phone: '',
    address: '',
    username: '',
    password: ''
  })

  useEffect(() => {
    const role = localStorage.getItem('user_role')
    if (role === 'admin') {
      setIsLoggedIn(true)
      loadData()
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (categories.length > 0 &&!shopForm.category_id) {
      setShopForm(prev => ({...prev, category_id: categories[0].id }))
    }
  }, [categories])

  async function loadData() {
    try {
      const [shopsRes, catsRes, companiesRes, ordersRes, shopLedgerRes, deliveryLedgerRes] = await Promise.all([
        supabase.from('shops').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('delivery_companies').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('id, shop_id, delivery_company_id, total_amount, delivery_fee, delivery_status'),
        supabase.from('shop_profit_ledger').select('*'),
        supabase.from('delivery_profit_ledger').select('*')
      ])

      setShops(shopsRes.data || [])
      setCategories(catsRes.data || [])
      setDeliveryCompanies(companiesRes.data || [])
      setStats({
        shops: shopsRes.data?.length || 0,
        companies: companiesRes.data?.length || 0,
        orders: ordersRes.data?.length || 0
      })

      const salesByShop = {}
      const earningsByCompany = {}

      ordersRes.data?.forEach(order => {
        if (order.delivery_status === 'delivered') {
          if (order.shop_id) {
            if (!salesByShop[order.shop_id]) {
              salesByShop[order.shop_id] = { total: 0, count: 0 }
            }
            salesByShop[order.shop_id].total += parseFloat(order.total_amount || 0)
            salesByShop[order.shop_id].count += 1
          }
          if (order.delivery_company_id) {
            if (!earningsByCompany[order.delivery_company_id]) {
              earningsByCompany[order.delivery_company_id] = { total: 0, count: 0 }
            }
            earningsByCompany[order.delivery_company_id].total += parseFloat(order.delivery_fee || 0)
            earningsByCompany[order.delivery_company_id].count += 1
          }
        }
      })

      // الارباح المحفوظة حتى لو الطلب اتحذف هتفضل
      shopLedgerRes.data?.forEach(row => {
        if (!salesByShop[row.shop_id]) salesByShop[row.shop_id] = { total: 0, count: 0 }
        salesByShop[row.shop_id].total += parseFloat(row.total_sales || 0)
        salesByShop[row.shop_id].count += parseInt(row.total_orders || 0)
      })
      deliveryLedgerRes.data?.forEach(row => {
        if (!earningsByCompany[row.company_id]) earningsByCompany[row.company_id] = { total: 0, count: 0 }
        earningsByCompany[row.company_id].total += parseFloat(row.total_earnings || 0)
        earningsByCompany[row.company_id].count += parseInt(row.total_orders || 0)
      })

      setShopSales(salesByShop)
      setCompanyEarnings(earningsByCompany)

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleClearShopProfit(shopId, shopName) {
    if (!confirm(`متأكد عايز تصفي ارباح ${shopName}؟\nهيتم تصفير الارباح في كل لوح التحكم وتبدأ العد من جديد`)) return
    try {
      await supabase.from('shop_profit_ledger').delete().eq('shop_id', shopId)
      await supabase.from('orders').delete().eq('shop_id', shopId).eq('delivery_status', 'delivered')
      alert(`✅ تم تصفية ارباح ${shopName}`)
      loadData()
    } catch (e) { alert(e.message) }
  }

  async function handleClearCompanyProfit(companyId, companyName) {
    if (!confirm(`متأكد عايز تصفي ارباح ${companyName}؟\nهيتم تصفير الارباح في كل لوح التحكم وتبدأ العد من جديد`)) return
    try {
      await supabase.from('delivery_profit_ledger').delete().eq('company_id', companyId)
      await supabase.from('orders').delete().eq('delivery_company_id', companyId).eq('delivery_status', 'delivered')
      alert(`✅ تم تصفية ارباح ${companyName}`)
      loadData()
    } catch (e) { alert(e.message) }
  }

  async function handleLogin(e) {
    e.preventDefault()
    try {
      const { data, error } = await supabase
  .from('admins')
  .select('*')
  .eq('username', loginForm.username)
  .eq('password', loginForm.password)
  .eq('is_active', true)
  .single()

      if (error ||!data) {
        alert('بيانات الدخول غير صحيحة')
        return
      }

      localStorage.setItem('user_role', 'admin')
      localStorage.setItem('admin_id', data.id)
      setIsLoggedIn(true)
      loadData()
    } catch (error) {
      alert('خطأ في تسجيل الدخول')
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('اختر صورة فقط')
      return
    }

    if (file.size > 5 * 1024) {
      alert('حجم الصورة كبير - الحد الأقصى 5MB')
      return
    }

    setUploadingLogo(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `shops/${fileName}`

      const { error: uploadError } = await supabase.storage
  .from('shop-images')
  .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
  .from('shop-images')
  .getPublicUrl(filePath)

      setShopForm(prev => ({...prev, logo_url: publicUrl }))
    } catch (error) {
      console.error('Upload error:', error)
      alert('فشل رفع الصورة: ' + error.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleAddShop(e) {
    e.preventDefault()

    if (!shopForm.name.trim() ||!shopForm.category_id ||!shopForm.username.trim() ||!shopForm.password.trim()) {
      alert('املأ الحقول المطلوبة: الاسم، القسم، اليوزرنيم، الباسورد')
      return
    }
    if (shopForm.password.length < 6) {
      alert('الباسورد لازم 6 حروف على الأقل')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase.from('shops').insert({
        name: shopForm.name.trim(),
        category_id: shopForm.category_id,
        description: shopForm.description.trim() || null,
        address: shopForm.address.trim() || null,
        phone: shopForm.phone.trim() || null,
        logo_url: shopForm.logo_url || null,
        cover_image_url: shopForm.cover_image_url || null,
        username: shopForm.username.trim(),
        password: shopForm.password,
        is_active: true,
        is_verified: true,
        rating: 5.0
      }).select()

      if (error) {
        if (error.code === '23505') {
          throw new Error('اليوزرنيم ده موجود بالفعل')
        }
        throw error
      }

      alert(`✅ تم إضافة المحل بنجاح!\n\nاسم المحل: ${shopForm.name}\nاليوزرنيم: ${shopForm.username}\nالباسورد: ${shopForm.password}`)

      setShopForm({
        name: '',
        category_id: categories[0]?.id || '',
        description: '',
        address: '',
        phone: '',
        logo_url: '',
        cover_image_url: '',
        username: '',
        password: ''
      })
      setShowAddShop(false)
      loadData()
    } catch (error) {
      console.error('Error:', error)
      alert('خطأ: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddCompany(e) {
    e.preventDefault()

    if (!companyForm.name.trim() ||!companyForm.username.trim() ||!companyForm.password.trim()) {
      alert('املأ الحقول المطلوبة')
      return
    }

    if (companyForm.password.length < 6) {
      alert('الباسورد لازم 6 حروف على الأقل')
      return
    }

    setSubmitting(true)
    try {
      if (editingCompany) {
        const { error } = await supabase.from('delivery_companies').update({
          name: companyForm.name.trim(),
          phone: companyForm.phone.trim() || null,
          address: companyForm.address.trim() || null,
          username: companyForm.username.trim(),
          password: companyForm.password
        }).eq('id', editingCompany.id)

        if (error) throw error
        alert('✅ تم تحديث الشركة')
      } else {
        const { error } = await supabase.from('delivery_companies').insert({
          name: companyForm.name.trim(),
          phone: companyForm.phone.trim() || null,
          address: companyForm.address.trim() || null,
          username: companyForm.username.trim(),
          password: companyForm.password,
          is_active: true
        })

        if (error) {
          if (error.code === '23505') {
            throw new Error('اليوزرنيم ده موجود بالفعل')
          }
          throw error
        }
        alert(`✅ تم إضافة شركة التوصيل!\n\nالاسم: ${companyForm.name}\nاليوزرنيم: ${companyForm.username}\nالباسورد: ${companyForm.password}`)
      }

      resetCompanyForm()
      loadData()
    } catch (error) {
      alert('خطأ: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  function resetCompanyForm() {
    setCompanyForm({ name: '', phone: '', address: '', username: '', password: '' })
    setShowAddCompany(false)
    setEditingCompany(null)
  }

  function handleEditCompany(company) {
    setEditingCompany(company)
    setCompanyForm({
      name: company.name,
      phone: company.phone || '',
      address: company.address || '',
      username: company.username,
      password: company.password
    })
    setShowAddCompany(true)
  }

  async function toggleShopStatus(shopId, currentStatus) {
    try {
      await supabase.from('shops').update({ is_active:!currentStatus }).eq('id', shopId)
      loadData()
    } catch (error) {
      alert('خطأ في تحديث الحالة')
    }
  }

  async function toggleCompanyStatus(companyId, currentStatus) {
    try {
      await supabase.from('delivery_companies').update({ is_active:!currentStatus }).eq('id', companyId)
      loadData()
    } catch (error) {
      alert('خطأ في تحديث الحالة')
    }
  }

  async function handleDeleteCompany(companyId) {
    if (!confirm('متأكد عايز تمسح شركة التوصيل؟')) return
    const { error } = await supabase.from('delivery_companies').delete().eq('id', companyId)
    if (error) {
      alert('خطأ في المسح: ' + error.message)
    } else {
      loadData()
    }
  }

  function handleLogout() {
    localStorage.clear()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-[#D4AF37] text-xl">جاري التحميل...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md bg-[#1E1E1E] border border-[#333] rounded-2xl p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#D4AF37] mb-6 text-center">لوحة تحكم الأدمن</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="اسم المستخدم"
              value={loginForm.username}
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none"
              required
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-[#D4AF37] text-black py-3 rounded-xl font-bold hover:bg-[#D4AF37]/90"
            >
              تسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#D4AF37]">لوحة تحكم الأدمن</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500/20 text-red-400 px-4 md:px-6 py-2 rounded-lg font-bold flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <LogOut size={18} />
            خروج
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Store className="text-[#D4AF37]" />
              <h3 className="text-gray-400">المحلات</h3>
            </div>
            <p className="text-3xl md:text-4xl font-bold">{stats.shops}</p>
          </div>
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Truck className="text-[#D4AF37]" />
              <h3 className="text-gray-400">شركات التوصيل</h3>
            </div>
            <p className="text-3xl md:text-4xl font-bold">{stats.companies}</p>
          </div>
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="text-[#D4AF37]" />
              <h3 className="text-gray-400">الطلبات</h3>
            </div>
            <p className="text-3xl md:text-4xl font-bold">{stats.orders}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold">المحلات</h2>
              <button
                onClick={() => setShowAddShop(true)}
                className="bg-[#D4AF37] text-black px-3 md:px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm md:text-base"
              >
                <Plus size={18} />
                إضافة محل
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {shops.map(shop => (
                <div key={shop.id} className="bg-[#121212] rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-3 md:gap-4 mb-3">
                    {shop.logo_url && (
                      <img src={shop.logo_url} className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover flex-shrink-0" alt="" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{shop.name}</p>
                      <p className="text-xs md:text-sm text-gray-400">{shop.categories?.name}</p>
                      <p className="text-xs text-gray-500 truncate">@{shop.username}</p>
                    </div>
                    <button
                      onClick={() => toggleShopStatus(shop.id, shop.is_active)}
                      className={`px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm font-bold flex-shrink-0 ${
                        shop.is_active
                ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {shop.is_active? 'نشط' : 'موقوف'}
                    </button>
                  </div>
                  <div className="bg-[#1E1E1E] border border-[#D4AF37]/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign size={18} className="text-[#D4AF37]" />
                        <span className="text-sm text-gray-400">إجمالي المبيعات</span>
                      </div>
                      <span className="text-lg font-bold text-[#D4AF37]">
                        {(shopSales[shop.id]?.total || 0).toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                    <button onClick={() => handleClearShopProfit(shop.id, shop.name)} className="w-full mt-2 bg-red-500/10 border border-red-500/30 text-red-400 py-2 rounded-lg text-sm font-bold hover:bg-red-500/20 flex items-center justify-center gap-2">
                      <Trash2 size={14} /> تصفية الأرباح
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold">شركات التوصيل</h2>
              <button
                onClick={() => setShowAddCompany(true)}
                className="bg-[#D4AF37] text-black px-3 md:px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm md:text-base"
              >
                <Plus size={18} />
                إضافة شركة
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {deliveryCompanies.map(company => (
                <div key={company.id} className="bg-[#121212] rounded-xl p-3 md:p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{company.name}</p>
                      <p className="text-xs md:text-sm text-gray-400 truncate">@{company.username}</p>
                      {company.phone && <p className="text-xs md:text-sm text-gray-400">{company.phone}</p>}
                      {company.address && <p className="text-xs text-gray-500 truncate">{company.address}</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => toggleCompanyStatus(company.id, company.is_active)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          company.is_active
                    ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {company.is_active? 'نشط' : 'موقوف'}
                      </button>
                      <button
                        onClick={() => handleEditCompany(company)}
                        className="flex items-center justify-center gap-1 bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-lg hover:bg-[#D4AF37]/30 transition text-xs"
                      >
                        <Edit size={12} />
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company.id)}
                        className="flex items-center justify-center gap-1 bg-red-500/20 text-red-500 px-3 py-1 rounded-lg hover:bg-red-500/30 transition text-xs"
                      >
                        <Trash2 size={12} />
                        حذف
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#1E1E1E] border border-[#D4AF37]/30 rounded-lg p-3 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={18} className="text-[#D4AF37]" />
                        <span className="text-sm text-gray-400">الأرباح</span>
                      </div>
                      <span className="text-lg font-bold text-[#D4AF37]">
                        {(companyEarnings[company.id]?.total || 0).toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Package size={18} className="text-gray-400" />
                        <span className="text-sm text-gray-400">عدد الطلبات</span>
                      </div>
                      <span className="text-lg font-bold text-white">
                        {companyEarnings[company.id]?.count || 0}
                      </span>
                    </div>
                    <button onClick={() => handleClearCompanyProfit(company.id, company.name)} className="w-full bg-red-500/10 border border-red-500/30 text-red-400 py-2 rounded-lg text-sm font-bold hover:bg-red-500/20 flex items-center justify-center gap-2">
                      <Trash2 size={14} /> تصفية الأرباح
                    </button>
                  </div>
                </div>
              ))}
              {deliveryCompanies.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Truck size={40} className="mx-auto mb-2 opacity-50" />
                  <p>لسه مضفتش شركات توصيل</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {showAddShop && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#D4AF37]">إضافة محل جديد</h2>
                <button onClick={() => setShowAddShop(false)}><X size={24} /></button>
              </div>

              <form onSubmit={handleAddShop} className="space-y-4">
                <input type="text" placeholder="اسم المحل *" value={shopForm.name} onChange={(e) => setShopForm({...shopForm, name: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3" required />
                <select value={shopForm.category_id} onChange={(e) => setShopForm({...shopForm, category_id: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3" required><option value="">اختر القسم *</option>{categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select>
                <textarea placeholder="الوصف" value={shopForm.description} onChange={(e) => setShopForm({...shopForm, description: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3" rows="3" />
                <input type="text" placeholder="العنوان" value={shopForm.address} onChange={(e) => setShopForm({...shopForm, address: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3" />
                <input type="tel" placeholder="رقم الهاتف" value={shopForm.phone} onChange={(e) => setShopForm({...shopForm, phone: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3" />
                <div><label className="block text-sm text-gray-400 mb-2">لوجو المحل</label><div className="flex items-center gap-4">{shopForm.logo_url && (<img src={shopForm.logo_url} className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover" alt="" />)}<label className="flex-1 cursor-pointer"><div className="bg-[#121212] border border-[#333] border-dashed rounded-xl px-4 py-3 text-center hover:border-[#D4AF37] transition">{uploadingLogo? (<span className="text-[#D4AF37]">جاري الرفع...</span>) : (<span className="flex items-center justify-center gap-2 text-sm md:text-base"><Upload size={18} />اختر صورة</span>)}</div><input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} /></label></div></div>
                <div className="border-t border-[#333] pt-4"><p className="text-sm text-gray-400 mb-3">بيانات الدخول للمحل</p><input type="text" placeholder="اسم المستخدم *" value={shopForm.username} onChange={(e) => setShopForm({...shopForm, username: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 mb-3" required /><input type="password" placeholder="كلمة المرور * (6 حروف على الأقل)" value={shopForm.password} onChange={(e) => setShopForm({...shopForm, password: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3" required minLength={6} /></div>
                <div className="flex gap-3 pt-4"><button type="submit" disabled={submitting || uploadingLogo} className="flex-1 bg-[#D4AF37] text-black py-3 rounded-xl font-bold hover:bg-[#D4AF37]/90 disabled:opacity-50">{submitting? 'جاري الإضافة...' : 'إضافة المحل'}</button><button type="button" onClick={() => setShowAddShop(false)} className="flex-1 bg-[#333] text-white py-3 rounded-xl font-bold">إلغاء</button></div>
              </form>
            </div>
          </div>
        )}

        {showAddCompany && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6 md:p-8 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl md:text-2xl font-bold text-[#D4AF37]">{editingCompany? 'تعديل شركة التوصيل' : 'إضافة شركة توصيل'}</h2><button onClick={resetCompanyForm}><X size={24} /></button></div>
              <form onSubmit={handleAddCompany} className="space-y-4">
                <input type="text" placeholder="اسم الشركة *" value={companyForm.name} onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3" required />
                <input type="tel" placeholder="رقم الهاتف" value={companyForm.phone} onChange={(e) => setCompanyForm({...companyForm, phone: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3" />
                <input type="text" placeholder="العنوان" value={companyForm.address} onChange={(e) => setCompanyForm({...companyForm, address: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3" />
                <div className="border-t border-[#333] pt-4"><p className="text-sm text-gray-400 mb-3">بيانات الدخول</p><input type="text" placeholder="اسم المستخدم *" value={companyForm.username} onChange={(e) => setCompanyForm({...companyForm, username: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 mb-3" required /><input type="password" placeholder="كلمة المرور * (6 حروف على الأقل)" value={companyForm.password} onChange={(e) => setCompanyForm({...companyForm, password: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3" required minLength={6} /></div>
                <div className="flex gap-3 pt-4"><button type="submit" disabled={submitting} className="flex-1 bg-[#D4AF37] text-black py-3 rounded-xl font-bold hover:bg-[#D4AF37]/90 disabled:opacity-50">{submitting? 'جاري الحفظ...' : editingCompany? 'تحديث الشركة' : 'إضافة الشركة'}</button><button type="button" onClick={resetCompanyForm} className="flex-1 bg-[#333] text-white py-3 rounded-xl font-bold">إلغاء</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}