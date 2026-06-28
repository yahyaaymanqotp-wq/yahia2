import { supabase } from "../lib/supabase";
import { useState } from "react";

export default function Checkout() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

async function handleSubmit(e) {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.address.trim()
    ) {
      alert("من فضلك أكمل جميع البيانات المطلوبة");
      return;
    }

    const phone = form.phone.trim();

    // التحقق من رقم موبايل مصري
    if (!/^01[0125][0-9]{8}$/.test(phone)) {
      alert("من فضلك أدخل رقم موبايل مصري صحيح");
      return;
    }

const cart = JSON.parse(localStorage.getItem("cart") || "[]");

if (cart.length === 0) {
  alert("السلة فارغة");
  return;
}

const total = cart.reduce(
  (sum, item) => sum + Number(item.price) * item.quantity,
  0
);

const orderNumber =
  "FAQ" + Date.now().toString().slice(-8);

const { error } = await supabase
  .from("orders")
  .insert({
    order_number: orderNumber,
    customer_name: form.name,
    customer_phone: form.phone,
    customer_address: form.address,
    notes: form.notes,
    items: cart,
    subtotal: total,
    total: total,
    status: "جديد",
    payment_method: "كاش",
    payment_status: "غير مدفوع",
  });

if (error) {
  console.log(error);
  alert("حدث خطأ أثناء حفظ الطلب");
  return;
}

localStorage.removeItem("cart");

alert("تم إرسال الطلب بنجاح\nرقم الطلب: " + orderNumber);

window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex justify-center py-10 px-4">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">

        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          إتمام الطلب
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="text"
            name="name"
            value={form.name}
            placeholder="الاسم بالكامل"
            onChange={handleChange}
            className="w-full rounded-xl p-4 bg-white/10 text-white border border-white/20"
          />

          <input
            type="tel"
            name="phone"
            value={form.phone}
            placeholder="01xxxxxxxxx"
            maxLength={11}
            inputMode="numeric"
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setForm({
                ...form,
                phone: value,
              });
            }}
            className="w-full rounded-xl p-4 bg-white/10 text-white border border-white/20"
          />

          <input
            type="text"
            name="address"
            value={form.address}
            placeholder="العنوان بالكامل"
            onChange={handleChange}
            className="w-full rounded-xl p-4 bg-white/10 text-white border border-white/20"
          />

          <textarea
            name="notes"
            value={form.notes}
            placeholder="ملاحظات (اختياري)"
            rows="4"
            onChange={handleChange}
            className="w-full rounded-xl p-4 bg-white/10 text-white border border-white/20"
          />

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg"
          >
            تأكيد الطلب
          </button>

        </form>

      </div>
    </div>
  );
}