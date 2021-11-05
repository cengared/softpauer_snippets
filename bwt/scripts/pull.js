const path = require('path')
const fs = require('fs-extra')
const flatten = require('flat')
const xml2js = require('xml2js')
const { execSync } = require('child_process')
const log = require('../utils/log')
const utils = require('../utils/utils')
const manifest = require('./manifest.json')
const depPath = '../'
const workingDirs = {
  src: 'translations/src',
  old: 'translations/old',
  po: 'translations/po',
}
const appData = manifest['app']
const languages = manifest['languages']
const baseUrl = utils.checkArgs('stage')
  ? manifest['cmsServerStage']
  : manifest['cmsServerProd']
const cmsUrl = baseUrl + '/translations/uploads.php'
const genVariant = utils.checkArgs('variant')

async function main() {
  const files = await processTranslations()
  if (!genVariant) {
    if (files) {
      for (let i in files) {
        utils.uploadFile(cmsUrl, files[i].key, files[i].path)
      }
    }
  }
}

function processTranslations() {
  const files = []
  try {
    if (utils.checkArgs('clean')) {
      log.info('Cleaning up working directories in translations')
      for (dir in workingDirs) {
        fs.removeSync(workingDirs[dir])
      }
    }
    compileExistingTranslations()

    for (key in appData) {
      log.msg(`Pulling translation files for: ${key}`)

      const targetPath = `${workingDirs.src}/${key}`
      let sourcePath = ''
      if (appData[key].dependency) {
        sourcePath += depPath + key + '/'
      }
      const templateFile = `${workingDirs.po}/${key}.pot`
      const templateStream = createPoFileStream(templateFile)
      let template = {}

      appData[key].sources.forEach((source) => {
        if (source.extract && !utils.checkArgs('no-extract')) {
          log.debug(
            `Extracting strings from ${key} ${
              source.subfolder ? `(${source.subfolder})` : ''
            }`
          )
          let cmd = ''
          if (sourcePath) {
            cmd += `cd ${sourcePath}; `
          }
          cmd += source.extract
          log.warn(`Executing commands: ${cmd}`)
          execSync(cmd, { stdio: 'inherit' })
        }

        const sourceDir = sourcePath + source.src
        const targetDir = source.subfolder
          ? `${targetPath}/${source.subfolder}/`
          : `${targetPath}/`
        const prefix = source.subfolder ? `${key}_${source.subfolder}` : key
        let files = utils.walkExt(sourceDir, source.type)

        files.forEach((file) => {
          const filename = file.replace(`${sourceDir}/`, '')
          const targetFile = targetDir + filename
          if (source.type === 'json') {
            log.info(`Processing ${file} => ${targetFile}`)
            file = jsonPrefix(fs.readFileSync(file, 'utf-8'), prefix)
          } else if (source.type === 'resx') {
            log.info(`Copying ${file} => ${targetFile}`)
            file = fs.readFileSync(file, 'utf-8')
          }
          utils.writeFile(targetFile, file)
        })

        let sourceTemplateFile = source.template ? source.template : 'en.json'
        if (genVariant) sourceTemplateFile = `${genVariant}.json`
        let templateSource =
          source.type === 'resx' || genVariant
            ? `${workingDirs.old}/${key}/${sourceTemplateFile}`
            : `${targetDir}/${sourceTemplateFile}`
        buildTemplate(fs.readFileSync(templateSource, 'utf-8'), template, prefix)
      })
      template = utils.sortObject(template)
      writeGettext(templateStream, template)
      templateStream.end()

      try {
        languages.forEach((lang) => {
          const poFile = `${workingDirs.po}/${key}/${lang}.po`
          log.debug(`Generating po file for language: ${lang}`)
          const poStream = createPoFileStream(poFile, lang)
          const sourceFile = `${workingDirs.old}/${key}/${lang}.json`
          if (fs.existsSync(sourceFile)) {
            writeGettext(poStream, template, lang, fs.readFileSync(sourceFile, 'utf-8'))
            files.push({
              key: key,
              path: poFile,
            })
          } else {
            writeGettext(poStream, template)
          }
        })
      } catch (error) {
        log.error('Error generating po files...', error)
      }
    }
    log.msg('Translation files generated')
  } catch (error) {
    log.error('Error with pulling translations...', error)
  }
  return files
}

