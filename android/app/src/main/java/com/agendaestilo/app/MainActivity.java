package com.agendaestilo.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Garante que o layout utiliza o espaço completo da janela nativa
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );
    }

    @Override
    public void onStart() {
        super.onStart();
        // Remove o efeito de elástico/ricochete ao atingir o topo ou o fim da página no APK
        WebView webview = getBridge().getWebView();
        if (webview != null) {
            webview.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        }
    }
}