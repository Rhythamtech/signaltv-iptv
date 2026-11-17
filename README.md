# Signal — India Live TV

A small TV-first Indian live TV player built with HTML, CSS and vanilla JavaScript. It uses the [India playlist](https://iptv-org.github.io/iptv/countries/in.m3u) linked by the supplied directory and the [iptv-org channel catalogue](https://iptv-org.github.io/api/channels.json) and [feed metadata](https://iptv-org.github.io/api/feeds.json) to identify genres, languages and published picture quality. This is a public directory, not proof that every feed is licensed for your use: use only streams you are authorized to access.

## Run

Serve this folder over HTTPS or on localhost (opening `index.html` directly does not provide PWA support). For example:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. On a TV or another device, deploy the folder to an HTTPS static host; localhost refers to that device itself. Install from the browser's install menu when supported. PWA installation and fullscreen availability vary by browser and TV platform. No Android APK is included.

## Using the app

Select a channel to play it. Use arrow keys to move between controls, OK/Enter to select, Back/Escape to return to the channel list, and the remote's play/pause button to control playback. Search and language selection work with the device's keyboard or standard TV input controls. The star beside the player saves the selected channel. Refresh forces an update; otherwise a saved list appears immediately and is refreshed after 24 hours while the app is open or next opened.

The app stores channel data, favorites and the last channel in localStorage. Its service worker caches the app shell only; it does not cache live streams. The app uses native HLS when available, otherwise it loads HLS.js from jsDelivr only when playback is requested. HLS.js and stream data require network access. If the metadata catalogue cannot be fetched, a saved complete list is kept; on first use the app may show a partial list based on playlist categories and names. Language filters depend on metadata supplied by the source; the exact feed is used when identified, otherwise the main feed is used. Channel listings and stream URLs change independently of this app.

Public streams can be offline, geographically restricted, incompatible, or reject browser requests through CORS. HTTP streams are blocked on HTTPS sites by browsers. The app tries alternative URLs where provided, then reconnects a limited number of times. It cannot bypass restrictions, guarantee availability, or determine licensing. Autoplay with sound may require a user gesture. Logos are hosted by external providers and may fail or be blocked; initials are shown instead.

## Files

- `index.html`, `style.css`, `app.js`: interface, navigation and playback
- `playlist.js`: M3U parsing and news filtering
- `sw.js`, `manifest.webmanifest`, `icons/`: installable offline shell

The 43 user-supplied news channels in `channels.js` are bundled with the app shell and appear immediately, including when the remote directory is unavailable. Daily updates enrich the list with logos, languages and additional channels. Matching names or stream URLs are merged, and the supplied URL is tried first. Channels without a supplied or fetched logo show initials.

## TV interface

The interface uses an Apple TV-style dark sidebar, large video stage, rounded transport controls and a horizontal channel shelf. It retains Signal branding. Left/Right moves through channels; Up moves to filters; Down from filters returns to channels. The Channels button opens the shelf while the stream continues. During watch mode, Up switches to the next channel and Down switches to the previous channel; the order follows the visible channel shelf and wraps at either end. The ↑↓ player button enables or disables this shortcut and remembers the setting. Holding a key does not repeatedly open streams. With the shelf or a dialog open, arrows navigate controls normally. Back closes dialogs first, then browsing, then browser fullscreen.

After five seconds without remote, pointer or touch activity during successful playback, the sidebar, channel shelf and playback controls disappear automatically. Video and audio keep playing. Left/Right, OK or Tab reveals hidden controls without also activating them. Up/Down directly changes the channel when arrow switching is enabled. Paused playback, search/language dialogs and connection/error messages keep the controls visible. The page remains fixed to the viewport; only the channel shelf and long option panels scroll internally.

Use the language panel to narrow the channel shelf. Search always covers the full loaded list, including channels outside the active quality, genre, language and favorites filters. Clearing search restores those filters; choosing a filter exits search. Focus returns to the last browsed channel. Android TV hardware still needs device testing.

## Channel filters

The full India playlist is imported, including genres beyond news. Each app launch defaults to **HD · News · Hindi**. The single toolbar offers quality, genre, language, favorites, search and Reset. Reset restores those defaults and clears search/favorites-only filtering. All quality, All genres and All languages broaden the list explicitly.

HD means a published resolution of 720 lines or higher (including UHD), or an explicit HD/FHD/UHD label. SD means a lower published resolution or an SD label. Streams with no usable quality information are shown under Unknown or All quality. These labels describe published stream/feed metadata; adaptive streams can change their actual playback resolution with network conditions. No video manifests are downloaded just to classify the shelf. Channels with multiple stream URLs appear in matching quality categories; playback tries matching URLs first and can fall back to other URLs if they fail.

While the search panel is open, an empty query shows the full loaded list. Search uses the latest successfully loaded/cached India playlist plus bundled channels; it cannot find entries that have not been loaded.

## PWA installation and updates

Serve the complete folder over HTTPS, or use localhost while developing. Opening a file directly or using an HTTP LAN address does not provide a reliable installable PWA. Choose **Install app** in the channel toolbar: supporting browsers show their native prompt; other browsers get guidance for their installation menu. Android TV installation support depends on the TV browser. The install action is hidden when running as an installed standalone app.

After a successful first online visit, the service worker caches the HTML, CSS, JavaScript, manifest and icons as one versioned app shell. The saved playlist and preferences remain in localStorage. Offline mode displays a connection notice and lets you browse the saved list. Playback, external logos and the on-demand HLS.js library still require internet. Streams, media segments, DRM/encryption keys and remote playlists are never stored in the service worker cache.

New releases download in the background. An **Update app** notice appears when the new version is ready; selecting it activates that version and reloads the app. Playback is not automatically interrupted. Returning to the app after an hour checks for updates again. Increment the `signal-shell-v…` version in `sw.js` when publishing a release. Early installations using shell versions 1–7 migrate once automatically and reload the app, retaining localStorage favorites and settings. Later updates wait for Update app.

For deployment checks, open the browser's application/developer tools and confirm the manifest and service worker have loaded, install the app, then disconnect the network and reopen it. Confirm that the saved channel list opens and the offline notice appears. Restore the network before testing live playback. Installing does not create an Android APK.

During playback, select the music note button to choose an available audio language. The choices come from the current stream and device; some streams or browsers do not expose alternative audio tracks. The language filter in the channel shelf only filters channels.
