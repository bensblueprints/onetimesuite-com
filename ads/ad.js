/* OneTimeSuite ad loader.
 * Embed:  <div data-ots-ad="728x90"></div>
 *         <script src="https://onetimesuite.com/ads/ad.js" async></script>
 * Slots defined in https://onetimesuite.com/ads/ads.json — edit that file to
 * change creatives everywhere at once. */
(function () {
  function run() {
    var slots = document.querySelectorAll('[data-ots-ad]');
    if (!slots.length) return;
    fetch('https://onetimesuite.com/ads/ads.json', { mode: 'cors' })
      .then(function (r) { return r.json(); })
      .then(function (cfg) {
        slots.forEach(function (el) {
          var ad = cfg.slots[el.getAttribute('data-ots-ad')];
          if (!ad) return;
          var a = document.createElement('a');
          a.href = ad.href; a.rel = 'noopener'; a.style.display = 'block';
          var img = document.createElement('img');
          img.src = ad.img; img.alt = ad.alt || '';
          img.width = ad.width; img.height = ad.height;
          img.style.maxWidth = '100%'; img.style.height = 'auto'; img.style.borderRadius = '10px';
          a.appendChild(img);
          el.innerHTML = ''; el.appendChild(a);
        });
      })
      .catch(function () { /* leave placeholder */ });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
