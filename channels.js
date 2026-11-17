/* User-supplied public news feeds, available before the remote catalogue loads. */
(function (root) {
  'use strict';
  var entries = [
    ['4TV News', 'https://cdn-4.pishow.tv/live/1007/master.m3u8', ''],
    ['6 TV Telugu', 'https://cdn-1.pishow.tv/live/232/master.m3u8', 'Telugu'],
    ['10 TV', 'https://cdn-1.pishow.tv/live/391/master.m3u8', ''],
    ['24 News', 'https://segment.yuppcdn.net/110322/channel24/playlist.m3u8', ''],
    ['99TV', 'https://cdn-1.pishow.tv/live/1211/master.m3u8', ''],
    ['Aaj Tak HD', 'https://feeds.intoday.in/aajtak/api/aajtakhd/master.m3u8', 'Hindi'],
    ['ABP News', 'https://d1rc86nwwc9fag.cloudfront.net/vglive-sk-472500/abpnews/master.m3u8', 'Hindi'],
    ['APN News', 'https://d1msejlow1t3l4.cloudfront.net/fta/apnnews/playlist.m3u8', 'Hindi'],
    ['Bansal News', 'https://8yzmq2gbdvax-hls-live.wmncdn.net/bansalnewstv1/live1.stream/playlist.m3u8', 'Hindi'],
    ['Bharat 24', 'https://cdn.ottlive.co.in/bharat24/index.m3u8', 'Hindi'],
    ['Bharat Express', 'https://cdn.pishow.tv/ott/live/1139/master.m3u8', 'Hindi'],
    ['Bharat Samachar', 'https://mumt03.tangotv.in/Dsly5z3HBHARATSAMACHAR/index.m3u8', 'Hindi'],
    ['CNBC Awaaz', 'https://n18syndication.akamaized.net/bpk-tv/CNBC_Awaaz_NW18_MOB/output01/master.m3u8', 'Hindi'],
    ['DD News', 'https://mumbai-edge.smartplaytv.in/DDNews/index.m3u8', 'Hindi'],
    ['First India News', 'https://mumt03.tangotv.in/Dsly5z3H1STINDIANEWS/index.m3u8', 'Hindi'],
    ['Good News Today', 'https://cc-89m9zu7a2upfe.akamaized.net/hls/live/2016145/gnt/gntlive/playlist.m3u8', 'Hindi'],
    ['India News', 'https://mumt03.tangotv.in/Dsly5z3HINDIANEWS/index.m3u8', 'Hindi'],
    ['India News Haryana', 'https://fta.ektv.in/live/590/master.m3u8', 'Hindi'],
    ['India News MP/Chhattisgarh', 'https://fta.ektv.in/live/600/master.m3u8', 'Hindi'],
    ['India News Punjab/Himachal', 'https://mumt03.tangotv.in/Dsly5z3HINDIANEWSPBHPJ&K/index.m3u8', 'Hindi'],
    ['India News Rajasthan', 'https://fta.ektv.in/live/601/master.m3u8', 'Hindi'],
    ['India News Uttar Pradesh', 'https://fta.ektv.in/live/304/master.m3u8', 'Hindi'],
    ['India TV', 'https://pl-indiatvnews.akamaized.net/out/v1/db79179b608641ceaa5a4d0dd0dca8da/index.m3u8', 'Hindi'],
    ['NDTV India', 'https://mumbai-edge.smartplaytv.in/NDTVIndia/index.m3u8', 'Hindi'],
    ['News 1 India', 'https://mumt07.tangotv.in/zHjX9OFlNEWS1INDIA/index.m3u8', 'Hindi'],
    ['News 11', 'https://live1.ottlive.co.in/news11/news11/index.m3u8', 'Hindi'],
    ['News 18 India', 'https://n18syndication.akamaized.net/bpk-tv/News18_India_NW18_MOB/output01/master.m3u8', 'Hindi'],
    ['News18 Bihar/Jharkhand', 'https://n18syndication.akamaized.net/bpk-tv/News18_Bihar_Jharkhand_NW18_MOB/output01/master.m3u8', 'Hindi'],
    ['News18 Delhi NCR/J&K', 'https://n18syndication.akamaized.net/bpk-tv/News18_JKLH_NW18_MOB/output01/master.m3u8', 'Hindi'],
    ['News18 MP/Chhattisgarh', 'https://n18syndication.akamaized.net/bpk-tv/News18_MP_Chhattisgarh_NW18_MOB/output01/master.m3u8', 'Hindi'],
    ['News18 Punjab/Haryana/Himachal', 'https://n18syndication.akamaized.net/bpk-tv/News18_Punjab_Haryana_HP_NW18_MOB/output01/master.m3u8', 'Hindi'],
    ['News18 Rajasthan', 'https://n18syndication.akamaized.net/bpk-tv/News18_Rajasthan_NW18_MOB/output01/master.m3u8', 'Hindi'],
    ['News18 UP/Uttarakhand', 'https://n18syndication.akamaized.net/bpk-tv/News18_UP_Uttarakhand_NW18_MOB/output01/master.m3u8', 'Hindi'],
    ['News 24', 'https://vidcdn.vidgyor.com/news24-origin/liveabr/playlist.m3u8', 'Hindi'],
    ['News Nation', 'https://cdn.pishow.tv/ott/live/1493/master.m3u8', 'Hindi'],
    ['News State MP/Chhattisgarh', 'https://mumt01.tangotv.in/O5aw8Zn3NEWSSTATEMPCG/index.m3u8', 'Hindi'],
    ['News State Punjab/Haryana/Himachal', 'https://fta.ektv.in/live/732/master.m3u8', 'Hindi'],
    ['News State UP/Uttarakhand', 'https://fta.ektv.in/live/302/master.m3u8', 'Hindi'],
    ['Republic Bharat', 'https://cdn.pishow.tv/ott/live/1053/master.m3u8', 'Hindi'],
    ['Sudarshan News', 'https://cdn.pishow.tv/ott/live/1516/master.m3u8', 'Hindi'],
    ['Swadesh News', 'https://mumt03.tangotv.in/Dsly5z3HSWADESHNEWS/index.m3u8', 'Hindi'],
    ['Times Now Navbharat', 'https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/a5ee7c4e7a2a4b15a22a3bcf523b9776/index.m3u8', 'Hindi'],
    ['Zee News', 'https://dknttpxmr0dwf.cloudfront.net/index_57.m3u8', 'Hindi']
  ];
  function nameKey(name) { return name.toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function matches(a, b) { return nameKey(a.name) === nameKey(b.name) || a.streams.some(function (url) { return b.streams.indexOf(url) >= 0; }); }
  function merge(remote, previous) {
    var result = remote.map(function (c) { return {id:c.id, name:c.name, logo:c.logo || '', languages:(c.languages || []).slice(), genres:(c.genres || ['news']).slice(), streamQualities:Object.assign({}, c.streamQualities), streams:c.streams.slice()}; });
    entries.forEach(function (entry) {
      var seed = {id:'built-in:' + nameKey(entry[0]), name:entry[0], logo:'', languages:entry[2] ? [entry[2]] : [], genres:['news'], streamQualities:{}, streams:[entry[1]]};
      seed.streamQualities[entry[1]] = NewsPlaylist.qualityOf(entry[0]);
      var found = result.find(function (c) { return matches(c, seed); });
      var old = (previous || []).find(function (c) { return matches(c, seed); });
      if (!found) { found = seed; result.push(found); }
      else {
        found.name = seed.name;
        if (found.genres.indexOf('news') < 0) found.genres.push('news');
        if (!found.streamQualities[entry[1]]) found.streamQualities[entry[1]] = seed.streamQualities[entry[1]];
        found.streams = seed.streams.concat(found.streams.filter(function (url) { return url !== entry[1]; }));
        seed.languages.forEach(function (lang) { if (found.languages.indexOf(lang) < 0) found.languages.push(lang); });
      }
      if (old) found.id = old.id;
    });
    return result.sort(function (a,b) { return a.name.localeCompare(b.name, undefined, {numeric:true, sensitivity:'base'}); });
  }
  root.NewsChannels = {merge:merge};
}(typeof window !== 'undefined' ? window : globalThis));
