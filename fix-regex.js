#!/usr/bin/env node

/**
 * Fix for misleading operator precedence in @octokit/request regex
 * Changes /^text\/|charset=utf-8$/ to /^text\/|charset=utf-8/
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'node_modules/@actions/github/node_modules/@octokit/request/dist-src/fetch-wrapper.js',
  'node_modules/@actions/github/node_modules/@octokit/request/dist-node/index.js',
  'node_modules/@actions/github/node_modules/@octokit/request/dist-web/index.js'
];

console.log('🔧 Applying regex fix for @octokit/request...');

let filesFixed = 0;

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Fix the problematic regex pattern - replace the end anchor version with the fixed version
      content = content.replace(/charset=utf-8\$\//g, 'charset=utf-8/');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
        filesFixed++;
      } else {
        console.log(`ℹ️  No changes needed: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log(`\n🎉 Fix complete! ${filesFixed} files updated.`);
if (filesFixed > 0) {
  console.log('Run "npm run build:package" to rebuild with the fix.');
}
