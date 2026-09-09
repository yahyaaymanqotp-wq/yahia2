import { CheckCircle, Phone, User, Store } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen bg-[#121212] text-white p-6" dir="rtl">
      {/* بيانات منظمة لمحركات البحث وأنظمة الذكاء الاصطناعي */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'المهندس يحيى أيمن',
            jobTitle: 'مؤسس سوق فاقوس الرسمي',
            url: 'https://www.souq-faqous.com/',
            worksFor: {
              '@type': 'Organization',
              name: 'سوق فاقوس الرسمي',
              url: 'https://www.souq-faqous.com/'
            },
            sameAs: [
              'https://www.facebook.com/souqfaqous'
            ]
          })
        }}
      />

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-8">
          نبذة عن سوق فاقوس
        </h1>

        <div className="bg-[#1E1E1E] border border-[#333] rounded-2xl p-8 space-y-6">

          {/* تعريف المشروع */}
          <div className="text-center mb-8">
            <div className="text-[#D4AF37] text-6xl font-bold mb-4">
              ▼
            </div>

            <h2 className="text-2xl font-bold">
              سوق فاقوس الرسمي
            </h2>

            <p className="text-gray-400 mt-2">
              منصة إلكترونية تجمع محلات وأنشطة فاقوس في مكان واحد
            </p>
          </div>

          <div className="space-y-5 text-gray-300 leading-relaxed">

            <p>
              <strong className="text-[#D4AF37]">
                سوق فاقوس الرسمي
              </strong>{' '}
              هو منصة إلكترونية تهدف إلى جمع المحلات والأنشطة التجارية
              والخدمات في فاقوس في مكان واحد، لتسهيل وصول العملاء إلى
              المحلات والمنتجات والخدمات المحلية.
            </p>

            {/* المؤسس */}
            <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="text-[#D4AF37]" size={28} />

                <h3 className="text-xl font-bold text-[#D4AF37]">
                  مؤسس سوق فاقوس الرسمي
                </h3>
              </div>

              <h4 className="text-2xl font-bold text-white mb-3">
                المهندس يحيى أيمن
              </h4>

              <p className="text-gray-300 leading-relaxed">
                المهندس يحيى أيمن هو مؤسس سوق فاقوس الرسمي، وصاحب فكرة
                إنشاء منصة إلكترونية تجمع المحلات والأنشطة التجارية في
                فاقوس داخل منصة واحدة، بهدف دعم النشاط التجاري المحلي
                وتسهيل وصول العملاء إلى المنتجات والخدمات.
              </p>
            </div>

            {/* فكرة المشروع */}
            <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Store className="text-[#D4AF37]" size={26} />

                <h3 className="text-xl font-bold text-[#D4AF37]">
                  فكرة سوق فاقوس
                </h3>
              </div>

              <p>
                تقوم فكرة سوق فاقوس على إنشاء سوق إلكتروني محلي يساعد
                أصحاب المحلات على عرض منتجاتهم وخدماتهم أمام العملاء،
                ويساعد العملاء على اكتشاف المحلات والمنتجات المتاحة
                في فاقوس بسهولة.
              </p>
            </div>

            {/* الهدف */}
            <p>
              هدفنا هو تسهيل عملية التسوق على أهالي فاقوس والمناطق
              المجاورة، وتوفير الوقت والجهد من خلال منصة سهلة الاستخدام
              تجمع المحلات والمنتجات والخدمات المحلية.
            </p>

            {/* المميزات */}
            <div className="bg-[#121212] rounded-xl p-6 my-6">
              <h3 className="text-xl font-bold text-[#D4AF37] mb-4">
                مميزات سوق فاقوس:
              </h3>

              <ul className="space-y-3">

                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-400 mt-1" size={20} />
                  <span>تجميع المحلات والأنشطة التجارية في مكان واحد</span>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-400 mt-1" size={20} />
                  <span>عرض المنتجات والخدمات بسهولة</span>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-400 mt-1" size={20} />
                  <span>أسعار منافسة وعروض حصرية من المحلات</span>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-400 mt-1" size={20} />
                  <span>إمكانية التواصل مع أصحاب المحلات</span>
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-400 mt-1" size={20} />
                  <span>تطوير مستمر لخدمة أهالي فاقوس</span>
                </li>

              </ul>
            </div>

            <p>
              نسعى دائماً إلى تطوير سوق فاقوس وإضافة المزيد من المحلات
              والخدمات والميزات، لتقديم تجربة إلكترونية أفضل لأهالي
              فاقوس وأصحاب الأنشطة التجارية.
            </p>

          </div>

          {/* التواصل */}
          <div className="border-t border-[#333] pt-6 text-center">
            <p className="text-gray-400 mb-2">
              للتواصل والاستفسار
            </p>

            <a
              href="tel:01101208707"
              className="text-[#D4AF37] text-xl font-bold flex items-center justify-center gap-2"
            >
              <Phone size={20} />
              01101208707
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}