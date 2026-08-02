/*
  ARP Prevención — site-footer.js
  Pinta el footer en cualquier página que tenga <div id="site-footer"></div>.
  Los datos de contacto/redes se rellenan automáticamente desde config
  (ver site-config.js) — no escribir dirección/teléfono a mano aquí.
*/
function renderSiteFooterSkeleton(){
  const mount = document.getElementById('site-footer');
  if(!mount) return;

  mount.innerHTML = `
    <footer class="site">
      <div class="wrap">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="brand">
              <div class="brand-mark">ARP</div>
              <div class="brand-name" style="color:#fff">ARP Prevención</div>
            </div>
            <p data-config="nombre"></p>
            <p style="margin-top:4px" data-flag="sello">Entidad de inspección acreditada ENAC <span data-config="acreditacion"></span>, ISO/IEC 17020.</p>
            <div class="social-row">
              <a class="social-btn" data-social="instagram" href="#" target="_blank" rel="noopener">IG</a>
              <a class="social-btn" data-social="facebook" href="#" target="_blank" rel="noopener">FB</a>
            </div>
          </div>
          <div>
            <h4>Servicios</h4>
            <ul>
              <li><a href="/acreditadas/parques-de-aventura/">Parques de aventura</a></li>
              <li><a href="/acreditadas/estructuras-artificiales-de-escalada/">Rocódromos</a></li>
              <li><a href="/acreditadas/instalaciones-deportivas/">Equipamiento deportivo</a></li>
              <li><a href="/no-acreditadas/vias-ferratas/">Vías ferratas</a></li>
            </ul>
          </div>
          <div>
            <h4>Empresa</h4>
            <ul>
              <li><a href="/empresa/quienes-somos/">Quiénes somos</a></li>
              <li><a href="/empresa/politica-de-empresa/">Política de empresa</a></li>
              <li><a href="/empresa/aviso-legal/">Aviso legal</a></li>
              <li><a href="/mapa/">Mapa de instalaciones</a></li>
            </ul>
          </div>
          <div>
            <h4>Contacto</h4>
            <ul>
              <li class="mono" data-config="telefono"></li>
              <li data-config="sedeFiscal"></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 <span data-config="nombre"></span></span>
          <span>ARP Prevención · Ocio y turismo activo</span>
        </div>
      </div>
    </footer>
  `;
}

renderSiteFooterSkeleton();
// site-config.js rellena los data-config / data-social cuando Firestore responde:
window.siteConfigReady.then(() => {});
