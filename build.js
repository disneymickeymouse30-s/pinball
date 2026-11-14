// 1ファイル版（dist/pug-pinball-world.html）を作る：node build.js
const fs = require('fs'), path = require('path'), R = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
let html = R('index.html');
html = html.replace(/<!--PWA-->[\s\S]*?<!--\/PWA-->\n/, '');
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + R('css/style.css') + '</style>');
html = html.replace(/<script src="(js\/[a-z]+\.js)"><\/script>\n/g, (m, f) => '<script>\n' + R(f).replace(/<\/script/g, '<\\/script') + '\n</script>\n');
html = html.replace('<script>', '<script>window.PP_NO_SW=true;</script>\n<script>');
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/pug-pinball-world.html'), html);
console.log('dist/pug-pinball-world.html', (html.length / 1024).toFixed(0) + 'KB');
