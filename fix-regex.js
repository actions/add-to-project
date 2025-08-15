#!/usr/bin/env node

/**
 * Fix for misleading operator precedence in @octokit/request regex
 * Changes /^text\/|charset=utf-8$/ to /^text\/|charset=utf-8/
 */

const fs = require('fs')

const filesToFix = [
  'node_modules/@actions/github/node_modules/@octokit/request/dist-src/fetch-wrapper.js',
  'node_modules/@actions/github/node_modules/@octokit/request/dist-node/index.js',
  'node_modules/@actions/github/node_modules/@octokit/request/dist-web/index.js',
]

process.stdout.write('🔧 Applying regex fix for @octokit/request...\n')

let filesFixed = 0

for (const filePath of filesToFix) {
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8')
      const originalContent = content

      // Fix the problematic regex pattern - replace the end anchor version with the fixed version
      content = content.replace(/charset=utf-8\$\//g, 'charset=utf-8/')

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8')
        process.stdout.write(`✅ Fixed: ${filePath}\n`)
        filesFixed++
      } else {
        process.stdout.write(`ℹ️  No changes needed: ${filePath}\n`)
      }
    } catch (error) {
      process.stderr.write(`❌ Error fixing ${filePath}: ${error.message}\n`)
    }
  } else {
    process.stdout.write(`⚠️  File not found: ${filePath}\n`)
  }
}

process.stdout.write(`\n🎉 Fix complete! ${filesFixed} files updated.\n`)
if (filesFixed > 0) {
  process.stdout.write('Run "npm run build:package" to rebuild with the fix.\n')
}
