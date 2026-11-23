const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

// Exercise campaign behavior using the actual storefront class and a fixed clock.
function fixture() {
  const entries = new Map();
  let Giveaway;
  let now = Date.parse('2026-11-19T12:00:00Z');
  let blocked = false;
  let typing = false;
  let scheduled = [];
  const observers = new Map();
  class Clock extends Date { static now() { return now; } }
  const context = {
    HTMLElement: class {}, Date: Clock, Map, JSON, Number, String, Math,
    MutationObserver: class {
      constructor(callback) { this.callback = callback; }
      observe(target) { this.target = target; observers.set(target, this.callback); }
      disconnect() { observers.delete(this.target); }
    },
    customElements: {
      get() {}, define(name, implementation) { Giveaway = implementation; },
      whenDefined: () => Promise.resolve()
    },
    localStorage: { getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value) },
    document: {
      visibilityState: 'visible', querySelector: () => blocked,
      activeElement: { matches: () => typing }
    },
    setTimeout: (callback, delay) => { scheduled.push({ callback, delay }); return scheduled.length; },
    clearTimeout() {}, clearInterval() {}
  };
  vm.runInNewContext(readFileSync(require.resolve('../assets/giveaway.js'), 'utf8'), context);
  const popup = new Giveaway();
  popup.dataset = { giveawayEnabled: 'true', mobile: 'true', repeatDays: '7' };
  popup.mobile = { matches: false };
  popup.isConnected = true;
  popup.key = 'twin-signature:giveaway:campaign-one';
  popup.end = NaN;
  popup.tab = { hidden: true };
  popup.dialog = {
    open: false,
    show() { this.open = true; this.nonModal = true; },
    showModal() { this.open = true; },
    close() { this.open = false; }
  };
  popup.querySelector = () => null;
  return {
    popup, entries, scheduled, observers,
    setState(state) { entries.set(popup.key, JSON.stringify(state)); },
    advance(milliseconds) { now += milliseconds; },
    block(value) { blocked = value; }, type(value) { typing = value; }, now: () => now
  };
}

test('dismissal frequency, new campaigns and completed signups stay distinct', () => {
  const f = fixture();
  assert.equal(f.popup.shouldShow(), true);
  f.setState({ dismissed: f.now() });
  assert.equal(f.popup.shouldShow(), false);
  f.advance(7 * 86400000);
  assert.equal(f.popup.shouldShow(), true);
  f.popup.dataset.repeatDays = '0';
  assert.equal(f.popup.shouldShow(), false);
  f.setState({ entered: f.now() });
  f.popup.dataset.repeatDays = '1';
  f.advance(90 * 86400000);
  assert.equal(f.popup.shouldShow(), false);
  f.popup.updateTab();
  assert.equal(f.popup.tab.hidden, true);
  f.popup.key = 'twin-signature:giveaway:campaign-two';
  assert.equal(f.popup.shouldShow(), true);
});

test('automatic opening waits while another dialog or a customer input is active', () => {
  const f = fixture();
  f.block(true);
  f.popup.tryAutomaticOpen();
  assert.equal(f.popup.dialog.open, false);
  assert.equal(f.scheduled[0].delay, 3000);
  f.block(false); f.type(true);
  f.scheduled[0].callback();
  assert.equal(f.popup.dialog.open, false);
  f.type(false); f.scheduled[1].callback();
  assert.equal(f.popup.dialog.open, true);
});

test('disabled campaigns and mobile exclusions cannot open or expose the teaser', () => {
  const f = fixture();
  f.popup.dataset.giveawayEnabled = 'false';
  f.popup.open(); f.popup.updateTab();
  assert.equal(f.popup.dialog.open, false);
  assert.equal(f.popup.tab.hidden, true);
  f.popup.dataset.giveawayEnabled = 'true';
  f.popup.dataset.mobile = 'false'; f.popup.mobile.matches = true;
  f.popup.open(); f.popup.updateTab();
  assert.equal(f.popup.dialog.open, false);
  assert.equal(f.popup.dataset.giveawayActive, 'false');
  f.popup.mobile.matches = false; f.popup.updateTab();
  assert.equal(f.popup.tab.hidden, false);
  assert.equal(f.popup.dataset.giveawayActive, 'true');
});

