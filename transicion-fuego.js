/* Transición con el video de fuego (Assets/02/Fire) entre el formulario y gracias.

   TransicionFuego.preparar(): crea la capa oculta y precarga el video, para que
   arranque sin demora al hacer clic.
   TransicionFuego.salir(url): reproduce la llamarada sobre la página. En su punto
   máximo la congela y navega a url. Detrás del video aparece un fondo rojo oscuro,
   porque ni en el pico las llamas son opacas del todo y la página se vería. Deja
   una marca en sessionStorage.
   TransicionFuego.entrar(): en la página de destino parte desde ese mismo cuadro
   (gracias.html lo muestra como imagen desde el <head>, antes de pintarse) y sigue
   el video desde el pico: el fuego se disipa y destapa la página.

   Si se cambia FONDO, actualizar también el degradé de html.fuego-entrando en
   gracias.html. */
(function () {
  const MARCA = 'transicion-fuego';
  const PICO = 0.3;   // s: cuadro 10 de 23, donde la llamarada cubre más pantalla
  const FONDO = 'linear-gradient(to bottom, rgb(35,5,0), rgb(95,18,2) 50%, rgb(170,55,8))';
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const suave = (a, b, t) => { t = Math.min(1, Math.max(0, (t - a) / (b - a))); return t * t * (3 - 2 * t); };
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  function crearCapa() {
    const capa = document.createElement('div');
    capa.className = 'transicion-fuego';
    capa.setAttribute('aria-hidden', 'true');
    capa.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;visibility:hidden;';
    const fondo = document.createElement('div');
    fondo.style.cssText = `position:absolute;inset:0;opacity:0;background:${FONDO};`;
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
    // Safari usa HEVC con transparencia; Chrome, Edge y Firefox, WebM VP9 con transparencia
    video.innerHTML =
      '<source src="Assets/02/Fire_hevc.mov" type=\'video/quicktime; codecs="hvc1"\'>' +
      '<source src="Assets/02/Fire.webm" type="video/webm">';
    capa.append(fondo, video);
    document.body.appendChild(capa);
    video.load();
    return { capa, fondo, video };
  }

  let salida = null, saliendo = false;

  window.TransicionFuego = {
    preparar() {
      if (reducido || salida) return;
      salida = crearCapa();
      new Image().src = 'Assets/02/Fire_pico.webp';   // queda en caché para gracias
    },

    salir(url) {
      if (saliendo) return;
      if (reducido) { location.href = url; return; }
      saliendo = true;
      this.preparar();
      const { capa, fondo, video } = salida;
      try { sessionStorage.setItem(MARCA, '1'); } catch (e) {}
      capa.style.visibility = 'visible';
      capa.style.pointerEvents = 'auto';   // bloquea clics durante la transición
      let fin = false;
      const irse = () => {
        if (fin) return;
        fin = true;
        video.pause();
        fondo.style.opacity = 1;
        location.href = url;
      };
      video.currentTime = 0;
      const p = video.play();
      if (p) p.catch(irse);          // si el navegador no deja reproducir, navega igual
      setTimeout(irse, 2500);        // por si el video no avanza
      const paso = () => {
        if (fin) return;
        const t = video.currentTime;
        fondo.style.opacity = suave(0.12, PICO, t);
        if (t >= PICO) irse();
        else requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    },

    entrar() {
      const html = document.documentElement;
      if (!html.classList.contains('fuego-entrando')) return;
      try { sessionStorage.removeItem(MARCA); } catch (e) {}
      if (reducido) { html.classList.remove('fuego-entrando'); return; }

      const { capa, fondo, video } = crearCapa();
      fondo.style.opacity = 1;
      capa.style.pointerEvents = 'auto';
      let terminado = false;
      const terminar = () => {
        if (terminado) return;
        terminado = true;
        html.classList.remove('fuego-entrando');
        capa.remove();
      };

      // La capa se muestra recién cuando el video tiene el cuadro del pico; hasta
      // entonces lo reemplaza la imagen de html.fuego-entrando
      const enPico = new Promise((r) => {
        const ir = () => { video.currentTime = PICO + 0.017; };
        if (video.readyState >= 1) ir();
        else video.addEventListener('loadedmetadata', ir, { once: true });
        video.addEventListener('seeked', r, { once: true });
      });
      const cargada = document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((r) => addEventListener('load', r, { once: true }));

      Promise.race([Promise.all([enPico, cargada, espera(150)]).then(() => true), espera(2500).then(() => false)])
        .then((listo) => {
          if (!listo) { terminar(); return; }   // no cargó a tiempo: muestra la página sin transición
          capa.style.visibility = 'visible';
          html.classList.remove('fuego-entrando');
          const p = video.play();
          if (p) p.catch(terminar);
          video.addEventListener('ended', terminar, { once: true });
          setTimeout(terminar, 2000);
          const paso = () => {
            if (terminado) return;
            fondo.style.opacity = 1 - suave(PICO, 0.45, video.currentTime);
            requestAnimationFrame(paso);
          };
          requestAnimationFrame(paso);
        });
    },
  };

  // Al volver con "atrás", el navegador puede restaurar el formulario tal como quedó
  // (congelado en el fuego): se deja la capa lista para otra salida
  addEventListener('pageshow', (e) => {
    if (!e.persisted || !salida) return;
    saliendo = false;
    salida.video.pause();
    salida.video.currentTime = 0;
    salida.fondo.style.opacity = 0;
    salida.capa.style.visibility = 'hidden';
    salida.capa.style.pointerEvents = 'none';
  });
})();
