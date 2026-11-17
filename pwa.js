/* Installation, offline status and opt-in app updates. No stream caching. */
(function (root) {
  'use strict';
  function init(options) {
    var install = document.getElementById('install'), notice = document.getElementById('pwa-notice');
    var text = document.getElementById('pwa-notice-text'), update = document.getElementById('pwa-update');
    var deferred = null, registration = null, applying = false;
    var standalone = root.matchMedia('(display-mode: standalone)');
    function installed() { return standalone.matches || navigator.standalone === true; }
    function availability() { install.hidden = installed(); }
    function announce() {
      var waiting = registration && registration.waiting;
      update.hidden = !waiting;
      notice.hidden = !waiting && navigator.onLine;
      text.textContent = waiting ? 'An app update is ready.' : 'Offline · Saved channels are available. Live TV needs internet.';
    }
    root.addEventListener('beforeinstallprompt', function (event) { event.preventDefault(); deferred = event; availability(); });
    root.addEventListener('appinstalled', function () { deferred = null; availability(); });
    if (standalone.addEventListener) standalone.addEventListener('change', availability);
    install.addEventListener('click', async function () {
      if (!deferred) { options.openDialog('install-dialog', install); return; }
      var prompt = deferred; deferred = null;
      try { await prompt.prompt(); await prompt.userChoice; }
      catch (_) { options.openDialog('install-dialog', install); }
      availability();
    });
    root.addEventListener('online', announce); root.addEventListener('offline', announce);
    availability(); announce();
    if (!('serviceWorker' in navigator) || !root.isSecureContext) return;
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (applying) root.location.reload(); });
    update.addEventListener('click', function () {
      if (!registration || !registration.waiting) return;
      applying = true; update.disabled = true; text.textContent = 'Updating app…';
      registration.waiting.postMessage({type:'SKIP_WAITING'});
    });
    navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'}).then(function (reg) {
      registration = reg; announce();
      reg.addEventListener('updatefound', function () {
        var worker = reg.installing;
        if (worker) worker.addEventListener('statechange', function () { if (worker.state === 'installed') announce(); });
      });
      // Check again after returning to an app left open on a TV. No interval while watching.
      var checkedAt = Date.now();
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && Date.now() - checkedAt > 60 * 60 * 1000) { checkedAt = Date.now(); reg.update().catch(function () {}); }
      });
    }).catch(function () {
      document.getElementById('install-help').textContent = 'Offline setup could not finish. Reopen the app online over HTTPS or localhost and try again.';
    });
  }
  root.SignalPWA = {init:init};
}(window));
