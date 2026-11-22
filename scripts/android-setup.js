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
run('npx cap sync android');
console.log('\nPronto. Abra no Android Studio com: npm run android:open  — ou gere o APK com: npm run android:apk');
