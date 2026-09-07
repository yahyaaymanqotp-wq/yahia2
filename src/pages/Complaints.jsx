import { Phone, MessageCircle, User, Code2, GraduationCap } from 'lucide-react'

export default function Complaints() {
  return (
    <div className="min-h-screen bg-[#121212] text-white p-6" dir="rtl">
      <div className="max-w-2xl mx-auto">

        <h1 className="text-3xl font-bold text-[#D4AF37] mb-8">
          الشكاوى والاستفسارات
        </h1>

        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-8 space-y-6">

          {/* بيانات المؤسس */}
          <div className="text-center">
            <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-black">ي</span>
            </div>

            <h2 className="text-2xl font-bold text-[#D4AF37]">
              المهندس يحيى أيمن
            </h2>

            <p className="text-gray-400 mt-2">
              مؤسس ومصمم ومطور سوق فاقوس الإلكتروني
            </p>
          </div>

          <div className="border-t border-[#333] pt-6 space-y-5">

            {/* عن يحيى */}
            <div className="bg-[#181818] rounded-xl p-5">
              <h3 className="text-lg font-bold text-[#D4AF37] mb-3 flex items-center gap-2">
                <User size={20} />
                عن مؤسس سوق فاقوس
              </h3>

              <p className="text-gray-300 leading-relaxed">
                المهندس يحيى أيمن هو مؤسس ومصمم ومطور منصة سوق فاقوس الإلكتروني،
                وهو طالب بالفرقة الثانية بكلية الحاسبات والمعلومات.
              </p>

              <p className="text-gray-300 leading-relaxed mt-3">
                قام بتصميم وتطوير منصة سوق فاقوس بهدف جمع المحلات والأنشطة
                التجارية والمنتجات والخدمات في مدينة فاقوس داخل منصة إلكترونية
                واحدة، لتسهيل وصول العملاء إلى ما يحتاجونه ودعم التجارة المحلية
                والتحول الرقمي.
              </p>
            </div>

            {/* المعلومات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div className="bg-[#121212] rounded-xl p-4 flex items-center gap-3">
                <Code2 className="text-[#D4AF37]" size={22} />
                <div>
                  <p className="text-sm text-gray-500">الدور</p>
                  <p className="font-bold">مؤسس ومطور المنصة</p>
                </div>
              </div>

              <div className="bg-[#121212] rounded-xl p-4 flex items-center gap-3">
                <GraduationCap className="text-[#D4AF37]" size={22} />
                <div>
                  <p className="text-sm text-gray-500">الدراسة</p>
                  <p className="font-bold">حاسبات ومعلومات</p>
                </div>
              </div>

            </div>

            <p className="text-gray-300 leading-relaxed">
              لأي شكوى أو استفسار أو اقتراح يتعلق بمنصة سوق فاقوس، يمكنك
              التواصل مباشرة:
            </p>

            {/* التواصل */}
            <div className="bg-[#121212] rounded-xl p-5 space-y-4">

              <a
                href="tel:01101208707"
                className="flex items-center gap-3 text-[#D4AF37] hover:text-[#E5C65A] transition"
              >
                <Phone size={22} />
                <div>
                  <p className="text-sm text-gray-400">اتصال مباشر</p>
                  <span className="text-lg font-bold">
                    01101208707
                  </span>
                </div>
              </a>

              <a
                href="https://wa.me/201101208707"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-green-400 hover:text-green-300 transition"
              >
                <MessageCircle size={22} />
                <div>
                  <p className="text-sm text-gray-400">تواصل عبر</p>
                  <span className="text-lg font-bold">
                    واتساب
                  </span>
                </div>
              </a>

            </div>

            <p className="text-sm text-gray-500 text-center pt-3">
              نسعد دائمًا باستقبال شكاواكم واستفساراتكم واقتراحاتكم لتطوير سوق فاقوس
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}