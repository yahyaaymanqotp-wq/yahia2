import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Trash2, Power, Store } from 'lucide-react'

export default function AdminDashboard({ profile }) {
  const navigate = useNavigate()

  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [shopName, setShopName] = useState('')
  const [shopDescription, setShopDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [shopLogo, setShopLogo] = useState(null)
  const [shopCover, setShopCover] = useState(null)

  useEffect(() => {
    if (profile && profile.role!== 'admin') {
      navigate('/')
      return
    }

    fetchShops()
    fetchCategories()
  }, [profile, navigate])

  async function fetchShops() {
    const { data, error } = await supabase
     .from('shops')
     .select('*')
     .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching shops:', error)
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
      console.error('Error fetching categories:', error)
      return
    }
    setCategories(data || [])
  }

  async function addCategory(e) {
    e.preventDefault()
    if (!categoryName.trim()) return

    setLoading(true)
    const { error } = await supabase
     .from('categories')
     .insert({
        name: categoryName.trim()
      })

    if (error) {
      alert('خطأ: ' + error.message)
    } else {
      setCategoryName('')
      fetchCategories()
    }
    setLoading(false)
  }

  async function uploadFile(file, folder) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { error } = await supabase.storage
     .from('shops')
     .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    const { data } = supabase.storage
     .from('shops')
     .getPublicUrl(fileName)

    return data.publicUrl
  }

  async function addShop(e) {
    e.preventDefault()

    if (!shopName.trim() ||!categoryId ||!ownerName.trim() ||!ownerEmail.trim() ||!ownerPassword) {
      alert('اكمل جميع البيانات المطلوبة')
      return
    }

    setLoading(true)

    try {
      const { data: existingShop } = await supabase
       .from('shops')
       .select('id')
       .eq('name', shopName.trim())
       .maybeSingle()

      if (existingShop) {
        alert('هذا المحل موجود بالفعل')
        setLoading(false)
        return
      }

      let logoUrl = '/default-shop-logo.png'
      let coverUrl = '/default-shop-cover.jpg'

      if (shopLogo) {
        try {
          logoUrl = await uploadFile(shopLogo, 'logos')
        } catch (error) {
          alert('خطأ في رفع اللوجو: ' + error.message)
          setLoading(false)
          return
        }
      }

      if (shopCover) {
        try {
          coverUrl = await uploadFile(shopCover, 'covers')
        } catch (error) {
          alert('خطأ في رفع الغلاف: ' + error.message)
          setLoading(false)
          return
        }
      }

      const { data: shopData, error: shopError } = await supabase
       .from('shops')
       .insert({
          name: shopName.trim(),
          description: shopDescription.trim(),
          category_id: Number(categoryId),
          is_active: true,
          image_url: logoUrl,
          cover_url: coverUrl
        })
       .select()
       .single()

      if (shopError) {
        alert('خطأ في إنشاء المحل: ' + shopError.message)
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/create-shop-owner`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: ownerEmail,
              password: ownerPassword,
              full_name: ownerName,
              shop_id: shopData.id
            })
          }
        )

        const result = await response.json()

        if (!response.ok) {
          await supabase.from('shops').delete().eq('id', shopData.id)
          alert(result.error || 'حدث خطأ أثناء إنشاء صاحب المحل')
          setLoading(false)
          return
        }

        alert(`تم إضافة المحل بنجاح ✅

اسم المحل: ${shopName}
اسم صاحب المحل: ${ownerName}
البريد الإلكتروني: ${ownerEmail}
كلمة المرور: ${ownerPassword}

قم بإرسال هذه البيانات لصاحب المحل.`)

        setShopName('')
        setShopDescription('')
        setCategoryId('')
        setOwnerName('')
        setOwnerEmail('')
        setOwnerPassword('')
        setShopLogo(null)
        setShopCover(null)
        document.getElementById('logo-input').value = ''
        document.getElementById('cover-input').value = ''

        fetchShops()

      } catch (error) {
        await supabase.from('shops').delete().eq('id', shopData.id)
        alert('حدث خطأ في الاتصال بالسيرفر. تأكد أن الباك إند شغال على localhost:3001')
        console.error(error)
      }

    } catch (error) {
      alert('حدث خطأ: ' + error.message)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleShop(id, isActive) {
    const { error } = await supabase
     .from('shops')
     .update({ is_active:!isActive })
     .eq('id', id)

    if (error) {
      alert('خطأ: ' + error.message)
    } else {
      fetchShops()
    }
  }

  // فانكشن الحذف الجديدة
  async function deleteShop(shopId, shopName, logoUrl, coverUrl) {
    if (!confirm(`متأكد عايز تحذف محل "${shopName}"؟\n\nهيتحذف معاه كل المنتجات والصور نهائياً ومش هتعرف ترجعهم!`)) {
      return
    }

    setDeletingId(shopId)

    try {
      // 1. احذف منتجات المحل
      const { error: productsError } = await supabase
       .from('products')
       .delete()
       .eq('shop_id', shopId)

      if (productsError) throw productsError

      // 2. احذف الصور من Storage
      const filesToDelete = []
      if (logoUrl &&!logoUrl.includes('default')) {
        const logoPath = logoUrl.split('/shops/')[1]
        if (logoPath) filesToDelete.push(logoPath)
      }
      if (coverUrl &&!coverUrl.includes('default')) {
        const coverPath = coverUrl.split('/shops/')[1]
        if (coverPath) filesToDelete.push(coverPath)
      }

      if (filesToDelete.length > 0) {
        await supabase.storage.from('shops').remove(filesToDelete)
      }

      // 3. احذف المحل
      const { error: shopError } = await supabase
       .from('shops')
       .delete()
       .eq('id', shopId)

      if (shopError) throw shopError

      alert(`تم حذف محل "${shopName}" بنجاح ✅`)
      fetchShops()

    } catch (error) {
      alert('حصل خطأ في الحذف: ' + error.message)
      console.error(error)
    } finally {
      setDeletingId(null)
    }
  }

  if (profile?.role!== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Store className="mx-auto text-red-500 mb-4" size={64} />
          <p className="text-2xl font-bold text-white">غير مصرح بالدخول</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
            لوحة تحكم الأدمن
          </h1>
          <p className="text-white/60">إدارة المحلات والأقسام</p>
        </div>

        {/* إضافة قسم */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
            إضافة قسم جديد
          </h2>

          <form onSubmit={addCategory} className="flex gap-3">
            <input
              type="text"
              placeholder="اسم القسم"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:border-emerald-500 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading? 'جاري...' : 'إضافة'}
            </button>
          </form>
        </div>

        {/* إضافة محل */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            إضافة محل جديد
          </h2>

          <form onSubmit={addShop} className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="اسم المحل *"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none"
              disabled={loading}
            >
              <option value="" className="bg-slate-800">اختر القسم *</option>
              {categories.map(category => (
                <option key={category.id} value={category.id} className="bg-slate-800">
                  {category.name}
                </option>
              ))}
            </select>

            <textarea
              placeholder="وصف المحل"
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none md:col-span-2"
              rows="3"
              disabled={loading}
            />

            <input
              type="text"
              placeholder="اسم صاحب المحل *"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />

            <input
              type="email"
              placeholder="بريد صاحب المحل *"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />

            <input
              type="password"
              placeholder="كلمة مرور صاحب المحل *"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none md:col-span-2"
              disabled={loading}
            />

            <div>
              <label className="block mb-2 text-white/80 text-sm font-medium">لوجو المحل</label>
              <input
                id="logo-input"
                type="file"
                accept="image/*"
                onChange={(e) => setShopLogo(e.target.files[0])}
                className="bg-white/5 border border-white/10 rounded-xl p-3 w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block mb-2 text-white/80 text-sm font-medium">غلاف المحل</label>
              <input
                id="cover-input"
                type="file"
                accept="image/*"
                onChange={(e) => setShopCover(e.target.files[0])}
                className="bg-white/5 border border-white/10 rounded-xl p-3 w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl md:col-span-2 font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading? 'جاري الإضافة...' : 'إضافة المحل'}
            </button>
          </form>
        </div>

        {/* إدارة المحلات */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
            إدارة المحلات
            <span className="text-sm px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 mr-auto">
              {shops.length}
            </span>
          </h2>

          <div className="space-y-3">
            {shops.length === 0? (
              <div className="text-center py-12">
                <Store className="mx-auto text-white/20 mb-4" size={64} />
                <p className="text-white/60 text-lg">لا توجد محلات بعد</p>
              </div>
            ) : (
              shops.map(shop => (
                <div key={shop.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <img
                        src={shop.image_url || '/default-shop-logo.png'}
                        alt={shop.name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-white/10"
                      />
                      <div>
                        <h3 className="text-white font-bold text-lg">{shop.name}</h3>
                        <p className="text-white/50 text-sm">{shop.description || 'بدون وصف'}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          shop.is_active
                           ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {shop.is_active? 'مفعل' : 'موقوف'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleShop(shop.id, shop.is_active)}
                        className={`px-4 py-2 rounded-xl text-white font-bold flex items-center gap-2 transition-all hover:scale-105 ${
                          shop.is_active
                           ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        <Power size={18} />
                        {shop.is_active? 'إيقاف' : 'تفعيل'}
                      </button>

                      <button
                        onClick={() => deleteShop(shop.id, shop.name, shop.image_url, shop.cover_url)}
                        disabled={deletingId === shop.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        <Trash2 size={18} />
                        {deletingId === shop.id? 'جاري الحذف...' : 'حذف'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}