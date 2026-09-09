/*
  ARP Prevención — site-head.js
  Un path que empieza por "/" SIEMPRE resuelve contra la raíz del dominio,
  <base href> no lo cambia (así funciona la resolución de URLs, no un bug).
  Por eso cada página calcula antes window.SITE_PREFIX (vacío en producción,
  "/arp-web-preview" en la demo de GitHub Pages) y usa document.write para
  cargar este script con el prefijo correcto — y aquí, con SITE_PREFIX ya
  disponible como global, se antepone a los <link> de CSS y favicon
  (bloqueantes, por eso document.write y no un <link> normal).
  Cambiar el CSS compartido o el favicon se hace UNA VEZ aquí, no en cada página.
*/
document.write('<link rel="stylesheet" href="' + SITE_PREFIX + '/css/tokens.css">');
document.write('<link rel="stylesheet" href="' + SITE_PREFIX + '/css/base.css">');
document.write('<link rel="icon" type="image/svg+xml" href="' + SITE_PREFIX + '/favicon.svg">');
document.write('<link rel="shortcut icon" href="' + SITE_PREFIX + '/favicon.ico">');
document.write('<link rel="apple-touch-icon" href="' + SITE_PREFIX + '/apple-touch-icon.png">');
