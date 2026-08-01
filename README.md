# arp-web-preview

Repo de pruebas para el rediseño de arpprevencion.com. Es **desechable**:
sirve para enseñar el avance al equipo en una URL pública mientras se
resuelve el acceso al hosting real de ARP. Cuando la versión esté validada,
se sube a Hostinger y este repo se archiva/borra.

## Puesta en marcha

1. **Crear el repo en GitHub** (nuevo, separado de `arp-inspecciones`):
   ```
   github.com/GCustos/arp-web-preview
   ```
2. Subir estos archivos y activar **GitHub Pages** (Settings → Pages → rama `main`, carpeta raíz).
3. Tendrás una URL tipo `gcustos.github.io/arp-web-preview` para compartir.

## Firebase — proyecto nuevo (NO usar `arp-inspecciones`)

1. Crear un proyecto Firebase nuevo, ej. `arp-web` — separado del sistema de inspecciones.
2. Activar **Firestore** y crear estos documentos iniciales:
   - `config/empresa` → razon_social, cif, direccion, cp_ciudad, telefono, texto_aviso_legal, texto_politica_empresa
   - `config/redes` → instagram, facebook
   - `config/web` → sello_visible (bool), banner_visible (bool), sello_texto
3. Copiar las credenciales del proyecto en `js/firebase-init.js` (sustituir los "PENDIENTE").
4. En **Authentication → Settings → Authorized domains**, añadir `gcustos.github.io` mientras dure la fase de preview. Al migrar a Hostinger, quitarlo y añadir `arpprevencion.com`.
5. Reglas de Firestore recomendadas para esta fase (ajustar cuando se añada el panel de admin con Auth):
   ```
   match /config/{doc} {
     allow read: if true;
     allow write: if false; // solo se edita desde la consola de Firebase por ahora
   }
   ```

## Sistema de diseño

- `css/tokens.css` — colores, tipografía, espaciados. Cambiar aquí, se propaga a todo.
- `css/base.css` — header, footer, botones, tarjetas de servicio. Componentes compartidos.
- Cada página añade solo sus estilos exclusivos en un `<style>` propio (ver `index.html` como ejemplo).

## Paths absolutos en GitHub Pages — SITE_PREFIX

Todo el código escribe rutas absolutas (`/css/...`, `/contacto/...`) pensando
en el dominio real (`arpprevencion.com`, raíz). Pero GitHub Pages sirve este
repo en `/arp-web-preview/`, y un path que empieza por `/` **siempre**
resuelve contra la raíz del dominio — `<base href>` no lo cambia, es cómo
funciona la resolución de URLs, no un bug puntual. La solución: un snippet al
principio de cada página calcula `window.SITE_PREFIX` (vacío en producción,
`/arp-web-preview` en GitHub Pages) y lo antepone a mano donde hace falta.

**Cada página nueva debe empezar el `<head>` así**, antes de cualquier otro
`<link>`:
```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>
  window.SITE_PREFIX = location.hostname.endsWith('github.io') ? '/arp-web-preview' : '';
  document.write('<link rel="stylesheet" href="' + SITE_PREFIX + '/css/tokens.css">');
  document.write('<link rel="stylesheet" href="' + SITE_PREFIX + '/css/base.css">');
</script>
```

Y terminar el `<body>` así:
```html
<div id="site-header" data-active="CLAVE"></div>
...
<div id="site-footer"></div>

<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
<script>
  document.write('<script src="' + SITE_PREFIX + '/js/firebase-init.js"><\/script>');
  document.write('<script src="' + SITE_PREFIX + '/js/site-config.js"><\/script>');
  document.write('<script src="' + SITE_PREFIX + '/js/site-header.js"><\/script>');
  document.write('<script src="' + SITE_PREFIX + '/js/site-footer.js"><\/script>');
</script>
<script>
  if (SITE_PREFIX) {
    document.querySelectorAll('a[href^="/"]').forEach(function(a){
      a.setAttribute('href', SITE_PREFIX + a.getAttribute('href'));
    });
  }
</script>
```
`CLAVE` es una de las definidas en `SITE_NAV` dentro de `js/site-header.js`
(sirve para marcar el enlace activo del menú). No hace falta prefijar a mano
ningún `<a href="/...">` del contenido de la página — el último script los
reescribe automáticamente, incluidos los que pinta `site-header.js`/
`site-footer.js`. Al migrar a Hostinger (dominio raíz real), `SITE_PREFIX`
se calcula como cadena vacía solo y todo funciona igual sin tocar nada.

## Datos que se propagan solos (no escribir a mano en el HTML)

Usa `data-config="campo"` para cualquier dato de `config/empresa` o
`config/web` (ej. `<span data-config="telefono"></span>`), y
`data-social="instagram"` / `data-social="facebook"` para enlaces de redes.
`data-flag="sello"` / `data-flag="banner"` ocultan el bloque si el flag
correspondiente está en `false`.

## Próximos pasos (ver AUDITORIA_Y_PLAN_WEB_ARP.md)

- Fase 2: páginas troncales (Inspección y Certificación índice, Empresa, Contacto)
- Fase 3: páginas de servicio individuales
- Fase 4: subpáginas de equipamiento deportivo (decidir: 6 páginas o 1 con pestañas)
- Fase 5: blog + panel de administración conectado a Firestore
- Fase 6: Tarifas, Política de empresa, Aviso legal, formularios de contacto
- Fase 7: mapa de instalaciones (`instalaciones_publicas`, ver documento de plan)
