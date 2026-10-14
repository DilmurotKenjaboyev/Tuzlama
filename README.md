# Tuzlama hisobi

Magazinlarga topshirilgan tuzlama mahsulotlari (karam, pomidor, bodring, assorti) hisobi.
Vue 3 + Vite + Supabase (baza va login). GitHub Pages'da ishlaydi.

## 1. Supabase (baza)
1. https://supabase.com da bepul loyiha oching.
2. **SQL Editor** ga `supabase/schema.sql` ichidagi kodni qo'yib ishga tushiring.
3. **Project Settings → API** dan `Project URL` va `anon public` kalitni oling.
4. **Authentication → Providers → Email** da qulaylik uchun "Confirm email" ni o'chirib qo'yishingiz mumkin.

## 2. Kompyuterda ishga tushirish
```
cp .env.example .env     # URL va kalitni yozing
npm install
npm run dev
```

## 3. GitHub Pages
1. Kodni GitHub'ga `main` branch'ga yuklang.
2. **Settings → Pages → Source: GitHub Actions**.
3. **Settings → Secrets and variables → Actions** ga ikkita secret qo'shing: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Push qiling. Sayt manzili Actions tugagach Pages bo'limida chiqadi.

## 4. Hisoblar
Siz va otangiz saytda "Yangi hisob yaratish" orqali ro'yxatdan o'tasiz. Ikkalangiz ham o'tgach, Supabase'da **Authentication → Sign In / Providers → Allow new users to sign up** ni o'chiring, shunda begona odam hisob yarata olmaydi.

`anon` kalit ochiq bo'lishi normal. Ma'lumotlarni faqat kirgan foydalanuvchilar ko'ra oladi (schema.sql dagi RLS qoidalari).
