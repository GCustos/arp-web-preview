/*
  ARP Prevención — site-config.js
  Fuente única de verdad para datos que se repiten en TODAS las páginas
  (dirección, teléfono, redes, textos legales, flags on/off).

  Cambiar un dato en Firestore (config/empresa, config/redes, config/web)
  actualiza automáticamente todas las páginas que carguen este script.
  No escribas dirección/teléfono/redes a mano en el HTML de ninguna página.

  Uso: añade data-config="campo" a cualquier elemento y este script
  rellena su contenido. Ejemplos:
    <span data-config="telefono"></span>
    <span data-config="direccion"></span>
*/

// Valores por defecto — se muestran mientras carga Firestore o si falla la conexión.
// MANTENER SINCRONIZADOS a mano si cambian los datos reales, como red de seguridad.
const CONFIG_FALLBACK = {
  empresa: {
    razon_social: "Adell Riesgos y Prevención S.L.",
    cif: "B64399793",
    direccion: "Calle Alegría Nº27-29, local 2",
    cp_ciudad: "08905 Hospitalet de Llobregat, Barcelona",
    telefono: "685 76 26 45"
  },
  redes: {
    instagram: "https://instagram.com/arpprevencion",
    facebook: "https://facebook.com/arpprevencion"
  },
  web: {
    sello_visible: true,
    banner_visible: true,
    sello_texto: "ENAC 489/EI 558"
  }
};

async function loadSiteConfig(){
  let empresa = CONFIG_FALLBACK.empresa;
  let redes = CONFIG_FALLBACK.redes;
  let web = CONFIG_FALLBACK.web;

  try{
    const [empresaSnap, redesSnap, webSnap] = await Promise.all([
      db.collection('config').doc('empresa').get(),
      db.collection('config').doc('redes').get(),
      db.collection('config').doc('web').get()
    ]);
    if(empresaSnap.exists) empresa = { ...empresa, ...empresaSnap.data() };
    if(redesSnap.exists) redes = { ...redes, ...redesSnap.data() };
    if(webSnap.exists) web = { ...web, ...webSnap.data() };
  }catch(err){
    console.warn('No se pudo leer config de Firestore, usando valores por defecto.', err);
  }

  applyConfig({ empresa, redes, web });
  return { empresa, redes, web };
}

function applyConfig({ empresa, redes, web }){
  // Rellena cualquier elemento marcado con data-config="campo"
  document.querySelectorAll('[data-config]').forEach(el => {
    const key = el.getAttribute('data-config');
    if(empresa[key] !== undefined) el.textContent = empresa[key];
  });

  // Enlaces de redes sociales
  document.querySelectorAll('[data-social="instagram"]').forEach(el => el.href = redes.instagram);
  document.querySelectorAll('[data-social="facebook"]').forEach(el => el.href = redes.facebook);

  // Sello ENAC — se oculta si sello_visible es false
  document.querySelectorAll('[data-flag="sello"]').forEach(el => {
    el.style.display = web.sello_visible ? '' : 'none';
  });
  document.querySelectorAll('[data-config="sello_texto"]').forEach(el => {
    el.textContent = web.sello_texto;
  });

  // Banner de presupuesto — se oculta si banner_visible es false
  document.querySelectorAll('[data-flag="banner"]').forEach(el => {
    el.style.display = web.banner_visible ? '' : 'none';
  });
}

// Se ejecuta en cuanto el DOM está listo; site-header.js y site-footer.js
// esperan a esta promesa antes de pintar sus datos.
window.siteConfigReady = loadSiteConfig();
