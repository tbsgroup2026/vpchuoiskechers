const fs = require('fs');
const file = 'web/node_modules/next/dist/export/index.js';
let c = fs.readFileSync(file, 'utf8');
const regex = /await\s+_fs\.promises\.rm\(outDir,\s*\{\s*recursive:\s*true,\s*force:\s*true\s*\}\);/;
const replacement = `try {
      await _fs.promises.rm(outDir, {
          recursive: true,
          force: true,
          maxRetries: 3
      });
    } catch (e) {
      if (e.code !== 'EBUSY' && e.code !== 'EPERM') throw e;
    }`;

if (regex.test(c)) {
  c = c.replace(regex, replacement);
  fs.writeFileSync(file, c);
  console.log('Successfully patched Next export rm in node_modules!');
} else {
  console.log('Already patched or not matched.');
}
