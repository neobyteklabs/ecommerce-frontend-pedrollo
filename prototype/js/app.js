/* =====================================================================
   BSV Tienda · prototipo. Cabecera/pie como custom elements (light DOM
   para que html.to.design capture las capas), marca por data-brand,
   carrito en localStorage, toasts e iconos (Lucide, SVG inline).
   ===================================================================== */
(function () {
  // ---------- Marca ----------
  const params = new URLSearchParams(location.search);
  // Este frontend es Pedrollo. El sistema sigue siendo genérico: data-brand en <html>
  // cambia los tokens; solo cambio-marca.html pasa ?brand= para demostrarlo.
  const brand = params.get('brand') || 'pedrollo';
  document.documentElement.dataset.brand = brand;

  const BRANDS = {
    pedrollo: { name: 'Pedrollo', logo: 'assets/logo-pedrollo.svg' },
    barmesa:  { name: 'Barmesa',  logo: 'assets/logo-barmesa.svg' },
    evans:    { name: 'Evans',    logo: 'assets/logo-evans.svg' },
  };
  window.BSV_BRAND = BRANDS[brand] || BRANDS.pedrollo;

  // ---------- Iconos (Lucide, 24px, stroke 2) ----------
  const I = {
    search: '<path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="8"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8M16 13H8M16 17H8"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    creditCard: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    wifiOff: '<path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M19 12.859a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><path d="m2 2 20 20"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  };
  window.icon = (n, cls) => `<svg ${cls ? `class="${cls}"` : ''} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-icon="${n}">${I[n] || ''}</svg>`;
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-icon-slot]').forEach(el => { el.innerHTML = icon(el.dataset.iconSlot); });
  });

  // ---------- Datos de ejemplo ----------
  const fmt = n => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  window.fmt = fmt;
  window.PRODUCTS = {
    'pkm-60':  { model: 'PKm 60',  name: 'Bomba periférica monofásica 0.5 HP', price: 1890, hp: '0.5', v: '127 V', phase: 'Monofásica', cat: 'Superficie', avail: 'stock' },
    'pkm-100': { model: 'PKm 100', name: 'Bomba periférica monofásica 1 HP',  price: 2650, hp: '1',   v: '127 V', phase: 'Monofásica', cat: 'Superficie', avail: 'stock' },
    'cpm-158': { model: 'CPm 158', name: 'Bomba centrífuga monofásica 1 HP',  price: 4280, hp: '1',   v: '127 V', phase: 'Monofásica', cat: 'Superficie', avail: 'pedido' },
    '4sr-2-9': { model: '4SR 2/9', name: 'Bomba sumergible 4" para pozo 1 HP', price: 9850, hp: '1',  v: '220 V', phase: 'Monofásica', cat: 'Sumergibles', avail: 'pedido' },
    'cpm-170': { model: 'CPm 170', name: 'Bomba centrífuga monofásica 1.5 HP', price: 5420, hp: '1.5', v: '127 V', phase: 'Monofásica', cat: 'Superficie', avail: 'stock' },
    'hf-6b':   { model: 'HF 6B',   name: 'Bomba centrífuga alto caudal 3 HP',  price: 18500, hp: '3', v: '220 V', phase: 'Trifásica', cat: 'Superficie', avail: 'pedido' },
    'top-2':   { model: 'TOP 2',   name: 'Bomba sumergible de drenaje 0.5 HP', price: 3150, hp: '0.5', v: '127 V', phase: 'Monofásica', cat: 'Drenaje', avail: 'stock' },
    'jswm-1a': { model: 'JSWm 1A', name: 'Bomba autocebante monofásica 1 HP',  price: 3980, hp: '1', v: '127 V', phase: 'Monofásica', cat: 'Superficie', avail: 'agotado' },
    'pkm-80':  { model: 'PKm 80',  name: 'Bomba periférica monofásica 0.75 HP', price: 2190, hp: '0.75', v: '127 V', phase: 'Monofásica', cat: 'Superficie', avail: 'stock' },
    'easypress': { model: 'EASYPRESS 2M', name: 'Regulador de presión electrónico', price: 2890, hp: '—', v: '127 V', phase: '—', cat: 'Presurización', avail: 'stock' },
  };
  window.availLabel = a => ({ stock: 'En existencia · envío 24–48 h', pedido: 'Sobre pedido · entrega 5–7 días', agotado: 'No disponible por ahora' })[a];

  // ---------- Carrito ----------
  const cart = {
    get() { try { return JSON.parse(localStorage.getItem('bsv.cart') || '[]'); } catch { return []; } },
    set(v) { localStorage.setItem('bsv.cart', JSON.stringify(v)); document.dispatchEvent(new CustomEvent('cart:change')); },
    add(id, qty = 1) { const c = cart.get(); const l = c.find(x => x.id === id); if (l) l.qty += qty; else c.push({ id, qty, priceAtAdd: PRODUCTS[id].price }); cart.set(c); },
    setQty(id, qty) { let c = cart.get(); c = c.map(x => x.id === id ? { ...x, qty } : x).filter(x => x.qty > 0); cart.set(c); },
    remove(id) { cart.set(cart.get().filter(x => x.id !== id)); },
    clear() { cart.set([]); },
    count() { return cart.get().reduce((a, x) => a + x.qty, 0); },
    subtotal() { return cart.get().reduce((a, x) => a + x.qty * PRODUCTS[x.id].price, 0); },
  };
  window.cart = cart;

  // ---------- Toast ----------
  window.toast = (msg, kind = 'success', link) => {
    let r = document.querySelector('.toast-region');
    if (!r) { r = document.createElement('div'); r.className = 'toast-region'; r.setAttribute('role', 'status'); r.setAttribute('aria-live', 'polite'); document.body.appendChild(r); }
    const t = document.createElement('div'); t.className = `toast toast-${kind}`;
    t.innerHTML = `${icon(kind === 'success' ? 'check' : 'alert')}<span>${msg}</span>${link ? `<a href="${link.href}">${link.label}</a>` : ''}`;
    r.appendChild(t); setTimeout(() => t.remove(), 4000);
  };

  // ---------- Cabecera ----------
  class BsvHeader extends HTMLElement {
    connectedCallback() {
      const cur = this.getAttribute('current') || '';
      const nav = [['index.html', 'Inicio'], ['categoria.html', 'Bombas de superficie'], ['categoria.html?c=sumergibles', 'Sumergibles'], ['categoria.html?c=presurizacion', 'Presurización'], ['categoria.html?c=drenaje', 'Drenaje'], ['categoria.html?c=refacciones', 'Refacciones']];
      this.innerHTML = `
      <header class="site-header" data-component="Header">
        <div class="topbar">Distribuidor autorizado ${BSV_BRAND.name} · Envío a todo México · Factura disponible · <a href="legal.html#contacto">55 7258 9681</a></div>
        <div class="container">
          <div class="header-main">
            <a class="brand" href="index.html" aria-label="${BSV_BRAND.name}, inicio" data-component="Brand/Logo">
              <span class="logo-slot" data-slot="logo"></span>
              <span><span class="wordmark"></span><span class="by">por Bombas y Sistemas Vega</span></span>
            </a>
            <form class="header-search" action="buscar.html" role="search" data-component="SearchBar">
              <label class="sr-only" for="q">Buscar modelo o producto</label>
              <div class="input-group">${icon('search')}<input id="q" name="q" type="search" placeholder="Buscar por modelo, HP o uso: PKm 60, 1 HP, pozo…" autocomplete="off"></div>
            </form>
            <div class="header-actions">
              <a class="icon-btn hide-mobile" href="cuenta.html">${icon('user')}<span>Cuenta</span></a>
              <a class="icon-btn" href="carrito.html" aria-label="Carrito">${icon('cart')}<span class="hide-mobile">Carrito</span><span class="count" data-cart-count></span></a>
              <button class="icon-btn hide-desktop" type="button" aria-label="Menú" onclick="toast('Menú lateral: categorías, cuenta, ayuda','success')">${icon('menu')}</button>
            </div>
          </div>
          <form class="mobile-search" action="buscar.html" role="search"><label class="sr-only" for="qm">Buscar</label><div class="input-group">${icon('search')}<input id="qm" name="q" type="search" placeholder="Buscar modelo, HP o uso…"></div></form>
          <nav class="header-nav" aria-label="Categorías" data-component="MainNav">${nav.map(([h, l]) => `<a href="${h}" ${cur === l ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
        </div>
      </header>`;
      const ls = this.querySelector('.logo-slot');
      const img = new Image(); img.src = BSV_BRAND.logo; img.alt = '';
      img.onload = () => { ls.appendChild(img); this.querySelector('.wordmark').style.display = 'none'; };
      updateCounts();
    }
  }
  class BsvBottombar extends HTMLElement {
    connectedCallback() {
      const cur = this.getAttribute('current') || '';
      const items = [['index.html', 'home', 'Inicio', 'inicio'], ['buscar.html', 'search', 'Buscar', 'buscar'], ['carrito.html', 'cart', 'Carrito', 'carrito'], ['cuenta.html', 'user', 'Cuenta', 'cuenta']];
      this.innerHTML = `<nav class="bottombar" aria-label="Navegación principal" data-component="BottomBar">${items.map(([h, i, l, k]) => `<a href="${h}" ${cur === k ? 'aria-current="page"' : ''}>${icon(i)}<span>${l}</span>${k === 'carrito' ? '<span class="count" data-cart-count></span>' : ''}</a>`).join('')}</nav>`;
      updateCounts();
    }
  }
  class BsvFooter extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
      <footer class="site-footer" data-component="Footer">
        <div class="container">
          <div class="cols">
            <div><div class="wordmark"></div><p style="margin-top:8px;max-width:36ch">Distribuidor autorizado ${BSV_BRAND.name} en México. Operado por Bombas y Sistemas Vega, S.A. de C.V.</p>
              <p>Tlalnepantla de Baz, Estado de México<br><a href="tel:+525572589681">55 7258 9681</a> · <a href="mailto:ventas@bombasvega.mx">ventas@bombasvega.mx</a></p></div>
            <div><h4>Tienda</h4><a href="categoria.html">Bombas de superficie</a><br><a href="categoria.html?c=sumergibles">Sumergibles</a><br><a href="categoria.html?c=presurizacion">Presurización</a><br><a href="categoria.html?c=drenaje">Drenaje</a><br><a href="categoria.html?c=refacciones">Refacciones</a></div>
            <div><h4>Tu cuenta</h4><a href="pedidos.html">Mis pedidos</a><br><a href="factura.html">Solicitar factura</a><br><a href="devolucion.html">Devoluciones</a><br><a href="cuenta.html">Direcciones y datos fiscales</a></div>
            <div><h4>Ayuda</h4><a href="legal.html#envios">Envíos y devoluciones</a><br><a href="legal.html#contacto">Contacto</a><br><a href="legal.html#terminos">Términos y condiciones</a><br><a href="legal.html#privacidad">Aviso de privacidad</a></div>
          </div>
          <div class="legal"><span>© 2026 Bombas y Sistemas Vega, S.A. de C.V.</span><span>Pagos seguros con Stripe · Precios en MXN con IVA incluido</span></div>
        </div>
      </footer>`;
    }
  }
  customElements.define('bsv-header', BsvHeader);
  customElements.define('bsv-bottombar', BsvBottombar);
  customElements.define('bsv-footer', BsvFooter);

  function updateCounts() { const n = cart.count(); document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = n ? n : ''); }
  document.addEventListener('cart:change', updateCounts);

})();
