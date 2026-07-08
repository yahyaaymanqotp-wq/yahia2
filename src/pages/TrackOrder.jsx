import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Package, Search, Phone, MapPin, Store } from 'lucide-react'

const STATUS_CONFIG = {
  'pending': { label: 'قيد الانتظار', icon: '🆕', color: 'bg-gray-500' },
  'accepted': { label: 'تم الاستلام', icon: '📦', color: 'bg-yellow-500' },
  'preparing': { label: 'جاري التجهيز', icon: '⏳', color: 'bg-orange-500' },
  'shipping': { label: 'جاري الشحن', icon: '🚚', color: 'bg-blue-600' },
  'delivered': { label: 'تم التسليم', icon: '✅', color: 'bg-green-600' },
  'cancelled': { label: 'ملغي', icon: '❌', color: 'bg-red-600' },
};

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const pathId = window.location.pathname.split('/track/')[1]?.split('?')[0];
    if (pathId &&!isNaN(parseInt(pathId))) {
      setOrderId(pathId);
      searchById(parseInt(pathId));
    }
  }, []);

  async function searchById(id) {
    setLoading(true); setError(''); setOrder(null); setItems([]);
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('not found');
      let finalOrder = data;
      if (data.parent_order_id) {
        const { data: parent } = await supabase.from('orders').select('*').eq('id', data.parent_order_id).maybeSingle();
        if (parent) finalOrder = parent;
      }
      setOrder(finalOrder);
      const { data: orderItems } = await supabase.from('order_items').select('*').eq('order_id', finalOrder.id);
      setItems(orderItems || []);
    } catch (e) {
      console.error(e);
      setError('الطلب غير موجود');
    } finally { setLoading(false); }
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!orderId.trim() &&!phone.trim()) {
      setError('أدخل رقم الطلب أو رقم الهاتف'); return;
    }
    setLoading(true); setError(''); setOrder(null); setItems([]);

    try {
      if (orderId.trim()) {
        await searchById(parseInt(orderId.trim()));
        return;
      }

      const cleanPhone = phone.trim().replace(/\D/g, '');
      const last7 = cleanPhone.slice(-7);

      const { data: allOrders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;

      let found = allOrders.find(o => o.customer_phone === cleanPhone);
      if (!found) found = allOrders.find(o => o.customer_phone?.includes(last7));
      if (!found) found = allOrders.find(o => cleanPhone.includes(o.customer_phone?.slice(-7) || ''));

      if (!found) throw new Error('not found');

      let finalOrder = found;
      if (found.parent_order_id) {
        const parent = allOrders.find(o=>o.id === found.parent_order_id);
        if (parent) finalOrder = parent;
        else {
          const { data: p } = await supabase.from('orders').select('*').eq('id', found.parent_order_id).maybeSingle();
          if (p) finalOrder = p;
        }
      }

      setOrder(finalOrder);
      const { data: orderItems } = await supabase.from('order_items').select('*').eq('order_id', finalOrder.id);
      setItems(orderItems || []);

    } catch (err) {
      console.error(err);
      setError(`مفيش طلب بالرقم ${phone || orderId}`);
    } finally { setLoading(false); }
  }

  const groupedByShop = useMemo(() => {
    if (!items.length) return [];
    const g = {};
    items.forEach(item => {
      const name = item.shop_name || 'محل غير محدد';
      if (!g[name]) g[name] = { name, items: [], subtotal: 0 };
      const price = parseFloat(item.price || 0);
      const qty = parseFloat(item.quantity || 1);
      const sub = parseFloat(item.subtotal || 0);
      const itemTotal = sub > 0? sub : price * qty;
      const calcPrice = price > 0? price : (qty > 0? itemTotal / qty : itemTotal);
      g[name].items.push({...item, _calcPrice: calcPrice, _calcTotal: itemTotal, _qty: qty });
      g[name].subtotal += itemTotal;
    });
    return Object.values(g);
  }, [items]);

  const calculatedSubtotal = groupedByShop.reduce((s, shop) => s + shop.subtotal, 0);
  const deliveryFee = parseFloat(order?.delivery_fee || 0);
  const finalTotal = calculatedSubtotal + deliveryFee;
  const currentIndex = order? Object.keys(STATUS_CONFIG).indexOf(order.delivery_status) : 0;

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-8 text-center">تتبع الطلب</h1>

        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-8 mb-8">
          <div className="text-center mb-6">
            <Package size={60} className="text-[#D4AF37] mx-auto mb-4" />
            <p className="text-gray-400">ادخل رقم الطلب أو رقم الهاتف</p>
          </div>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input type="number" value={orderId} onChange={e=>setOrderId(e.target.value)} placeholder="رقم الطلب" className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 pr-12 focus:border-[#D4AF37] focus:outline-none" />
              <Search className="absolute right-4 top-3.5 text-gray-500" size={20} />
            </div>
            <div className="flex items-center gap-4"><div className="flex-1 h-px bg-[#333]"></div><span className="text-gray-500 text-sm">أو</span><div className="flex-1 h-px bg-[#333]"></div></div>
            <div className="relative">
              <input type="tel" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="01xxxxxxxxx" maxLength={11} className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 pr-12 focus:border-[#D4AF37] focus:outline-none" />
              <Phone className="absolute right-4 top-3.5 text-gray-500" size={20} />
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">{error}</div>}
            <button disabled={loading} className="w-full bg-[#D4AF37] text-black py-3 rounded-xl font-bold hover:bg-[#D4AF37]/90 transition disabled:opacity-50">{loading?'جاري البحث...':'تتبع الطلب'}</button>
          </form>
        </div>

        {order && (
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-[#333]">
              <div><h2 className="text-2xl font-bold">طلب #{order.id}</h2><p className="text-gray-400 text-sm">{new Date(order.created_at).toLocaleString('ar-EG')}</p></div>
              <div className={`px-4 py-2 rounded-xl font-bold text-white ${STATUS_CONFIG[order.delivery_status]?.color}`}>{STATUS_CONFIG[order.delivery_status]?.icon} {STATUS_CONFIG[order.delivery_status]?.label}</div>
            </div>

            <div className="relative">
              <div className="flex justify-between mb-2">
                {Object.entries(STATUS_CONFIG).filter(([k])=>k!=='cancelled').map(([key, config], idx) => {
                  const isActive = idx <= currentIndex
                  return (<div key={key} className="flex flex-col items-center flex-1"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isActive? config.color : 'bg-[#333]'}`}>{config.icon}</div><p className={`text-xs mt-2 ${isActive? 'text-white' : 'text-gray-600'}`}>{config.label}</p></div>)
                })}
              </div>
              <div className="h-1 bg-[#333] rounded-full overflow-hidden mt-4"><div className={`h-full ${STATUS_CONFIG[order.delivery_status]?.color} transition-all duration-500`} style={{ width: `${((currentIndex + 1) / 5) * 100}%` }} /></div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#121212] rounded-xl p-4"><p className="text-sm text-gray-400 mb-1">العميل</p><p className="font-bold">{order.customer_name}</p><p className="text-sm text-gray-400 mt-1" dir="ltr">{order.customer_phone}</p></div>
              <div className="bg-[#121212] rounded-xl p-4"><p className="text-sm text-gray-400 mb-1 flex items-center gap-1"><MapPin size={14} />العنوان</p><p className="font-bold">{order.customer_address}</p></div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Store size={18} className="text-[#D4AF37]" />تفاصيل الطلب ({groupedByShop.length} محل)</h3>
              <div className="space-y-4">
                {groupedByShop.map((shop,i)=>(
                  <div key={i} className="bg-[#121212] border border-[#333] rounded-xl overflow-hidden">
                    <div className="bg-[#1E1E1E] p-3 flex justify-between items-center border-b border-[#333]"><span className="font-bold text-[#D4AF37]">🏪 {shop.name}</span><span className="font-bold text-white text-sm">{shop.subtotal.toFixed(2)} ج.م</span></div>
                    <div className="p-3 space-y-2">
                      {shop.items.map((it,j)=>
                        <div key={j} className="flex justify-between items-center bg-[#1E1E1E] rounded-xl p-3">
                          <div><p className="font-bold text-sm">{it.product_name}</p><p className="text-xs text-gray-400">{it._qty} × {it._calcPrice.toFixed(2)} ج.م</p></div>
                          <p className="font-bold text-[#D4AF37]">{it._calcTotal.toFixed(2)} ج.م</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#121212] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-gray-400"><span>إجمالي المنتجات:</span><span className="font-bold text-white">{calculatedSubtotal.toFixed(2)} ج.م</span></div>
              <div className="flex justify-between text-gray-400"><span>التوصيل:</span><span className="font-bold text-white">{deliveryFee.toFixed(2)} ج.م</span></div>
              <div className="flex justify-between text-xl font-black text-[#D4AF37] pt-2 border-t border-[#333]"><span>الإجمالي:</span><span>{finalTotal.toFixed(2)} ج.م</span></div>
            </div>

            {order.notes && <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"><p className="text-sm text-yellow-400 font-bold mb-1">ملاحظات:</p><p className="text-white">{order.notes}</p></div>}
          </div>
        )}
      </div>
    </div>
  )
}