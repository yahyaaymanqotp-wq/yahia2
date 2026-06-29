import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    loadCart();
  }, []);

  function loadCart() {
    const data = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(data);
  }

  function saveCart(newCart) {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  }

  function increase(id) {
    const newCart = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );

    saveCart(newCart);
  }

  function decrease(id) {
    const newCart = cart
      .map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter((item) => item.quantity > 0);

    saveCart(newCart);
  }

  function removeItem(id) {
    const newCart = cart.filter((item) => item.id !== id);
    saveCart(newCart);
  }

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-5">
            سلة المشتريات فارغة
          </h1>

          <Link
            to="/"
            className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold"
          >
            العودة للتسوق
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">

      <h1 className="text-4xl font-bold text-white mb-8">
        سلة المشتريات
      </h1>

      {cart.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-2xl shadow-lg p-5 mb-5 flex flex-col md:flex-row justify-between items-center gap-5"
        >
          <div className="flex items-center gap-5">

            <img
              src={
                item.images?.[0] ||
                "https://via.placeholder.com/120"
              }
              className="w-28 h-28 rounded-xl object-cover"
            />

            <div>

              <h2 className="text-xl font-bold">
                {item.name}
              </h2>

              <p className="text-green-600 font-bold mt-2">
                {item.price} ج.م
              </p>

              <div className="flex items-center gap-10 mt-4">

                <button
                  onClick={() => decrease(item.id)}
                  className="w-10 h-10 rounded-lg bg-red-600 text-white text-2xl"
                >
                  -
                </button>

                <span className="text-xl font-bold">
                  {item.quantity}
                </span>

                <button
                  onClick={() => increase(item.id)}
                  className="w-10 h-10 rounded-lg bg-green-600 text-white text-2xl"
                >
                  +
                </button>

              </div>

            </div>
          </div>

          <button
            onClick={() => removeItem(item.id)}
            className="bg-red-700 text-white px-6 py-3 rounded-xl font-bold"
          >
            حذف المنتج
          </button>
        </div>
      ))}

      <div className="bg-white rounded-2xl p-6 shadow-xl mt-8">

        <h2 className="text-3xl font-bold">
          الإجمالي : {total} ج.م
        </h2>

        <Link
          to="/checkout"
          className="block mt-6 text-center bg-gradient-to-r from-green-600 to-emerald-500 text-white py-4 rounded-xl text-xl font-bold"
        >
         const phone = form.phone.trim();  
          إتمام الطلب
        </Link>

      </div>

    </div>
  );
}