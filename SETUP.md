# ⚙️ INSTRUCCIONES — INTRODUCIR CLAVES

## 1. Claves en index.html

Abre `index.html` y busca este bloque cerca del principio del `<script>`:

```js
// ⚙️  CONFIGURACIÓN — INTRODUCE TUS CLAVES AQUÍ
const SUPABASE_URL  = 'PEGA_AQUI_TU_PROJECT_URL';
const SUPABASE_ANON = 'PEGA_AQUI_TU_ANON_PUBLIC_KEY';
```

Reemplaza los valores:
- `PEGA_AQUI_TU_PROJECT_URL` → tu Project URL de Supabase (ej: `https://abcd.supabase.co`)
- `PEGA_AQUI_TU_ANON_PUBLIC_KEY` → tu anon public key (empieza por `eyJ...`)

Ambas las encuentras en: Supabase → Settings → API

---

## 2. Clave de Gemini en la Edge Function (NUNCA en el frontend)

**Opción A — Variable de entorno en Supabase (recomendado):**
1. Supabase → Settings → Edge Functions → Secrets
2. Añade un secret: Name=`GEMINI_API_KEY`, Value=tu clave de aistudio.google.com
3. La Edge Function la lee automáticamente con `Deno.env.get('GEMINI_API_KEY')`

**Opción B — Directamente en el código (solo para pruebas):**
Abre `supabase/functions/gemini-rutina/index.ts` y reemplaza:
`PEGA_AQUI_TU_GEMINI_API_KEY` → tu clave de Google AI Studio

---

## 3. Desplegar la Edge Function

Instala Supabase CLI y ejecuta:
```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy gemini-rutina
```

O desde el dashboard de Supabase → Edge Functions → New Function → pega el contenido de index.ts

---

## 4. SQL para las tablas (ejecutar en Supabase → SQL Editor)

```sql
create table profiles (
  id uuid references auth.users primary key,
  data jsonb,
  updated_at timestamptz default now()
);

create table sessions (
  id text primary key,
  user_id uuid references auth.users not null,
  date text not null,
  data jsonb,
  created_at timestamptz default now()
);

create table weight_log (
  user_id uuid references auth.users not null,
  date text not null,
  weight numeric not null,
  created_at timestamptz default now(),
  primary key (user_id, date)
);

alter table profiles enable row level security;
alter table sessions enable row level security;
alter table weight_log enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own sessions" on sessions for all using (auth.uid() = user_id);
create policy "own weight" on weight_log for all using (auth.uid() = user_id);
```
