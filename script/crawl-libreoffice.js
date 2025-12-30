/**
 * Cross-platform script to download and process LibreOffice dictionaries.
 * Works on Windows, macOS, and Linux.
 *
 * Usage: node script/crawl-libreoffice.js
 */

import fs from 'node:fs/promises'
import {existsSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DICTIONARIES_DIR = path.join(__dirname, '..', 'dictionaries')

// LibreOffice dictionaries to add
const LIBREOFFICE_DICTIONARIES = [
  {
    code: 'af',
    folder: 'af_ZA',
    name: 'Afrikaans',
    license: 'LGPL-3.0',
    licenseFile: 'README_af_ZA.txt'
  },
  {
    code: 'an',
    folder: 'an_ES',
    name: 'Aragonese',
    license: 'GPL-3.0',
    licenseFile: 'LICENSES-en.txt'
  },
  {
    code: 'ar',
    folder: 'ar',
    name: 'Arabic',
    license: 'GPL-3.0',
    licenseFile: 'COPYING.txt'
  },
  {
    code: 'as',
    folder: 'as_IN',
    name: 'Assamese',
    license: 'GPL-2.0',
    licenseFile: 'COPYING'
  },
  {
    code: 'be',
    folder: 'be_BY',
    name: 'Belarusian',
    license: 'GPL-3.0',
    licenseFile: 'README_be_BY.txt',
    dicPath: 'be-official.dic',
    affPath: 'be-official.aff'
  },
  {
    code: 'bn',
    folder: 'bn_BD',
    name: 'Bengali',
    license: 'GPL-2.0',
    licenseFile: 'COPYING'
  },
  {
    code: 'bo',
    folder: 'bo',
    name: 'Tibetan',
    license: 'GPL-3.0',
    licenseFile: 'LICENSE-en.txt'
  },
  {
    code: 'bs',
    folder: 'bs_BA',
    name: 'Bosnian',
    license: 'GPL-3.0',
    licenseFile: 'registration/LICENSE'
  },
  {
    code: 'ckb',
    folder: 'ckb',
    name: 'Central Kurdish',
    license: 'GPL-3.0',
    licenseFile: 'LICENSES-en.txt',
    dicPath: 'dictionaries/ckb.dic',
    affPath: 'dictionaries/ckb.aff'
  },
  {
    code: 'gu',
    folder: 'gu_IN',
    name: 'Gujarati',
    license: 'GPL-3.0',
    licenseFile: 'COPYING'
  },
  {
    code: 'gug',
    folder: 'gug',
    name: 'Guarani',
    license: 'GPL-3.0',
    licenseFile: 'LICENSE.txt'
  },
  {
    code: 'hi',
    folder: 'hi_IN',
    name: 'Hindi',
    license: 'GPL-2.0',
    licenseFile: 'COPYING'
  },
  {
    code: 'id',
    folder: 'id',
    name: 'Indonesian',
    license: 'GPL-3.0',
    licenseFile: 'LICENSE-dict',
    dicPath: 'id_ID.dic',
    affPath: 'id_ID.aff'
  },
  {
    code: 'it',
    folder: 'it_IT',
    name: 'Italian',
    license: 'GPL-3.0',
    licenseFile: 'README_it_IT.txt'
  },
  {
    code: 'kn',
    folder: 'kn_IN',
    name: 'Kannada',
    license: 'GPL-3.0',
    licenseFile: 'COPYING'
  },
  {
    code: 'kmr-Latn',
    folder: 'kmr_Latn',
    name: 'Kurmanji',
    license: 'GPL-3.0',
    licenseFile: 'gpl-3.0.txt'
  },
  {
    code: 'lo',
    folder: 'lo_LA',
    name: 'Lao',
    license: 'GPL-3.0',
    licenseFile: 'README_lo_LA.txt'
  },
  {
    code: 'mr',
    folder: 'mr_IN',
    name: 'Marathi',
    license: 'LGPL-3.0',
    licenseFile: 'README_mr_IN.txt'
  },
  {
    code: 'or',
    folder: 'or_IN',
    name: 'Odia',
    license: 'GPL-2.0',
    licenseFile: 'COPYING'
  },
  {
    code: 'pa',
    folder: 'pa_IN',
    name: 'Punjabi',
    license: 'GPL-2.0',
    licenseFile: 'COPYING'
  },
  {
    code: 'sa',
    folder: 'sa_IN',
    name: 'Sanskrit',
    license: 'GPL-3.0',
    licenseFile: 'COPYING'
  },
  {
    code: 'si',
    folder: 'si_LK',
    name: 'Sinhala',
    license: 'GPL-3.0',
    licenseFile: 'COPYING'
  },
  {
    code: 'sq',
    folder: 'sq_AL',
    name: 'Albanian',
    license: 'GPL-3.0',
    licenseFile: 'README_sq_AL.txt'
  },
  {
    code: 'sw',
    folder: 'sw_TZ',
    name: 'Swahili',
    license: 'LGPL-3.0',
    licenseFile: 'README_sw_TZ.txt'
  },
  {
    code: 'ta',
    folder: 'ta_IN',
    name: 'Tamil',
    license: 'GPL-3.0',
    licenseFile: 'COPYING'
  },
  {
    code: 'te',
    folder: 'te_IN',
    name: 'Telugu',
    license: 'GPL-2.0',
    licenseFile: 'COPYING'
  },
  {
    code: 'th',
    folder: 'th_TH',
    name: 'Thai',
    license: 'LGPL-2.1',
    licenseFile: 'README_th_TH.txt'
  }
  // Note: zu (Zulu) removed - LibreOffice only has hyphenation, no spelling dictionary
]

const LIBREOFFICE_BASE_URL =
  'https://raw.githubusercontent.com/LibreOffice/dictionaries/master'

/**
 * Normalize file content (remove BOM, normalize line endings, ensure final newline)
 * @param {string} content
 * @returns {string}
 */
function normalizeContent(content) {
  return content
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
    .replace(/\n*$/, '\n') // Ensure single final newline
}

/**
 * Process a dictionary from LibreOffice
 * @param {typeof LIBREOFFICE_DICTIONARIES[number]} dict
 */
async function processDictionary(dict) {
  const destDir = path.join(DICTIONARIES_DIR, dict.code)

  // Skip if already exists
  if (existsSync(path.join(destDir, 'index.dic'))) {
    console.log(`  ✓ ${dict.code} (${dict.name}) - already exists`)
    return
  }

  console.log(`  Processing ${dict.code} (${dict.name})...`)

  await fs.mkdir(destDir, {recursive: true})

  // Determine dic/aff file paths - use custom paths if provided
  const folder = dict.folder
  const dicFile =
    dict.dicPath || `${folder.includes('_') ? folder : folder}.dic`
  const affFile =
    dict.affPath || `${folder.includes('_') ? folder : folder}.aff`

  // Download .dic file
  const dicUrl = `${LIBREOFFICE_BASE_URL}/${folder}/${dicFile}`
  const dicPath = path.join(destDir, 'index.dic')
  try {
    const response = await fetch(dicUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    let content = await response.text()
    content = normalizeContent(content)
    await fs.writeFile(dicPath, content, 'utf8')
    console.log(`    ✓ index.dic`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.log(`    ✗ Failed to download .dic: ${message}`)
    return
  }

  // Download .aff file
  const affUrl = `${LIBREOFFICE_BASE_URL}/${folder}/${affFile}`
  const affPath = path.join(destDir, 'index.aff')
  try {
    const response = await fetch(affUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    let content = await response.text()
    // Update SET pragma to UTF-8
    content = content.replace(/^SET .*/m, 'SET UTF-8')
    content = normalizeContent(content)
    await fs.writeFile(affPath, content, 'utf8')
    console.log(`    ✓ index.aff`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.log(`    ✗ Failed to download .aff: ${message}`)
    return
  }

  // Write .spdx file
  await fs.writeFile(path.join(destDir, '.spdx'), dict.license + '\n', 'utf8')
  console.log(`    ✓ .spdx`)

  // Write .source file
  await fs.writeFile(
    path.join(destDir, '.source'),
    'https://github.com/LibreOffice/dictionaries\n',
    'utf8'
  )
  console.log(`    ✓ .source`)

  // Download license file
  const licenseUrl = `${LIBREOFFICE_BASE_URL}/${folder}/${dict.licenseFile}`
  try {
    const response = await fetch(licenseUrl)
    if (response.ok) {
      let content = await response.text()
      content = normalizeContent(content)
      await fs.writeFile(path.join(destDir, 'license'), content, 'utf8')
      console.log(`    ✓ license`)
    }
  } catch {
    console.log(`    - No license file found`)
  }

  console.log(`  ✓ ${dict.code} (${dict.name}) - done`)
}

async function main() {
  console.log(
    '╔══════════════════════════════════════════════════════════════╗'
  )
  console.log(
    '║  LibreOffice Dictionaries Downloader (Cross-platform)        ║'
  )
  console.log(
    '╚══════════════════════════════════════════════════════════════╝'
  )
  console.log('')
  console.log(
    `Adding ${LIBREOFFICE_DICTIONARIES.length} new dictionaries from LibreOffice...`
  )
  console.log('')

  // Ensure directories exist
  await fs.mkdir(DICTIONARIES_DIR, {recursive: true})

  for (const dict of LIBREOFFICE_DICTIONARIES) {
    try {
      await processDictionary(dict)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.log(`  ✗ ${dict.code} failed: ${message}`)
    }
  }

  console.log('')
  console.log('Done! Now run: node --conditions development script/generate.js')
  console.log('')
}

main().catch(console.error)
