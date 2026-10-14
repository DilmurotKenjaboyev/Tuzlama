<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { supabase } from './supabase'

const PROD = [['Karam', '🥬'], ['Pomidor', '🍅'], ['Bodring', '🥒'], ['Assorti', '🥗']]
const UNITS = ['kg', 'banka', 'litr', 'dona']

const ready = ref(false)
const session = ref(null)
const email = ref('')
const password = ref('')
const stores = ref([])
const entries = ref([])
const view = ref('home')
const cur = ref(null)
const filter = ref('all')
const edit = ref(null)
const newName = ref('')
const f = reactive({})
let channel = null

const money = n => Math.round(n).toLocaleString('ru-RU') + " so'm"
const toInput = iso => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }
const fmtDt = iso => { const s = toInput(iso), p = s.split('T'), d = p[0].split('-'); return `${d[2]}.${d[1]}.${d[0]}, ${p[1]}` }
const emo = p => (PROD.find(x => x[0] === p) || [0, '📦'])[1]
const toTop = () => window.scrollTo(0, 0)

const store = computed(() => stores.value.find(s => s.id === cur.value))
const entsOf = id => entries.value.filter(e => e.store_id === id)
function sums(id) {
  let t = 0, p = 0
  entsOf(id).forEach(e => { const a = e.qty * e.price; t += a; if (e.paid) p += a })
  return { t, p, u: t - p }
}
const list = computed(() => entsOf(cur.value)
  .filter(e => filter.value === 'all' || (filter.value === 'paid' ? e.paid : !e.paid))
  .sort((a, b) => (a.dt < b.dt ? 1 : -1)))
const total = computed(() => (parseFloat(f.qty) || 0) * (parseFloat(f.price) || 0))

async function load() {
  const [s, e] = await Promise.all([
    supabase.from('stores').select('*').order('name'),
    supabase.from('entries').select('*')
  ])
  if (s.error || e.error) { alert("Ma'lumotni yuklab bo'lmadi. Internetni tekshiring."); return }
  stores.value = s.data
  entries.value = e.data
}
function listen() {
  if (channel) return
  channel = supabase.channel('live').on('postgres_changes', { event: '*', schema: 'public' }, load).subscribe()
}
function unlisten() { if (channel) { supabase.removeChannel(channel); channel = null } }

async function signIn() {
  const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
  if (error) alert("Kirib bo'lmadi: " + error.message)
}
async function signUp() {
  const { error } = await supabase.auth.signUp({ email: email.value, password: password.value })
  if (error) alert(error.message)
  else alert("Hisob yaratildi. Agar xabar kelsa, pochtangizni tasdiqlang va keyin «Kirish» ni bosing.")
}
const signOut = () => supabase.auth.signOut()

function openStore(id) { cur.value = id; view.value = 'store'; filter.value = 'all'; toTop() }
function goHome() { view.value = 'home'; edit.value = null; toTop() }
async function addStore() {
  const n = newName.value.trim()
  if (!n) return alert('Magazin nomini yozing')
  const { data, error } = await supabase.from('stores').insert({ name: n }).select().single()
  if (error) return alert(error.message)
  newName.value = ''
  await load()
  openStore(data.id)
}
async function renameStore() {
  const n = prompt('Magazinning yangi nomi:', store.value.name)
  if (!n || !n.trim()) return
  const { error } = await supabase.from('stores').update({ name: n.trim() }).eq('id', cur.value)
  if (error) alert(error.message)
  await load()
}
async function delStore() {
  if (!confirm(`«${store.value.name}» magazini va uning barcha yozuvlari o'chiriladi. Rostdan o'chiraymi?`)) return
  const { error } = await supabase.from('stores').delete().eq('id', cur.value)
  if (error) return alert(error.message)
  cur.value = null
  await load()
  goHome()
}
function openForm(e) {
  edit.value = e ? e.id : null
  if (e) Object.assign(f, { product: e.product, qty: e.qty, unit: e.unit, price: e.price, dt: toInput(e.dt), paid: e.paid })
  else {
    const last = list.value[0]
    Object.assign(f, { product: 'Karam', qty: '', unit: last ? last.unit : 'kg', price: '', dt: toInput(new Date()), paid: false })
  }
  view.value = 'form'
  toTop()
}
async function saveEntry() {
  const qty = parseFloat(f.qty), price = parseFloat(f.price)
  if (!(qty > 0)) return alert('Miqdorni yozing')
  if (isNaN(price) || price < 0) return alert('Narxni yozing')
  const row = { product: f.product, qty, unit: f.unit, price, dt: new Date(f.dt || Date.now()).toISOString(), paid: !!f.paid }
  const q = edit.value
    ? supabase.from('entries').update(row).eq('id', edit.value)
    : supabase.from('entries').insert({ ...row, store_id: cur.value })
  const { error } = await q
  if (error) return alert(error.message)
  edit.value = null
  view.value = 'store'
  await load()
  toTop()
}
async function togglePaid(e) {
  const { error } = await supabase.from('entries').update({ paid: !e.paid }).eq('id', e.id)
  if (error) alert(error.message)
  await load()
}
async function delEntry(e) {
  if (!confirm("Bu yozuvni o'chirmoqchimisiz?")) return
  const { error } = await supabase.from('entries').delete().eq('id', e.id)
  if (error) alert(error.message)
  await load()
}

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  session.value = data.session
  ready.value = true
  if (session.value) { load(); listen() }
  supabase.auth.onAuthStateChange((_, s) => {
    const was = !!session.value
    session.value = s
    if (s && !was) { load(); listen() }
    if (!s) { unlisten(); stores.value = []; entries.value = []; view.value = 'home' }
  })
})
</script>

