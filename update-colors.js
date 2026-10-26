const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src');

const colorMap = {
  'var(--primary-orange)': '#FF9900',
  'var(--secondary-dark-slate)': '#3D4D5C',
  'var(--background-color)': '#F8F8F8',
};

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.css') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const [oldColor, newColor] of Object.entries(colorMap)) {
        // Escape special characters in the key (like parentheses) for regex
        const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, newColor);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcPath);
console.log('Color replacement complete.');
