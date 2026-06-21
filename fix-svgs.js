const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.html')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./frontend/src');
files.push('./frontend/index.html');

let modified = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const newContent = content.replace(/<svg(?![\s\w="-]*aria-hidden)/g, '<svg aria-hidden="true"');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    modified++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Finished updating ${modified} files.`);
