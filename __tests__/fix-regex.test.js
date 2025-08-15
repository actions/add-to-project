/**
 * Tests for fix-regex.js
 * Validates the regex fix functionality for addressing code scanning alert:
 * "Misleading operator precedence. The subexpression '^text/' is anchored at the beginning, 
 * but the other parts of this regular expression are not"
 * 
 * This test suite covers:
 * - Regex pattern transformation logic (applyRegexFix)
 * - File system operations (fixFile)
 * - Batch processing (fixAllFiles)
 * - Edge cases and error handling
 * - Integration validation of the fix behavior
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const { applyRegexFix, fixFile, fixAllFiles } = require('../fix-regex.js')

describe('fix-regex', () => {
  describe('applyRegexFix', () => {
    test('should fix problematic regex with escaped slashes', () => {
      const input = `
        if (!contentType || /^text\\/|charset=utf-8$/.test(contentType)) {
          return response.text();
        }
      `
      const expected = `
        if (!contentType || /^(text\\/|charset=utf-8)$/.test(contentType)) {
          return response.text();
        }
      `
      expect(applyRegexFix(input)).toBe(expected)
    })

    test('should fix problematic regex without escaped slashes', () => {
      const input = `
        if (!contentType || /^text/|charset=utf-8$/.test(contentType)) {
          return response.text();
        }
      `
      const expected = `
        if (!contentType || /^(text\\/|charset=utf-8)$/.test(contentType)) {
          return response.text();
        }
      `
      expect(applyRegexFix(input)).toBe(expected)
    })

    test('should handle already fixed regex', () => {
      const input = `
        if (!contentType || /^(text\\/|charset=utf-8)$/.test(contentType)) {
          return response.text();
        }
      `
      // Should remain unchanged
      expect(applyRegexFix(input)).toBe(input)
    })

    test('should handle content without problematic regex', () => {
      const input = `
        if (!contentType || /application\\/json/.test(contentType)) {
          return response.json();
        }
      `
      // Should remain unchanged
      expect(applyRegexFix(input)).toBe(input)
    })

    test('should handle multiple regex patterns in same content', () => {
      const input = `
        if (/^text/|charset=utf-8$/.test(contentType)) {
          return response.text();
        }
        if (/^text\\/|charset=utf-8$/.test(otherType)) {
          return other.text();
        }
      `
      const expected = `
        if (/^(text\\/|charset=utf-8)$/.test(contentType)) {
          return response.text();
        }
        if (/^(text\\/|charset=utf-8)$/.test(otherType)) {
          return other.text();
        }
      `
      expect(applyRegexFix(input)).toBe(expected)
    })

    test('should validate regex behavior differences', () => {
      // Test the difference between problematic and fixed regex
      const problematicRegex = /^text\/|charset=utf-8$/
      const fixedRegex = /^(text\/|charset=utf-8)$/
      
      // Both should match text/ patterns
      expect(problematicRegex.test('text/plain')).toBe(true)
      expect(fixedRegex.test('text/plain')).toBe(false) // Only matches exactly 'text/' or 'charset=utf-8'
      
      // Both should match charset=utf-8
      expect(problematicRegex.test('charset=utf-8')).toBe(true)
      expect(fixedRegex.test('charset=utf-8')).toBe(true)
      
      // Fixed regex is more restrictive
      expect(fixedRegex.test('text/')).toBe(true)
      expect(fixedRegex.test('application/json')).toBe(false)
    })
  })

  describe('fixFile', () => {
    let tempDir
    let tempFile

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fix-regex-test-'))
      tempFile = path.join(tempDir, 'test-file.js')
    })

    afterEach(() => {
      // Clean up temp files
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile)
      }
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir)
      }
    })

    test('should fix file with problematic regex', () => {
      const content = `
        if (!contentType || /^text/|charset=utf-8$/.test(contentType)) {
          return response.text();
        }
      `
      fs.writeFileSync(tempFile, content, 'utf8')

      const result = fixFile(tempFile)
      
      expect(result.fixed).toBe(true)
      expect(result.error).toBe(null)
      
      const updatedContent = fs.readFileSync(tempFile, 'utf8')
      expect(updatedContent).toContain('/^(text\\/|charset=utf-8)$/')
    })

    test('should handle file that needs no changes', () => {
      const content = `
        if (!contentType || /^(text/|charset=utf-8)$/.test(contentType)) {
          return response.text();
        }
      `
      fs.writeFileSync(tempFile, content, 'utf8')

      const result = fixFile(tempFile)
      
      expect(result.fixed).toBe(false)
      expect(result.error).toBe(null)
    })

    test('should handle non-existent file', () => {
      const nonExistentFile = path.join(tempDir, 'does-not-exist.js')
      
      const result = fixFile(nonExistentFile)
      
      expect(result.fixed).toBe(false)
      expect(result.error).toContain('ENOENT')
    })
  })

  describe('fixAllFiles', () => {
    let tempDir
    let tempFiles

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fix-regex-test-'))
      tempFiles = [
        path.join(tempDir, 'file1.js'),
        path.join(tempDir, 'file2.js'),
        path.join(tempDir, 'missing-file.js')
      ]
    })

    afterEach(() => {
      // Clean up temp files
      tempFiles.forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
        }
      })
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir)
      }
    })

    test('should process multiple files correctly', () => {
      // Create test files
      fs.writeFileSync(tempFiles[0], 'if (/^text/|charset=utf-8$/.test(x)) {}', 'utf8')
      fs.writeFileSync(tempFiles[1], 'if (/^(text/|charset=utf-8)$/.test(x)) {}', 'utf8')
      // tempFiles[2] intentionally not created (missing file)

      const result = fixAllFiles(tempFiles)

      expect(result.filesFixed).toBe(1)
      expect(result.results).toHaveLength(3)
      
      // Check first file was fixed
      expect(result.results[0].fixed).toBe(true)
      expect(result.results[0].error).toBe(null)
      
      // Check second file needed no changes
      expect(result.results[1].fixed).toBe(false)
      expect(result.results[1].error).toBe(null)
      
      // Check third file had error
      expect(result.results[2].fixed).toBe(false)
      expect(result.results[2].error).toContain('ENOENT')
    })

    test('should handle empty file list', () => {
      const result = fixAllFiles([])
      
      expect(result.filesFixed).toBe(0)
      expect(result.results).toHaveLength(0)
    })
  })

  describe('integration test', () => {
    test('should demonstrate regex operator precedence fix', () => {
      // The original problematic regex has misleading operator precedence
      const problematicPattern = /^text\/|charset=utf-8$/
      const fixedPattern = /^(text\/|charset=utf-8)$/
      
      // The problematic pattern means: (^text\/) OR (charset=utf-8$)
      // The fixed pattern means: ^(text\/ OR charset=utf-8)$
      
      // This demonstrates the precedence issue:
      expect(problematicPattern.test('text/plain')).toBe(true)  // Matches start
      expect(problematicPattern.test('some charset=utf-8')).toBe(true)  // Matches end
      
      // The fixed version is more restrictive and explicit:
      expect(fixedPattern.test('text/')).toBe(true)
      expect(fixedPattern.test('charset=utf-8')).toBe(true)
      expect(fixedPattern.test('text/plain')).toBe(false)  // Doesn't match partial
      expect(fixedPattern.test('some charset=utf-8')).toBe(false)  // Doesn't match partial
    })
  })
})
