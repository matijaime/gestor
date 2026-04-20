# Gestor · Tracker de Gastos Mensual

<div align="center">

![Gestor Logo](https://img.shields.io/badge/Gestor-Expense%20Tracker-7c3aed?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHBhdGggZD0iTTMyIDIgTDU2IDE2IEw1NiA0OCBMMzIgNjIgTDggNDggTDggMTYgWiIgZmlsbD0iIzdjM2FlZCIvPjx0ZXh0IHg9IjMyIiB5PSI0MiIgZm9udC1mYW1pbHk9IkludGVyIiBmb250LXNpemU9IjMwIiBmb250LXdlaWdodD0iOTAwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RzwvdGV4dD48L3N2Zz4=)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Tracker de gastos mensual interactivo para Argentina — Mayo 2026 a Diciembre 2027**

[Demo](#uso) · [Características](#características) · [Instalación](#instalación) · [Estructura](#estructura-del-proyecto)

</div>

---

## ✨ Características

| Funcionalidad | Descripción |
|---|---|
| 📅 **20 meses** | Cobertura de Mayo 2026 a Diciembre 2027 con pestañas por año y mes |
| 💵 **Dólar Blue en tiempo real** | Consume la API de [dolarapi.com](https://dolarapi.com) automáticamente al cargar |
| ✏️ **Tipo de cambio editable** | Si la API falla, podés ingresar el valor manualmente y todo se recalcula |
| 💰 **Ingresos por mes** | Sin monto fijo — editable mes a mes |
| ➕ **Agregar gastos libremente** | Modal con nombre, monto, ARS o USD, categoría, nota opcional |
| 🔁 **Repetición flexible** | Solo este mes / Resto del año / Todos los meses / Cada 2 meses |
| ✎ **Edición inline** | Doble clic en cualquier monto de la tabla para editarlo en el lugar |
| 🔄 **Estados de pago** | Un clic cicla: Pendiente → Pagado → Próximo |
| 📊 **Resumen con 4 tarjetas** | Ingresos · Gastos · Disponible · Meta de ahorro |
| 📈 **Barra de progreso** | Cambia de color violeta→amarillo→rojo según el % comprometido |
| 💱 **Equivalente en USD** | Cada gasto muestra su valor en dólares al blue actual |
| 📉 **Gráfico de barras** | Evolución mensual animada con barras de ingresos y gastos |
| 💾 **Persistencia** | Todo se guarda en `localStorage` — nada se pierde al recargar |

## 🎨 Diseño

- **Tema oscuro** premium con fondo deep space (`#07071a`)
- **Glassmorphism** — tarjetas con blur y bordes sutiles
- **Orbes animados** de fondo para profundidad visual
- **Animaciones CSS** en entrada de elementos, hover effects, toasts, modal
- **Gráfico animado** con easing suave usando `requestAnimationFrame`
- **Logo SVG** inline con gradiente hexagonal y efecto glow pulsante
- **Responsive** — funciona en mobile, tablet y desktop

## 📁 Estructura del Proyecto

```
gestor/
├── index.html              # Estructura HTML semántica con ARIA labels
├── assets/
│   ├── css/
│   │   └── styles.css      # Design system completo + todas las animaciones
│   └── js/
│       └── app.js          # Toda la lógica de la aplicación (JS vanilla)
├── docs/
│   └── ARCHITECTURE.md     # Documentación técnica de arquitectura
├── README.md               # Este archivo
└── .gitignore
```

## 🚀 Instalación

### Opción 1 — Abrir directamente (sin servidor)
```bash
open index.html
# o en Windows:
start index.html
```

> **Nota:** La API del dólar blue puede fallar por CORS al abrir como `file://`. Recomendamos usar un servidor local.

### Opción 2 — Servidor local (recomendado)
```bash
# Con Python (viene pre-instalado en macOS/Linux)
python3 -m http.server 8080

# Con Node.js
npx serve .

# Con PHP
php -S localhost:8080
```
Luego abrí `http://localhost:8080` en tu navegador.

## 📖 Uso

### Navegar meses
1. Usá las pestañas de **año** (2026 / 2027) y luego las de **mes**
2. El mes actual se destaca en el gráfico

### Configurar ingresos
- Hacé clic en el campo **"Ingresos del Mes"** en la tarjeta superior izquierda
- El valor es independiente por cada mes

### Agregar un gasto
1. Botón **＋ Agregar gasto**
2. Completá nombre, monto y moneda (ARS o USD)
3. Elegí la categoría y el estado inicial
4. Seleccioná en cuántos meses repetirlo
5. Guardá — el gasto aparece en la tabla

### Editar un monto rápido
- **Doble clic** sobre cualquier monto en la tabla para editarlo inline sin abrir el modal

### Marcar como pagado
- Hacé clic en el badge de estado (`⏳ Pendiente`) para ciclarlo:
  `Pendiente → Pagado → Próximo → Pendiente...`

### Dólar Blue
- Se obtiene automáticamente de [dolarapi.com](https://dolarapi.com/v1/dolares/blue) al cargar
- El botón **⟳** actualiza la cotización manualmente
- Si no hay conexión, editá el número directamente en el widget

## 🔌 API Utilizada

| API | Endpoint | Licencia |
|---|---|---|
| [dolarapi.com](https://dolarapi.com) | `GET /v1/dolares/blue` | Pública, sin key |

Response esperado:
```json
{
  "venta": 1180,
  "compra": 1170,
  "casa": "blue",
  "moneda": "USD"
}
```

## 🗂️ Estado de la Aplicación

El estado se guarda en `localStorage` bajo la key `gestor_tracker_2627`:

```json
{
  "blue": 1180,
  "blueUpdated": "16:24",
  "yearView": 2026,
  "monthIdx": 0,
  "data": {
    "0": {
      "income": 0,
      "savings": 0,
      "expenses": [
        {
          "id": "unique-id",
          "name": "Netflix",
          "amount": 15,
          "currency": "USD",
          "category": "Entretenimiento",
          "status": "paid",
          "note": "plan básico"
        }
      ]
    }
  }
}
```

## 🛠️ Tecnologías

- **HTML5** semántico con ARIA para accesibilidad
- **CSS3** — Custom Properties, Grid, Flexbox, Animations, Keyframes
- **JavaScript ES6+** — Vanilla JS, Fetch API, Canvas 2D, localStorage, ResizeObserver
- **Google Fonts** — Inter (300–900)
- **Sin dependencias externas** — cero frameworks, cero bundlers

## 📄 Licencia

MIT © 2026 — Libre para uso personal y comercial.
