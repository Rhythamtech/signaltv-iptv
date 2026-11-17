package com.signaltv.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

public final class MainActivity extends Activity {
    private static final String APP_URL = "https://indication-productive-appearance-genesis.trycloudflare.com/";
    private static final String FALLBACK_URL = "file:///android_asset/index.html";
    private WebView webView;
    private boolean usingFallback;
    private View fullscreenView;
    private WebChromeClient.CustomViewCallback fullscreenCallback;
    private FrameLayout root;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        root = new FrameLayout(this);
        webView = new WebView(this);
        root.addView(webView);
        setContentView(root);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame() && request.getUrl().toString().startsWith(APP_URL)) openFallback();
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && request.getUrl().toString().startsWith(APP_URL) && response.getStatusCode() >= 400) openFallback();
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullscreenView != null) { callback.onCustomViewHidden(); return; }
                fullscreenView = view;
                fullscreenCallback = callback;
                root.addView(view, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                webView.setVisibility(View.GONE);
            }
            @Override public void onHideCustomView() { hideFullscreen(); }
        });
        if (state == null) webView.loadUrl(APP_URL);
        else webView.restoreState(state);
    }

    private void openFallback() {
        if (usingFallback) return;
        usingFallback = true;
        webView.loadUrl(FALLBACK_URL);
    }

    private void hideFullscreen() {
        if (fullscreenView == null) return;
        root.removeView(fullscreenView);
        fullscreenView = null;
        webView.setVisibility(View.VISIBLE);
        fullscreenCallback.onCustomViewHidden();
        fullscreenCallback = null;
    }
    @Override public void onBackPressed() {
        if (fullscreenView != null) hideFullscreen();
        else if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
    @Override protected void onSaveInstanceState(Bundle state) {
        webView.saveState(state);
        super.onSaveInstanceState(state);
    }
    @Override protected void onDestroy() {
        root.removeView(webView);
        webView.destroy();
        super.onDestroy();
    }
}
