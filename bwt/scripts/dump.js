const axios = require('axios')
const fs = require('fs-extra')
const prettier = require('prettier')
const log = require('../utils/log')
const config = require('./config.json')
const utils = require('../utils/utils')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')

const isStage = utils.checkArgs('stage')
const getImages = utils.checkArgs('images')
const baseUrl = isStage ? config['stage'] : config['prod']
// const env = isStage ? 'stage' : 'prod'

const endpoint = baseUrl + config['route'] + 'products'
const headers = {
  Authorization: `Basic ${Buffer.from(config['auth']).toString('base64')}`,
}

const getProducts = async () => {
  try {
    const response = await axios.get(endpoint, { headers: headers })
    return response.data
  } catch (err) {
    log.error('getProducts error:', err)
  }
}

const processImage = async (path, folder) => {
  if (getImages) {
    const filename = path.split('/').pop()
    const tempDest = `${config['workingDirs']['temp']}/${filename}`
    const finalDest = `${config['workingDirs'][folder]}/${filename}`
    await utils.downloadFile(path, tempDest)
    log.info('Compressing image', finalDest)
    await imagemin([tempDest], {
      destination: config['workingDirs'][folder],
      plugins: [
        imageminPngquant({
          quality: [0.5, 0.7],
          strip: true,
        }),
      ],
    })
  }
}

const main = async () => {
  try {
    Object.keys(config['workingDirs']).forEach((dir) => {
      if (getImages) {
        fs.removeSync(config['workingDirs'][dir])
      }
      fs.ensureDirSync(config['workingDirs'][dir])
    })

    log.msg(`Pulling product data & images from CMS...`)
    log.info(`Using endpoint '${endpoint}'`)

    const products = await getProducts()
    const messages = {}
    const itemNumberToInternalId = {}
    const cmsProducts = {}
    const msgFields = ['itemName', 'actionHeader', 'actionBody', 'circleText']
    const states = ['urgent', 'warn', 'ok', 'pure']
    const stateFields = ['overviewText', 'statusLine', 'statusText']
    const jsonFields = ['shop', 'detailLink', 'videos']
    const jsonErrors = []
    const imgImports = {}

    products.forEach((product) => {
      if (product.image && product.image.length > 0) {
        const imageFile = product.image.split('/').pop()
        processImage(product.image, 'full')
        if (product.category === 'ble-pool-robot') processImage(product.image, 'robot')
        const imagePath = `assets/products/full/${imageFile}`
        const normalisedImageName = `srcFull_${imageFile.replace(/[^\w]/g, '_')}`
        imgImports[normalisedImageName] = imagePath
        product.image = `AS_REF(${normalisedImageName})`
        // const remoteImg = `${config['resources']}/${env}/products/full/${imageFile}`
        // product.remoteImage = remoteImg
      }

      if (product.thumbnail && product.thumbnail.length > 0) {
        const thumbFile = product.thumbnail.split('/').pop()
        processImage(product.thumbnail, 'thumbs')
        const thumbPath = `assets/products/thumbs/${thumbFile}`
        const normalisedThumbName = `srcThumb_${thumbFile.replace(/[^\w]/g, '_')}`
        imgImports[normalisedThumbName] = thumbPath
        product.thumbnail = `AS_REF(${normalisedThumbName})`
        // const remoteThumb = `${config['resources']}/${env}/products/full/${imageFile}`
        // product.remoteThumbnail = remoteThumb
      }

      product.itemNumbers.forEach((num) => {
        itemNumberToInternalId[num] = product.internalId
      })

      msgFields.forEach((field) => {
        if (product[field]) {
          const msgId = `${product.internalId}.${field}`
          messages[msgId] = {
            id: `parsedProducts.${msgId}`,
            defaultMessage: product[field],
          }
          product[field] = `parsedMessages['${msgId}']`
        } else {
          delete product[field]
        }
      })
      for (const state of states) {
        if (product[state]) {
          for (const field of stateFields) {
            if (state === 'pure' && field === 'statusText') {
              const pureStatusTexts = JSON.parse(product[state][field])
              const pureStatusTextField = {}
              for (const textId in pureStatusTexts) {
                const pureMsgId = `${product.internalId}.${state}.${field}.${textId}`
                messages[pureMsgId] = {
                  id: `parsedProducts.${pureMsgId}`,
                  defaultMessage: pureStatusTexts[textId],
                }
                pureStatusTextField[textId] = `parsedMessages['${pureMsgId}']`
              }
              product[state][field] = pureStatusTextField
            } else {
              const stateMsgId = `${product.internalId}.${state}.${field}`
              if (product[state][field]) {
                messages[stateMsgId] = {
                  id: `parsedProducts.${stateMsgId}`,
                  defaultMessage: product[state][field],
                }
                product[state][field] = `parsedMessages['${stateMsgId}']`
              }
            }
          }
          if (product[state]['buttons']['actionButton']) {
            const actionId = `${product.internalId}.${state}.buttons.actionButton`
            messages[actionId] = {
              id: `parsedProducts.${actionId}`,
              defaultMessage: product[state]['buttons']['actionButton'],
            }
            let pMsg = `parsedMessages['${actionId}']`
            product[state]['buttons']['actionButton'] = pMsg
          }
          if (product[state]['buttons']['buy']) {
            const buyId = `${product.internalId}.${state}.buttons.buy`
            messages[buyId] = {
              id: `parsedProducts.${buyId}`,
              defaultMessage: product[state]['buttons']['buy'],
            }
            product[state]['buttons']['buy'] = `parsedMessages['${buyId}']`
          }
        }
      }

      jsonFields.forEach((field) => {
        if (typeof product[field] === 'string' && !product[field].includes('https'))
          jsonErrors.push(`${product[field]} in ${product.internalId}.${field}`)
      })

      cmsProducts[product.internalId] = product
    })

    const orderedItemNumbers = {}
    Object.keys(itemNumberToInternalId)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      .forEach(function (key) {
        orderedItemNumbers[key] = itemNumberToInternalId[key]
      })

    const withMessagesLinked = JSON.stringify(cmsProducts).replace(
      /"parsedMessages\[([^"]+)\]"/g,
      'parsedMessages[$1]'
    )

    const withImagesLinked = withMessagesLinked.replace(/"AS_REF\(([^\)]+)\)"/g, '$1')

    const output = prettier.format(
      `// This is a generated file. Do not edit it directly.
      // Data pulled from ${endpoint}
      import { defineMessages } from 'react-intl'

      ${Object.entries(imgImports)
        .map(([name, path]) => `import ${name} from '${path}'`)
        .join('\n')}

      const parsedMessages = defineMessages(${JSON.stringify(messages)})

      const parsedProducts = ${withImagesLinked}

      export const parsedItemNumberToInternalId = ${JSON.stringify(orderedItemNumbers)}

      export default parsedProducts`,
      {
        parser: 'babel',
        semi: false,
        trailingComma: 'es5',
        singleQuote: true,
        arrowParens: 'always',
        printWidth: 90,
        quoteProps: 'consistent',
      }
    )
    fs.writeFileSync('src/modules/products/cmsData.js', output, 'utf8')
    log.msg('Generated cmsData.js!')

    if (jsonErrors.length > 0) {
      log.warn(`${jsonErrors.length} JSON parsing errors found in CMS dump:`)
      jsonErrors.forEach((err) => log.error(err))
    }
  } catch (error) {
    log.error('main error:', error)
  }
}

main()