test('the actual closing time ends the popup and countdown without a fake reset', () => {
  const f = fixture();
  const countdown = { hidden: true, textContent: '' };
  f.popup.querySelector = () => countdown;
  f.popup.end = f.now() + 3661000;
  f.popup.checkEnd();
  assert.equal(countdown.textContent, 'Entries close in 01h 01m 01s');
  f.popup.open();
  f.advance(3661000); f.popup.checkEnd();
  assert.equal(countdown.textContent, 'This giveaway has ended.');
  assert.equal(f.popup.dialog.open, false);
  assert.equal(f.popup.tab.hidden, true);
  assert.equal(f.popup.allowed(), false);
});

test('editor preview can inspect a disabled campaign without enabling it', () => {
  const f = fixture();
  f.popup.editor = true;
  f.popup.dataset.giveawayEnabled = 'false';
  f.popup.open(true);
  assert.equal(f.popup.dialog.open, true);
  assert.equal(f.popup.dialog.nonModal, true);
  assert.equal(f.popup.allowed(), false);
});

test('successful signups hide entry copy and decline while exposing the success action', () => {
  const f = fixture();
  const elements = Object.fromEntries(['[data-giveaway-fields]', '[data-giveaway-intro]', '[data-giveaway-decline]', '[data-giveaway-success]'].map(selector => [selector, { hidden: selector.includes('success') }]));
  f.popup.querySelector = selector => elements[selector];
  f.popup.dialog.removeAttribute = name => { f.popup.dialog.removedAttribute = name; };
  f.popup.dialog.setAttribute = (name, value) => { f.popup.dialog[name] = value; };
  f.popup.showSuccess();
  assert.equal(elements['[data-giveaway-fields]'].hidden, true);
  assert.equal(elements['[data-giveaway-intro]'].hidden, true);
  assert.equal(elements['[data-giveaway-decline]'].hidden, true);
  assert.equal(elements['[data-giveaway-success]'].hidden, false);
  assert.equal(f.popup.dialog['aria-label'], 'Giveaway signup received');
  assert.equal(f.popup.tab.hidden, true);
  assert.equal(f.popup.shouldShow(), false);
});

test('Shopify Forms confirmation hides the teaser and remembers the entry after the popup closes', () => {
  const { popup, entries, observers, now } = fixture();
  let embed;
  let banner;
  const app = { querySelector: () => embed };
  const shadow = { querySelector: selector => selector === 'style[data-ts-confirmation]' || banner === selector };
  popup.querySelector = selector => selector === '[data-giveaway-app]' ? app : null;
  const controller = new AbortController();
  popup.watchFormsEmbed(controller.signal);
  popup.open();
  popup.updateTab();
  assert.equal(popup.tab.hidden, false);

  embed = { shadowRoot: shadow };
  observers.get(app)();
  banner = 'section[data-testid="banner-error"]';
  observers.get(shadow)();
  assert.equal(popup.tab.hidden, false);
  assert.equal(entries.has(popup.key), false);

  banner = 'section[data-testid="banner-success"]';
  observers.get(shadow)();
  assert.equal(popup.dialog.open, true);
  assert.equal(popup.tab.hidden, true);
  assert.equal(JSON.parse(entries.get(popup.key)).entered, now());

  popup.dialog.close();
  popup.completed = false;
  popup.updateTab();
  assert.equal(popup.tab.hidden, true);
  assert.equal(popup.shouldShow(), false);
  controller.abort();
  assert.equal(observers.size, 0);
});
