import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import fs from 'fs'
import path from 'path'

/*
  تحميل متغيرات البيئة من ملفات Vite
  مثل:
  .env
  .env.production
*/
const env = loadEnv('production', process.cwd(), 'VITE_')

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ لم يتم العثور على بيانات Supabase في ملفات البيئة.')
  console.error('تأكد من وجود:')
  console.error('VITE_SUPABASE_URL')
  console.error('VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

const SITE_URL = 'https://www.souq-faqous.com'

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function generateSitemap() {
  console.log('🔄 جاري إنشاء Sitemap...')

  // جلب جميع المحلات النشطة
  const { data: shops, error } = await supabase
    .from('shops')
    .select('id')
    .eq('is_active', true)

  if (error) {
    console.error('❌ حدث خطأ أثناء جلب المحلات:')
    console.error(error.message)
    process.exit(1)
  }

  const today = new Date().toISOString().split('T')[0]

  // الصفحات الأساسية للموقع
  const urls = [
    {
      loc: `${SITE_URL}/`,
      lastmod: today,
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      loc: `${SITE_URL}/about`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.9'
    },
    {
      loc: `${SITE_URL}/complaints`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.6'
    },
    {
      loc: `${SITE_URL}/track-order`,
      lastmod: today,
      changefreq: 'daily',
      priority: '0.5'
    }
  ]

  // إضافة صفحات كل المحلات النشطة
  for (const shop of shops || []) {
    if (!shop.id) continue

    urls.push({
      loc: `${SITE_URL}/shop/${encodeURIComponent(shop.id)}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.8'
    })
  }

  // إنشاء XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n\n')}

</urlset>
`

  // مكان حفظ Sitemap
  const publicDir = path.resolve('public')
  const sitemapPath = path.join(publicDir, 'sitemap.xml')

  // إنشاء مجلد public إذا لم يكن موجودًا
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  // كتابة sitemap.xml
  fs.writeFileSync(
    sitemapPath,
    xml,
    'utf8'
  )

  console.log('')
  console.log('✅ تم إنشاء Sitemap بنجاح')
  console.log(`🏪 عدد المحلات النشطة: ${shops?.length || 0}`)
  console.log(`📄 الملف: ${sitemapPath}`)
  console.log(`🌐 الرابط: ${SITE_URL}/sitemap.xml`)
  console.log('')
}

generateSitemap().catch((error) => {
  console.error('❌ حدث خطأ غير متوقع:')
  console.error(error)
  process.exit(1)
})