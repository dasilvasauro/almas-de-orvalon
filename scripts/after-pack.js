/* electron-builder afterPack: no Linux, troca o executável por um lançador que decide se a sandbox do Chromium
   pode ser usada. Em distros que restringem user namespaces (Ubuntu 23.10+/24.04, Mint 22) e em AppImages
   (onde chrome-sandbox não pode ser setuid root), o jogo abre com --no-sandbox em vez de abortar. */
const fs = require('fs'); const path = require('path');
exports.default = async function (context) {
  if (context.electronPlatformName !== 'linux') return;
  const dir = context.appOutDir; const exe = context.packager.executableName;
  const bin = path.join(dir, exe), real = bin + '.bin';
  if (!fs.existsSync(real)) fs.renameSync(bin, real);
  fs.writeFileSync(bin, `#!/bin/sh
# Lançador do Almas de Orvalon
HERE="$(dirname "$(readlink -f "$0")")"
BIN="$HERE/${exe}.bin"
OK=0
if [ -u "$HERE/chrome-sandbox" ] && [ "$(stat -c %u "$HERE/chrome-sandbox" 2>/dev/null)" = "0" ]; then
  OK=1
elif [ "$(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns 2>/dev/null)" = "1" ]; then
  OK=0
elif command -v unshare >/dev/null 2>&1 && unshare -Ur true >/dev/null 2>&1; then
  OK=1
fi
[ "$(id -u)" = "0" ] && OK=0
[ "$ORVALON_NO_SANDBOX" = "1" ] && OK=0
if [ "$OK" = "1" ]; then exec "$BIN" "$@"; else exec "$BIN" --no-sandbox "$@"; fi
`);
  fs.chmodSync(bin, 0o755);
  console.log('  • launcher', bin);
};
