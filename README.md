# سوق فاقوس - Souq Faqous

مول إلكتروني متعدد التجار مبني بـ React + Supabase

## التشغيل على جهازك
1. فك الضغط وافتح الفولدر في VS Code
2. شغل التيرمنال واكتب:
```bash
npm install
```
3. انسخ ملف `.env.example` وسميه `.env` وحط بيانات Supabase بتاعتك
4. شغل المشروع:
```bash
npm run dev
```

## تجهيز Supabase
1. اعمل مشروع جديد في supabase.com
2. روح SQL Editor والصق محتوى ملف `supabase-schema.sql` كامل
3. روح Storage واعمل bucket جديد اسمه `images` وخليه Public
4. خد الـ URL والـ Anon Key من Settings > API وحطهم في `.env`

## الرفع على Netlify
1. اعمل `npm run build` 
2. ارفع فولدر `dist` على Netlify
3. ضيف الـ Environment Variables في Netlify: VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY

## الحسابات
أول يوزر تسجل بيه هيدخل كـ customer. عشان تخليه admin:
روح Supabase > Table Editor > profiles > عدّل role لـ 'admin'
