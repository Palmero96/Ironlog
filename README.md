# 🏋️ IRON LOG

App móvil PWA para seguimiento de entrenamiento en el gimnasio.

## Instalación como app en Android

1. Abre la URL de GitHub Pages en Chrome
2. Menú (⋮) → "Añadir a pantalla de inicio"
3. Listo — funciona como app nativa sin Play Store

## Funcionalidades

- 📋 Rutinas — pega cualquier formato y se parsea automáticamente
- ✅ Marca ejercicios y series individuales como hechos
- 📅 Calendario con historial de entrenos
- 📈 Seguimiento de peso con gráfico de evolución
- ⚡ Generador de prompt para IA coach personalizado
- 👤 Perfil completo (IMC, lesiones, objetivos, equipamiento)
- 🔥 Racha de días consecutivos entrenados
- 💪 Cálculo automático de 1RM por ejercicio
- 🔌 Funciona offline (PWA con Service Worker)

## Estructura

```
ironlog/
├── index.html      ← App completa
├── manifest.json   ← Configuración PWA
├── sw.js           ← Service Worker (offline)
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Datos

Los datos se guardan en `localStorage` del navegador. Persisten indefinidamente mientras no limpies el caché del navegador o desinstales la app.
