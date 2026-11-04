package fr.minitele.app;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.window.OnBackInvokedDispatcher;

/**
 * Full-screen shell for the Mini Télé site. Phones and Android TV both launch it.
 * The page owns D-pad focus and the Back key while a video is open.
 */
public class MainActivity extends Activity {
    static final String HOME = "https://allefs17fr-ai.github.io/mini-tele/";

    private WebView webView;
    private boolean backBusy;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemBars();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                return !allowedHost(request.getUrl().getHost());
            }

            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !allowedHost(Uri.parse(url).getHost());
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showOffline();
            }

            @Override
            @SuppressWarnings("deprecation")
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                if (Build.VERSION.SDK_INT < 23) showOffline();
            }
        });
        /* A long-press listener that consumes the gesture cancels a slow drag on the seek bar. */
        webView.setLongClickable(false);
        webView.setHapticFeedbackEnabled(false);
        setContentView(webView);
        webView.requestFocus();
        webView.loadUrl(HOME);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                    this::handleBack
            );
        }
    }

    private static boolean allowedHost(String host) {
        return "allefs17fr-ai.github.io".equals(host);
    }

    private void showOffline() {
        String html = "<!DOCTYPE html><html><head><meta charset='utf-8'>"
                + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
                + "<style>body{margin:0;min-height:100vh;display:grid;place-items:center;"
                + "background:#c5efff;font-family:sans-serif;text-align:center;color:#243047}"
                + "button{font-size:1.4rem;padding:1rem 1.4rem;border:0;border-radius:999px;background:#ffe14a}</style>"
                + "</head><body><div><h1>Mini Télé</h1>"
                + "<p>Pas de connexion.<br>Sem conexão.</p>"
                + "<p><button onclick=\"location.href='" + HOME + "'\">Réessayer / Tentar de novo</button></p>"
                + "</div></body></html>";
        webView.loadDataWithBaseURL(HOME, html, "text/html", "utf-8", null);
    }

    private void handleBack() {
        if (webView == null) {
            finish();
            return;
        }
        if (backBusy) return;
        backBusy = true;
        webView.evaluateJavascript(
                "(function(){try{return !!(window.miniTeleOnBack&&window.miniTeleOnBack());}catch(e){return false;}})()",
                value -> runOnUiThread(() -> {
                    backBusy = false;
                    if (!"true".equals(value)) finish();
                })
        );
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) return;
        handleBack();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (webView != null && !webView.hasFocus()) webView.requestFocus();
        if (event.getAction() == KeyEvent.ACTION_DOWN && dispatchMediaKey(event.getKeyCode())) {
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    /** TV remotes send media keys that the page does not always receive as arrows. */
    private boolean dispatchMediaKey(int keyCode) {
        String action = null;
        if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE
                || keyCode == KeyEvent.KEYCODE_MEDIA_PLAY
                || keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE
                || keyCode == KeyEvent.KEYCODE_HEADSETHOOK) {
            action = "toggle";
        } else if (keyCode == KeyEvent.KEYCODE_MEDIA_REWIND
                || keyCode == KeyEvent.KEYCODE_MEDIA_SKIP_BACKWARD
                || keyCode == KeyEvent.KEYCODE_MEDIA_STEP_BACKWARD) {
            action = "back";
        } else if (keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD
                || keyCode == KeyEvent.KEYCODE_MEDIA_SKIP_FORWARD
                || keyCode == KeyEvent.KEYCODE_MEDIA_STEP_FORWARD) {
            action = "forward";
        }
        if (action == null || webView == null) return false;
        webView.evaluateJavascript("window.miniTeleMedia&&window.miniTeleMedia('" + action + "')", null);
        return true;
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemBars();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    private void hideSystemBars() {
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= 30) {
            window.setDecorFitsSystemWindows(false);
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            View decor = window.getDecorView();
            decor.setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            );
        }
    }
}
