const fs = require('fs-extra')
const xml2js = require('xml2js')
const unflatten = require('flat').unflatten
const log = require('../utils/log')
const utils = require('../utils/utils')
const manifest = require('./manifest.json')
const depPath = '../'
const workingDirs = {
  src: 'translations/src',
  old: 'translations/old',
  out: 'translations/out',
  po: 'translations/po',
}
const appData = manifest['app']
const languages = manifest['languages']
const baseUrl = utils.checkArgs('stage')
  ? manifest['cmsServerStage']
  : manifest['cmsServerProd']
const cmsUrl = baseUrl + '/translations/uploads.php'

async function main() {
  const files = await pushTranslations()
  if (files && utils.checkArgs('upload')) {
    for (let i in files) {
      utils.uploadFile(cmsUrl, files[i].key, files[i].path)
    }
  }
}

function pushTranslations() {
  const files = []
  try {
    log.info('Cleaning up output directory...')
    fs.removeSync(workingDirs.out)
    log.msg('Starting push of translations to app and dependencies...')

    languages.forEach((lang) => {
      for (key in appData) {
        log.debug(`Generating translation files for: ${key} in '${lang}'`)
        const poFile = `${workingDirs.po}/${key}/${lang}.po`
        const outPath = `${workingDirs.out}/${key}/`
        let targetPath = ''
        if (appData[key].dependency) {
          targetPath += depPath + key + '/'
        }
        if (!fs.existsSync(poFile)) {
          log.error(`No po file exists for ${lang}`)
          return
        }
        log.msg(`Processing file: ${poFile}`)
        const poData = po2json(fs.readFileSync(poFile, 'utf-8'))
        appData[key].sources.forEach((source) => {
          let translation = ''
          const prefix = source.subfolder ? `${key}_${source.subfolder}` : key

          if (source.type === 'json') {
            const oldFilename = `${workingDirs.old}/${key}/${lang}.json`
            let srcFile = false
            if (fs.existsSync(oldFilename)) {
              srcFile = fs.readFileSync(oldFilename, 'utf-8')
            }
            translation = jsonTranslate(srcFile, poData, prefix)
            if (source.outFormat === 'nested') {
              translation = unflatten(translation, { object: true })
            }
            if (source.platformLocale && lang.includes('-')) {
              translation.locale = {
                ios: [lang],
                android: [lang.replace('-', '-r')],
              }
            }
            let subfolder = source.subfolder ? source.subfolder + '/' : ''
            const outFile = `${outPath + subfolder + lang}.json`
            if (source.sort) {
              translation = utils.sortObject(translation)
            }
            translation = JSON.stringify(translation, null, 2)
            utils.writeFile(outFile, translation)
            if (Array.isArray(source.out)) {
              source.out.forEach((outTarget) => {
                const targetFile = `${targetPath + outTarget}/${lang}.json`
                utils.writeFile(targetFile, translation)
                log.info(`Pushing translations: ${outFile} => ${targetFile}`)
              })
            } else {
              const targetFile = `${targetPath + source.out}/${lang}.json`
              utils.writeFile(targetFile, translation)
              log.info(`Pushing translations: ${outFile} => ${targetFile}`)
            }
          } else if (source.type === 'resx') {
            const resxSource = `${workingDirs.src}/${key}`
            let resxFiles = utils.walkExt(resxSource, source.type)
            resxFiles.forEach((filename) => {
              if (filename.includes(`.${lang}.resx`)) {
                let id = filename.replace(`${resxSource}/`, '').split('.')[0]
                translation = resxTranslate(filename, poData, `${key}_${id}`)
                const outFile = filename.replace(workingDirs.src, workingDirs.out)
                utils.writeFile(outFile, translation)
                if (Array.isArray(source.out)) {
                  source.out.forEach((outTarget) => {
                    const tFile = `${targetPath + outTarget}/${id}.${lang}.resx`
                    utils.writeFile(tFile, translation)
                    log.info(`Pushing translations: ${outFile} => ${tFile}`)
                  })
                } else {
                  const tFile = `${targetPath + source.out}/${id}.${lang}.resx`
                  utils.writeFile(tFile, translation)
                  log.info(`Pushing translations: ${outFile} => ${tFile}`)
                }
              }
            })
          }
        })
        files.push({
          key: key,
          path: poFile,
        })
      }
    })
    log.warn('Latest translations pushed out successfully')
  } catch (error) {
    log.error('Error with pushing translations...', error)
  }
  return files
}

function jsonTranslate(src, po, prefix) {
  if (!src) return {}
  src = JSON.parse(utils.removeBOM(src))
  let edit = {}
  try {
    for (line in src) {
      if (line.startsWith(prefix)) {
        edit[line.replace(`${prefix}_`, '')] = po[line]
        delete po[line]
      }
    }
    for (line in po) {
      if (line.startsWith(prefix)) {
        edit[line.replace(`${prefix}_`, '')] = po[line]
        delete po[line]
      }
    }
    return edit
  } catch (error) {
    log.error('Error translating json file...', error)
  }
}

function resxTranslate(src, po, prefix) {
  try {
    const file = fs.readFileSync(src, 'utf-8')
    const builder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
    })
    let out = ''
    xml2js.parseString(file, (error, result) => {
      for (d in result.root.data) {
        let id = `${prefix}.${result.root.data[d].$.name}`
        result.root.data[d].value[0] = po[id]
      }
      if (error) {
        log.error(`Error parsing ${filename}: ${error}`)
      }
      out = builder.buildObject(result)
    })
    return out
  } catch (error) {
    log.error('Error translating resx file...', error)
  }
}

function po2json(file) {
  try {
    file = file.split(/\r\n|\r|\n/)
    let json = {}
    let ids = []
    let msgBlock = 0
    let msg = ''

    for (let i = 12; i < file.length; i++) {
      line = file[i]

      if (line.startsWith('#. [')) {
        ids.push(line.substring(4, line.length - 1))
      }
      if (line.startsWith('msgid')) {
        if (line === 'msgid ""') {
          msgBlock = 1
          continue
        } else {
          if (!ids.length) {
            ids.push(line.substring(7, line.length - 1))
          }
        }
      }
      if (line.startsWith('msgstr')) {
        msgBlock = 0
        if (msg && !ids.length) {
          ids.push(msg.replace(new RegExp('\\\\n', 'g'), '\n'))
        }
        msg = ''
        if (line === 'msgstr ""') {
          msgBlock = 2
          continue
        } else {
          ids.forEach((id) => {
            json[id] = line.substring(8, line.length - 1)
          })
          ids = []
        }
      }
      if (line === '') {
        if (msgBlock == 2) {
          ids.forEach((id) => {
            json[id] = msg.replace(new RegExp('\\\\n', 'g'), '\n')
          })
          ids = []
        }
        msg = ''
        msgBlock = 0
      }
      if (msgBlock != 0) {
        msg += line.substring(1, line.length - 1)
      }
    }
    return json
  } catch (error) {
    log.error('Error converting po file to json...', error)
  }
}

main()
