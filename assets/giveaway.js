(() => {
  'use strict';
  if (customElements.get('ts-giveaway')) return;
  const memory = new Map();
  const read = key => {
    try { return JSON.parse(localStorage.getItem(key)) || {}; }
    catch { return memory.get(key) || {}; }
  };
  const write = (key, value) => {
    memory.set(key, value);
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be unavailable. */ }
  };
  const pendingKey = 'twin-signature:giveaway-pending';
  const pending = () => { try { return sessionStorage.getItem(pendingKey); } catch { return null; } };

  class SignatureGiveaway extends HTMLElement {
    connectedCallback() {
      this.controller = new AbortController();
      const { signal } = this.controller;
      this.dialog = this.querySelector('dialog');
      this.tab = this.querySelector('[data-giveaway-open]');
      this.editor = this.dataset.editor === 'true';
      this.key = `twin-signature:giveaway:${this.dataset.campaign}`;
      this.end = Date.parse(this.dataset.end);
      this.mobile = matchMedia('(max-width:749px)');
      this.completed = false;
      this.querySelectorAll('[data-giveaway-close]').forEach(button => button.addEventListener('click', () => this.dialog.close(), { signal }));
      this.tab?.addEventListener('click', () => this.open(), { signal });
      this.dialog.addEventListener('click', event => {
        if (event.target !== this.dialog) return;
        const box = this.dialog.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) this.dialog.close();
      }, { signal });
      this.dialog.addEventListener('close', () => {
        if (!this.editor) write(this.key, { ...read(this.key), dismissed: Date.now() });
        this.updateTab();
      }, { signal });
      this.querySelector('.giveaway-form')?.addEventListener('submit', event => {
        if (this.editor) {
          event.preventDefault();
          this.querySelector('[data-giveaway-editor-note]').hidden = false;
          return;
        }
        if (this.expired()) { event.preventDefault(); this.checkEnd(); return; }
        // Let Shopify handle its native customer form, validation and spam protection.
        try { sessionStorage.setItem(pendingKey, this.dataset.campaign); } catch { /* Native form still works. */ }
      }, { signal });
      this.mobile.addEventListener('change', () => {
        if (!this.allowed() && this.dialog.open && !this.editor) this.dialog.close();
        this.updateTab();
      }, { signal });
      this.updateTab();
      if (Number.isFinite(this.end)) {
        this.checkEnd();
        if (!this.expired()) this.endTimer = setInterval(() => this.checkEnd(), 1000);
      }
      const responseForThisPopup = pending() === this.dataset.campaign;
      const success = this.querySelector('[data-giveaway-success]');
      const errors = this.querySelector('[data-giveaway-errors]');
      if (!this.editor && responseForThisPopup && (success?.dataset.posted === 'true' || (errors && !errors.hidden))) {
        try { sessionStorage.removeItem(pendingKey); } catch { /* Storage may be unavailable. */ }
        if (success?.dataset.posted === 'true') {
          this.showSuccess();
        }
        this.open(true);
        if (this.completed) success.focus();
      } else if (this.editor) {
        if (this.dataset.preview === 'true') this.open(true);
        this.addEventListener('shopify:block:select', () => this.open(true), { signal });
        this.addEventListener('shopify:block:deselect', () => { if (this.dialog.open) this.dialog.close(); }, { signal });
        this.closest('.shopify-section')?.addEventListener('shopify:section:select', () => {
          if (this.dataset.preview === 'true') this.open(true);
        }, { signal });
      } else if (this.allowed() && this.shouldShow()) {
        this.timer = setTimeout(() => this.tryAutomaticOpen(), Math.max(0, Number(this.dataset.delay) || 0) * 1000);
      }
    }

    showSuccess() {
      this.completed = true;
      if (!this.editor) write(this.key, { ...read(this.key), entered: Date.now() });
      ['[data-giveaway-fields]', '[data-giveaway-intro]', '[data-giveaway-decline]'].forEach(selector => {
        const element = this.querySelector(selector);
        if (element) element.hidden = true;
      });
      const success = this.querySelector('[data-giveaway-success]');
      if (success) success.hidden = false;
      this.dialog.removeAttribute('aria-labelledby');
      this.dialog.setAttribute('aria-label', 'Giveaway signup received');
      this.updateTab();
    }

    expired() { return Number.isFinite(this.end) && Date.now() >= this.end; }
    allowed() { return this.dataset.giveawayEnabled === 'true' && !this.expired() && (this.dataset.mobile === 'true' || !this.mobile.matches); }
    shouldShow() {
      const state = read(this.key);
      const days = Number(this.dataset.repeatDays);
      return !state.entered && (!state.dismissed || (days > 0 && Date.now() - state.dismissed >= days * 86400000));
    }
    updateTab() {
      this.dataset.giveawayActive = String(this.allowed());
      if (this.tab) this.tab.hidden = !this.allowed() || this.completed || (!this.editor && Boolean(read(this.key).entered));
    }
    open(force = false) {
      if (!this.isConnected || (!force && !this.allowed()) || this.dialog.open) return;
      if (document.querySelector('dialog[open]')) return;
      // Keep Shopify's editor sidebar usable while previewing the popup.
      if (this.editor) this.dialog.show();
      else this.dialog.showModal();
    }
    tryAutomaticOpen() {
      if (!this.isConnected || !this.allowed() || !this.shouldShow()) return;
      if (document.visibilityState !== 'visible' || document.querySelector('dialog[open],form[aria-busy="true"]') || document.activeElement?.matches('input,textarea,select,[contenteditable="true"]')) {
        this.timer = setTimeout(() => this.tryAutomaticOpen(), 3000);
        return;
      }
      this.open();
    }
    checkEnd() {
      const countdown = this.querySelector('[data-giveaway-countdown]');
      if (this.expired()) {
        clearInterval(this.endTimer);
        if (countdown) { countdown.hidden = false; countdown.textContent = 'This giveaway has ended.'; }
        if (!this.editor && !this.completed && this.dialog.open) this.dialog.close();
        this.updateTab();
        return;
      }
      const seconds = Math.max(0, Math.floor((this.end - Date.now()) / 1000));
      if (countdown) {
        countdown.hidden = false;
        const days = Math.floor(seconds / 86400);
        const hours = String(Math.floor(seconds / 3600) % 24).padStart(2, '0');
        const minutes = String(Math.floor(seconds / 60) % 60).padStart(2, '0');
        const remainingSeconds = String(seconds % 60).padStart(2, '0');
        countdown.textContent = `Entries close in ${days ? `${days}d ` : ''}${hours}h ${minutes}m ${remainingSeconds}s`;
      }
    }
    disconnectedCallback() {
      this.controller?.abort();
      clearTimeout(this.timer);
      clearInterval(this.endTimer);
      if (this.dialog?.open) this.dialog.close();
    }
  }
  customElements.define('ts-giveaway', SignatureGiveaway);
})();
