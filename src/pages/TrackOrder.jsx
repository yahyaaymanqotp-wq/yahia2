import { useState } from 'react'
import { Package, Search } from 'lucide-react'

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState(null)

  function handleSearch(e) {
    e.preventDefault()
    // هنعمل التتبع الحقيقي بعدين
    alert('قريباً: تتبع الطلبات برقم الطلب')
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-8">تتبع الطلب</h1>

        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-8">
          <div className="text-center mb-6">
            <Package size={60} className="text-[#D4AF37] mx-auto mb-4" />
            <p className="text-gray-400">ادخل رقم الطلب لتتبع حالته</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="رقم الطلب #"
                className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 pr-12 focus:border-[#D4AF37] focus:outline-none"
              />
              <Search className="absolute right-4 top-3.5 text-gray-500" size={20} />
            </div>

            <button
              type="submit"
              className="w-full bg-[#D4AF37] text-black py-3 rounded-xl font-bold hover:bg-[#D4AF37]/90"
            >
              تتبع الطلب
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            هتلاقي رقم الطلب في رسالة التأكيد
          </p>
        </div>
      </div>
    </div>
  )
}