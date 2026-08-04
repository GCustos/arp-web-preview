/*
  ARP Prevención — site-header.js
  Pinta el header en cualquier página que tenga <div id="site-header"></div>.
  Cambiar el menú (añadir/quitar un enlace) se hace UNA VEZ aquí, no en cada página.

  La página puede indicar qué enlace marcar como activo con:
    <div id="site-header" data-active="servicios"></div>
*/
const SITE_NAV = [
  { href: "/inspeccion-y-certificacion/", label: "Inspección y Certificación", key: "servicios" },
  { href: "/proyectos-de-ingenieria/", label: "Ingeniería", key: "ingenieria" },
  { href: "/tarifas/", label: "Tarifas", key: "tarifas" },
  { href: "/mapa/", label: "Mapa de instalaciones", key: "mapa" },
  { href: "/blog/", label: "Casos", key: "blog" },
  { href: "/empresa/", label: "Empresa", key: "empresa" }
];

function renderSiteHeader(){
  const mount = document.getElementById('site-header');
  if(!mount) return;
  const active = mount.getAttribute('data-active') || '';

  mount.innerHTML = `
    <header class="site">
      <div class="wrap navbar">
        <a href="/" class="brand">
          <div class="brand-mark">ARP</div>
          <div>
            <div class="brand-name">ARP Prevención</div>
            <div class="brand-sub">Entidad de Inspección · ISO 17020</div>
          </div>
        </a>
        <nav class="site-nav" id="siteNav">
          ${SITE_NAV.map(item => `<a href="${item.href}" class="${item.key===active?'active':''}">${item.label}</a>`).join('')}
        </nav>
        <div class="navbar-right">
          <a href="/contacto/" class="cta-header">Presupuesto gratuito</a>
          <button type="button" class="nav-toggle" id="navToggle" aria-label="Abrir menú" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  `;

  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

renderSiteHeader();
