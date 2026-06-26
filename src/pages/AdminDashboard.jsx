import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard({ profile }) {
  const navigate = useNavigate()

  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])

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
    if (profile && profile.role !== 'admin') {
      navigate('/')
      return
    }

    fetchShops()
    fetchCategories()
  }, [profile])

  async function fetchShops() {
    const { data } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false })

    setShops(data || [])
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('id')

    setCategories(data || [])
  }

  async function addCategory(e) {
    e.preventDefault()

    if (!categoryName) return

    await supabase
      .from('categories')
      .insert({
        name: categoryName
      })

    setCategoryName('')
    fetchCategories()
  }

 async function addShop(e) {
  e.preventDefault()

  if (
    !shopName ||
    !categoryId ||
    !ownerName ||
    !ownerEmail ||
    !ownerPassword
  ) {
    alert('اكمل جميع البيانات')
    return
  }

  // التحقق من وجود المحل مسبقاً
  const { data: existingShop } = await supabase
    .from('shops')
    .select('id')
    .eq('name', shopName)
    .maybeSingle()

  if (existingShop) {
    alert('هذا المحل موجود بالفعل')
    return
  }


if (shopLogo) {
  const fileName = `logos/${Date.now()}-${shopLogo.name}`

  const { error } = await supabase.storage
    .from('shops')
    .upload(fileName, shopLogo)

  if (!error) {
    logoUrl = supabase.storage
      .from('shops')
      .getPublicUrl(fileName)
      .data.publicUrl
  }
}

if (shopCover) {
  const fileName = `covers/${Date.now()}-${shopCover.name}`

  const { error } = await supabase.storage
    .from('shops')
    .upload(fileName, shopCover)

  if (!error) {
    coverUrl = supabase.storage
      .from('shops')
      .getPublicUrl(fileName)
      .data.publicUrl
  }
}
  // إنشاء المحل
  let logoUrl = '/default-shop-logo.png'
let coverUrl = '/default-shop-cover.jpg'
  const { data: shopData, error: shopError } =
    await supabase
      .from('shops')
      .insert({
  name: shopName,
  description: shopDescription,
  category_id: Number(categoryId),
  is_active: true,
  logo_url: logoUrl,
  cover_url: coverUrl
})
      .select()
      .single()

  if (shopError) {
    alert(shopError.message)
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
      // حذف المحل إذا فشل إنشاء المالك
      await supabase
        .from('shops')
        .delete()
        .eq('id', shopData.id)

      alert(result.error || 'حدث خطأ أثناء إنشاء صاحب المحل')
      return
    }

    alert(`
تم إضافة المحل بنجاح ✅

اسم المحل: ${shopName}

اسم صاحب المحل: ${ownerName}

البريد الإلكتروني:
${ownerEmail}

كلمة المرور:
${ownerPassword}

قم بإرسال هذه البيانات لصاحب المحل.
`)

    // تنظيف الحقول
    setShopName('')
    setShopDescription('')
    setCategoryId('')
    setOwnerName('')
    setOwnerEmail('')
    setOwnerPassword('')
    setShopLogo(null)
    setShopCover(null)

    fetchShops()

  } catch (error) {
    alert('حدث خطأ في الاتصال بالسيرفر')
    console.error(error)
  }
}

  async function toggleShop(id, isActive) {
    await supabase
      .from('shops')
      .update({
        is_active: !isActive
      })
      .eq('id', id)

    fetchShops()
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-xl">
        غير مصرح بالدخول
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">

      <h1 className="text-4xl font-bold mb-8">
        لوحة تحكم الأدمن
      </h1>

      {/* إضافة قسم */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">
          إضافة قسم جديد
        </h2>

        <form onSubmit={addCategory} className="flex gap-3">

          <input
            type="text"
            placeholder="اسم القسم"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="flex-1 border rounded-xl p-3"
          />

          <button
            className="bg-emerald-600 text-white px-6 rounded-xl"
          >
            إضافة
          </button>

        </form>
      </div>

      {/* إضافة محل */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">

        <h2 className="text-2xl font-bold mb-4">
          إضافة محل
        </h2>

        <form
          onSubmit={addShop}
          className="grid md:grid-cols-2 gap-4"
        >

          <input
            type="text"
            placeholder="اسم المحل"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="border rounded-xl p-3"
          />

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="">
              اختر القسم
            </option>

            {categories.map(category => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>

          <textarea
            placeholder="وصف المحل"
            value={shopDescription}
            onChange={(e) => setShopDescription(e.target.value)}
            className="border rounded-xl p-3 md:col-span-2"
          />
          <input
  type="text"
  placeholder="اسم صاحب المحل"
  value={ownerName}
  onChange={(e) => setOwnerName(e.target.value)}
  className="border rounded-xl p-3"
/>

<input
  type="email"
  placeholder="بريد صاحب المحل"
  value={ownerEmail}
  onChange={(e) => setOwnerEmail(e.target.value)}
  className="border rounded-xl p-3"
/>

<input
  type="password"
  placeholder="كلمة مرور صاحب المحل"
  value={ownerPassword}
  onChange={(e) => setOwnerPassword(e.target.value)}
  className="border rounded-xl p-3 md:col-span-2"
/>
<div>
  <label className="block mb-2">
    لوجو المحل
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setShopLogo(e.target.files[0])
    }
    className="border rounded-xl p-3 w-full"
  />
</div>

<div>
  <label className="block mb-2">
    غلاف المحل
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setShopCover(e.target.files[0])
    }
    className="border rounded-xl p-3 w-full"
  />
</div>


          <button
            className="bg-blue-600 text-white py-3 rounded-xl md:col-span-2"
          >
            إضافة المحل
          </button>

        </form>

      </div>

      {/* إدارة المحلات */}
      <div className="bg-white rounded-2xl shadow p-6">

        <h2 className="text-2xl font-bold mb-4">
          إدارة المحلات
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>
              <tr className="border-b">
                <th className="text-right p-3">المحل</th>
                <th className="text-right p-3">الحالة</th>
                <th className="text-right p-3">تحكم</th>
              </tr>
            </thead>

            <tbody>

              {shops.map(shop => (

                <tr key={shop.id} className="border-b">

                  <td className="p-3">
                    {shop.name}
                  </td>

                  <td className="p-3">
                    {shop.is_active ? 'مفعل' : 'موقوف'}
                  </td>

                  <td className="p-3">

                    <button
                      onClick={() =>
                        toggleShop(
                          shop.id,
                          shop.is_active
                        )
                      }
                      className={`px-4 py-2 rounded-xl text-white ${
                        shop.is_active
                          ? 'bg-red-600'
                          : 'bg-green-600'
                      }`}
                    >
                      {shop.is_active
                        ? 'إيقاف'
                        : 'تفعيل'}
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}