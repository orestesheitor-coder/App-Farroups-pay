package br.com.farroupilha.farroupspay.demo;

import android.app.Activity;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * A vitrine do Farroups-pay é um HTML autocontido. Este app existe só para
 * carregá-la dos assets numa WebView em tela cheia — nenhuma dependência,
 * nenhum dado sai do aparelho.
 */
public class MainActivity extends Activity {

  private WebView web;

  @Override
  protected void onCreate(Bundle estadoSalvo) {
    super.onCreate(estadoSalvo);

    web = new WebView(this);
    web.setLayoutParams(new ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

    WebSettings ajustes = web.getSettings();
    ajustes.setJavaScriptEnabled(true);
    ajustes.setDomStorageEnabled(true);
    ajustes.setAllowFileAccessFromFileURLs(false);
    ajustes.setAllowUniversalAccessFromFileURLs(false);
    ajustes.setSupportZoom(false);
    ajustes.setMediaPlaybackRequiresUserGesture(true);

    // Sem navegação externa: tudo acontece dentro da página.
    web.setWebViewClient(new WebViewClient());
    web.setOverScrollMode(WebView.OVER_SCROLL_NEVER);

    if (estadoSalvo != null) {
      web.restoreState(estadoSalvo);
    } else {
      web.loadUrl("file:///android_asset/index.html");
    }

    setContentView(web);
  }

  @Override
  protected void onSaveInstanceState(Bundle estado) {
    super.onSaveInstanceState(estado);
    web.saveState(estado);
  }

  @Override
  public void onBackPressed() {
    if (web.canGoBack()) {
      web.goBack();
    } else {
      super.onBackPressed();
    }
  }
}
