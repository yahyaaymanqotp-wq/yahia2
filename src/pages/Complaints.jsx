import { Phone, MessageCircle } from 'lucide-react'

export default function Complaints() {
  return (
    <div className="min-h-screen bg-[#121212] text-white p-6" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-8">الشكاوى والاستفسار</h1>

        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-black">ي</span>
            </div>
            <h2 className="text-2xl font-bold text-[#D4AF37]">المهندس يحيى أيمن</h2>
            <p className="text-gray-400 mt-2">مطور ومؤسس سوق فاقوس</p>
          </div>

          <div className="border-t border-[#333] pt-6 space-y-4">
            <p className="text-gray-300 leading-relaxed">
              سوق فاقوس هو منصة تسوق إلكترونية متكاملة تهدف لخدمة أهالي فاقوس والمناطق المجاورة. 
              نوفر أفضل المحلات والمنتجات بأعلى جودة وأفضل الأسعار.
            </p>

            <p className="text-gray-300 leading-relaxed">
              لأي استفسار أو شكوى أو اقتراح، يمكنك التواصل معنا مباشرة:
            </p>

            <div className="bg-[#121212] rounded-xl p-4 space-y-3">
              <a 
                href="tel:01101208707" 
                className="flex items-center gap-3 text-[#D4AF37] hover:text-[#D4AF37]/80 transition"
              >
                <Phone size={20} />
                <span className="text-lg font-bold">01101208707</span>
              </a>

              <a 
                href="https://wa.me/201101208707" 
                target="_blank"
                className="flex items-center gap-3 text-green-400 hover:text-green-300 transition"
              >
                <MessageCircle size={20} />
                <span className="text-lg font-bold">واتساب</span>
              </a>
            </div>

            <p className="text-sm text-gray-500 text-center mt-6">
              نعمل على مدار الساعة لخدمتكم
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}