<template>
  <div class="wrap">
    <p v-if="!ready" class="mut">Yuklanmoqda…</p>

    <form v-else-if="!session" class="card" @submit.prevent="signIn">
      <h1>🥒 Tuzlama hisobi</h1>
      <label>Email</label>
      <input v-model="email" type="email" autocomplete="username" required>
      <label>Parol</label>
      <input v-model="password" type="password" autocomplete="current-password" minlength="6" required>
      <div class="gap"></div>
      <button class="p" type="submit">Kirish</button>
      <div class="gap"></div>
      <button type="button" style="width:100%" @click="signUp">Yangi hisob yaratish</button>
    </form>

    <div v-else-if="view === 'form' && store">
      <h1>{{ edit ? "Yozuvni o'zgartirish" : 'Yangi yozuv' }}</h1>
      <div class="card">
        <label style="margin-top:0">1. Nima topshirdingiz?</label>
        <div class="grid2">
          <button v-for="p in PROD" :key="p[0]" :class="{ sel: f.product === p[0] }" @click="f.product = p[0]">{{ p[1] }} {{ p[0] }}</button>
        </div>
        <label>2. Qancha? (miqdor)</label>
        <div class="row">
          <input v-model="f.qty" type="number" step="any" min="0" inputmode="decimal" placeholder="Masalan: 20">
          <select v-model="f.unit"><option v-for="u in UNITS" :key="u">{{ u }}</option></select>
        </div>
        <label>3. Narxi (1 {{ f.unit }} necha so'm?)</label>
        <input v-model="f.price" type="number" step="any" min="0" inputmode="decimal" placeholder="Masalan: 15000">
        <div class="tot">Jami: {{ money(total) }}</div>
        <label>4. Pul to'landimi?</label>
        <div class="grid2">
          <button :class="{ sel: f.paid }" @click="f.paid = true">✅ To'landi</button>
          <button :class="{ sel: !f.paid }" @click="f.paid = false">❌ To'lanmadi</button>
        </div>
        <label>Sana va vaqt <span class="mut">(o'zi qo'yildi, kerak bo'lsa o'zgartiring)</span></label>
        <input v-model="f.dt" type="datetime-local">
      </div>
      <button class="p" @click="saveEntry">💾 Saqlash</button>
      <div class="gap"></div>
      <button style="width:100%" @click="view = 'store'; edit = null">Bekor qilish</button>
    </div>

    <div v-else-if="view === 'store' && store">
      <button style="margin-bottom:12px" @click="goHome">← Magazinlarga qaytish</button>
      <h1>{{ store.name }}</h1>
      <div class="sum">
        <div><small>Qarz (to'lanmagan)</small><b :class="sums(store.id).u > 0 ? 'r' : 'g'">{{ money(sums(store.id).u) }}</b></div>
        <div><small>To'langan</small><b class="g">{{ money(sums(store.id).p) }}</b></div>
      </div>
      <button class="p" @click="openForm()">+ Yangi yozuv qo'shish</button>
      <h2 style="margin-top:22px">Yozuvlar</h2>
      <div class="row" style="margin-bottom:12px">
        <button v-for="x in [['all', 'Hammasi'], ['paid', `To'langan`], ['unpaid', `To'lanmagan`]]" :key="x[0]"
          :class="{ sel: filter === x[0] }" style="padding:10px 4px" @click="filter = x[0]">{{ x[1] }}</button>
      </div>
      <p v-if="!list.length" class="mut">Yozuvlar yo'q.</p>
      <p v-else class="mut">Holatni o'zgartirish uchun rangli tugmani bosing.</p>
      <div v-for="e in list" :key="e.id" class="e">
        <div class="t"><span>{{ emo(e.product) }} {{ e.product }}</span><span>{{ money(e.qty * e.price) }}</span></div>
        <div class="mut">{{ e.qty }} {{ e.unit }} × {{ money(e.price) }}<br>{{ fmtDt(e.dt) }}</div>
        <button :class="['st', e.paid ? 'paid' : 'unpaid']" @click="togglePaid(e)">{{ e.paid ? "✅ To'langan" : "❌ To'lanmagan" }}</button>
        <div class="row">
          <button @click="openForm(e)">✏️ O'zgartirish</button>
          <button @click="delEntry(e)">🗑 O'chirish</button>
        </div>
      </div>
      <div style="text-align:center;margin-top:16px">
        <button class="link" @click="renameStore">Magazin nomini o'zgartirish</button>
        <button class="link" @click="delStore">Magazinni o'chirish</button>
      </div>
    </div>

    <div v-else>
      <h1>🥒 Tuzlama hisobi</h1>
      <div class="card">
        <h2>Magazinlar</h2>
        <p v-if="!stores.length" class="mut">Hali magazin yo'q. Pastdan birinchi magazinni qo'shing.</p>
        <button v-for="s in stores" :key="s.id" class="store" @click="openStore(s.id)">
          <span>{{ s.name }}<small :class="sums(s.id).u > 0 ? 'r' : 'g'">{{ sums(s.id).u > 0 ? 'Qarz: ' + money(sums(s.id).u) : "Qarz yo'q ✅" }}</small></span>
          <span>›</span>
        </button>
      </div>
      <div class="card">
        <h2>Yangi magazin qo'shish</h2>
        <input v-model="newName" placeholder="Magazin nomi" @keyup.enter="addStore">
        <div class="gap"></div>
        <button class="p" @click="addStore">+ Magazin qo'shish</button>
      </div>
      <div style="text-align:center"><button class="link" @click="signOut">Chiqish</button></div>
    </div>
  </div>
</template>
