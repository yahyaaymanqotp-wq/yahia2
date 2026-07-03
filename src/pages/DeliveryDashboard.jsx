import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { Truck, Phone, EyeOff, LogOut, TrendingUp, CheckCircle, Clock, Package } from "lucide-react";

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

  const deliveryCompanyId = parseInt(localStorage.getItem('delivery_company_id'));
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
    return itemsTotal + delivery;
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
      const { data, error } = await supabase
     .from("shops")
     .select("id, name");

      if (error) return;

      const map = {};
      data?.forEach(shop => {
        map[shop.id] = shop.name;
      });
      setShopsMap(map);
    } catch (error) {
      console.error("Error loading shops:", error);
    }
  }

  async function loadOrders() {
    try {
      const { data, error } = await supabase
     .from("orders")
     .select(`
          *,
          shops(name, address, phone),
          order_items(*, products(name, image_url))
        `)
     .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      showToast("فشل تحميل الطلبات", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function moveToNextStatus(orderId, currentStatus, order) {
    const next = getNextStatus(currentStatus);
    if (!next) return;

    if (next.status === 'accepted' &&!order.delivery_fee) {
      const fee = deliveryFee[orderId];
      if (!fee || parseFloat(fee) <= 0) {
        showToast("أدخل سعر التوصيل أولاً", "error");
        return;
      }
    }

    setUpdatingId(orderId);
    setOrders(prev => prev.map(o =>
      o.id === orderId? {...o, delivery_status: next.status } : o
    ));

    try {
      const updateData = {
        delivery_status: next.status,
        delivery_company_id: deliveryCompanyId,
        updated_at: new Date().toISOString()
      };

      if (next.status === 'accepted' && deliveryFee[orderId]) {
        updateData.delivery_fee = parseFloat(deliveryFee[orderId]);
      }

      const { error } = await supabase
     .from("orders")
     .update(updateData)
     .eq("id", orderId);

      if (error) throw error;
      showToast(`✅ ${next.label}`, "success");
    } catch (error) {
      showToast("فشل التحديث", "error");
      loadOrders();
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  }

  const stats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter(o => o.delivery_status!== FINAL_STATUS && o.delivery_status!== "cancelled").length;
    const completed = orders.filter(o => o.delivery_status === FINAL_STATUS).length;
    const revenue = orders
   .filter(o => o.delivery_status === FINAL_STATUS)
   .reduce((sum, o) => sum + (parseFloat(o.delivery_fee) || 0), 0);

    return { total, active, completed, revenue };
  }, [orders]);

  const sortedAndFilteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const q = searchQuery.toLowerCase();
      return (
        order.id?.toString().includes(q) ||
        order.customer_name?.toLowerCase().includes(q) ||
        order.customer_phone?.includes(q) ||
        getShopName(order).toLowerCase().includes(q)
      );
    });

    if (activeTab === "active") {
      filtered = filtered.filter(o => o.delivery_status!== FINAL_STATUS && o.delivery_status!== "cancelled");
    } else if (activeTab === "completed") {
      filtered = filtered.filter(o => o.delivery_status === FINAL_STATUS);
    }

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6" dir="rtl">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl font-bold text-white animate-bounce ${
          toast.type === 'success'? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              لوحة شركة التوصيل
            </h1>
            <p className="text-gray-400">مرحبا {companyName}</p>
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login' }}
            className="bg-red-500/20 text-red-400 px-6 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <LogOut size={18} />
            خروج
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-4 border border-white/20">
          <div className="relative">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
            <input
              type="text"
              placeholder="ابحث برقم الطلب، اسم العميل، الهاتف، أو المحل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pr-12 pl-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">📊</span>
              <span className="text-sm opacity-80">الإجمالي</span>
            </div>
            <p className="text-4xl font-black">{stats.total}</p>
            <p className="text-sm opacity-80 mt-1">طلب</p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">🚚</span>
              <span className="text-sm opacity-80">النشطة</span>
            </div>
            <p className="text-4xl font-black">{stats.active}</p>
            <p className="text-sm opacity-80 mt-1">قيد التوصيل</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">✅</span>
              <span className="text-sm opacity-80">المكتملة</span>
            </div>
            <p className="text-4xl font-black">{stats.completed}</p>
            <p className="text-sm opacity-80 mt-1">تم التسليم</p>
          </div>

          <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">💰</span>
              <span className="text-sm opacity-80">الأرباح</span>
            </div>
            <p className="text-3xl font-black">{stats.revenue.toLocaleString()}</p>
            <p className="text-sm opacity-80 mt-1">ج.م</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === "all"
             ? "bg-purple-600 text-white shadow-lg scale-105"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            كل الطلبات ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === "active"
             ? "bg-blue-600 text-white shadow-lg scale-105"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            النشطة ({stats.active})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === "completed"
             ? "bg-green-600 text-white shadow-lg scale-105"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            المكتملة ({stats.completed})
          </button>
        </div>

        {sortedAndFilteredOrders.length === 0? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl text-gray-300">لا توجد طلبات</p>
          </div>
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

              return (
                <div
                  key={order.id}
                  className={`bg-white/95 backdrop-blur rounded-2xl p-6 shadow-2xl transition-all duration-500 ${
                    isDone? 'opacity-80 scale-98' : 'hover:shadow-purple-500/30'
                  }`}
                >
                  <div className="mb-6">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${config.color} transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b">
                    <div>
                      <h2 className="text-3xl font-black text-gray-900 mb-2">
                        طلب #{order.id}
                      </h2>
                      <p className="text-gray-500 text-sm">
                        {order.created_at? new Date(order.created_at).toLocaleString('ar-EG') : 'بدون تاريخ'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-white font-bold text-lg ${config.color}`}>
                      <span className="text-2xl">{config.icon}</span>
                      {config.label}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-300">
                      <p className="text-sm text-purple-700 font-bold mb-1">🏪 اسم المحل</p>
                      <p className="font-black text-gray-900 text-xl">{getShopName(order)}</p>
                      {order.shops?.phone && (
                        <p className="text-sm text-gray-600 mt-1" dir="ltr">{order.shops.phone}</p>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-300">
                      <p className="text-sm text-blue-700 font-bold mb-1">👤 اسم العميل</p>
                      <p className="font-black text-gray-900 text-xl">
                        {order.customer_name || "غير متوفر"}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-300">
                      <p className="text-sm text-green-700 font-bold mb-1">📱 رقم الهاتف</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-black text-gray-900 text-lg" dir="ltr">
                          {showPhone[order.id]?
                            (order.customer_phone || "غير متوفر") :
                            maskPhone(order.customer_phone)
                          }
                        </p>
                        <button
                          onClick={() => setShowPhone(prev => ({...prev, [order.id]:!prev[order.id]}))}
                          className="text-blue-600 hover:text-blue-800 text-sm font-bold"
                        >
                          {showPhone[order.id]? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border-2 border-pink-300">
                      <p className="text-sm text-pink-700 font-bold mb-1">💰 الإجمالي</p>
                      <p className="font-black text-gray-900 text-3xl">
                        {orderTotal.toLocaleString()} ج.م
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
  المنتجات: {itemsTotal.toLocaleString()}{parseFloat(order.delivery_fee) > 0 && ` + ${parseFloat(order.delivery_fee).toLocaleString()}`}
</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-300 md:col-span-2">
                      <p className="text-sm text-orange-700 font-bold mb-1">📍 عنوان التوصيل</p>
                      <p className="font-bold text-gray-900 text-lg">
                        {order.customer_address || "غير متوفر"}
                      </p>
                      {order.notes && (
                        <p className="text-sm text-gray-600 mt-2 bg-white/50 p-2 rounded">📝 {order.notes}</p>
                      )}
                    </div>
                  </div>

                  {order.order_items && order.order_items.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold text-xl mb-3 text-gray-900">
                        المنتجات ({order.order_items.length})
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {order.order_items.map((item, index) => (
                          <div key={index} className="bg-gray-50 rounded-xl p-3 border">
                            <div className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded mb-2 inline-block">
                              🏪 {getShopName(order)}
                            </div>
                            <div className="flex items-center gap-3">
                              <img
                                src={item.products?.image_url || "https://via.placeholder.com/60"}
                                className="w-16 h-16 rounded-lg object-cover"
                                alt={item.products?.name}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 truncate">
                                  {item.products?.name || "منتج"}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {item.quantity || 1} × {item.price || 0} ج.م
                                </p>
                              </div>
                              <p className="font-black text-purple-700">
                                {(item.price || 0) * (item.quantity || 1)} ج.م
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.delivery_status === 'pending' &&!order.delivery_fee && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-4">
                      <p className="text-sm text-yellow-700 font-bold mb-2">💰 أدخل سعر التوصيل</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="سعر التوصيل"
                          value={deliveryFee[order.id] || ''}
                          onChange={(e) => setDeliveryFee({...deliveryFee, [order.id]: e.target.value})}
                          className="flex-1 bg-white border border-yellow-300 rounded-lg px-4 py-2 text-gray-900"
                        />
                      </div>
                    </div>
                  )}

                  {nextStatus &&!isDone && (
                    <button
                      onClick={() => moveToNextStatus(order.id, order.delivery_status, order)}
                      disabled={isUpdating}
                      className={`
                        w-full flex items-center justify-center gap-3 px-6 py-5 rounded-xl font-black text-2xl
                        text-white ${nextStatus.color} transition-all duration-200 transform hover:scale-105 active:scale-95
                        shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-wait
                      `}
                    >
                      {isUpdating? (
                        <>
                          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                          جاري التحديث...
                        </>
                      ) : (
                        <>
                          <span className="text-4xl">{nextStatus.icon}</span>
                          {nextStatus.label}
                        </>
                      )}
                    </button>
                  )}

                  {isDone && (
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-5 text-center text-white shadow-lg">
                      <p className="font-black text-2xl">✅ تم إنجاز الطلب بنجاح</p>
                      <p className="text-sm opacity-90 mt-1">
                        {order.updated_at? new Date(order.updated_at).toLocaleString('ar-EG') : ''}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}