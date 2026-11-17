/* India M3U parsing and metadata. Unknown quality is never labelled HD or SD. */
(function (root) {
  'use strict';
  var names = {asm:'Assamese',ben:'Bengali',eng:'English',guj:'Gujarati',hin:'Hindi',kan:'Kannada',kas:'Kashmiri',mal:'Malayalam',mar:'Marathi',nep:'Nepali',ori:'Odia',ory:'Odia',pan:'Punjabi',san:'Sanskrit',tam:'Tamil',tel:'Telugu',urd:'Urdu'};
  function qualityOf(text) {
    var resolution = String(text).match(/(\d{3,4})[pi]\b/i);
    if (resolution) return Number(resolution[1]) >= 720 ? 'HD' : 'SD';
    if (/\b(?:HD|FHD|UHD|4K)\b/i.test(text)) return 'HD';
    if (/\bSD\b/i.test(text)) return 'SD';
    return 'Unknown';
  }
  function parse(text, catalogue, base, feeds) {
    var index = Object.create(null), feedIndex = Object.create(null), byId = Object.create(null), result = [];
    (Array.isArray(catalogue) ? catalogue : []).forEach(function (c) { if (c && c.id) index[c.id.toLowerCase()] = c; });
    (Array.isArray(feeds) ? feeds : []).forEach(function (f) {
      if (!f || !f.channel) return;
      var key = f.channel.toLowerCase();
      feedIndex[key + '@' + String(f.id).toLowerCase()] = f;
      if (f.is_main || !feedIndex[key]) feedIndex[key] = f;
    });
    var entry = null;
    text.replace(/^\uFEFF/, '').split(/\r?\n/).forEach(function (raw) {
      var line = raw.trim();
      if (/^#EXTINF:/i.test(line)) {
        var attrs = Object.create(null), match, re = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
        while ((match = re.exec(line))) attrs[match[1].toLowerCase()] = match[2] != null ? match[2] : match[3];
        // Find the title delimiter outside attribute quotes.
        var quote = '', comma = -1;
        for (var i=0;i<line.length;i++) { var ch=line[i]; if (quote) { if (ch===quote) quote=''; } else if (ch==='"' || ch==="'") quote=ch; else if (ch===',') { comma=i; break; } }
        entry = {attrs:attrs, name:comma>=0 ? line.slice(comma+1).trim() : ''};
      } else if (line && line[0] !== '#' && entry) {
        var a=entry.attrs, id=a['tvg-id'] || '', channelId=id.split('@')[0].toLowerCase(), meta=index[channelId], feed=feedIndex[id.toLowerCase()] || feedIndex[channelId];
        var title=entry.name || a['tvg-name'] || id;
        var url; try { url=new URL(line,base).href; } catch (_) { entry=null; return; }
        if (title && /^https?:/i.test(url)) {
          var clean=title.replace(/\s*\(\d+[pi]\)/ig,'').trim(), key=(id ? id+'|' : '')+clean.toLowerCase();
          var langs=(a['tvg-language'] ? a['tvg-language'].split(/[;,]/) : feed && feed.languages || []).filter(Boolean).map(function (l) { l=String(l).trim(); return names[l.toLowerCase()] || l; });
          var genres=meta && meta.categories && meta.categories.length ? meta.categories.slice() : (a['group-title'] || '').split(/[;|]/).map(function (g) { return g.trim().toLowerCase(); }).filter(function (g) { return g && g!=='india' && g!=='undefined'; });
          if (!genres.length && /\b(news|samachar|khabar)\b/i.test(title)) genres=['news'];
          if (!genres.length) genres=['uncategorized'];
          var quality=qualityOf(title+' '+(a['tvg-quality'] || ''));
          if (quality==='Unknown' && feed) quality=qualityOf(feed.format || '');
          if (!byId[key]) { byId[key]={id:key,name:clean,logo:a['tvg-logo'] || '',languages:langs,genres:genres,streams:[],streamQualities:{}}; result.push(byId[key]); }
          var c=byId[key]; if (c.streams.indexOf(url)<0) c.streams.push(url); c.streamQualities[url]=quality;
        }
        entry=null;
      }
    });
    return result.sort(function(a,b){return a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'});});
  }
  function matchesFilters(c, filters) {
    return (!filters.language || (c.languages || []).indexOf(filters.language)>=0) && (!filters.genre || (c.genres || []).indexOf(filters.genre)>=0) && (!filters.quality || c.streams.some(function(url){return (c.streamQualities && c.streamQualities[url] || 'Unknown')===filters.quality;}));
  }
  function selectChannels(channels, filters) {
    var query=String(filters.query || '').trim().toLowerCase();
    return channels.filter(function(c){
      if (query || filters.searchAll) return c.name.toLowerCase().indexOf(query)>=0;
      return (!filters.favoritesOnly || (filters.favorites || []).indexOf(c.id)>=0) && matchesFilters(c,filters);
    });
  }
  function adjacentChannel(channels, currentId, step) {
    if (!channels.length) return null;
    var index=channels.findIndex(function(c){return c.id===currentId;});
    if (index<0) return channels[step>0 ? 0 : channels.length-1];
    return channels[(index+step+channels.length)%channels.length];
  }
  root.NewsPlaylist={parse:parse,qualityOf:qualityOf,matchesFilters:matchesFilters,selectChannels:selectChannels,adjacentChannel:adjacentChannel};
}(typeof window!=='undefined' ? window : globalThis));
