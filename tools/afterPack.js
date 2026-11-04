// Pone el icono al .exe (electron-builder no puede en Windows sin privilegios de symlink)
const { execFileSync } = require('child_process');
const path = require('path');
exports.default = async ctx => {
  const exe = path.join(ctx.appOutDir, ctx.packager.appInfo.productFilename + '.exe');
  execFileSync(path.join(__dirname, 'rcedit-x64.exe'), [exe, '--set-icon', path.join(__dirname, '..', 'icon.ico')]);
};
