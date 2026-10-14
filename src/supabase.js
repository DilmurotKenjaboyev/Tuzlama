import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  document.body.innerHTML =
    '<div style="font:18px system-ui;padding:24px;max-width:560px;margin:auto">' +
    '<h2>.env fayli topilmadi</h2>' +
    '<p>Loyiha papkasida <b>.env</b> fayl yarating va ichiga yozing:</p>' +
    '<pre>VITE_SUPABASE_URL=https://XXXX.supabase.co\nVITE_SUPABASE_ANON_KEY=...</pre>' +
    '<p>Keyin serverni to\'xtatib, <b>npm run dev</b> ni qaytadan ishga tushiring.</p></div>'
  throw new Error('Supabase env variables are missing')
}

export const supabase = createClient(url, key)
