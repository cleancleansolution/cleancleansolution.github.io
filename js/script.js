/* ==========================================================================
   Clean Clean Solution — Interacciones del sitio (JavaScript Vanilla)
   www.cleancleansolution.com.mx

   Módulos
   1. Enlaces de WhatsApp con mensaje prellenado
   2. Imágenes: respaldo si falta el archivo + marco automático del logotipo
   3. Encabezado fijo y menú móvil
   4. Resaltado del menú según la sección visible
   5. Animaciones de aparición al hacer scroll
   6. Comparador antes / después
   7. Pre-cotizador por WhatsApp
   8. Acordeón de preguntas frecuentes
   9. Año del footer
   ========================================================================== */
(function () {
  'use strict';

  /* Número de WhatsApp en formato internacional, sin signos ni espacios. */
  var WHATSAPP_NUMBER = '524445509181';
  var WHATSAPP_BASE = 'https://wa.me/' + WHATSAPP_NUMBER;

  var root = document.documentElement;
  root.classList.add('js');

  var prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function whatsappUrl(message) {
    return message ? WHATSAPP_BASE + '?text=' + encodeURIComponent(message) : WHATSAPP_BASE;
  }

  function toArray(list) {
    return Array.prototype.slice.call(list);
  }

  /* ------------------------------------------------------------------------
     1. Enlaces de WhatsApp con mensaje prellenado
     Cada enlace con data-wa="mensaje" recibe su URL ya codificada.
     ------------------------------------------------------------------------ */
  toArray(document.querySelectorAll('a[data-wa]')).forEach(function (link) {
    link.href = whatsappUrl(link.getAttribute('data-wa'));
  });

  /* ------------------------------------------------------------------------
     2. Imágenes
     ------------------------------------------------------------------------ */
  function whenImageSettles(img, onLoad, onError) {
    if (img.complete) {
      if (img.naturalWidth > 0) { onLoad(); } else { onError(); }
      return;
    }
    img.addEventListener('load', onLoad, { once: true });
    img.addEventListener('error', onError, { once: true });
  }

  /* Fotos con data-fallback: si el archivo aún no existe se retira la imagen
     y queda visible la ilustración de respaldo que está detrás. */
  toArray(document.querySelectorAll('img[data-fallback]')).forEach(function (img) {
    whenImageSettles(img, function () {}, function () {
      if (img.parentNode) { img.parentNode.removeChild(img); }
    });
  });

  /* Lee el color de las esquinas del logotipo para saber si trae fondo
     transparente, claro u oscuro. */
  function readLogoBackground(img) {
    try {
      var width = img.naturalWidth;
      var height = img.naturalHeight;
      if (!width || !height) { return null; }

      var canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      var corners = [[1, 1], [width - 2, 1], [1, height - 2], [width - 2, height - 2]];
      var r = 0, g = 0, b = 0, a = 0;
      corners.forEach(function (point) {
        var pixel = ctx.getImageData(point[0], point[1], 1, 1).data;
        r += pixel[0]; g += pixel[1]; b += pixel[2]; a += pixel[3];
      });
      r = Math.round(r / 4); g = Math.round(g / 4); b = Math.round(b / 4); a = a / 4;

      if (a < 200) { return { type: 'transparent' }; }
      var luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      return {
        type: luminance < 0.45 ? 'dark' : 'light',
        color: 'rgb(' + r + ',' + g + ',' + b + ')'
      };
    } catch (error) {
      return null;
    }
  }

  toArray(document.querySelectorAll('.brand')).forEach(function (brand) {
    var img = brand.querySelector('.brand__img');
    var fallback = brand.querySelector('.brand__fallback');
    if (!img) { return; }

    whenImageSettles(img, function () {
      var background = readLogoBackground(img);
      if (background && background.type === 'dark') {
        brand.style.setProperty('--logo-bg', background.color);
        brand.classList.add('brand--tile');
      }
    }, function () {
      img.hidden = true;
      if (fallback) { fallback.hidden = false; }
    });
  });

  /* ------------------------------------------------------------------------
     3. Encabezado fijo y menú móvil
     ------------------------------------------------------------------------ */
  var header = document.getElementById('site-header');
  var nav = document.getElementById('menu-principal');
  var navToggle = document.querySelector('.nav-toggle');

  function updateHeaderShadow() {
    if (header) { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  }
  updateHeaderShadow();
  window.addEventListener('scroll', updateHeaderShadow, { passive: true });

  function setMenu(open) {
    if (!nav || !navToggle) { return; }
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }

  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) { setMenu(false); }
    });

    document.addEventListener('click', function (event) {
      if (header && !header.contains(event.target)) { setMenu(false); }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        navToggle.focus();
      }
    });

    if (window.matchMedia) {
      var desktopQuery = window.matchMedia('(min-width: 1024px)');
      var closeOnDesktop = function (query) { if (query.matches) { setMenu(false); } };
      if (desktopQuery.addEventListener) {
        desktopQuery.addEventListener('change', closeOnDesktop);
      } else if (desktopQuery.addListener) {
        desktopQuery.addListener(closeOnDesktop);
      }
    }
  }

  /* ------------------------------------------------------------------------
     4. Resaltado del menú según la sección visible
     ------------------------------------------------------------------------ */
  var navLinks = toArray(document.querySelectorAll('.nav__link[href^="#"]'));
  var linkBySection = [];

  navLinks.forEach(function (link) {
    var section = document.getElementById(link.getAttribute('href').slice(1));
    if (section) { linkBySection.push({ section: section, link: link }); }
  });

  function setActiveLink(activeLink) {
    navLinks.forEach(function (link) {
      var isActive = link === activeLink;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  if ('IntersectionObserver' in window && linkBySection.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        linkBySection.forEach(function (pair) {
          if (pair.section === entry.target) { setActiveLink(pair.link); }
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    linkBySection.forEach(function (pair) { spy.observe(pair.section); });
  }

  /* ------------------------------------------------------------------------
     5. Animaciones de aparición al hacer scroll
     ------------------------------------------------------------------------ */
  var revealItems = toArray(document.querySelectorAll('[data-reveal]'));

  function showRevealItem(item) {
    var delay = parseInt(item.getAttribute('data-reveal-delay'), 10) || 0;
    item.style.setProperty('--reveal-delay', delay + 'ms');
    item.classList.add('is-visible');
    /* Al terminar se retira el atributo para devolverle al elemento
       sus propias transiciones (por ejemplo, el hover de las tarjetas). */
    window.setTimeout(function () {
      item.removeAttribute('data-reveal');
      item.style.removeProperty('--reveal-delay');
    }, delay + 800);
  }

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (item) {
      item.classList.add('is-visible');
      item.removeAttribute('data-reveal');
    });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        showRevealItem(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  /* ------------------------------------------------------------------------
     6. Comparador antes / después
     Arrastre con mouse o dedo (Pointer Events) y control con teclado
     mediante el <input type="range"> incluido en el marcado.
     ------------------------------------------------------------------------ */
  toArray(document.querySelectorAll('[data-compare]')).forEach(function (compare) {
    var range = compare.querySelector('.compare__range');
    var dragging = false;

    function setPosition(percent) {
      var value = Math.min(100, Math.max(0, percent));
      compare.style.setProperty('--pos', value + '%');
      if (range) {
        range.value = String(Math.round(value));
        range.setAttribute(
          'aria-valuetext',
          Math.round(value) + '% antes, ' + (100 - Math.round(value)) + '% después'
        );
      }
    }

    function positionFromEvent(event) {
      var rect = compare.getBoundingClientRect();
      if (!rect.width) { return; }
      setPosition(((event.clientX - rect.left) / rect.width) * 100);
    }

    function stopDragging(event) {
      if (!dragging) { return; }
      dragging = false;
      compare.classList.remove('is-dragging');
      if (event && compare.hasPointerCapture && compare.hasPointerCapture(event.pointerId)) {
        compare.releasePointerCapture(event.pointerId);
      }
    }

    compare.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' && event.button !== 0) { return; }
      dragging = true;
      compare.classList.add('is-dragging');
      if (compare.setPointerCapture) {
        try { compare.setPointerCapture(event.pointerId); } catch (error) { /* sin captura */ }
      }
      positionFromEvent(event);
    });

    compare.addEventListener('pointermove', function (event) {
      if (dragging) { positionFromEvent(event); }
    });

    compare.addEventListener('pointerup', stopDragging);
    compare.addEventListener('pointercancel', stopDragging);
    compare.addEventListener('lostpointercapture', function () {
      dragging = false;
      compare.classList.remove('is-dragging');
    });

    if (range) {
      range.addEventListener('input', function () {
        setPosition(parseFloat(range.value));
      });
    }

    setPosition(range ? parseFloat(range.value) || 50 : 50);
  });

  /* ------------------------------------------------------------------------
     7. Pre-cotizador por WhatsApp (sin backend)
     Arma el mensaje con los muebles elegidos y lo coloca en el enlace
     https://wa.me/524445509181?text=...
     ------------------------------------------------------------------------ */
  var quoteForm = document.getElementById('quote-form');

  if (quoteForm) {
    var MAX_QUANTITY = 20;
    var quoteItems = toArray(quoteForm.querySelectorAll('[data-item]'));
    var summaryList = quoteForm.querySelector('[data-quote-list]');
    var summaryEmpty = quoteForm.querySelector('[data-quote-empty]');
    var summaryTotal = quoteForm.querySelector('[data-quote-total]');
    var quoteError = quoteForm.querySelector('[data-quote-error]');
    var quoteSubmit = quoteForm.querySelector('[data-quote-submit]');
    var quoteReset = quoteForm.querySelector('[data-quote-reset]');
    var nameField = document.getElementById('q-nombre');
    var areaField = document.getElementById('q-colonia');
    var notesField = document.getElementById('q-notas');

    var readQuantity = function (input) {
      var value = parseInt(input.value, 10);
      if (isNaN(value) || value < 0) { return 0; }
      return Math.min(value, MAX_QUANTITY);
    };

    var cleanText = function (field) {
      return field ? field.value.replace(/\s+/g, ' ').trim() : '';
    };

    var getSelection = function () {
      var selection = [];
      quoteItems.forEach(function (item) {
        var quantity = readQuantity(item.querySelector('.stepper__input'));
        if (quantity > 0) {
          var name = item.getAttribute('data-item');
          /* Grupos con variante (por ejemplo autos: vestiduras de tela o piel):
             la opción marcada se agrega al nombre de cada artículo del grupo. */
          var variantGroup = item.closest('[data-variant]');
          var variant = variantGroup && variantGroup.querySelector('input[type="radio"]:checked');
          if (variant) { name += ' (' + variant.value + ')'; }
          selection.push({ name: name, quantity: quantity });
        }
      });
      return selection;
    };

    var buildMessage = function (selection) {
      var lines = [
        'Hola Clean Clean Solution, me gustaría solicitar una cotización de lavado a domicilio en San Luis Potosí.',
        '',
        '*Servicios a cotizar:*'
      ];
      selection.forEach(function (entry) {
        lines.push('• ' + entry.quantity + ' × ' + entry.name);
      });

      var details = [];
      var name = cleanText(nameField);
      var area = cleanText(areaField);
      var notes = cleanText(notesField);
      if (name) { details.push('*Nombre:* ' + name); }
      if (area) { details.push('*Colonia o zona:* ' + area); }
      if (notes) { details.push('*Comentarios:* ' + notes); }
      if (details.length) {
        lines.push('');
        lines = lines.concat(details);
      }

      lines.push('', '¡Gracias!');
      return lines.join('\n');
    };

    var renderQuote = function () {
      var selection = getSelection();
      var totalPieces = 0;

      quoteItems.forEach(function (item) {
        var input = item.querySelector('.stepper__input');
        var quantity = readQuantity(input);
        var minus = item.querySelector('[data-step="-1"]');
        var plus = item.querySelector('[data-step="1"]');
        item.classList.toggle('is-selected', quantity > 0);
        if (minus) { minus.disabled = quantity <= 0; }
        if (plus) { plus.disabled = quantity >= MAX_QUANTITY; }
      });

      while (summaryList.firstChild) { summaryList.removeChild(summaryList.firstChild); }
      selection.forEach(function (entry) {
        totalPieces += entry.quantity;
        var row = document.createElement('li');
        var quantity = document.createElement('span');
        var label = document.createElement('span');
        quantity.className = 'summary__qty';
        quantity.textContent = entry.quantity + ' ×';
        label.textContent = entry.name;
        row.appendChild(quantity);
        row.appendChild(label);
        summaryList.appendChild(row);
      });

      summaryEmpty.hidden = selection.length > 0;
      summaryTotal.textContent = String(totalPieces);
      if (selection.length && quoteError) { quoteError.textContent = ''; }

      quoteSubmit.href = selection.length ? whatsappUrl(buildMessage(selection)) : WHATSAPP_BASE;
      return selection;
    };

    /* Botones + y − */
    quoteForm.addEventListener('click', function (event) {
      var button = event.target.closest('[data-step]');
      if (!button || !quoteForm.contains(button)) { return; }
      var input = button.parentNode.querySelector('.stepper__input');
      var step = parseInt(button.getAttribute('data-step'), 10);
      var next = Math.min(MAX_QUANTITY, Math.max(0, readQuantity(input) + step));
      input.value = String(next);
      renderQuote();
    });

    /* Cantidades escritas a mano y campos de texto */
    quoteForm.addEventListener('input', renderQuote);
    quoteForm.addEventListener('change', function (event) {
      if (event.target.classList && event.target.classList.contains('stepper__input')) {
        event.target.value = String(readQuantity(event.target));
        renderQuote();
      } else if (event.target.type === 'radio') {
        renderQuote();
      }
    });

    /* Envío: el enlace ya trae el mensaje; solo se valida que haya selección. */
    quoteSubmit.addEventListener('click', function (event) {
      var selection = renderQuote();
      if (selection.length) { return; }
      event.preventDefault();
      if (quoteError) {
        quoteError.textContent = 'Agrega al menos un mueble o vehículo para armar tu cotización.';
      }
      var firstInput = quoteForm.querySelector('.stepper__btn[data-step="1"]');
      if (firstInput) { firstInput.focus(); }
    });

    quoteForm.addEventListener('submit', function (event) {
      event.preventDefault();
      quoteSubmit.click();
    });

    if (quoteReset) {
      quoteReset.addEventListener('click', function () {
        quoteItems.forEach(function (item) {
          item.querySelector('.stepper__input').value = '0';
        });
        toArray(quoteForm.querySelectorAll('[data-variant] input[type="radio"]')).forEach(function (radio) {
          radio.checked = radio.defaultChecked;
        });
        if (quoteError) { quoteError.textContent = ''; }
        renderQuote();
      });
    }

    renderQuote();
  }

  /* ------------------------------------------------------------------------
     8. Acordeón de preguntas frecuentes
     ------------------------------------------------------------------------ */
  var faqButtons = toArray(document.querySelectorAll('.faq__q'));

  function setFaqItem(button, open) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    var item = button.closest('.faq__item');
    if (item) { item.classList.toggle('is-open', open); }
  }

  faqButtons.forEach(function (button) {
    setFaqItem(button, button.getAttribute('aria-expanded') === 'true');

    button.addEventListener('click', function () {
      var willOpen = button.getAttribute('aria-expanded') !== 'true';
      faqButtons.forEach(function (other) {
        if (other !== button) { setFaqItem(other, false); }
      });
      setFaqItem(button, willOpen);
    });
  });

  /* ------------------------------------------------------------------------
     9. Año del footer
     ------------------------------------------------------------------------ */
  var yearNode = document.getElementById('year');
  if (yearNode) { yearNode.textContent = String(new Date().getFullYear()); }

  /* ------------------------------------------------------------------------
     10. Carrusel del hero
     Cambia de foto cada 15 segundos (data-interval). Se detiene al pasar el
     mouse o al enfocar un control, cuando la pestaña no está visible o si la
     persona lo pausa. Con "reducir movimiento" activado no avanza solo.
     ------------------------------------------------------------------------ */
  toArray(document.querySelectorAll('[data-slider]')).forEach(function (slider) {
    var slides = toArray(slider.querySelectorAll('.slide'));
    var dots = toArray(slider.querySelectorAll('.slider__dot'));
    var pauseButton = slider.querySelector('.slider__pause');
    var interval = parseInt(slider.getAttribute('data-interval'), 10) || 15000;
    var current = 0;
    var timer = null;
    var userPaused = prefersReducedMotion;
    var hovering = false;
    var focusing = false;

    if (slides.length < 2) {
      var controls = slider.querySelector('.slider__controls');
      if (controls) { controls.hidden = true; }
      return;
    }

    function isRunning() {
      return !userPaused && !hovering && !focusing && !document.hidden;
    }

    function stop() {
      if (timer) { window.clearTimeout(timer); timer = null; }
    }

    function schedule() {
      stop();
      if (isRunning()) {
        timer = window.setTimeout(function () { show(current + 1, false); }, interval);
      }
    }

    function show(index, fromUser) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
        slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
        if (i === current) { dot.setAttribute('aria-current', 'true'); } else { dot.removeAttribute('aria-current'); }
      });
      schedule();
    }

    function setPaused(paused) {
      userPaused = paused;
      slider.classList.toggle('is-paused', paused);
      if (pauseButton) {
        pauseButton.setAttribute('aria-label', paused ? 'Reanudar presentación' : 'Pausar presentación');
      }
      slider.setAttribute('aria-live', paused ? 'polite' : 'off');
      schedule();
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { show(i, true); });
    });

    if (pauseButton) {
      pauseButton.addEventListener('click', function () { setPaused(!userPaused); });
    }

    slider.addEventListener('mouseenter', function () { hovering = true; stop(); });
    slider.addEventListener('mouseleave', function () { hovering = false; schedule(); });
    slider.addEventListener('focusin', function () { focusing = true; stop(); });
    slider.addEventListener('focusout', function () { focusing = false; schedule(); });
    document.addEventListener('visibilitychange', schedule);

    /* Deslizar con el dedo para cambiar de foto */
    var startX = null;
    slider.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' || event.target.closest('.slider__controls')) { return; }
      startX = event.clientX;
    });
    slider.addEventListener('pointerup', function (event) {
      if (startX === null) { return; }
      var delta = event.clientX - startX;
      startX = null;
      if (Math.abs(delta) > 40) { show(current + (delta < 0 ? 1 : -1), true); }
    });
    slider.addEventListener('pointercancel', function () { startX = null; });

    slides.forEach(function (slide, i) {
      slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
    });
    setPaused(userPaused);
    show(0, false);
  });
})();
