import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { Truck, Phone, EyeOff, LogOut, TrendingUp, CheckCircle, Clock, Package, Store, Trash2, Search } from "lucide-react";

const ORDER_FLOW = [
  { status: "pending", icon: "🆕", color: "bg-gray-500", label: "طلب جديد" },
  { status: "accepted", icon: "📦", color: "bg-yellow-500", label: "تم الاستلام" },
  { status: "preparing", icon: "⏳", color: "bg-orange-500", label: "جاري التجهيز" },
  { status: "shipping", icon: "🚚", color: "bg-blue-600", label: "جاري الشحن" },
  { status: "delivered", icon: "✅", color: "bg-green-600", label: "تم التسليم" },
];

const FINAL_STATUS = "delivered";

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [shopsMap, setShopsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [showPhone, setShowPhone] = useState({});
  const [activeTab, setActiveTab] = useState("all");
  const [deliveryFee, setDeliveryFee] = useState({});
  const [ledgerEarnings, setLedgerEarnings] = useState(0);
  const [ledgerCount, setLedgerCount] = useState(0);

  const deliveryCompanyId = localStorage.getItem('delivery_company_id');
  const companyName = localStorage.getItem('delivery_company_name');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const maskPhone = (phone) => {
    if (!phone) return "غير متوفر";
    const str = phone.toString();
    if (str.length < 8) return str;
    return str.slice(0, 3) + "****" + str.slice(-4);
  };

  const getShopName = (order) => {
    if (order.shops?.name) return order.shops.name;
    if (order.shop_id && shopsMap[order.shop_id]) return shopsMap[order.shop_id];
    if (order.shop_id && typeof order.shop_id === 'string' && order.shop_id.length > 10) return `محل ${order.shop_id.slice(0,8)}`;
    return "غير محدد";
  };

  const getOrderItemsTotal = (order) => {
    if (order.subtotal) return parseFloat(order.subtotal);
    if (!order.order_items?.length) return 0;
    return order.order_items.reduce((sum, item) => {
      return sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1));
    }, 0);
  };

  const getOrderTotal = (order) => {
    const itemsTotal = getOrderItemsTotal(order);
    const delivery = parseFloat(order.delivery_fee) || 0;
    return itemsTotal + delivery; // شامل التوصيل
  };

  const getStatusConfig = (status) => {
    return ORDER_FLOW.find(s => s.status === status) || ORDER_FLOW[0];
  };

  const getNextStatus = (currentStatus) => {
    const currentIndex = ORDER_FLOW.findIndex(s => s.status === currentStatus);
    if (currentIndex === -1 || currentIndex === ORDER_FLOW.length - 1) return null;
    return ORDER_FLOW[currentIndex + 1];
  };

  const getProgress = (status) => {
    const index = ORDER_FLOW.findIndex(s => s.status === status);
    return ((index + 1) / ORDER_FLOW.length) * 100;
  };

  useEffect(() => {
    loadShops();
    loadOrders();
    const channel = supabase
.channel("delivery_orders")
.on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadOrders)
.subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function loadShops() {
    try {
      const { data, error } = await supabase.from("shops").select("id, name");
      if (error) return;
      const map = {};
      data?.forEach(shop => { map[shop.id] = shop.name; });
      setShopsMap(map);
    } catch (error) { console.error(error); }
  }

  async function loadOrders() {
    try {
      const [ordersRes, ledgerRes] = await Promise.all([
        supabase.from("orders").select(`*, order_items(*)`).is("shop_id", null).order("created_at", { ascending: false }),
        supabase.from("delivery_profit_ledger").select("*").eq("company_id", deliveryCompanyId).maybeSingle()
      ]);
      if (ordersRes.error) throw ordersRes.error;
      setOrders(ordersRes.data || []);
      if (ledgerRes.data) {
        setLedgerEarnings(parseFloat(ledgerRes.data.total_earnings || 0));
        setLedgerCount(parseInt(ledgerRes.data.total_orders || 0));
      }
    } catch (error) {
      showToast("فشل تحميل الطلبات: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function moveToNextStatus(orderId, currentStatus, order) {
    const next = getNextStatus(currentStatus);
    if (!next) return;
    if (next.status === 'accepted' &&!order.delivery_fee) {
      const fee = deliveryFee[orderId];
      if (!fee || parseFloat(fee) <= 0) { showToast("أدخل سعر التوصيل أولاً", "error"); return; }
    }
    setUpdatingId(orderId);
    try {
      const updateData = { delivery_status: next.status, updated_at: new Date().toISOString() };
      if (deliveryCompanyId) updateData.delivery_company_id = deliveryCompanyId;
      if (next.status === 'accepted' && deliveryFee[orderId]) updateData.delivery_fee = parseFloat(deliveryFee[orderId]);

      const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);
      if (error) throw error;

      // لو وصل لتم التسليم - احفظ الربح في الجدول الدائم
      if (next.status === FINAL_STATUS) {
        const feeToSave = parseFloat(deliveryFee[orderId] || order.delivery_fee || 0);
        const totalToSave = getOrderTotal({...order, delivery_fee: feeToSave});

        // 1- حفظ ربح شركة التوصيل
        const { data: existingDel } = await supabase.from("delivery_profit_ledger").select("*").eq("company_id", deliveryCompanyId).maybeSingle();
        await supabase.from("delivery_profit_ledger").upsert({
          company_id: deliveryCompanyId.toString(),
          total_earnings: parseFloat(existingDel?.total_earnings || 0) + feeToSave,
          total_orders: (existingDel?.total_orders || 0) + 1
        }, { onConflict: 'company_id' });

        // 2- حفظ مبيعات كل محل (حتى لو الطلب اتحذف هتفضل في الادمن)
        const itemsByShop = {};
        (order.order_items || []).forEach(item => {
          const sid = item.shop_id?.toString();
          if (!sid) return;
          if (!itemsByShop[sid]) itemsByShop[sid] = 0;
          itemsByShop[sid] += parseFloat(item.price || 0) * parseFloat(item.quantity || 1);
        });

        for (const [shopId, shopTotal] of Object.entries(itemsByShop)) {
          const { data: existingShop } = await supabase.from("shop_profit_ledger").select("*").eq("shop_id", shopId).maybeSingle();
          await supabase.from("shop_profit_ledger").upsert({
            shop_id: shopId,
            total_sales: parseFloat(existingShop?.total_sales || 0) + shopTotal,
            total_orders: (existingShop?.total_orders || 0) + 1
          }, { onConflict: 'shop_id' });
        }
      }

      showToast(`✅ ${next.label}`, "success");
      loadOrders();
    } catch (error) {
      showToast("فشل التحديث", "error");
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteOrder(orderId) {
    if (!confirm("متأكد عاوز تحذف الطلب ده نهائي؟ الربح هيفضل محفوظ في لوحة الادمن")) return;
    const orderToDelete = orders.find(o=>o.id===orderId);
    try {
      // لو الطلب مكتمل ولسه متحفظش في الليدجر (طلبات قديمة) احفظه قبل الحذف
      if (orderToDelete?.delivery_status === FINAL_STATUS) {
        const feeToSave = parseFloat(orderToDelete.delivery_fee || 0);
        // نتأكد انه مش متسجل قبل كده عن طريق اننا بنسجله مرة واحدة بس عند التوصيل، فهنا مش هنسجل تاني
        // بس لو عايز تضمن ان القديم يتحفظ، فك الكومنت اللي تحت
        // await supabase.from("delivery_profit_ledger").upsert(...)
      }
      await supabase.from("orders").delete().eq("parent_order_id", orderId);
      await supabase.from("order_items").delete().eq("order_id", orderId);
      const { error } = await supabase.from("orders").delete().eq("id", orderId);
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id!== orderId));
      showToast("تم حذف الطلب - الربح فضل محفوظ", "success");
    } catch (e) {
      showToast("فشل الحذف: " + e.message, "error");
    }
  }

  const stats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter(o => o.delivery_status!== FINAL_STATUS && o.delivery_status!== "cancelled").length;
    const completed = orders.filter(o => o.delivery_status === FINAL_STATUS).length;
    const currentRevenue = orders.filter(o => o.delivery_status === FINAL_STATUS).reduce((sum, o) => sum + (parseFloat(o.delivery_fee) || 0), 0);
    const currentOrdersValue = orders.filter(o => o.delivery_status === FINAL_STATUS).reduce((sum, o) => sum + getOrderTotal(o), 0);
    const revenue = currentRevenue + ledgerEarnings; // شامل المحذوف
    const totalValue = currentOrdersValue + ledgerEarnings; // لو عايز الاجمالي شامل التوصيل
    return { total, active, completed, revenue, totalValue, currentRevenue, currentOrdersValue };
  }, [orders, ledgerEarnings]);

  const sortedAndFilteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const q = searchQuery.toLowerCase();
      return (order.id?.toString().includes(q) || order.customer_name?.toLowerCase().includes(q) || order.customer_phone?.includes(q) || getShopName(order).toLowerCase().includes(q));
    });
    if (activeTab === "active") filtered = filtered.filter(o => o.delivery_status!== FINAL_STATUS && o.delivery_status!== "cancelled");
    else if (activeTab === "completed") filtered = filtered.filter(o => o.delivery_status === FINAL_STATUS);
    return filtered.sort((a, b) => {
      const aIsDone = a.delivery_status === FINAL_STATUS;
      const bIsDone = b.delivery_status === FINAL_STATUS;
      if (aIsDone &&!bIsDone) return 1;
      if (!aIsDone && bIsDone) return -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [orders, searchQuery, activeTab, shopsMap]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-6" dir="rtl">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl font-bold text-black animate-bounce ${toast.type === 'success'? 'bg-[#D4AF37]' : 'bg-red-500 text-white'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 text-[#D4AF37]">لوحة شركة التوصيل</h1>
            <p className="text-gray-400">مرحبا {companyName} - بتشوف الطلبات المجمعة بس</p>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login' }} className="bg-[#1E1E1E] border border-[#333] text-gray-300 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#2a2a2a]">
            <LogOut size={18} />خروج
          </button>
        </div>

        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-4 mb-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input type="text" placeholder="ابحث برقم الطلب، اسم العميل، الهاتف، أو المحل..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#121212] border border-[#333] rounded-xl py-3 pr-12 pl-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2"><span className="text-2xl">📊</span><span className="text-sm text-gray-400">الإجمالي</span></div>
            <p className="text-4xl font-black text-white">{stats.total}</p><p className="text-sm text-gray-500 mt-1">طلب مجمع</p>
          </div>
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2"><span className="text-2xl">🚚</span><span className="text-sm text-gray-400">النشطة</span></div>
            <p className="text-4xl font-black text-[#D4AF37]">{stats.active}</p><p className="text-sm text-gray-500 mt-1">قيد التوصيل</p>
          </div>
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2"><span className="text-2xl">✅</span><span className="text-sm text-gray-400">المكتملة</span></div>
            <p className="text-4xl font-black text-green-400">{stats.completed + ledgerCount}</p><p className="text-sm text-gray-500 mt-1">تم التسليم (شامل المحذوف)</p>
          </div>
          <div className="bg-[#1E1E1E] border border-[#D4AF37]/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2"><span className="text-2xl">💰</span><span className="text-sm text-[#D4AF37]">الأرباح</span></div>
            <p className="text-3xl font-black text-[#D4AF37]">{stats.revenue.toLocaleString()} ج.م</p><p className="text-sm text-gray-500 mt-1">شامل التوصيل ولا ينقص بالحذف</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab("all")} className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === "all"? "bg-[#D4AF37] text-black" : "bg-[#1E1E1E] border border-[#333] text-gray-400 hover:bg-[#2a2a2a]"}`}>كل الطلبات ({stats.total})</button>
          <button onClick={() => setActiveTab("active")} className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === "active"? "bg-[#D4AF37] text-black" : "bg-[#1E1E1E] border border-[#333] text-gray-400 hover:bg-[#2a2a2a]"}`}>النشطة ({stats.active})</button>
          <button onClick={() => setActiveTab("completed")} className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === "completed"? "bg-[#D4AF37] text-black" : "bg-[#1E1E1E] border border-[#333] text-gray-400 hover:bg-[#2a2a2a]"}`}>المكتملة ({stats.completed})</button>
        </div>

        {sortedAndFilteredOrders.length === 0? (
          <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-12 text-center"><div className="text-6xl mb-4">📦</div><p className="text-xl text-gray-400">لا توجد طلبات مجمعة</p></div>
        ) : (
          <div className="grid gap-6">
            {sortedAndFilteredOrders.map((order) => {
              const config = getStatusConfig(order.delivery_status);
              const nextStatus = getNextStatus(order.delivery_status);
              const progress = getProgress(order.delivery_status);
              const isDone = order.delivery_status === FINAL_STATUS;
              const isUpdating = updatingId === order.id;
              const itemsTotal = getOrderItemsTotal(order);
              const orderTotal = getOrderTotal(order);
              const itemsByShop = {};
              (order.order_items || []).forEach((item) => {
                const sName = item.shop_name || (item.shop_id && shopsMap[item.shop_id]) || "محل غير محدد";
                if (!itemsByShop[sName]) itemsByShop[sName] = { name: sName, items: [], subtotal: 0 };
                itemsByShop[sName].items.push(item);
                itemsByShop[sName].subtotal += (parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1);
              });
              const shopGroups = Object.values(itemsByShop);

              return (
                <div key={order.id} className={`bg-[#1E1E1E] border border-[#333] rounded-2xl p-6 transition-all ${isDone? 'opacity-70' : 'hover:border-[#D4AF37]/30'}`}>
                  <div className="mb-6"><div className="h-2 bg-[#121212] rounded-full overflow-hidden"><div className={`h-full ${config.color} transition-all duration-500`} style={{ width: `${progress}%` }} /></div></div>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b border-[#333]">
                    <div><h2 className="text-2xl font-black text-white mb-2">طلب #{order.id} - مجمع {shopGroups.length} محل</h2><p className="text-gray-500 text-sm">{order.created_at? new Date(order.created_at).toLocaleString('ar-EG') : 'بدون تاريخ'}</p></div>
                    <span className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold ${config.color}`}><span className="text-xl">{config.icon}</span>{config.label}</span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#121212] border border-[#333] rounded-xl p-4"><p className="text-sm text-gray-500 font-bold mb-1">👤 اسم العميل</p><p className="font-black text-white text-lg">{order.customer_name || "غير متوفر"}</p></div>
                    <div className="bg-[#121212] border border-[#333] rounded-xl p-4"><p className="text-sm text-gray-500 font-bold mb-1">📱 رقم الهاتف</p><div className="flex items-center gap-2"><p className="font-mono font-black text-white text-lg" dir="ltr">{showPhone[order.id]? (order.customer_phone || "غير متوفر") : maskPhone(order.customer_phone)}</p><button onClick={() => setShowPhone(prev => ({...prev, [order.id]:!prev[order.id]}))} className="text-[#D4AF37] text-sm font-bold">{showPhone[order.id]? '🙈' : '👁️'}</button></div></div>
                    <div className="bg-[#121212] border border-[#333] rounded-xl p-4"><p className="text-sm text-gray-500 font-bold mb-1">💰 الإجمالي شامل التوصيل</p><p className="font-black text-[#D4AF37] text-2xl">{orderTotal.toLocaleString()} ج.م</p><p className="text-xs text-gray-500 mt-1">المنتجات: {itemsTotal.toLocaleString()} + {parseFloat(order.delivery_fee || 0).toLocaleString()} توصيل</p></div>
                    <div className="bg-[#121212] border border-[#333] rounded-xl p-4 md:col-span-2"><p className="text-sm text-gray-500 font-bold mb-1">📍 عنوان التوصيل</p><p className="font-bold text-white">{order.customer_address || "غير متوفر"}</p>{order.notes && <p className="text-sm text-gray-400 mt-2 bg-[#1E1E1E] p-2 rounded border border-[#333]">📝 {order.notes}</p>}</div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-bold text-lg mb-3 text-[#D4AF37]">الطلب متقسم حسب المحل ({shopGroups.length} محل)</h3>
                    <div className="space-y-3">
                      {shopGroups.map((sg, idx) => (
                        <div key={idx} className="bg-[#121212] rounded-xl border border-[#333] overflow-hidden">
                          <div className="bg-[#1E1E1E] p-3 flex justify-between items-center border-b border-[#333]"><div className="flex items-center gap-2"><Store size={16} className="text-[#D4AF37]" /><span className="font-bold text-white">🏪 {sg.name}</span><span className="text-xs bg-[#D4AF37] text-black px-2 py-1 rounded-full font-bold">{sg.items.length} منتج</span></div><span className="font-black text-[#D4AF37]">{sg.subtotal.toFixed(2)} ج.م</span></div>
                          <div className="p-3 grid md:grid-cols-2 gap-2">
                            {sg.items.map((item, index) => (<div key={index} className="bg-[#1E1E1E] rounded-lg p-3 border border-[#333] flex justify-between items-center"><div><h4 className="font-bold text-white text-sm truncate">{item.product_name || "منتج"}</h4><p className="text-xs text-gray-500">{item.quantity || 1} × {item.price || 0} ج.م</p></div><p className="font-black text-[#D4AF37] text-sm">{(item.price || 0) * (item.quantity || 1)} ج.م</p></div>))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.delivery_status === 'pending' &&!order.delivery_fee && (
                    <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4 mb-4">
                      <p className="text-sm text-[#D4AF37] font-bold mb-2">💰 أدخل سعر التوصيل</p>
                      <input type="number" step="0.01" placeholder="سعر التوصيل" value={deliveryFee[order.id] || ''} onChange={(e) => setDeliveryFee({...deliveryFee, [order.id]: e.target.value})} className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none" />
                    </div>
                  )}

                  {nextStatus &&!isDone && (<button onClick={() => moveToNextStatus(order.id, order.delivery_status, order)} disabled={isUpdating} className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-black text-xl text-white ${nextStatus.color} transition-all hover:scale-[1.02] disabled:opacity-50`}>{isUpdating? 'جاري التحديث...' : <><span className="text-2xl">{nextStatus.icon}</span>{nextStatus.label}</>}</button>)}
                  {isDone && (<div className="space-y-3"><div className="bg-green-600/20 border border-green-500/30 rounded-xl p-4 text-center text-green-400"><p className="font-black text-xl">✅ تم إنجاز الطلب بنجاح - شامل التوصيل {orderTotal.toLocaleString()} ج.م</p><p className="text-sm opacity-70 mt-1">{order.updated_at? new Date(order.updated_at).toLocaleString('ar-EG') : ''}</p></div><button onClick={() => deleteOrder(order.id)} className="w-full bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"><Trash2 size={20}/> حذف الطلب نهائي (الربح هيفضل محفوظ في الادمن)</button></div>)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}