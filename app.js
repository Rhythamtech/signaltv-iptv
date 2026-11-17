(function () {
  'use strict';
  var PLAYLIST = 'https://iptv-org.github.io/iptv/countries/in.m3u';
  var CATALOGUE = 'https://iptv-org.github.io/api/channels.json';
  var FEEDS = 'https://iptv-org.github.io/api/feeds.json';
  var HLS_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js';
  var DAY = 24 * 60 * 60 * 1000, CACHE = 'signal.channels.v2', FAVS = 'signal.favorites.v1', LAST = 'signal.last.v1';
  var $ = function (id) { return document.getElementById(id); };
  var video = $('video'), player = $('player'), list = $('channels'), msg = $('player-message');
  var channels = [], visible = [], favorites = read(FAVS, []), current = null, hls = null, hlsPromise = null, streamIndex = 0, playbackStreams = [], retries = 0, retryTimer = null, stallTimer = null, controlsTimer = null, playbackToken = 0, favoritesOnly = false, refreshing = false, cacheTime = 0, language = 'Hindi', quality = 'HD', genre = 'news', filterKind = '', activeDialog = null, dialogReturn = null, rowSignature = '', lastFocusedId = null, arrowChannelSwitching = read('signal.arrow-channels.v1', true) !== false;
  if (!Array.isArray(favorites)) favorites = [];
  function read(key, fallback) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (_) { return fallback; } }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function status(text) { msg.textContent = text; msg.hidden = !text; $('recovery').hidden = !/unavailable|could not load|not supported|unsupported format|retry|not available/i.test(text); if (text) { showControls(); clearTimeout(controlsTimer); } }
  function setNote(text) { $('source-note').textContent = text; }
  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function channelDetail(c) {
    var qualities = []; c.streams.forEach(function (url) { var q = c.streamQualities && c.streamQualities[url] || 'Unknown'; if (qualities.indexOf(q)<0) qualities.push(q); });
    return qualities.join('/') + ' · ' + ((c.languages || []).join(' / ') || 'Language unavailable');
  }
  function streamsFor(c) {
    // Prefer the selected category, keeping other URLs as recovery alternatives.
    return c.streams.filter(function (url) { return !quality || (c.streamQualities && c.streamQualities[url] || 'Unknown')===quality; }).concat(c.streams.filter(function (url) { return quality && (c.streamQualities && c.streamQualities[url] || 'Unknown')!==quality; }));
  }
  function genreName(value) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'All genres'; }
  function updateFilterButtons() {
    $('quality-button').textContent = (quality || 'All quality') + ' ▾';
    $('genre-button').textContent = genreName(genre) + ' ▾';
    $('quality-button').setAttribute('aria-label', 'Quality: ' + (quality || 'All quality'));
    $('genre-button').setAttribute('aria-label', 'Genre: ' + genreName(genre));
  }
  function initials(name) { return name.split(/\s+/).slice(0,2).map(function (s) { return s.charAt(0); }).join('').toUpperCase(); }
  function renderLanguages() {
    var langs = [];
    channels.forEach(function (c) { (c.languages || []).forEach(function (l) { if (langs.indexOf(l) < 0) langs.push(l); }); });
    if (langs.indexOf('Hindi') < 0) langs.push('Hindi'); langs.sort();
    $('language-options').innerHTML = [''].concat(langs).map(function (l) { return '<button class="language-option" data-language="' + escapeHTML(l) + '" aria-pressed="' + (language === l) + '">' + escapeHTML(l || 'All languages') + '</button>'; }).join('');
    $('language-button').textContent = (language || 'All languages') + ' ▾';
  }
  function renderList() {
    updateFilterButtons();
    var query = $('search').value.trim().toLowerCase(), lang = language;
    var searching = !!query || !!(activeDialog && activeDialog.id === 'search-dialog');
    visible = NewsPlaylist.selectChannels(channels, {query:query, searchAll:searching, favoritesOnly:favoritesOnly, favorites:favorites, language:lang, quality:quality, genre:genre});
    document.querySelector('.library').classList.toggle('searching', searching);
    $('search-scope').hidden = !searching;
    $('search-scope').textContent = 'Searching all ' + channels.length + ' channels · Filters paused';
    $('list-title').innerHTML = (searching ? 'Search results' : favoritesOnly ? 'Favorites' : 'Live channels') + ' <span>' + visible.length + '</span>';
    $('search-count').textContent = visible.length + ' matches across all ' + channels.length + ' channels';
    $('filter-all').setAttribute('aria-pressed', !favoritesOnly); $('filter-favorites').setAttribute('aria-pressed', favoritesOnly);
    $('search-button').textContent = query ? $('search').value : 'Search';
    $('list-label').textContent = favoritesOnly ? 'YOUR FAVORITES' : 'ALL CHANNELS';
    $('all-nav').classList.toggle('active', !favoritesOnly); $('favorites-nav').classList.toggle('active', favoritesOnly);
    if (!visible.length) { rowSignature = ''; list.innerHTML = '<div class="list-message">' + (!channels.length ? 'No channels loaded. Check your connection and select Refresh.' : !query && favoritesOnly && !favorites.length ? 'No favorites yet. Play a channel and select the star to save it.' : query ? 'No channels match your search. Try another channel name.' : 'No channels match these filters. Choose All quality, another genre or language, or Reset.') + '</div>'; return; }
    var focused = list.contains(document.activeElement) ? document.activeElement.closest('.channel') : null;
    var focusedId = focused && focused.dataset.id;
    var signature = JSON.stringify(visible.map(function (c) { return [c.id, c.name, c.logo, c.languages, c.streamQualities, favorites.indexOf(c.id) >= 0]; }));
    if (signature === rowSignature) { updatePlayingRows(); return; }
    rowSignature = signature;
    var html = visible.map(function (c, i) {
      var selected = current && c.id === current.id;
      var logo = c.logo && /^https?:\/\//i.test(c.logo) ? '<img src="' + escapeHTML(c.logo) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '';
      return '<button class="channel' + (selected ? ' selected' : '') + '" data-id="' + escapeHTML(c.id) + '" data-index="' + i + '"' + (selected ? ' aria-current="true"' : '') + '><span class="channel-logo"><span class="logo-fallback"' + (logo ? ' hidden' : '') + '>' + escapeHTML(initials(c.name)) + '</span>' + logo + '</span><span class="channel-copy"><span class="channel-name">' + escapeHTML(c.name) + '</span><span class="channel-sub">' + escapeHTML(channelDetail(c)) + '</span></span>' + (favorites.indexOf(c.id) >= 0 ? '<span class="channel-star" aria-label="Favorite">★</span>' : '<span class="channel-chevron" aria-hidden="true">›</span>') + '</button>';
    }).join('');
    list.innerHTML = html;
    updatePlayingRows();
    if (focusedId) focusChannel(focusedId);
  }
  function updatePlayingRows() {
    list.querySelectorAll('.channel').forEach(function (row) {
      var selected = current && row.dataset.id === current.id;
      row.classList.toggle('selected', !!selected);
      if (selected) row.setAttribute('aria-current', 'true'); else row.removeAttribute('aria-current');
      var badge = row.querySelector('.playing-badge');
      if (selected && !badge) { badge = document.createElement('span'); badge.className = 'playing-badge'; badge.textContent = 'Playing'; row.querySelector('.channel-copy').appendChild(badge); }
      if (!selected && badge) badge.remove();
    });
  }
  function scrollChannel(row) {
    // Scroll only the list, never the page or player underneath it.
    var left = row.offsetLeft;
    if (left < list.scrollLeft) list.scrollLeft = left;
    else if (left + row.offsetWidth > list.scrollLeft + list.clientWidth) list.scrollLeft = left + row.offsetWidth - list.clientWidth;
  }
  function focusChannel(id) {
    var rows = Array.from(list.querySelectorAll('.channel'));
    var row = rows.find(function (r) { return r.dataset.id === id; }) || list.querySelector('.selected') || rows[0];
    if (row) { row.focus({preventScroll:true}); scrollChannel(row); } else $('quality-button').focus();
  }
  function openChannels() {
    document.body.classList.add('panel-open');
    document.querySelector('.library').hidden = false;
    $('close-channels').hidden = !document.body.classList.contains('watching');
    $('browse').setAttribute('aria-expanded', 'true');
    showControls();
    focusChannel(lastFocusedId || (current && current.id));
  }
  function watchMode() {
    if (!current) return;
    document.body.classList.add('watching'); document.body.classList.remove('panel-open');
    document.querySelector('.library').hidden = true;
    $('browse').setAttribute('aria-expanded', 'false');
    showControls(); $('play').focus();
  }
  list.addEventListener('focusin', function (event) { var row = event.target.closest('.channel'); if (row) lastFocusedId = row.dataset.id; });
  list.addEventListener('error', function (event) { if (event.target.tagName === 'IMG') { event.target.hidden = true; event.target.previousElementSibling.hidden = false; } }, true);
  list.addEventListener('click', function (event) { var button = event.target.closest('.channel'); if (button && visible[+button.dataset.index]) choose(visible[+button.dataset.index]); });
  function fetchWithTimeout(url, timeout) { var controller = new AbortController(), timer = setTimeout(function () { controller.abort(); }, timeout); return fetch(url, {signal:controller.signal, cache:'no-cache'}).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r; }).finally(function () { clearTimeout(timer); }); }
  async function refresh(force) {
    if (refreshing || (!force && cacheTime && Date.now() - cacheTime < DAY)) return;
    refreshing = true; $('refresh').disabled = true; $('refresh').textContent = 'Updating…';
    try {
      var results = await Promise.allSettled([fetchWithTimeout(PLAYLIST, 20000).then(function (r) { return r.text(); }), fetchWithTimeout(CATALOGUE, 20000).then(function (r) { return r.json(); }), fetchWithTimeout(FEEDS, 20000).then(function (r) { return r.json(); })]);
      if (results[0].status !== 'fulfilled') throw results[0].reason;
      var hasCatalogue = results[1].status === 'fulfilled' && Array.isArray(results[1].value);
      var parsed = NewsPlaylist.parse(results[0].value, hasCatalogue ? results[1].value : [], PLAYLIST, results[2].status === 'fulfilled' ? results[2].value : []);
      if (!parsed.length) throw new Error('No channels were found');
      // Never replace a complete cached catalogue with a potentially incomplete fallback.
      if (!hasCatalogue && channels.length) { setNote('USING SAVED CHANNELS · CHANNEL METADATA UNAVAILABLE'); return; }
      channels = NewsChannels.merge(parsed, channels); cacheTime = hasCatalogue ? Date.now() : 0;
      if (hasCatalogue) save(CACHE, {time:cacheTime, channels:channels});
      renderLanguages(); renderList();
      setNote(hasCatalogue ? 'PUBLIC STREAMS · AVAILABILITY MAY VARY' : 'PARTIAL LIST · CHANNEL METADATA UNAVAILABLE');
      if (current) { var updated = channels.find(function (c) { return c.id === current.id; }); if (updated) current = updated; }
      if (!current) restoreLast();
    } catch (error) { setNote(channels.length ? 'USING SAVED CHANNELS · UPDATE FAILED' : 'COULD NOT LOAD PLAYLIST · CHECK CONNECTION AND REFRESH'); if (!channels.length) renderList(); }
    finally { refreshing = false; $('refresh').disabled = false; $('refresh').innerHTML = 'Refresh <span>↻</span>'; }
  }
  function restoreLast() { var id = read(LAST, null), match = channels.find(function (c) { return c.id === id; }); if (match) choose(match); }
  function loadHls() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (!hlsPromise) hlsPromise = new Promise(function (resolve, reject) { var script = document.createElement('script'); script.src = HLS_URL; script.onload = function () { window.Hls ? resolve(window.Hls) : reject(new Error('HLS unavailable')); }; script.onerror = function () { script.remove(); hlsPromise = null; reject(new Error('HLS failed to load')); }; document.head.appendChild(script); });
    return hlsPromise;
  }
  function cleanup() { clearTimeout(retryTimer); clearTimeout(stallTimer); if (hls) { hls.destroy(); hls = null; } video.pause(); video.removeAttribute('src'); video.load(); }
  function updateArrowSwitching() {
    $('channel-keys').setAttribute('aria-pressed', arrowChannelSwitching);
    $('channel-keys').setAttribute('aria-label', 'Arrow channel switching: ' + (arrowChannelSwitching ? 'On' : 'Off'));
    $('channel-keys').title = 'Up/Down channel switching: ' + (arrowChannelSwitching ? 'On' : 'Off');
    $('shortcut-hint').textContent = arrowChannelSwitching ? '↑ Next channel   ↓ Previous channel' : 'Arrow channel switching is off';
  }
  $('channel-keys').addEventListener('click', function () { arrowChannelSwitching = !arrowChannelSwitching; save('signal.arrow-channels.v1', arrowChannelSwitching); updateArrowSwitching(); });
  function switchChannel(step) {
    var next = NewsPlaylist.adjacentChannel(visible, current && current.id, step);
    if (!next) { openChannels(); return; }
    if (!current || next.id !== current.id) choose(next);
    else showControls();
  }
  function choose(channel) {
    playbackToken++; cleanup(); current = channel; playbackStreams = streamsFor(channel); streamIndex = 0; retries = 0; save(LAST, channel.id);
    player.classList.add('has-channel'); $('playing-name').textContent = channel.name; $('playing-detail').textContent = channelDetail(channel);
    updateFavorite(); renderList(); lastFocusedId = channel.id; watchMode(); startStream(playbackToken);
  }
  function failed(token) {
    if (token !== playbackToken || !current) return;
    clearTimeout(retryTimer); clearTimeout(stallTimer);
    if (streamIndex + 1 < playbackStreams.length) { streamIndex++; status('Trying another stream…'); retryTimer = setTimeout(function () { startStream(token); }, 800); }
    else if (retries < 2) { retries++; streamIndex = 0; status('Connection lost. Reconnecting…'); retryTimer = setTimeout(function () { startStream(token); }, retries * 3000); }
    else status('This stream is unavailable. It may be offline, region restricted, blocked by your browser, or use an unsupported format. Please try another channel.');
  }
  async function startStream(token) {
    if (token !== playbackToken || !current) return;
    cleanup(); var url = playbackStreams[streamIndex]; status('Connecting to live stream…');
    if (location.protocol === 'https:' && url.indexOf('http:') === 0) { failed(token); return; }
    try {
      if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = url; }
      else {
        var Hls = await loadHls(); if (token !== playbackToken) return;
        if (!Hls.isSupported()) { status('HLS playback is not supported in this browser. Try a newer browser or another device.'); return; }
        hls = new Hls({maxBufferLength:15, maxMaxBufferLength:30, backBufferLength:15, enableWorker:true});
        hls.on(Hls.Events.ERROR, function (_event, data) { if (data.fatal && token === playbackToken) { if (hls) { hls.destroy(); hls = null; } failed(token); } });
        hls.loadSource(url); hls.attachMedia(video);
      }
      video.play().catch(function (error) { if (token !== playbackToken) return; if (error.name === 'NotAllowedError') { status('Press play to start this channel.'); showControls(); } else if (error.name !== 'AbortError') failed(token); });
    } catch (_) { if (token === playbackToken) status('The video player could not load. Check your connection and try again.'); }
  }
  video.addEventListener('playing', function () { clearTimeout(stallTimer); retries = 0; status(''); $('play-icon').textContent = 'Ⅱ'; $('play').setAttribute('aria-label', 'Pause'); hideControlsLater(); });
  video.addEventListener('pause', function () { clearTimeout(stallTimer); $('play-icon').textContent = '▶'; $('play').setAttribute('aria-label', 'Play'); showControls(); });
  video.addEventListener('error', function () { if (current && video.getAttribute('src')) failed(playbackToken); });
  video.addEventListener('ended', function () { if (current) failed(playbackToken); });
  video.addEventListener('waiting', function () { if (current && !video.paused) { status('Buffering live stream…'); clearTimeout(stallTimer); var token = playbackToken; stallTimer = setTimeout(function () { failed(token); }, 20000); } });
  function updateFavorite() { var yes = current && favorites.indexOf(current.id) >= 0; $('favorite').textContent = yes ? '★' : '☆'; $('favorite').style.color = yes ? '#ffffff' : ''; $('favorite').setAttribute('aria-label', yes ? 'Remove from favorites' : 'Add to favorites'); }
  $('favorite').addEventListener('click', function () { if (!current) return; var index = favorites.indexOf(current.id); if (index >= 0) favorites.splice(index, 1); else favorites.push(current.id); save(FAVS, favorites); updateFavorite(); renderList(); });
  function togglePlay() { if (!current) { var first = list.querySelector('.channel'); if (first) first.focus(); return; } if (video.paused) { if (!video.currentSrc && !hls) { retries = 0; startStream(playbackToken); } else video.play().catch(function () { status('Press play to retry, or choose another channel.'); }); } else video.pause(); }
  $('play').addEventListener('click', togglePlay);
  $('fullscreen').addEventListener('click', function () { if (document.fullscreenElement) { document.exitFullscreen(); } else if (document.documentElement.requestFullscreen) { document.documentElement.requestFullscreen().catch(function () { status('Fullscreen is not available on this device.'); }); } else if (video.webkitEnterFullscreen) { video.webkitEnterFullscreen(); } else status('Fullscreen is not available on this device.'); });
  function showControls() { player.classList.remove('controls-hidden'); $('controls').removeAttribute('aria-hidden'); $('controls').removeAttribute('inert'); hideControlsLater(); }
  function canHidePlaybackUI() { return !!current && !video.paused && msg.hidden && !activeDialog; }
  function hidePlaybackUI() {
    if (!canHidePlaybackUI()) return;
    // Close browsing chrome as well as transport controls. The video stays untouched.
    document.body.classList.add('watching'); document.body.classList.remove('panel-open');
    document.querySelector('.library').hidden = true;
    $('browse').setAttribute('aria-expanded', 'false');
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    player.classList.add('controls-hidden');
    $('controls').setAttribute('aria-hidden', 'true'); $('controls').setAttribute('inert', '');
  }
  function hideControlsLater() {
    clearTimeout(controlsTimer);
    if (canHidePlaybackUI()) controlsTimer = setTimeout(hidePlaybackUI, 5000);
  }
  document.addEventListener('pointermove', function () { if (current) showControls(); }, {passive:true});
  document.addEventListener('touchstart', function () { if (current) showControls(); }, {passive:true});
  player.addEventListener('focusin', showControls);
  $('browse').addEventListener('click', openChannels);
  $('close-channels').addEventListener('click', watchMode);
  $('retry-stream').addEventListener('click', function () { if (current) { playbackToken++; retries = 0; streamIndex = 0; startStream(playbackToken); $('play').focus(); } });
  $('choose-another').addEventListener('click', openChannels);
  function setFavorites(only) { $('search').value = ''; favoritesOnly = only; renderList(); if (document.body.classList.contains('watching')) openChannels(); }
  $('all-nav').addEventListener('click', function () { setFavorites(false); });
  $('favorites-nav').addEventListener('click', function () { setFavorites(true); });
  $('filter-all').addEventListener('click', function () { setFavorites(false); });
  $('filter-favorites').addEventListener('click', function () { setFavorites(!favoritesOnly); });
  function openDialog(id, opener) {
    activeDialog = $(id); dialogReturn = opener; activeDialog.hidden = false; clearTimeout(controlsTimer);
    if (id === 'search-dialog') renderList();
    (id === 'search-dialog' ? $('search') : activeDialog.querySelector('[aria-pressed="true"]') || activeDialog.querySelector('button')).focus();
  }
  function closeDialog(results) {
    if (!activeDialog) return;
    var wasSearch = activeDialog.id === 'search-dialog';
    activeDialog.hidden = true; activeDialog = null;
    if (wasSearch) renderList();
    if (results) focusChannel(lastFocusedId); else if (dialogReturn) dialogReturn.focus();
    hideControlsLater();
  }
  function openFilter(kind, opener) {
    filterKind=kind;
    var options=kind==='quality' ? ['','HD','SD','Unknown'] : ['','news'];
    if (kind==='genre') channels.forEach(function(c){ (c.genres || []).forEach(function(g){if(options.indexOf(g)<0)options.push(g);}); });
    var selected=kind==='quality' ? quality : genre;
    $('filter-title').textContent=kind==='quality' ? 'Picture quality' : 'Choose a genre';
    $('filter-options').innerHTML=options.map(function(value){var label=kind==='quality' ? value || 'All quality' : genreName(value);return '<button class="language-option" data-filter="'+escapeHTML(value)+'" aria-pressed="'+(value===selected)+'">'+escapeHTML(label)+'</button>';}).join('');
    openDialog('filter-dialog',opener);
  }
  $('quality-button').addEventListener('click',function(){openFilter('quality',this);});
  $('genre-button').addEventListener('click',function(){openFilter('genre',this);});
  $('filter-options').addEventListener('click',function(event){var button=event.target.closest('[data-filter]');if(!button)return;$('search').value='';if(filterKind==='quality')quality=button.dataset.filter;else genre=button.dataset.filter;renderList();closeDialog(true);});
  $('reset-filters').addEventListener('click',function(){quality='HD';genre='news';language='Hindi';favoritesOnly=false;$('search').value='';renderLanguages();renderList();});
  $('language-button').addEventListener('click', function () { openDialog('language-dialog', this); });
  $('search-button').addEventListener('click', function () { openDialog('search-dialog', this); });
  document.querySelectorAll('[data-close-dialog]').forEach(function (button) { button.addEventListener('click', function () { closeDialog(false); }); });
  $('language-options').addEventListener('click', function (event) { var button = event.target.closest('[data-language]'); if (!button) return; $('search').value = ''; language = button.dataset.language; renderLanguages(); renderList(); closeDialog(true); });
  $('search').addEventListener('input', renderList);
  $('search-clear').addEventListener('click', function () { $('search').value = ''; renderList(); $('search').focus(); });
  $('search-results').addEventListener('click', function () { closeDialog(true); });
  $('refresh').addEventListener('click', function () { refresh(true); });
  function focusables() {
    return Array.from((activeDialog || document).querySelectorAll('button:not([disabled]), input, a[href]')).filter(function (el) { return el.getClientRects().length && !el.closest('[hidden]'); });
  }
  function navigate(key) {
    var active = document.activeElement;
    if (active.classList.contains('channel')) {
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        var rows = Array.from(list.querySelectorAll('.channel')), index = rows.indexOf(active), next = rows[index + (key === 'ArrowRight' ? 1 : -1)];
        if (next) { next.focus({preventScroll:true}); scrollChannel(next); }
        else if (key === 'ArrowLeft') $('all-nav').focus();
      } else if (key === 'ArrowUp') $('quality-button').focus();
      return;
    }
    if (!activeDialog && key === 'ArrowDown' && !document.querySelector('.library').hidden && !document.querySelector('.library').contains(active)) { focusChannel(lastFocusedId); return; }
    if (!activeDialog && key === 'ArrowDown' && document.querySelector('.tv-filters').contains(active)) { focusChannel(lastFocusedId); return; }
    if (!activeDialog && player.contains(active) && key === 'ArrowUp') { openChannels(); return; }
    var rect = active.getBoundingClientRect(), x = rect.left + rect.width/2, y = rect.top + rect.height/2, best = null, score = Infinity;
    focusables().forEach(function (el) {
      if (el === active) return;
      var r = el.getBoundingClientRect(), dx = r.left + r.width/2 - x, dy = r.top + r.height/2 - y, primary = key === 'ArrowRight' ? dx : key === 'ArrowLeft' ? -dx : key === 'ArrowDown' ? dy : -dy, cross = key === 'ArrowRight' || key === 'ArrowLeft' ? Math.abs(dy) : Math.abs(dx);
      if (primary <= 1) return; var candidate = primary + cross * 2.5; if (candidate < score) { score = candidate; best = el; }
    });
    if (best) { best.focus({preventScroll:true}); if (best.classList.contains('channel')) scrollChannel(best); else if (activeDialog) best.scrollIntoView({block:'nearest'}); }
  }
  document.addEventListener('keydown', function (event) {
    var key = event.key || '', active = document.activeElement;
    hideControlsLater();
    var back = key === 'Escape' || key === 'BrowserBack' || [10009,461,4].indexOf(event.keyCode) >= 0;
    var ok = key === 'Enter' || key === ' ' || event.keyCode === 23;
    if (back) {
      event.preventDefault();
      if (activeDialog) closeDialog(false);
      else if (document.body.classList.contains('panel-open')) watchMode();
      else if (document.fullscreenElement) document.exitFullscreen();
      else if (current) watchMode();
      return;
    }
    if (key === 'Tab' && activeDialog) { var items = focusables(), i = items.indexOf(active); event.preventDefault(); items[(i + (event.shiftKey ? items.length - 1 : 1)) % items.length].focus(); return; }
    if (key === 'MediaPlayPause' || key === 'MediaPlay' || key === 'MediaPause' || [179,415,19].indexOf(event.keyCode) >= 0) { event.preventDefault(); togglePlay(); return; }
    if (arrowChannelSwitching && current && !activeDialog && document.body.classList.contains('watching') && !document.body.classList.contains('panel-open') && (key === 'ArrowUp' || key === 'ArrowDown')) {
      event.preventDefault();
      if (!event.repeat) switchChannel(key === 'ArrowUp' ? 1 : -1);
      return;
    }
    if ((key.indexOf('Arrow') === 0 || ok || key === 'Tab') && player.classList.contains('controls-hidden') && !activeDialog) { event.preventDefault(); showControls(); $('play').focus(); return; }
    if (key.indexOf('Arrow') === 0) {
      if (active.tagName === 'INPUT' && (key === 'ArrowLeft' || key === 'ArrowRight')) return;
      event.preventDefault(); showControls(); navigate(key);
    } else if (ok && active === $('search') && key === 'Enter') { event.preventDefault(); closeDialog(true); }
    else if (event.keyCode === 23 && active.tagName === 'BUTTON') { event.preventDefault(); active.click(); }
  });
  function clock() { var now = new Date(); $('clock-time').textContent = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); $('clock-date').textContent = now.toLocaleDateString([], {weekday:'short', day:'numeric', month:'short'}).toUpperCase(); }
  SignalPWA.init({openDialog:openDialog});
  window.addEventListener('online', function () { refresh(false); });
  var cached = read(CACHE, null), legacy = cached ? null : read('signal.channels.v1', null);
  var savedChannels = cached && Array.isArray(cached.channels) ? cached.channels : legacy && Array.isArray(legacy.channels) ? legacy.channels : [];
  channels = NewsChannels.merge(savedChannels, savedChannels);
  cacheTime = cached && cached.time || 0;
  updateArrowSwitching(); renderLanguages(); renderList(); restoreLast(); openChannels();
  clock(); setInterval(clock, 60000); refresh(false); setInterval(function () { refresh(false); }, 60 * 60 * 1000);
}());
