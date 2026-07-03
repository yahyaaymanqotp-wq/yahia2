import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Store, Trash } from "lucide-react";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate()

  useEffect(() => {
    loadCart();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, []);

  function loadCart() {
    const data = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(data);
  }

  function saveCart(newCart) {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  }

  function increase(productId) {
    const newCart = cart.map((item) =>
      item.product_id === productId
    ? {...item, quantity: item.quantity + 1 }
        : item
    );
    saveCart(newCart);
  }

  function decrease(productId) {
    const newCart = cart
  .map((item) =>
        item.product_id === productId
      ? {...item, quantity: item.quantity - 1 }
          : item
      )
  .filter((item) => item.quantity > 0);
    saveCart(newCart);
  }

  function removeItem(productId) {
    const newCart = cart.filter((item) => item.product_id!== productId);
    saveCart(newCart);
  }

  function clearCart() {
    if (!confirm('متأكد عايز تفضي السلة كلها؟')) return
    saveCart([])
  }

  // تجميع المنتجات حسب المحل
  const groupedByShop = useMemo(() => {
    const grouped = {};

    cart.forEach(item => {
      const shopId = item.shop_id || item.shop_name;
      const shopName = item.shop_name || "غير محدد";

      if (!grouped[shopId]) {
        grouped[shopId] = {
          shopId,
          shopName,
          items: [],
          subtotal: 0
        };
      }

      grouped[shopId].items.push(item);
      grouped[shopId].subtotal += parseFloat(item.price || 0) * item.quantity;
    });

    return Object.values(grouped);
  }, [cart]);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4">
        <div className="text-center">
          <ShoppingCart size={80} className="mx-auto mb-6 text-[#D4AF37]/40" />
          <h1 className="text-4xl font-bold text-white mb-5">
            سلة المشتريات فارغة
          </h1>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#D4AF37]/90 transition"
          >
            <ArrowRight size={20} />
            العودة للتسوق
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#D4AF37] mb-2">
              سلة المشتريات
            </h1>
            <p className="text-gray-400">{totalItems} منتج في السلة</p>
          </div>
          <button
            onClick={clearCart}
            className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-500/30 transition"
          >
            <Trash size={18} />
            إفراغ السلة
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* المنتجات */}
          <div className="lg:col-span-2 space-y-6">
            {groupedByShop.map((shop) => (
              <div key={shop.shopId} className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6">
                {/* هيدر المحل */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#333]">
                  <Store size={20} className="text-[#D4AF37]" />
                  <h3 className="font-bold text-[#D4AF37] text-xl">من محل: {shop.shopName}</h3>
                  <span className="text-sm text-gray-400 mr-auto">
                    ({shop.items.length} منتج)
                  </span>
                </div>

                {/* منتجات المحل */}
                <div className="space-y-4">
                  {shop.items.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#121212] rounded-xl p-4"
                    >
                      <div className="flex items-center gap-4 flex-1 w-full">
                        <img
                          src={item.image_url || "https://via.placeholder.com/100"}
                          className="w-24 h-24 rounded-xl object-cover"
                          alt={item.name}
                        />
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold text-white truncate">{item.name}</h2>
                          <p className="text-[#D4AF37] font-bold mt-1 text-lg">
                            {parseFloat(item.price).toFixed(2)} ج.م
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <button
                              onClick={() => decrease(item.product_id)}
                              className="w-9 h-9 rounded-lg bg-[#1E1E1E] border border-[#333] text-[#D4AF37] hover:bg-[#2a2a2a] transition flex items-center justify-center"
                            >
                              <Minus size={18} />
                            </button>
                            <span className="text-xl font-bold w-8 text-center text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => increase(item.product_id)}
                              className="w-9 h-9 rounded-lg bg-[#1E1E1E] border border-[#333] text-[#D4AF37] hover:bg-[#2a2a2a] transition flex items-center justify-center"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-center md:text-left w-full md:w-auto">
                        <p className="text-2xl font-bold text-[#D4AF37] mb-3">
                          {(item.price * item.quantity).toFixed(2)} ج.م
                        </p>
                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="bg-red-500/20 text-red-400 px-6 py-2 rounded-xl font-bold hover:bg-red-500/30 transition flex items-center gap-2 w-full md:w-auto justify-center"
                        >
                          <Trash2 size={18} />
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* إجمالي المحل */}
                <div className="mt-4 pt-4 border-t border-[#333] flex justify-between items-center">
                  <span className="text-gray-400">إجمالي المحل:</span>
                  <span className="font-black text-[#D4AF37] text-xl">
                    {shop.subtotal.toFixed(2)} ج.م
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ملخص الطلب */}
          <div className="lg:col-span-1">
            <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-[#D4AF37] mb-6">ملخص الطلب</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>عدد المنتجات:</span>
                  <span className="font-bold text-white">{totalItems}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>عدد المحلات:</span>
                  <span className="font-bold text-white">{groupedByShop.length}</span>
                </div>
                <div className="border-t border-[#333] pt-4">
                  <div className="flex justify-between text-xl">
                    <span className="font-bold text-white">الإجمالي:</span>
                    <span className="font-black text-[#D4AF37]">{total.toFixed(2)} ج.م</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">غير شامل رسوم التوصيل</p>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full text-center bg-[#D4AF37] text-black py-4 rounded-xl text-xl font-black hover:bg-[#D4AF37]/90 transition transform hover:scale-105 active:scale-95"
              >
                إتمام الطلب
              </Link>

              <Link
                to="/"
                className="block w-full text-center bg-[#121212] border border-[#333] text-gray-300 py-3 rounded-xl font-bold mt-3 hover:bg-[#2a2a2a] transition"
              >
                متابعة التسوق
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}