function jsonPrefix(file, prefix) {
  try {
    file = utils.removeBOM(file)
    let json = JSON.parse(file)
    let edit = []

    if (json[0]) {
      // handles files with strings stored in arrays each with an id field
      json.forEach((item) => {
        if (item.id) {
          item.id = `${prefix}_${item.id}`
        }
        edit.push(item)
      })
    } else {
      edit = {}
      for (line in json) {
        edit[`${prefix}_${line}`] = json[line]
      }
    }
    return JSON.stringify(edit, null, 2)
  } catch (error) {
    log.error('Error editing file...', error)
  }
}

function buildTemplate(src, template, prefix) {
  try {
    let json = JSON.parse(utils.removeBOM(src))
    // checks if json has strings stored in arrays or not as each file structure is handled differently
    if (json[0]) {
      json.forEach((item) => {
        if (!template[item.defaultMessage]) {
          template[item.defaultMessage] = []
        }
        let blob = {
          id: item.id,
          context: item.description ? item.description : '',
        }
        if (!template[item.defaultMessage].some((e) => e.id === item.id)) {
          template[item.defaultMessage].push(blob)
        }
      })
    } else {
      json = flatten(json)
      for (line in json) {
        let blob = {
          id: line,
          context: line.includes('|') ? line.split('|')[1] : '',
        }
        let id = json[line]
        if (id == '') {
          id = line.replace(`${prefix}_`, '').split('|')[0]
        }
        if (!template[id]) {
          template[id] = []
        }
        if (!template[id].some((e) => e.id === line)) {
          template[id].push(blob)
        }
      }
    }
  } catch (error) {
    log.error('Error building translation template...', error)
  }
}

function getTranslation(id, file) {
  if (!file) {
    return ''
  }
  try {
    file = utils.removeBOM(file)
    let json = JSON.parse(file)
    return json[id] ? json[id] : ''
  } catch (error) {
    log.error('Error getting translations...', error)
  }
}

function createPoFileStream(file, lang) {
  try {
    fs.ensureDirSync(path.dirname(file))
    const stream = fs.createWriteStream(file)
    stream.write(`msgid ""\n`)
    stream.write(`msgstr ""\n`)
    stream.write(`"POT-Creation-Date: ${new Date().toISOString()}\\n"\n`)
    stream.write(`"Content-Type: text/plain; charset=UTF-8\\n"\n`)
    stream.write(`"Content-Transfer-Encoding: 8bit\\n"\n`)
    stream.write(`"MIME-Version: 1.0\\n"\n`)
    stream.write(`"X-Generator: translate:pull\\n"\n`)
    if (lang) {
      stream.write(`"PO-Revision-Date: ${new Date().toISOString()}\\n"\n`)
      stream.write(`"Language: ${lang}\\n"\n`)
      stream.write(`"Project-Id-Version: \\n"\n`)
      stream.write(`"Last-Translator: \\n"\n`)
      stream.write(`"Language-Team: \\n"\n`)
    }
    stream.write('\n')
    return stream
  } catch (error) {
    log.error('Error creating write file stream...', error)
  }
}

