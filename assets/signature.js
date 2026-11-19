(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('SignatureConfig')?.textContent || '{}');
  const root = config.root || '/';
  const money = cents => (config.currency || 'PKR') === 'PKR' ? `Rs.${new Intl.NumberFormat(config.locale || 'en',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(cents)/100)}` : new Intl.NumberFormat(config.locale || 'en',{style:'currency',currency:config.currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(cents)/100);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const syncScrollbarWidth = () => {
    // Keep the reserved page width while a giveaway temporarily removes the root gutter.
    if (document.querySelector('.giveaway-popup[open]')) return;
    document.documentElement.style.setProperty('--scrollbar-width',`${Math.max(0,innerWidth-document.documentElement.clientWidth)}px`);
  };
  syncScrollbarWidth();
  addEventListener('resize',syncScrollbarWidth,{passive:true});
  const toast = message => { const el = $('[data-toast]'); if (!el) return; el.textContent = message; el.classList.add('is-visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('is-visible'), 4000); };
  const drawerMotion = new WeakMap();
  const isDrawer = dialog => dialog?.matches('.cart-drawer,.mobile-menu');
  function makeCloseButton(label) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'dialog-close icon-button'; button.setAttribute('aria-label',label);
    const icon = $('#QuickView [data-dialog-close] .icon')?.cloneNode(true);
    if (icon) button.append(icon);
    else { const glyph = document.createElement('span'); glyph.className = 'dialog-close__glyph'; glyph.setAttribute('aria-hidden','true'); glyph.textContent = '×'; button.append(glyph); }
    return button;
  }
  function stopVideo(poster, restoreFocus = true) {
    if (!poster) return;
    $('.video-feature__player',poster)?.remove(); $('.video-feature__close',poster)?.remove();
    poster.classList.remove('is-playing');
    const trigger = $('[data-video-url]',poster); trigger?.setAttribute('aria-expanded','false');
    if (restoreFocus) trigger?.focus({preventScroll:true});
  }
  function openDialog(dialog) {
    if (!dialog) return;
    bindDialog(dialog);
    const previous = drawerMotion.get(dialog);
    if (dialog.open && !dialog.classList.contains('is-closing')) return;
    previous?.cancel();
    dialog.classList.remove('is-closing');
    if (!dialog.open) { if (dialog.matches('.newsletter-popup')) dialog.show(); else dialog.showModal(); }
    if (isDrawer(dialog) && !reducedMotion.matches) {
      const from = dialog.matches('.mobile-menu') ? '-100%' : '100%';
      drawerMotion.set(dialog,dialog.animate([{transform:`translateX(${from})`},{transform:'translateX(0)'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'}));
    }
  }
  function closeDialog(dialog) {
    if (!dialog?.open || dialog.classList.contains('is-closing')) return;
    drawerMotion.get(dialog)?.cancel();
    if (!isDrawer(dialog) || reducedMotion.matches) { dialog.close(); return; }
    dialog.classList.add('is-closing');
    const to = dialog.matches('.mobile-menu') ? '-100%' : '100%';
    const animation = dialog.animate([{transform:'translateX(0)'},{transform:`translateX(${to})`}],{duration:300,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
    drawerMotion.set(dialog,animation);
    animation.finished.then(()=> { dialog.close(); dialog.classList.remove('is-closing'); animation.cancel(); }).catch(()=> {});
  }
  function bindDialog(dialog) {
    if (dialog.dataset.bound) return;
    dialog.dataset.bound = 'true';
    dialog.addEventListener('cancel',event=> { if (isDrawer(dialog)) { event.preventDefault(); closeDialog(dialog); } });
    dialog.addEventListener('click',event=> {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog(dialog);
    });
  }
  const storage = {get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },set(key,value) { try { localStorage.setItem(key,JSON.stringify(value)); } catch { /* Private browsing can disable persistence. */ } }};
  let wishlist = storage.get('twin-signature:wishlist', []).filter?.(value => typeof value === 'string' && /^[a-z0-9-]+$/.test(value)).slice(0,50) || [];
  function syncWishlist() {
    $$('[data-wishlist-count]').forEach(el => el.textContent = wishlist.length);
    $$('[data-wishlist-toggle]').forEach(el => { const saved = wishlist.includes(el.dataset.wishlistToggle); el.setAttribute('aria-pressed', String(saved)); el.title = saved ? 'Remove from wishlist' : 'Save to wishlist'; });
    const grid = $('[data-wishlist-grid]');
    if (grid) $$('[data-product-handle]', grid).forEach(card => { if (!wishlist.includes(card.dataset.productHandle)) card.remove(); });
    if ($('[data-wishlist-empty]')) $('[data-wishlist-empty]').hidden = wishlist.length !== 0;
  }
  async function loadWishlist() {
    const grid = $('[data-wishlist-grid]'); if (!grid || grid.dataset.loaded) return;
    grid.dataset.loaded = 'true'; const status = $('[data-wishlist-status]');
    if (wishlist.length) status.textContent = 'Loading your favourite fragrances…';
    let failures = 0;
    // A small worker pool avoids overwhelming storefront rendering.
    const queue = [...wishlist];
    await Promise.all(Array.from({length:Math.min(4,queue.length)},async () => {
      while (queue.length) {
        const handle = queue.shift();
        try {
          const response = await fetch(`${root}products/${encodeURIComponent(handle)}?view=card`);
          if (response.status === 404) { wishlist = wishlist.filter(value => value !== handle); continue; }
          if (!response.ok) throw new Error('Unable to load a fragrance.');
          const doc = new DOMParser().parseFromString(await response.text(),'text/html');
          const card = $('[data-product-handle]',doc);
          if (card && wishlist.includes(handle)) grid.append(card);
        } catch { failures++; }
      }
    }));
    storage.set('twin-signature:wishlist', wishlist); syncWishlist();
    status.textContent = failures ? 'Some fragrances could not be loaded. Please refresh to try again.' : '';
  }
  function renderCart(sections, cart) {
    let rendered = false;
    for (const [id, html] of Object.entries(sections || {})) {
      if (!html) continue;
      const doc = new DOMParser().parseFromString(html,'text/html');
      const incoming = $('[data-cart-content]',doc);
      const host = id === 'ts-cart-drawer' ? $('#CartDrawer [data-cart-content]') : $('[data-cart-page] [data-cart-content]');
      if (incoming && host) { host.replaceChildren(...incoming.childNodes); rendered = true; }
      const count = $('[data-cart-count]',doc)?.textContent;
      if (count !== undefined) $$('[data-cart-count]').forEach(el => el.textContent = count);
    }
    if (cart?.item_count !== undefined) $$('[data-cart-count]').forEach(el => el.textContent = cart.item_count);
    return rendered;
  }
  function cartSectionIds() { return ['ts-cart-drawer', $('[data-cart-page]')?.dataset.cartPage].filter(Boolean); }
  async function refreshCart(cart) {
    const response = await fetch(`${root}?sections=${cartSectionIds().join(',')}`);
    if (!response.ok || !renderCart(await response.json(),cart)) throw new Error('Your cart changed. Open the cart page to see the latest items.');
  }
  async function requestJSON(url, options = {}) {
    const response = await fetch(url,{...options,headers:{Accept:'application/json',...options.headers}});
    const body = await response.json();
    if (!response.ok) throw new Error(body.description || body.message || 'Something went wrong. Please try again.');
    return body;
  }
  let cartQueue = Promise.resolve();
  function saveCartNote(input) {
    const note = input.value;
    // Keep the page and drawer forms consistent, including native checkout submission.
    $$('[data-cart-note]').forEach(field => field.value = note);
    const status = $('[data-cart-note-status]',input.closest('.cart-note'));
    if (status) status.textContent = 'Saving…';
    cartQueue = cartQueue.catch(() => {}).then(async () => {
      try {
        await requestJSON(`${root}cart/update.js`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({note})});
        if (status) status.textContent = 'Note saved';
      } catch (error) {
        if (status) status.textContent = 'Could not save. Your note will be sent when you check out.';
        toast(error.message);
      }
    });
  }
  function changeCart(key, quantity) {
    cartQueue = cartQueue.catch(() => {}).then(async () => {
      const nodes = $$('[data-cart-content] input, [data-cart-content] button, [data-cart-content] textarea');
      nodes.forEach(el => el.disabled = true);
      try {
        const cart = await requestJSON(`${root}cart/change.js`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:key,quantity,sections:cartSectionIds(),sections_url:location.pathname})});
        if (!renderCart(cart.sections,cart)) await refreshCart(cart);
      } catch (error) { toast(error.message); await refreshCart().catch(() => {}); }
      finally { nodes.forEach(el => el.disabled = false); }
    });
    return cartQueue;
  }
  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!form.matches('[data-cart-form]') || event.submitter?.name === 'checkout') return;
    event.preventDefault();
    const button = $('[type=submit]',form); if (button?.disabled) return;
    const errorEl = $('.form-error',form); if (errorEl) errorEl.textContent = '';
    if (button) button.disabled = true;
    form.setAttribute('aria-busy','true');
    try {
      const data = new FormData(form); data.append('sections',cartSectionIds().join(',')); data.append('sections_url',location.pathname);
      const item = await requestJSON(`${root}cart/add.js`,{method:'POST',body:data});
      if (!renderCart(item.sections)) await refreshCart();
      closeDialog($('#QuickView'));
      if (config.cartType === 'page') location.assign(config.cartUrl || `${root}cart`);
      else openDialog($('#CartDrawer'));
    } catch (error) { if (errorEl) errorEl.textContent = error.message; toast(error.message); }
    finally { form.removeAttribute('aria-busy'); if (button) button.disabled = false; }
  });
  let quickViewController;
  function prepareQuickView(product, url) {
    $$('.product-breadcrumb,.product-accordion,.product-share,.product-gallery__navigation',product).forEach(element => element.remove());
    const originalTitle = $('h1',product);
    if (originalTitle) {
      const title = document.createElement('h2');
      title.className = 'quick-view__title'; title.id = 'QuickViewProductTitle'; title.textContent = originalTitle.textContent;
      originalTitle.replaceWith(title);
    }
    // Distinct IDs preserve accessible labels beside the original product form.
    $$('[id]',product).forEach(element => {
      if (element.id === 'QuickViewProductTitle') return;
      const old = element.id, next = `Quick-${old}`;
      element.id = next;
      $$('label',product).filter(label => label.htmlFor === old).forEach(label => label.htmlFor = next);
    });
    $$('input[type=radio]',product).forEach(element => element.name = `Quick-${element.name}`);
    const link = document.createElement('a');
    link.href = url; link.className = 'text-link quick-view__details-link'; link.textContent = 'View full details →';
    $('.product-detail__info',product).append(link);
    return product;
  }
  async function quickView(url) {
    const dialog = $('#QuickView'), target = $('[data-quick-view-content]',dialog);
    quickViewController?.abort();
    const controller = new AbortController(); quickViewController = controller;
    if (!dialog.dataset.quickViewBound) {
      dialog.dataset.quickViewBound = 'true';
      dialog.addEventListener('close',()=> {
        quickViewController?.abort();
        target.replaceChildren(); target.dataset.state = 'idle'; target.removeAttribute('aria-busy');
        dialog.removeAttribute('aria-labelledby');
      });
    }
    const status = document.createElement('p'); status.className = 'quick-view__status'; status.setAttribute('role','status'); status.textContent = 'Loading fragrance…';
    target.replaceChildren(status); target.dataset.state = 'loading'; target.setAttribute('aria-busy','true');
    dialog.removeAttribute('aria-labelledby'); target.scrollTop = 0; openDialog(dialog);
    try {
      const response = await fetch(url,{signal:controller.signal}); if (!response.ok) throw new Error('This fragrance could not be loaded.');
      const doc = new DOMParser().parseFromString(await response.text(),'text/html');
      if (controller.signal.aborted || !dialog.open) return;
      const product = $('[data-product-detail]',doc); if (!product) throw new Error('Open the product page to see this fragrance.');
      target.replaceChildren(prepareQuickView(product,url)); target.dataset.state = 'ready'; target.removeAttribute('aria-busy'); target.scrollTop = 0;
      dialog.setAttribute('aria-labelledby','QuickViewProductTitle'); syncWishlist();
      if (window.Shopify?.PaymentButton) window.Shopify.PaymentButton.init();
    } catch (error) {
      if (controller.signal.aborted) return;
      status.textContent = error.message; target.replaceChildren(status); target.dataset.state = 'error'; target.removeAttribute('aria-busy');
      const link = document.createElement('a'); link.href = url; link.className = 'text-link'; link.textContent = 'View product details →'; target.append(link);
    }
  }
  function imageModal(source, alt) {
    const dialog = document.createElement('dialog'); dialog.className = 'dialog product-image-modal'; dialog.setAttribute('aria-label','Product image');
    const image = document.createElement('img'); image.src = source; image.alt = alt;
    const button = makeCloseButton('Close image'); button.dataset.dialogClose = '';
    dialog.append(button,image); dialog.addEventListener('close',() => dialog.remove(),{once:true}); document.body.append(dialog); openDialog(dialog);
  }
  function chooseLookbook(button) {
    const lookbook = button.closest('[data-lookbook]'), index = Number(button.dataset.lookbookIndex);
    const track = $('[data-lookbook-track]',lookbook), panels = $$('[data-lookbook-product]',lookbook);
    if (track && panels[index]) {
      panels.forEach((panel,i)=>panel.style.order=(i-index+panels.length)%panels.length);
      track.scrollTo({left:0,behavior:'instant'});
      if (!reducedMotion.matches) track.animate([{opacity:.45},{opacity:1}],{duration:250,easing:'ease-out'});
    }
    $$('[data-lookbook-index]',lookbook).forEach(el => el.setAttribute('aria-pressed',String(Number(el.dataset.lookbookIndex) === index)));
  }
  document.addEventListener('click', async event => {
    const target = event.target.closest('button,a'); if (!target) return;
    if (target.matches('[data-open-dialog]')) openDialog(document.getElementById(target.dataset.openDialog));
    if (target.matches('[data-dialog-close]')) closeDialog(target.closest('dialog'));
    if (target.matches('[data-video-close]')) stopVideo(target.closest('.video-feature__poster'));
    if (target.matches('[data-cart-open]') && config.cartType !== 'page') { event.preventDefault(); openDialog($('#CartDrawer')); }
    if (target.matches('[data-wishlist-toggle]')) {
      const handle = target.dataset.wishlistToggle, saved = wishlist.includes(handle);
      if (!saved && wishlist.length >= 50) return toast('Your wishlist is full. Remove a fragrance to save another.');
      wishlist = saved ? wishlist.filter(value => value !== handle) : [...wishlist,handle]; storage.set('twin-signature:wishlist',wishlist); syncWishlist(); toast(saved ? 'Removed from your wishlist' : 'Saved to your wishlist');
    }
    if (target.matches('[data-quick-view]')) quickView(target.dataset.quickView);
    if (target.matches('[data-copy-store-link]')) {
      try { await navigator.clipboard.writeText(target.dataset.copyStoreLink); toast('Store link copied'); }
      catch { toast('The store link could not be copied. Copy it from your address bar.'); }
    }
    if (target.matches('[data-quantity-step]')) {
      const input = $('input',target.closest('.quantity')); if (!input || input.disabled) return;
      const value = Math.max(Number(input.min || 0),Math.min(Number(input.max || 999),Number(input.value || 0) + Number(target.dataset.quantityStep)));
      input.value = value; input.dispatchEvent(new Event('change',{bubbles:true}));
    }
    if (target.matches('[data-cart-remove]')) { event.preventDefault(); changeCart(target.dataset.cartRemove,0); }
    if (target.matches('[data-carousel-step]')) {
      const track = $('[data-carousel-track]',target.closest('[data-carousel]'));
      if (track) {
        const step = Number(target.dataset.carouselStep), card = $('.product-card',track);
        const distance = (card?.getBoundingClientRect().width || track.clientWidth) + parseFloat(getComputedStyle(track).columnGap || 0);
        const end = track.scrollWidth-track.clientWidth;
        const left = step > 0 && track.scrollLeft >= end-2 ? 0 : step < 0 && track.scrollLeft <= 2 ? end : track.scrollLeft+step*distance;
        track.scrollTo({left,behavior:reducedMotion.matches?'instant':'smooth'});
      }
    }
    if (target.matches('[data-lookbook-index]')) chooseLookbook(target);
    if (target.matches('[data-gallery-image]')) {
      selectProductImage(target.closest('[data-product-detail]'),{id:target.dataset.imageId,src:target.dataset.galleryImage});
    }
    if (target.matches('[data-image-zoom]')) { const image = $('img',target); if (image) imageModal(image.currentSrc || image.src,image.alt); }
    if (target.matches('[data-filter-open]')) { const panel = $('.collection-sidebar'); panel?.classList.add('is-open'); $('.filter-close',panel)?.focus(); }
    if (target.matches('[data-filter-close]')) { $('.collection-sidebar')?.classList.remove('is-open'); $('[data-filter-open]')?.focus(); }
    if (target.matches('[data-grid-columns]')) { const section = target.closest('[data-collection-section]'); $('.collection-layout',section).style.setProperty('--grid-columns',target.dataset.gridColumns); $$('[data-grid-columns]',section).forEach(el => el.setAttribute('aria-pressed',String(el === target))); }
    if (target.matches('[data-video-url]')) {
      try {
        const source = new URL(target.dataset.videoUrl);
        if (!['www.youtube-nocookie.com','www.youtube.com','player.vimeo.com'].includes(source.hostname) || !/^\/(embed|video)\//.test(source.pathname)) throw new Error('Please configure a YouTube or Vimeo embed URL in the theme editor.');
        const poster = target.closest('.video-feature__poster'); if (!poster || poster.classList.contains('is-playing')) return;
        source.protocol = 'https:';
        source.searchParams.set('autoplay','1'); source.searchParams.set('mute','1'); source.searchParams.set('playsinline','1'); source.searchParams.set('rel','0');
        const frame = document.createElement('iframe'); frame.id = target.dataset.videoPlayerId; frame.className = 'video-feature__player'; frame.src = source.href; frame.title = 'Twin Signature fragrance film'; frame.allow = 'autoplay; fullscreen; picture-in-picture'; frame.allowFullscreen = true;
        const close = makeCloseButton('Close video'); close.classList.add('video-feature__close'); close.dataset.videoClose = '';
        poster.append(frame,close); poster.classList.add('is-playing'); target.setAttribute('aria-expanded','true'); close.focus({preventScroll:true});
      } catch (error) { toast(error.message); }
    }
  });
  function refreshGalleryNavigation(navigation) {
    const track = $('[data-gallery-track]',navigation);
    const end = Math.max(0,track.scrollWidth-track.clientWidth);
    navigation.classList.toggle('has-overflow',end > 2);
    $('[data-gallery-step="-1"]',navigation).disabled = track.scrollLeft <= 2;
    $('[data-gallery-step="1"]',navigation).disabled = track.scrollLeft >= end-2;
  }
  function initProductGalleries(context) {
    $$('[data-gallery-navigation]',context).forEach(navigation => {
      if (navigation.dataset.bound) return;
      navigation.dataset.bound = 'true';
      const track = $('[data-gallery-track]',navigation);
      track.addEventListener('scroll',()=>refreshGalleryNavigation(navigation),{passive:true});
      $$('[data-gallery-step]',navigation).forEach(button => button.addEventListener('click',()=> {
        const thumb = $('[data-gallery-image]',track);
        const distance = (thumb.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0))*3;
        track.scrollTo({left:Math.max(0,Math.min(track.scrollWidth-track.clientWidth,track.scrollLeft+Number(button.dataset.galleryStep)*distance)),behavior:reducedMotion.matches?'instant':'smooth'});
      }));
      requestAnimationFrame(()=> {
        const selected = $('[aria-pressed="true"]',track);
        if (selected) track.scrollLeft = Math.max(0,selected.offsetLeft-track.offsetLeft-(track.clientWidth-selected.clientWidth)/2);
        refreshGalleryNavigation(navigation);
      });
    });
  }
  addEventListener('resize',()=>$$('[data-gallery-navigation]').forEach(refreshGalleryNavigation),{passive:true});
  function selectProductImage(scope, media) {
    const image = $('.product-gallery__main',scope);
    if (!image || !media?.src) return;
    const thumbs = $$('[data-gallery-image]',scope);
    const thumb = thumbs.find(el => String(el.dataset.imageId) === String(media.id));
    const source = thumb?.dataset.galleryImage || (media.src.startsWith('//') ? `https:${media.src}` : media.src);
    if (image.getAttribute('src') !== source) {
      const zoom = image.closest('[data-image-zoom]');
      zoom?.classList.add('is-loading');
      image.setAttribute('aria-busy','true');
      const finish = () => { zoom?.classList.remove('is-loading'); image.removeAttribute('aria-busy'); };
      image.onload = finish;
      image.onerror = finish;
      image.removeAttribute('srcset');
      image.src = source;
      if (image.complete) finish();
    }
    thumbs.forEach(el => el.setAttribute('aria-pressed',String(el === thumb)));
    if (thumb) { const strip = thumb.parentElement; const offset = thumb.getBoundingClientRect().left - strip.getBoundingClientRect().left + strip.scrollLeft; strip.scrollTo({left:Math.max(0,offset-(strip.clientWidth-thumb.clientWidth)/2),behavior:reducedMotion.matches?'instant':'smooth'}); }
  }
  function updateProductStock(scope, variant) {
    const message = $('[data-stock-message]',scope);
    if (!message) return;
    const inventory = JSON.parse($('[data-product-inventory]',scope)?.textContent || '{}')[variant?.id];
    const quantity = Number(inventory?.quantity || 0);
    const threshold = Math.max(1,Number(message.dataset.stockThreshold) || 20);
    const trackedStock = Boolean(variant?.available && inventory?.tracked && quantity > 0);
    message.textContent = !variant ? 'Unavailable' : !variant.available ? 'Out of stock!' : inventory?.tracked && quantity <= 0 ? 'Available to order' : trackedStock && message.dataset.showStockQuantity === 'true' && quantity <= threshold ? `Only ${quantity} ${quantity === 1 ? 'item' : 'items'} in stock!` : 'In stock · Ready to find your signature';
    const track = $('[data-stock-progress-track]',scope);
    if (track) track.hidden = !trackedStock;
    const progress = $('[data-stock-progress]',scope);
    if (progress) progress.style.width = `${trackedStock ? Math.min(100,quantity/threshold*100) : 0}%`;
  }
  function updateVariant(scope) {
    const variants = JSON.parse($('[data-product-json]',scope)?.textContent || '[]');
    const selected = $$('[data-option-index]',scope).map(group => $('input:checked',group)?.value);
    const variant = variants.find(item => item.options.every((option,i)=>option === selected[i]));
    const button = $('[data-add-to-cart]',scope), input = $('[data-variant-id]',scope);
    if (button) { button.disabled = !variant?.available; button.textContent = !variant ? 'Unavailable' : variant.available ? 'Add to cart' : 'Sold out'; }
    $$('[data-option-index]',scope).forEach(group => { $('[data-option-label]',group).textContent = $('input:checked',group)?.value || ''; });
    const accelerated = $('.shopify-payment-button',scope); if (accelerated) accelerated.hidden = !variant?.available;
    updateProductStock(scope,variant);
    if (!variant) return;
    input.value = variant.id;
    const price = $('[data-product-price]',scope); price.replaceChildren();
    const value = document.createElement('span'); value.className = 'price'; value.textContent = money(variant.price);
    if (variant.compare_at_price > variant.price) { const compare = document.createElement('s'); compare.textContent = money(variant.compare_at_price); value.append(compare); } price.append(value);
    if ($('[data-product-sku]',scope)) $('[data-product-sku]',scope).textContent = variant.sku ? `SKU: ${variant.sku}` : '';
    const colorGroup = $('.variant-options--color',scope);
    const colorIndex = colorGroup ? Number(colorGroup.dataset.optionIndex) : -1;
    const colorMedia = variants.find(item => item.options[colorIndex] === selected[colorIndex] && item.featured_image)?.featured_image;
    selectProductImage(scope,variant.featured_image || colorMedia);
    const detailsLink = $('.quick-view__details-link',scope);
    if (detailsLink) { const url = new URL(detailsLink.href,location.href); url.searchParams.set('variant',variant.id); detailsLink.href = url.href; }
    if (!scope.closest('#QuickView')) { const url = new URL(location.href); url.searchParams.set('variant',variant.id); history.replaceState({},'',url); }
  }
  const warmedImages = new Set();
  function warmOptionImage(event) {
    const choice = event.target.closest('.variant-choice');
    const source = choice?.querySelector('[data-option-image]')?.dataset.optionImage;
    if (!source || warmedImages.has(source)) return;
    warmedImages.add(source); const image = new Image(); image.src = source;
  }
  document.addEventListener('pointerover',warmOptionImage);
  document.addEventListener('focusin',warmOptionImage);
  document.addEventListener('change', event => {
    const input = event.target;
    if (input.matches('[data-cart-note]')) saveCartNote(input);
    if (input.matches('[data-cart-quantity]')) { const quantity = Number(input.value); if (!Number.isInteger(quantity) || quantity < 0) { input.reportValidity(); return; } changeCart(input.dataset.cartQuantity,quantity); }
    if (input.matches('[data-option-index] input')) updateVariant(input.closest('[data-product-detail]'));
    if (input.id === 'CollectionSort') $('#CollectionFilters').requestSubmit();
    if (input.matches('.filter-form input[type=checkbox]')) input.form.requestSubmit();
    if (input.matches('[data-localization-select]')) input.form.requestSubmit();
  });
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape') { $('.collection-sidebar')?.classList.remove('is-open'); if (event.target.closest('.video-feature__poster')) stopVideo(event.target.closest('.video-feature__poster')); }
  });
  const desktopMenuHover = matchMedia('(min-width:990px) and (hover:hover) and (pointer:fine)');
  function closeDesktopMenus(except) {
    $$('.desktop-nav .nav-dropdown[open]').forEach(menu => { if (menu !== except) menu.open = false; });
  }
  function initNavigation(context) {
    $$('.desktop-nav .nav-dropdown',context).forEach(menu => {
      if (menu.dataset.navigationBound) return;
      menu.dataset.navigationBound = 'true';
      const summary = $('summary',menu);
      const open = () => { closeDesktopMenus(menu); menu.open = true; };
      menu.addEventListener('pointerenter',event => {
        if (desktopMenuHover.matches && event.pointerType === 'mouse') open();
      });
      menu.addEventListener('pointerleave',event => {
        if (desktopMenuHover.matches && event.pointerType === 'mouse' && !$(':focus-visible',menu)) menu.open = false;
      });
      summary.addEventListener('click',event => {
        // A mouse click on an already hovered trigger should keep its panel open.
        // Native details toggling still handles keyboard activation and touch.
        if (desktopMenuHover.matches && event.detail > 0 && event.pointerType !== 'touch' && summary.matches(':hover')) {
          event.preventDefault(); open();
        }
      });
      menu.addEventListener('toggle',()=> { if (menu.open) closeDesktopMenus(menu); });
      menu.addEventListener('focusout',event => {
        if (!menu.contains(event.relatedTarget) && !(desktopMenuHover.matches && menu.matches(':hover'))) menu.open = false;
      });
      menu.addEventListener('keydown',event => {
        if (event.key === 'Escape' && menu.open) {
          event.preventDefault(); event.stopPropagation(); menu.open = false; summary.focus({preventScroll:true});
        } else if (event.target === summary && ['ArrowDown','ArrowUp'].includes(event.key)) {
          event.preventDefault(); open();
          const links = $$('a[href]',menu);
          (event.key === 'ArrowDown' ? links[0] : links.at(-1))?.focus();
        }
      });
    });
  }
  document.addEventListener('click',event => {
    if (!event.target.closest('.desktop-nav .nav-dropdown')) closeDesktopMenus();
  });
  desktopMenuHover.addEventListener('change',()=>closeDesktopMenus());
  function initTabs(context) {
    $$('[data-tabs]',context).forEach(group => {
      if (group.dataset.bound) return; group.dataset.bound = 'true';
      const tabs = $$('[role=tab]',group);
      function select(tab) { tabs.forEach(item => { const active = item === tab; item.setAttribute('aria-selected',String(active)); item.tabIndex = active ? 0 : -1; document.getElementById(item.getAttribute('aria-controls')).hidden = !active; }); }
      group.addEventListener('shopify:block:select',event => { const panel = event.target.closest('[role=tabpanel]'); const tab = tabs.find(item => item.getAttribute('aria-controls') === panel?.id); if (tab) select(tab); });
      tabs.forEach((tab,index)=> { tab.addEventListener('click',()=>select(tab)); tab.addEventListener('keydown',event => { if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length)%tabs.length; select(tabs[next]); tabs[next].focus(); }); });
    });
  }
  function initSlides(context) {
    $$('[data-slideshow]',context).forEach(hero => {
      if (hero.dataset.bound) return; hero.dataset.bound = 'true';
      const slides = $$('[data-slide]',hero); let index = 0, paused = reducedMotion.matches || hero.dataset.autoplay !== 'true';
      if (slides.length < 2) return;
      const pause = $('[data-slideshow-pause]',hero);
      const syncPause = () => {
        if (!pause) return;
        $('[data-slideshow-play-icon]',pause).hidden = !paused;
        $('[data-slideshow-pause-icon]',pause).hidden = paused;
        pause.setAttribute('aria-label',paused?'Play slideshow':'Pause slideshow');
      };
      const show = next => { index = (next + slides.length) % slides.length; slides.forEach((slide,i)=> { slide.classList.toggle('is-active',i === index); slide.inert = i !== index; }); $$('[data-slide-to]',hero).forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index))); };
      hero.addEventListener('click',event => { const step = event.target.closest('[data-slide-step]'), dot = event.target.closest('[data-slide-to]'); if (step) show(index+Number(step.dataset.slideStep)); if (dot) show(Number(dot.dataset.slideTo)); });
      pause?.addEventListener('click',()=> { paused = !paused; syncPause(); });
      syncPause();
      const timer = setInterval(()=> { if (!hero.isConnected) return clearInterval(timer); if (!paused && !document.hidden && !hero.matches(':hover,:focus-within')) show(index+1); },Math.max(3,Number(hero.dataset.slideInterval) || 6)*1000);
      hero.addEventListener('shopify:block:select',event => { const selected = event.target.closest('[data-slide]'); if (selected && slides.includes(selected)) { paused = true; syncPause(); show(slides.indexOf(selected)); } });
      hero.addEventListener('keydown',event => { if (event.key === 'ArrowRight') show(index+1); if (event.key === 'ArrowLeft') show(index-1); });
    });
  }
  let searchController,searchTimer,searchEpoch = 0;
  function dismissSearch() {
    clearTimeout(searchTimer); searchController?.abort(); searchEpoch++;
    $$('.predictive-results').forEach(panel=>panel.hidden=true);
    $$('[data-predictive-search]').forEach(input=>input.setAttribute('aria-expanded','false'));
  }
  document.addEventListener('input',event => {
    if (!event.target.matches('[data-predictive-search]')) return;
    const input = event.target, panel = $('.predictive-results',input.closest('.predictive-search')); clearTimeout(searchTimer); searchController?.abort();
    const epoch = ++searchEpoch;
    if (input.value.trim().length < 2) { panel.hidden = true; input.setAttribute('aria-expanded','false'); return; }
    searchTimer = setTimeout(async ()=> {
      searchController = new AbortController(); const query = input.value.trim();
      try {
        const params = new URLSearchParams({q:query,'resources[type]':'product','resources[limit]':'5'});
        const data = await requestJSON(`${root}search/suggest.json?${params}`,{signal:searchController.signal});
        if (input.value.trim() !== query || epoch !== searchEpoch || !input.closest('.predictive-search').contains(document.activeElement)) return;
        panel.replaceChildren();
        data.resources.results.products.forEach(product => {
          const link = document.createElement('a'); link.href = product.url; link.className = 'predictive-result';
          if (product.image) { const image = document.createElement('img'); image.src = product.image; image.alt = product.title; image.width = 50; image.height = 60; link.append(image); }
          const title = document.createElement('span'); title.textContent = product.title;
          const price = document.createElement('small'); price.textContent = money(Number(product.price)*100); title.append(price); link.append(title); panel.append(link);
        });
        const all = document.createElement('a'); all.className = 'predictive-result'; all.href = `${root}search?q=${encodeURIComponent(query)}&type=product`; all.textContent = `Search all results for “${query}”`; panel.append(all); panel.hidden = false; input.setAttribute('aria-expanded','true');
      } catch (error) { if (error.name !== 'AbortError') { panel.hidden = true; input.setAttribute('aria-expanded','false'); } }
    },250);
  });
  document.addEventListener('click',event => { if (!event.target.closest('.predictive-search')) dismissSearch(); });
  document.addEventListener('focusout',event => { if (event.target.closest('.predictive-search') && !event.target.closest('.predictive-search').contains(event.relatedTarget)) dismissSearch(); });
  document.addEventListener('keydown',event => {
    const search = event.target.closest('.predictive-search'); if (!search) return;
    const panel = $('.predictive-results',search), input = $('[data-predictive-search]',search);
    if (event.key === 'Escape') {
      if (!panel.hidden) { event.preventDefault(); dismissSearch(); input.focus(); }
      else if (search.closest('dialog')) { event.preventDefault(); closeDialog(search.closest('dialog')); }
    }
    if (panel.hidden || !['ArrowDown','ArrowUp'].includes(event.key)) return;
    const links = $$('a',panel), index = links.indexOf(document.activeElement);
    event.preventDefault();
    const next = event.key === 'ArrowDown' ? index+1 : index-1;
    if (next < 0 || next >= links.length) input.focus(); else links[next].focus();
  });
  function init(context = document) {
    initNavigation(context); initTabs(context); initSlides(context); initProductGalleries(context); syncWishlist(); loadWishlist();
    $$('dialog',context).forEach(bindDialog);
    $$('[data-lookbook-track]',context).forEach(track => {
      if (track.dataset.bound) return; track.dataset.bound = 'true';
      const lookbook = track.closest('[data-lookbook]');
      lookbook.addEventListener('shopify:block:select',event => { const panel = event.target.closest('[data-lookbook-product]'); const index = $$('[data-lookbook-product]',track).indexOf(panel); const button = $$('[data-lookbook-index]',lookbook).find(item => Number(item.dataset.lookbookIndex) === index); if (button) chooseLookbook(button); });
      track.addEventListener('scroll',()=> {
        const panels = $$('[data-lookbook-product]',track);
        const index = panels.reduce((best,panel,i)=>Math.abs(panel.getBoundingClientRect().left-track.getBoundingClientRect().left)<Math.abs(panels[best].getBoundingClientRect().left-track.getBoundingClientRect().left)?i:best,0);
        $$('[data-lookbook-index]',track.closest('[data-lookbook]')).forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.lookbookIndex)===index)));
      },{passive:true});
    });
    $$('[data-countdown]',context).forEach(el => {
      if (el.dataset.bound) return; el.dataset.bound = 'true'; const end = Date.parse(el.dataset.countdown); if (!Number.isFinite(end)) return;
      function tick() { const seconds = Math.max(0,Math.floor((end-Date.now())/1000)); if (!seconds) { el.textContent = 'This promotion has ended.'; return; } const units = [[Math.floor(seconds/86400),'Days'],[Math.floor(seconds/3600)%24,'Hrs'],[Math.floor(seconds/60)%60,'Min'],[seconds%60,'Sec']]; el.replaceChildren(...units.map(([value,label]) => { const span = document.createElement('span'), strong = document.createElement('strong'), small = document.createElement('small'); strong.textContent = String(value).padStart(2,'0'); small.textContent = label; span.append(strong,small); return span; })); }
      tick(); const timer = setInterval(()=> { if (!el.isConnected || Date.now() >= end) { tick(); return clearInterval(timer); } tick(); },1000);
    });
    $$('[data-recommendations]',context).forEach(el => { if (el.dataset.loaded) return; el.dataset.loaded = 'true'; const observer = new IntersectionObserver(async entries => { if (!entries[0].isIntersecting) return; observer.disconnect(); try { const response = await fetch(el.dataset.recommendations); if (!response.ok) return; const doc = new DOMParser().parseFromString(await response.text(),'text/html'), incoming = $('[data-recommendations] .product-grid',doc); if (incoming?.children.length) { $('.product-grid',el).replaceChildren(...incoming.childNodes); syncWishlist(); } } catch { /* The server-rendered fallback remains available. */ } },{rootMargin:'300px'}); observer.observe(el); });
  }
  init();
  document.addEventListener('shopify:section:load',event => init(event.target));
  addEventListener('storage',event => { if (event.key === 'twin-signature:wishlist') { wishlist = storage.get('twin-signature:wishlist',[]); syncWishlist(); } });
  const popup = $('#NewsletterPopup');
  if (popup) { popup.addEventListener('close',()=>storage.set('twin-signature:newsletter-dismissed',Date.now())); if (Date.now()-storage.get('twin-signature:newsletter-dismissed',0) > 7*86400000 && !window.Shopify?.designMode) setTimeout(()=> { if (!document.querySelector('[data-giveaway-active="true"], dialog[open], form[aria-busy="true"]') && !document.activeElement?.matches('input,textarea,select')) openDialog(popup); },30000); }
})();
