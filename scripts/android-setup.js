/* Cria o projeto Android (Capacitor), trava em retrato e sincroniza os arquivos web. Uso: npm run android:setup */
const { execSync } = require('child_process'); const fs = require('fs');
const run = (c) => execSync(c, { stdio: 'inherit' });
if (!fs.existsSync('android')) run('npx cap add android');
const mf = 'android/app/src/main/AndroidManifest.xml';
if (fs.existsSync(mf)) {
  let s = fs.readFileSync(mf, 'utf8');
  if (!s.includes('android:screenOrientation') && process.env.ORVALON_FREE_ORIENTATION !== '1') s = s.replace('<activity', '<activity android:screenOrientation="portrait"');
  fs.writeFileSync(mf, s);
}
// MainActivity: ignora o tamanho de fonte do sistema (evita layout quebrado) e força camada de hardware
const pkgDir = 'android/app/src/main/java/com/orvalon/almas';
if (fs.existsSync(pkgDir)) fs.writeFileSync(pkgDir + '/MainActivity.java', `package com.orvalon.almas;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    WebSettings s = this.bridge.getWebView().getSettings();
    s.setTextZoom(100);
    s.setUseWideViewPort(true);
    s.setLoadWithOverviewMode(true);
    this.bridge.getWebView().setLayerType(View.LAYER_TYPE_HARDWARE, null);
  }
}
`);
if (fs.existsSync(mf)) { let s2 = fs.readFileSync(mf, 'utf8'); if (!s2.includes('android:hardwareAccelerated')) s2 = s2.replace('<application', '<application android:hardwareAccelerated="true"'); fs.writeFileSync(mf, s2); }
run('npx cap sync android');
console.log('\nPronto. Abra no Android Studio com: npm run android:open  — ou gere o APK com: npm run android:apk');