function writeGettext(stream, template, lang = false, source = false) {
  try {
    for (msg in template) {
      let msgstr = getTranslation(template[msg][0].id, source)
      if (lang && lang == 'en' && msgstr.length == 0) msgstr = msg
      stream.write(`#. default message is:\n`)
      stream.write(`#. ${msg.replace(new RegExp('\n', 'g'), '')}\n`)
      let contexts = []
      template[msg].forEach((string) => {
        stream.write(`#. [${string.id}]\n`)
        if (string.context && !contexts.includes(string.context)) {
          contexts.push(string.context)
        }
      })
      if (contexts.length > 1) {
        stream.write(`#. Contexts: ${contexts.join(', ')}\n`)
        stream.write(`msgctxt "multiple contexts"\n`)
      } else if (contexts.length === 1) {
        stream.write(`msgctxt "${contexts[0]}"\n`)
      }
      stream.write('msgid ')
      writeMessage(stream, msg)
      stream.write('msgstr ')
      writeMessage(stream, msgstr)
      stream.write('\n')
    }
  } catch (error) {
    log.error('Error writing gettext to file...', error)
  }
}

function writeMessage(stream, msg) {
  if (msg.includes('\n')) {
    stream.write(`""`)
    msg = msg.split('\n')
    msg.forEach((m, i) => {
      stream.write(`\n"${m}`)
      if (i == msg.length - 1) {
        stream.write('"')
      } else {
        stream.write('\\n"')
      }
    })
    stream.write('\n')
  } else if (msg.includes('|')) {
    stream.write(`"${msg.split('|')[0]}"\n`)
  } else {
    stream.write(`"${msg}"\n`)
  }
}

function compileExistingTranslations() {
  try {
    fs.removeSync(workingDirs.old)
    for (key in appData) {
      log.msg(`Compiling existing translations for ${key}`)
      const targetPath = `${workingDirs.old}/${key}`
      let sourcePath = ''
      if (appData[key].dependency) {
        sourcePath += `${depPath + key}/`
      }

      languages.forEach((lang) => {
        log.debug(`Pulling ${lang} translations...`)
        const targetFile = `${targetPath}/${lang}.json`
        let translation = {}
        appData[key].sources.forEach((source) => {
          const prefix = source.subfolder ? `${key}_${source.subfolder}` : key
          const sourceDir =
            (appData[key].dependency ? depPath + key + '/' : '') + source.src

          if (source.type === 'json') {
            let filepath = `${sourcePath + source.src}/${lang}.json`
            if (source.translationSrc === 'out') {
              const sourceOut = Array.isArray(source.out) ? source.out[0] : source.out
              filepath = `${sourcePath + sourceOut}/${lang}.json`
            }
            log.info(`Processing => ${filepath}`)
            if (fs.existsSync(filepath)) {
              let file = utils.removeBOM(fs.readFileSync(filepath, 'utf-8'))
              let json = JSON.parse(file)
              if (source.outFormat === 'nested') {
                json = flatten(json)
              }
              for (line in json) {
                translation[`${prefix}_${line}`] = json[line]
              }
            }
          } else if (source.type === 'resx') {
            let files = utils.walkExt(sourceDir, source.type)
            const json = resx2json(files, prefix, lang, sourceDir)
            for (line in json) {
              translation[line] = json[line]
            }
          }
        })
        utils.writeFile(targetFile, JSON.stringify(translation, null, 2))
      })
    }
  } catch (error) {
    log.error(`Error getting existing translations...${error}`)
  }
}

function resx2json(files, prefix, lang, sourceDir) {
  let xmlData = {}
  files.forEach((filename) => {
    if (filename.includes(`.${lang}.resx`)) {
      log.info(`Processing => ${filename}`)
      const id = filename.replace(`${sourceDir}/`, '').split('.')[0]
      const file = fs.readFileSync(filename, 'utf-8')
      xml2js.parseString(file, (error, result) => {
        xmlData[id] = []
        for (d in result.root.data) {
          xmlData[id].push({
            id: result.root.data[d].$.name,
            string: result.root.data[d].value[0],
          })
        }
        if (error) {
          log.error(`Error parsing ${filename}: ${error}`)
        }
      })
    }
  })
  let json = {}
  for (id in xmlData) {
    xmlData[id].forEach((xml) => {
      json[`${prefix}_${id}.${xml.id}`] = xml.string
    })
  }
  return json
}

main()
