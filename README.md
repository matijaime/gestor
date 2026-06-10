# 💰 Gestor de Finanzas Personal

App web para registrar gastos personales en ARS, con integración a iPhone Shortcuts.

**Stack:** Next.js 14 · Firebase Auth · Firestore · Tailwind · Recharts

---

## 🚀 Setup en 5 pasos

### 1. Cloná e instalá dependencias

```bash
cd gestor
npm install
```

### 2. Creá un proyecto en Firebase

1. Entrá a [console.firebase.google.com](https://console.firebase.google.com)
2. **Creá un nuevo proyecto** (ej: `mis-finanzas`)
3. En **Authentication** → Get started → habilitá **Google** como proveedor
4. En **Firestore Database** → Crear base de datos → modo producción
5. En **Configuración del proyecto** (⚙️) → Tus apps → Web → registrá una app → copiá el config

### 3. Configurá las variables de entorno

```bash
cp .env.local.example .env.local
```

Editá `.env.local` con los datos de Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mis-finanzas.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mis-finanzas
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mis-finanzas.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Generá una clave aleatoria (en terminal: openssl rand -hex 32)
SHORTCUTS_API_KEY=pon_tu_clave_secreta_aqui

# Tu UID lo ves en: Settings de la app → Configuración, después de hacer login
SHORTCUTS_OWNER_UID=
```

**Para la API de Shortcuts (Firebase Admin SDK):**

1. Firebase Console → Configuración del proyecto → **Cuentas de servicio**
2. Clic en **Generar nueva clave privada** → descargá el JSON
3. Copiá los valores al `.env.local`:

```env
FIREBASE_ADMIN_PROJECT_ID=mis-finanzas
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@mis-finanzas.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

> ⚠️ La `FIREBASE_ADMIN_PRIVATE_KEY` debe ir entre comillas dobles y con `\n` (no saltos reales).

### 4. Desplegá las reglas de Firestore

En Firebase Console → Firestore → **Reglas**, pegá el contenido de `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gastos/{gastoId} {
      allow read, delete: if request.auth != null && resource.data.uid == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }
  }
}
```

### 5. Levantá la app

```bash
npm run dev
# → http://localhost:3000
```

---

## 📱 Atajo de iPhone

### Importar el atajo

El archivo `AgregarGasto.shortcut` ya está generado.

1. **Pasalo al iPhone** via AirDrop, iCloud Drive o USB
2. En el iPhone, abrí **app Archivos** → buscá `AgregarGasto.shortcut` → tapealo
3. Se abre la app **Atajos** con "Agregar Gasto" listo para importar → **Agregar Atajo**

### Configurar URL y API key

1. Abrí la app **Atajos** → tap en "Agregar Gasto" → tap en los **3 puntos** (editar)
2. Scrolleá hasta la acción **"Obtener contenido de URL"**
3. Reemplazá `REEMPLAZA_CON_TU_URL` con la URL de tu app (ej: `https://tu-app.vercel.app`)
4. En los headers, reemplazá `REEMPLAZA_CON_TU_API_KEY` con el valor de `SHORTCUTS_API_KEY`
5. Guardá

### Usar el atajo

- Abrí la app **Atajos** → tap en "Agregar Gasto"
- O agregalo al **widget** de la pantalla de inicio
- O configuralo como **Acción rápida de Siri**: "Oye Siri, agregar gasto"

El flujo pide:
1. **Monto** (teclado numérico)
2. **Descripción** (texto libre, opcional)
3. **Categoría** (menú de selección)

Y muestra una notificación de confirmación al guardarse.

---

## 🌐 Deploy en Vercel

```bash
# Instalá Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurá las variables de entorno en el dashboard de Vercel:
# vercel.com → tu proyecto → Settings → Environment Variables
# (copiá todas las de .env.local)
```

> 🔑 **Importante:** en Vercel, la `FIREBASE_ADMIN_PRIVATE_KEY` hay que pegarla
> con los saltos de línea reales (no `\n`). Usá el editor de Vercel que los respeta.

---

## 🗂️ Estructura del proyecto

```
gestor/
├── src/
│   ├── app/
│   │   ├── dashboard/page.tsx      ← App principal
│   │   ├── login/page.tsx          ← Login con Google
│   │   ├── settings/page.tsx       ← Config + datos del atajo
│   │   └── api/shortcuts/expense/  ← API para iPhone
│   ├── components/
│   │   ├── AuthProvider.tsx
│   │   ├── GastoForm.tsx
│   │   ├── GastoList.tsx
│   │   ├── ResumenCards.tsx
│   │   └── GraficoPorCategoria.tsx
│   ├── lib/
│   │   ├── firebase.ts             ← Config Firebase client
│   │   └── firestore.ts            ← CRUD de gastos
│   └── types/index.ts
├── scripts/
│   └── generate_shortcut.py       ← Regenera el .shortcut
├── AgregarGasto.shortcut           ← Importar en iPhone
├── firestore.rules                 ← Reglas de seguridad
└── .env.local.example
```

---

## 🔒 Seguridad

- Las reglas de Firestore garantizan que **solo vos** podés leer/escribir tus gastos
- La API de Shortcuts está protegida con una **API key secreta** (header `x-api-key`)
- La API key nunca se expone en el frontend
- El `SHORTCUTS_OWNER_UID` en el servidor hace que el atajo siempre guarde en tu cuenta

---

## 💡 Tips

- **Regenerar el shortcut** con valores distintos: editá `scripts/generate_shortcut.py` y correlo con `python3 scripts/generate_shortcut.py`
- **Ver tu UID:** iniciá sesión en la app → ve a **Configuración** (ícono ⚙️)
- **Verificar que la API funciona:** `curl https://tu-app.vercel.app/api/shortcuts/expense` → debe responder `{"ok":true,...}`
