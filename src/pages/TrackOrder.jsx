import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Package, Search, CheckCircle, Clock, Truck, XCircle, Phone, MapPin, Store, DollarSign } from 'lucide-react'

const STATUS_CONFIG = {
  'pending': { label: 'قيد الانتظار', icon: '🆕', color: 'bg-gray-500', textColor: 'text-gray-400' },
  'accepted': { label: 'تم الاستلام', icon: '📦', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  'preparing': { label: 'جاري التجهيز', icon: '⏳', color: 'bg-orange-500', textColor: 'text-orange-400' },
  'shipping': { label: 'جاري الشحن', icon: '🚚', color: 'bg-blue-600', textColor: 'text-blue-400' },
  'delivered': { label: 'تم التسليم', icon: '✅', color: 'bg-green-600', textColor: 'text-green-400' },
  'cancelled': { label: 'ملغي', icon: '❌', color: 'bg-red-600', textColor: 'text-red-400' },
};

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Realtime للطلب المفتوح
  useEffect(() => {
    if (!order?.id) return

    const channel = supabase
     .channel(`order_${order.id}`)
     .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${order.id}`
      }, (payload) => {
        setOrder(prev => ({...prev, ...payload.new }))
      })
     .subscribe()

    return () => supabase.removeChannel(channel)
  }, [order?.id])

  async function handleSearch(e) {
    e.preventDefault()
    setError('')
    setOrder(null)

    if (!orderId.trim() &&!phone.trim()) {
      setError('أدخل رقم الطلب أو رقم الهاتف')
      return
    }

    setLoading(true)

    try {
      let query = supabase
       .from('orders')
       .select(`
          *,
          shops(name, phone, address, logo_url),
          delivery_companies(name, phone),
          order_items(*, products(name, image_url))
        `)

      if (orderId.trim()) {
        query = query.eq('id', parseInt(orderId.trim()))
      } else {
        query = query.eq('customer_phone', phone.trim())
       .order('created_at', { ascending: false })
       .limit(1)
      }

      const { data, error: fetchError } = await query.single()

      if (fetchError) throw fetchError
      if (!data) throw new Error('الطلب غير موجود')

      setOrder(data)
    } catch (err) {
      setError('الطلب غير موجود أو رقم الهاتف غير صحيح')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIndex = (status) => {
    return Object.keys(STATUS_CONFIG).indexOf(status)
  }

  const currentIndex = order? getStatusIndex(order.delivery_status) : 0

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-8 text-center">تتبع الطلب</h1>

        {/* فورم البحث */}
        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-8 mb-8">
          <div className="text-center mb-6">
            <Package size={60} className="text-[#D4AF37] mx-auto mb-4" />
            <p className="text-gray-400">ادخل رقم الطلب أو رقم الهاتف</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">رقم الطلب</label>
              <div className="relative">
                <input
                  type="number"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="مثال: 123"
                  className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 pr-12 focus:border-[#D4AF37] focus:outline-none"
                />
                <Search className="absolute right-4 top-3.5 text-gray-500" size={20} />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-[#333]"></div>
              <span className="text-gray-500 text-sm">أو</span>
              <div className="flex-1 h-px bg-[#333]"></div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">رقم الهاتف</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="01xxxxxxxxx"
                  maxLength={11}
                  className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 pr-12 focus:border-[#D4AF37] focus:outline-none"
                />
                <Phone className="absolute right-4 top-3.5 text-gray-500" size={20} />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-black py-3 rounded-xl font-bold hover:bg-[#D4AF37]/90 transition disabled:opacity-50"
            >
              {loading? 'جاري البحث...' : 'تتبع الطلب'}
            </button>
          </form>
        </div>

        {/* عرض الطلب */}
        {order && (
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6 space-y-6">
            
            {/* الهيدر */}
            <div className="flex items-center justify-between pb-6 border-b border-[#333]">
              <div>
                <h2 className="text-2xl font-bold">طلب #{order.id}</h2>
                <p className="text-gray-400 text-sm">
                  {new Date(order.created_at).toLocaleString('ar-EG')}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-xl font-bold text-white ${STATUS_CONFIG[order.delivery_status]?.color}`}>
                {STATUS_CONFIG[order.delivery_status]?.icon} {STATUS_CONFIG[order.delivery_status]?.label}
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="relative">
              <div className="flex justify-between mb-2">
                {Object.entries(STATUS_CONFIG).filter(([key]) => key!== 'cancelled').map(([key, config], idx) => {
                  const isActive = idx <= currentIndex
                  const isCurrent = key === order.delivery_status
                  return (
                    <div key={key} className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                        isActive? config.color : 'bg-[#333]'
                      } ${isCurrent? 'ring-4 ring-[#D4AF37] scale-110' : ''}`}>
                        {config.icon}
                      </div>
                      <p className={`text-xs mt-2 text-center ${isActive? config.textColor : 'text-gray-600'}`}>
                        {config.label}
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className="h-1 bg-[#333] rounded-full overflow-hidden mt-4">
                <div 
                  className={`h-full ${STATUS_CONFIG[order.delivery_status]?.color} transition-all duration-500`}
                  style={{ width: `${((currentIndex + 1) / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* تفاصيل العميل */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#121212] rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">العميل</p>
                <p className="font-bold text-lg">{order.customer_name}</p>
                <p className="text-sm text-gray-400 mt-1" dir="ltr">{order.customer_phone}</p>
              </div>

              <div className="bg-[#121212] rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  <MapPin size={14} />
                  العنوان
                </p>
                <p className="font-bold">{order.customer_address}</p>
              </div>
            </div>

            {/* تفاصيل المحل */}
            {order.shops && (
              <div className="bg-[#121212] rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                  <Store size={14} />
                  المحل
                </p>
                <div className="flex items-center gap-3">
                  {order.shops.logo_url && (
                    <img src={order.shops.logo_url} className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="font-bold text-lg">{order.shops.name}</p>
                    <p className="text-sm text-gray-400" dir="ltr">{order.shops.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* شركة التوصيل */}
            {order.delivery_companies && (
              <div className="bg-[#121212] rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                  <Truck size={14} />
                  شركة التوصيل
                </p>
                <p className="font-bold text-lg">{order.delivery_companies.name}</p>
                <p className="text-sm text-gray-400" dir="ltr">{order.delivery_companies.phone}</p>
              </div>
            )}

            {/* المنتجات */}
            {order.order_items && order.order_items.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3">المنتجات ({order.order_items.length})</h3>
                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-[#121212] rounded-xl p-3">
                      <img
                        src={item.products?.image_url || 'https://via.placeholder.com/60'}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-bold">{item.product_name}</p>
                        <p className="text-sm text-gray-400">
                          {item.quantity} × {item.price} ج.م
                        </p>
                      </div>
                      <p className="font-bold text-[#D4AF37]">
                        {item.subtotal} ج.م
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* الإجمالي */}
            <div className="bg-[#121212] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>إجمالي المنتجات:</span>
                <span>{order.total_amount} ج.م</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>التوصيل:</span>
                <span>{order.delivery_fee || 0} ج.م</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-[#D4AF37] pt-2 border-t border-[#333]">
                <span>الإجمالي:</span>
                <span>{order.grand_total} ج.م</span>
              </div>
            </div>

            {order.notes && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-sm text-yellow-400 font-bold mb-1">ملاحظات:</p>
                <p className="text-white">{order.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}