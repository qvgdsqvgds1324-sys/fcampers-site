// Add content-hash version query to app.css / app.js links in all HTML pages.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const hashOf = (p) => createHash('sha1').update(readFileSync(p)).digest('hex').slice(0, 8);

const cssV = hashOf(join(root, 'assets/build/app.css'));
const jsV = hashOf(join(root, 'assets/build/app.js'));

const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (name.endsWith('.html')) {
      let t = readFileSync(p, 'utf8');
      const before = t;
      t = t.replace(/(app\.css)(?:\?v=[^"']*)?/g, `app.css?v=${cssV}`);
      t = t.replace(/(app\.js)(?:\?v=[^"']*)?/g, `app.js?v=${jsV}`);
      if (t !== before) {
        writeFileSync(p, t);
        console.log('stamped', relative(root, p));
      }
    }
  }
};

walk(root);
console.log('versions:', cssV, jsV);
