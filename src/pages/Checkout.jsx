import { supabase } from "../lib/supabase";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingCart, User, Phone, MapPin, FileText, ArrowRight, Store, Truck, CheckCircle } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState([]);
  const [shopsMap, setShopsMap] = useState({});
  const [showSuccess, setShowSuccess] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    loadCart();
    loadShops();
  }, []);

  async function loadShops() {
    try {
      const { data, error } = await supabase
      .from("shops")
      .select("id, name, delivery_fee, min_order");
      if (error) return;
      const map = {};
      data?.forEach(shop => {
        map[shop.id] = shop;
      });
      setShopsMap(map);
    } catch (error) {
      console.error("Error loading shops:", error);
    }
  }

  function loadCart() {
    const data = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(data);
  }

  function handleChange(e) {
    setForm({
    ...form,
      [e.target.name]: e.target.value,
    });
  }

  const groupedByShop = useMemo(() => {
    const grouped = {};
    cart.forEach(item => {
      const shopId = item.shop_id || item.shop_name;
      const shopName = item.shop_name || shopsMap[shopId]?.name || "غير محدد";
      const shopData = shopsMap[shopId] || {};
      if (!grouped[shopId]) {
        grouped[shopId] = {
          shopId,
          shopName,
          shopData,
          items: [],
          subtotal: 0
        };
      }
      grouped[shopId].items.push(item);
      grouped[shopId].subtotal += parseFloat(item.price || 0) * item.quantity;
    });
    return Object.values(grouped);
  }, [cart, shopsMap]);

  const subtotal = groupedByShop.reduce((sum, shop) => sum + shop.subtotal, 0)
  const totalDeliveryFee = groupedByShop.reduce((sum, shop) => {
    return sum + parseFloat(shop.shopData?.delivery_fee || 0)
  }, 0)
  const total = subtotal + totalDeliveryFee
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  const shopsBelowMin = groupedByShop.filter(shop => {
    const minOrder = parseFloat(shop.shopData?.min_order || 0)
    return minOrder > 0 && shop.subtotal < minOrder
  })

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() ||!form.phone.trim() ||!form.address.trim()) {
      alert("من فضلك أكمل جميع البيانات المطلوبة");
      return;
    }
    const phone = form.phone.trim();
    if (!/^01[0-9]{9}$/.test(phone)) {
      alert("من فضلك أدخل رقم موبايل مصري صحيح");
      return;
    }
    if (cart.length === 0) {
      alert("السلة فارغة");
      return;
    }
    if (shopsBelowMin.length > 0) {
      alert("بعض المحلات لم تصل للحد الأدنى للطلب");
      return;
    }
    setSubmitting(true);
    try {
      const { data: mainOrder, error: mainError } = await supabase
      .from("orders")
      .insert({
          shop_id: null,
          customer_name: form.name.trim(),
          customer_phone: form.phone.trim(),
          customer_address: form.address.trim(),
          notes: form.notes.trim() || null,
          subtotal: subtotal,
          delivery_fee: totalDeliveryFee,
          total_amount: total,
          delivery_status: "pending",
          payment_status: "pending"
        })
      .select()
      .single();
      if (mainError) throw mainError;

      const mainOrderItems = cart.map(item => ({
        order_id: mainOrder.id,
        product_id: item.product_id,
        product_name: item.name,
        shop_id: (item.shop_id || "").toString(),
        shop_name: item.shop_name || shopsMap[item.shop_id]?.name || "غير محدد",
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.price) * item.quantity
      }));
      const { error: mainItemsError } = await supabase.from("order_items").insert(mainOrderItems);
      if (mainItemsError) throw mainItemsError;

      for (const shop of groupedByShop) {
        const shopDeliveryFee = parseFloat(shop.shopData?.delivery_fee || 0)
        const shopTotal = shop.subtotal + shopDeliveryFee
        const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
            shop_id: shop.shopId,
            parent_order_id: mainOrder.id,
            customer_name: form.name.trim(),
            customer_phone: form.phone.trim(),
            customer_address: form.address.trim(),
            notes: form.notes.trim() || null,
            subtotal: shop.subtotal,
            delivery_fee: shopDeliveryFee,
            total_amount: shopTotal,
            delivery_status: "pending",
            payment_status: "pending"
          })
        .select()
        .single();
        if (orderError) throw orderError;
        const orderItems = shop.items.map(item => ({
          order_id: orderData.id,
          product_id: item.product_id,
          product_name: item.name,
          shop_id: shop.shopId.toString(),
          shop_name: shop.shopName,
          quantity: item.quantity,
          price: parseFloat(item.price),
          subtotal: parseFloat(item.price) * item.quantity
        }));
        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;
      }
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event('cartUpdated'));
      setShowSuccess({ id: mainOrder.id, total: total.toFixed(2), count: totalItems });
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء حفظ الطلب: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4" dir="rtl">
        <div className="bg-[#1E1E1E] border border-[#333] rounded-3xl p-8 md:p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-[#D4AF37]" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">تم تأكيد طلبك بنجاح</h1>
          <p className="text-gray-400 mb-6 leading-relaxed">
            شكراً لثقتك بنا يا <span className="text-white font-bold">{form.name}</span><br/>
            طلبك رقم <span className="text-[#D4AF37] font-bold">#{showSuccess.id}</span> قيد التجهيز الآن
          </p>
          <div className="bg-[#121212] border border-[#333] rounded-2xl p-4 mb-6 text-sm">
            <div className="flex justify-between text-gray-400 mb-2"><span>عدد المنتجات</span><span className="text-white font-bold">{showSuccess.count} منتج</span></div>
            <div className="flex justify-between text-gray-400"><span>الإجمالي</span><span className="text-[#D4AF37] font-black text-lg">{showSuccess.total} ج.م</span></div>
          </div>
          <p className="text-xs text-gray-500 mb-6">سيتواصل معك فريق التوصيل قريباً على رقم {form.phone} لتأكيد العنوان</p>
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">تابع الطلب من لوحة تتبع الطلب</p>
            <button onClick={()=>navigate("/")} className="w-full py-3 rounded-xl bg-[#121212] border border-[#333] text-white font-bold hover:bg-[#2a2a2a] transition">العودة للرئيسية</button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4" dir="rtl">
        <div className="text-center">
          <ShoppingCart size={80} className="mx-auto mb-6 text-[#D4AF37]/40" />
          <h1 className="text-4xl font-bold text-white mb-5">سلة المشتريات فارغة</h1>
          <Link to="/" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#D4AF37]/90 transition">
            <ArrowRight size={20} />العودة للتسوق
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/cart')} className="bg-[#1E1E1E] border border-[#333] p-3 rounded-xl hover:bg-[#2a2a2a] transition">
            <ArrowRight size={20} className="text-[#D4AF37]" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-[#D4AF37] mb-2">إتمام الطلب</h1>
            <p className="text-gray-400">{totalItems} منتج من {groupedByShop.length} محل</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-[#D4AF37] mb-6 flex items-center gap-2"><User size={24} />بيانات التوصيل</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2"><User size={16} />الاسم بالكامل *</label>
                  <input type="text" name="name" value={form.name} placeholder="الاسم الثلاثي" onChange={handleChange} className="w-full rounded-xl p-4 bg-[#121212] text-white border border-[#333] focus:border-[#D4AF37] focus:outline-none transition" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2"><Phone size={16} />رقم الموبايل *</label>
                  <input type="tel" name="phone" value={form.phone} placeholder="01xxxxxxxxx" maxLength={11} inputMode="numeric" onChange={(e) => { const value = e.target.value.replace(/\D/g, ""); setForm({...form, phone: value }); }} className="w-full rounded-xl p-4 bg-[#121212] text-white border border-[#333] focus:border-[#D4AF37] focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2"><MapPin size={16} />العنوان بالتفصيل أو لينك الموقع على الخريطة *</label>
                  <textarea name="address" value={form.address} placeholder="مثال: شارع التحرير، عمارة 5، الدور 3، شقة 10&#10;أو: https://maps.app.goo.gl/..." rows="3" onChange={handleChange} className="w-full rounded-xl p-4 bg-[#121212] text-white border border-[#333] focus:border-[#D4AF37] focus:outline-none resize-none" required />
                  <p className="text-xs text-gray-500 mt-1">اكتب العنوان كامل أو الصق لينك Google Maps</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2"><FileText size={16} />ملاحظات (اختياري)</label>
                  <textarea name="notes" value={form.notes} placeholder="أي ملاحظات إضافية للتوصيل" rows="3" onChange={handleChange} className="w-full rounded-xl p-4 bg-[#121212] text-white border border-[#333] focus:border-[#D4AF37] focus:outline-none resize-none" />
                </div>
                <button type="submit" disabled={submitting || shopsBelowMin.length > 0} className="w-full py-4 rounded-xl bg-[#D4AF37] text-black font-bold text-lg hover:bg-[#D4AF37]/90 transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait disabled:hover:scale-100">
                  {submitting? 'جاري الإرسال...' : 'تأكيد الطلب'}
                </button>
                {shopsBelowMin.length > 0 && (<p className="text-yellow-400 text-sm text-center">⚠️ بعض المحلات لم تصل للحد الأدنى للطلب</p>)}
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-[#D4AF37] mb-6">ملخص الطلب</h2>
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {groupedByShop.map((shop) => {
                  const deliveryFee = parseFloat(shop.shopData?.delivery_fee || 0)
                  return (
                    <div key={shop.shopId} className="bg-[#121212] border border-[#333] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#333]"><Store size={16} className="text-[#D4AF37]" /><p className="font-bold text-[#D4AF37] text-sm">{shop.shopName}</p></div>
                      <div className="space-y-2">
                        {shop.items.map((item) => (
                          <div key={item.product_id} className="flex items-center gap-2 text-sm">
                            <img src={item.image_url || "https://via.placeholder.com/40"} className="w-10 h-10 rounded object-cover" alt={item.name} />
                            <div className="flex-1 min-w-0"><p className="text-white truncate text-xs">{item.name}</p><p className="text-gray-400 text-xs">x{item.quantity}</p></div>
                            <p className="text-[#D4AF37] font-bold text-xs">{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#333] space-y-1 text-xs">
                        <div className="flex justify-between text-gray-400"><span>إجمالي المحل:</span><span className="text-white font-bold">{shop.subtotal.toFixed(2)} ج.م</span></div>
                        <div className="flex justify-between text-gray-400"><span className="flex items-center gap-1"><Truck size={12} />التوصيل:</span>{deliveryFee > 0? (<span className="text-white font-bold">{deliveryFee.toFixed(2)} ج.م</span>) : (<span className="text-[#D4AF37] font-bold text-xs">تابع مع شركة الشحن</span>)}</div>
                        {parseFloat(shop.shopData?.min_order || 0) > 0 && shop.subtotal < shop.shopData.min_order && (<div className="text-yellow-400 text-xs">⚠️ الحد الأدنى: {parseFloat(shop.shopData.min_order).toFixed(2)} ج.م</div>)}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-[#333] pt-4 space-y-3">
                <div className="flex justify-between text-gray-400"><span>إجمالي المنتجات:</span><span className="font-bold text-white">{subtotal.toFixed(2)} ج.م</span></div>
                <div className="flex justify-between text-gray-400"><span>رسوم التوصيل:</span>{totalDeliveryFee > 0? (<span className="font-bold text-white">{totalDeliveryFee.toFixed(2)} ج.م</span>) : (<span className="text-[#D4AF37] font-bold text-xs">تابع مع شركة الشحن</span>)}</div>
                <div className="border-t border-[#333] pt-3">
                  <div className="flex justify-between text-xl"><span className="font-bold text-white">الإجمالي:</span><span className="font-black text-[#D4AF37]">{total.toFixed(2)} ج.م</span></div>
                  {totalDeliveryFee > 0 && (<p className="text-xs text-gray-500 mt-1 text-left">+ مصاريف الشحن</p>)}
                  {totalDeliveryFee === 0 && (<p className="text-xs text-[#D4AF37] mt-1 text-left">+ رسوم التوصيل (تابع مع شركة الشحن)</p>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}