const fs = require('fs');
const file = 'web/node_modules/next/dist/lib/recursive-copy.js';
let c = fs.readFileSync(file, 'utf8');
c = c.replace('overwrite ? undefined : COPYFILE_EXCL', 'undefined');
fs.writeFileSync(file, c);
console.log('Successfully patched recursive-copy.js to allow file overwriting!');
