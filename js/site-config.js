/*
  ARP Prevención — site-config.js
  Fuente única de verdad: lee config/empresa del MISMO Firestore que usa
  la app interna (arp-inspecciones). Un cambio ahí (dirección, teléfono,
  alcances ENAC...) se refleja aquí solo con recargar la página — nunca
  se edita a mano en el HTML de ninguna página.

  Uso: añade data-config="campo" a cualquier elemento y este script
  rellena su contenido con el campo correspondiente de config/empresa.
  Ejemplos: <span data-config="telefono"></span>
            <span data-config="sedeFiscal"></span>

  data-flag="nombreCampo" oculta el elemento si ese campo es exactamente
  false en config/empresa (por defecto, visible si el campo no existe).

  El sello ENAC es un caso especial: se calcula solo a partir de
  enacAlcances, no es un flag manual — basta con que un alcance esté
  activo para que aparezca. Ahora mismo (acreditación en pausa) todos
  están en false, así que el sello se oculta correctamente sin que
  nadie tenga que tocar nada aquí cuando se reactive.
*/

// Valores por defecto — se muestran mientras carga Firestore o si falla la conexión.
// Reflejan el shape real de config/empresa en Firestore (arp-inspecciones).
const CONFIG_FALLBACK = {
  nombre: "Adell Riesgos y Prevención S.L.",
  nombreCorto: "Arp Prevención S.L.",
  sedeSocial: "C/ Gabriel Miró 3, Edificio Wertice, Planta 1ª Puerta 4, 41704 Dos Hermanas, Sevilla",
  sedeFiscal: "C/ Gabriel Miró 3, Edificio Wertice, Planta 1ª Puerta 4, 41704 Dos Hermanas, Sevilla",
  telefono: "685 76 26 45",
  email: "info@arpprevencion.com",
  web: "www.arpprevencion.com",
  acreditacion: "Nº 489 / EI 558",
  enacAlcances: { PAA: false, FER: false, AJN: false, SAE: false }
  // cif, instagram, facebook: aún no existen en Firestore — se muestran
  // solo cuando se añadan como campos de config/empresa.
};

async function loadSiteConfig(){
  let empresa = CONFIG_FALLBACK;

  try{
    const snap = await db.collection('config').doc('empresa').get();
    if(snap.exists) empresa = { ...CONFIG_FALLBACK, ...snap.data() };
  }catch(err){
    console.warn('No se pudo leer config/empresa de Firestore, usando valores por defecto.', err);
  }

  applyConfig(empresa);
  return empresa;
}

function applyConfig(empresa){
  // Rellena cualquier elemento marcado con data-config="campo"
  document.querySelectorAll('[data-config]').forEach(el => {
    const key = el.getAttribute('data-config');
    const v = empresa[key];
    if(v === undefined || v === '') return;
    el.textContent = v;
    // Si es un enlace, también actualiza el href automáticamente
    if(el.tagName === 'A'){
      if(key === 'telefono') el.href = 'tel:+34' + v.replace(/[\s\-\.]/g, '');
      else if(key === 'email') el.href = 'mailto:' + v;
      else if(key === 'web') el.href = 'https://' + v.replace(/^https?:\/\//, '');
    }
  });

  // Enlaces de redes sociales — solo se muestran si el campo existe
  document.querySelectorAll('[data-social]').forEach(el => {
    const key = el.getAttribute('data-social');
    if(empresa[key]) el.href = empresa[key];
    else el.style.display = 'none';
  });

  // Sello ENAC — visible si algún alcance está activo en enacAlcances
  const enacActivo = Object.values(empresa.enacAlcances || {}).some(Boolean);
  document.querySelectorAll('[data-flag="sello"]').forEach(el => {
    el.style.display = enacActivo ? '' : 'none';
  });

  // Flags genéricos: oculto solo si el campo homónimo es exactamente false
  document.querySelectorAll('[data-flag]').forEach(el => {
    const key = el.getAttribute('data-flag');
    if(key === 'sello') return; // ya resuelto arriba
    if(empresa[key] === false) el.style.display = 'none';
  });
}

// Expuesto globalmente para que site-header.js y site-footer.js puedan
// re-aplicar la config a elementos renderizados después de la primera llamada.
window.applyConfig = applyConfig;
window.siteConfigReady = loadSiteConfig();

// Carga la imagen de cabecera de cualquier página de servicio.
// Solo actúa si existe un .svc-page-hero con data-hero-img.
// Si el archivo no existe → el hero mantiene su aspecto original sin error.
(function initHeroImg(){
  var hero = document.querySelector('.svc-page-hero[data-hero-img]');
  if(!hero) return;
  var src = (window.SITE_PREFIX || '') + hero.getAttribute('data-hero-img');
  var test = new Image();
  test.onload = function(){
    hero.classList.add('has-photo');
    var overlay = document.createElement('div');
    overlay.className = 'svc-page-hero-overlay';
    var img = document.createElement('img');
    img.className = 'svc-page-hero-img';
    img.src = src;
    img.alt = '';
    img.setAttribute('aria-hidden','true');
    hero.insertBefore(overlay, hero.firstChild);
    hero.insertBefore(img, hero.firstChild);
  };
  test.src = src;
})();
