const unitSubstitutions = [
  [/\?+\s?days/gi, "{dayCount, number} {dayCount, plural, one {day} other {days}}"],
  [/\?+\s?tagen/gi, "{dayCount, number} {dayCount, plural, one {Tag} other {Tagen}}"],
  [/\?+\s?%/gi, "{percent, number, percent}"],
]

const parseText = text =>
  unitSubstitutions.reduce((text, [regex, sub]) => text.replace(regex, sub), text)

function productPageHeader() {
  return `<div id='productSelector'>Language: ${buildLanguageSelect(true)}</div>`
}

async function processPage(lang) {
  const enSource = []
  for (let [key, value] of Object.entries(await getPo("en", "Core"))) {
    enSource[value[0]] = { key: key, context: value[0] }
  }

  const deSource = await getPo("de", "Core")
  const translation = lang ? await getPo(lang, "Core") : false
  const elements = $j(".upcp-tabbed-cf-container .upcp-tab-title")

  for (let i = 0; i < elements.length; i++) {
    const titleElement = elements[i]
    const textElement = titleElement.nextElementSibling
    let string = parseText($j.trim(textElement.innerText))

    if (string.length < 0) return

    let html = `<div>${string}</div>`
    const key = enSource[string] && enSource[string].key ? enSource[string].key : false

    if (key) {
      html = `<div class='translatedBlock'>`
      html += `<div class='englishText'>${string}</div>`
      if (deSource[key] && deSource[key][0]) {
        html += `<div class='germanText'>${deSource[key][0]}</div>`
      } else {
        html += `<div class='noTranslation'>German translation not found</div>`
      }

      if (translation) {
        if (translation[key] && translation[key][0]) {
          html += `<div class='translationText'>${translation[key][0]}</div>`
          if (translation[key][1] && translation[key][1].length >= 1) {
            let context = translation[key][1]
            html += `<div class='translationContext'>Context: ${context}</div>`
          }
        } else {
          let language = langName(lang)
          html += `<div class='noTranslation'>${language} translation not found</div>`
        }
      }
      html += `</div>`
    } else {
      if (isJson(string)) {
        html = await processJson(JSON.parse(string), enSource, lang)
      }
    }
    textElement.outerHTML = html
  }
}

async function processJson(json, enSource, lang) {
  let html = ""
  const flatJson = flatten(json)

  for (const index in flatJson) {
    const string = flatJson[index]
    const label = index === "buy" ? "shop button" : index.replace(/\./g, " - ")
    html += `<div class='jsonBlock'>`
    if (typeof string == "boolean" || string.includes("http")) {
      html += `<div><span class='jsonLabel'>${label}: </span><span class='jsonParsed customSpan'>${string}</span><div>`
   } else {
      const key = enSource[string] && enSource[string].key ? enSource[string].key : false
      const german = await getTranslation(key, "de")
      const translation = lang ? await getTranslation(key, lang) : false
      html += `<div class='jsonLabel'>${label}:</div>`
      html += `<div class='englishText'>${string}</div>`
      html += `<div class='germanText'>${german}</div>`
      html += translation ? `<div class='translationText'>${translation}</div>` : ""
    }
    html += `</div>`
  }

  return html
}

async function getTranslation(key, lang) {
  const source = lang ? await getPo(lang, "Core") : false
  if (source) {
    if (source[key] && source[key][0]) {
      return source[key][0]
    }
  }
  return `<div class='noTranslation'>${langName(lang)} translation not found</div>`
}
