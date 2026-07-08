const fs = require('fs');
const path = require('path');

function fixImports(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fixImports(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const newContent = content.replace(
        /import\s+\{([^}]+)\}\s+from\s+['"](\.\.\/|\.\.\/\.\.\/)models['"]/g,
        "import type { $1 } from '$2models'"
      );
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Fixed ${fullPath}`);
      }
    }
  }
}

fixImports(path.join(__dirname, 'src'));
