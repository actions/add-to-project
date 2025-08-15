#!/usr/bin/env node

/**
 * Fix for misleading operator precedence in @octokit/request regex
 * Changes /^text\/|charset=utf-8$/ to /^(text\/|charset=utf-8)$/
 */

const fs = require('fs')

const filesToFix = [
    'node_modules/@actions/github/node_modules/@octokit/request/dist-src/fetch-wrapper.js',
    'node_modules/@actions/github/node_modules/@octokit/request/dist-node/index.js',
    'node_modules/@actions/github/node_modules/@octokit/request/dist-web/index.js',
]

/**
 * Apply regex fix to content
 * @param {string} content - The file content to fix
 * @returns {string} - The fixed content
 */
function applyRegexFix(content) {
    let fixedContent = content
    
    // Fix the problematic regex pattern - add proper grouping to fix operator precedence
    fixedContent = fixedContent.replace(/\/\^text\\?\/\|charset=utf-8\$?\//g, '/^(text\\/|charset=utf-8)$/')
    fixedContent = fixedContent.replace(/\/\^text\/\|charset=utf-8\$?\//g, '/^(text/|charset=utf-8)$/')
    
    return fixedContent
}

/**
 * Fix a single file
 * @param {string} filePath - Path to the file to fix
 * @returns {{fixed: boolean, error: string|null}} - Result of the fix operation
 */
function fixFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8')
        const originalContent = content
        const fixedContent = applyRegexFix(content)

        if (fixedContent !== originalContent) {
            fs.writeFileSync(filePath, fixedContent, 'utf8')
            return { fixed: true, error: null }
        } else {
            return { fixed: false, error: null }
        }
    } catch (error) {
        return { fixed: false, error: error.message }
    }
}

/**
 * Main function to fix all files
 * @param {string[]} files - Array of file paths to fix
 * @returns {{filesFixed: number, results: Array}} - Summary of fix operations
 */
function fixAllFiles(files = filesToFix) {
    const results = []
    let filesFixed = 0

    for (const filePath of files) {
        const result = fixFile(filePath)
        results.push({ filePath, ...result })
        
        if (result.fixed) {
            filesFixed++
        }
    }

    return { filesFixed, results }
}

// Main execution when run as script
if (require.main === module) {
    process.stdout.write('🔧 Applying regex fix for @octokit/request...\n')

    const { filesFixed, results } = fixAllFiles()

    for (const result of results) {
        if (result.error) {
            if (result.error.includes('ENOENT') || result.error.includes('no such file')) {
                process.stdout.write(`⚠️  File not found: ${result.filePath}\n`)
            } else {
                process.stderr.write(`❌ Error fixing ${result.filePath}: ${result.error}\n`)
            }
        } else if (result.fixed) {
            process.stdout.write(`✅ Fixed: ${result.filePath}\n`)
        } else {
            process.stdout.write(`ℹ️  No changes needed: ${result.filePath}\n`)
        }
    }

    process.stdout.write(`\n🎉 Fix complete! ${filesFixed} files updated.\n`)
    if (filesFixed > 0) {
        process.stdout.write('Run "npm run build:package" to rebuild with the fix.\n')
    }
}

// Export functions for testing
module.exports = {
    applyRegexFix,
    fixFile,
    fixAllFiles
}
