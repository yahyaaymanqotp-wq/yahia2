import { CheckCircle, Phone } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen bg-[#121212] text-white p-6" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-8">نبذة عن سوق فاقوس</h1>

        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-8 space-y-6">
          <div className="text-center mb-8">
            <div className="text-[#D4AF37] text-6xl font-bold mb-4">▼</div>
            <h2 className="text-2xl font-bold">سوق فاقوس</h2>
            <p className="text-gray-400 mt-2">تجربة تسوق متكاملة</p>
          </div>

          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              <strong className="text-[#D4AF37]">سوق فاقوس</strong> هو أول منصة تسوق إلكترونية متكاملة 
              في مدينة فاقوس، تجمع أفضل المحلات والمتاجر في مكان واحد.
            </p>

            <p>
              هدفنا هو تسهيل عملية التسوق على أهالي فاقوس والمناطق المجاورة، وتوفير الوقت والجهد 
              من خلال عرض جميع المنتجات والخدمات في تطبيق واحد سهل الاستخدام.
            </p>

            <div className="bg-[#121212] rounded-xl p-6 my-6">
              <h3 className="text-xl font-bold text-[#D4AF37] mb-4">مميزاتنا:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-400 mt-1" size={20} />
                  <span>أكثر من 100 محل متنوع في جميع المجالات</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-400 mt-1" size={20} />
                  <span>توصيل سريع لجميع أنحاء فاقوس</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-400 mt-1" size={20} />
                  <span>أسعار منافسة وعروض حصرية</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-400 mt-1" size={20} />
                  <span>تتبع الطلبات لحظة بلحظة</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-400 mt-1" size={20} />
                  <span>دعم فني على مدار الساعة</span>
                </li>
              </ul>
            </div>

            <p>
              نسعى دائماً لتطوير خدماتنا وإضافة محلات ومنتجات جديدة لتلبية جميع احتياجاتكم.
            </p>
          </div>

          <div className="border-t border-[#333] pt-6 text-center">
            <p className="text-gray-400 mb-2">للتواصل والاستفسار</p>
            <a href="tel:01101208707" className="text-[#D4AF37] text-xl font-bold flex items-center justify-center gap-2">
              <Phone size={20} />
              01101208707
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}