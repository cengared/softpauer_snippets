function stringsPageHeader() {
  const folderSelect = `<select id="folderSelect">
  <option value="Core">Core</option>
  <option value="RobotApp">Robot</option>
  <option value="StoreText">App Stores</option>
  </select>`

  const selectors = `<div id="stringsSelectors">
  <span>App Section: ${folderSelect}</span>
  <span>Language: ${buildLanguageSelect()}</span>
  </div>`

  const buttons = `<div id="stringsButtons">
  <a id="downloadLink" class="button" download></a>
  <form id="poForm" enctype="multipart/form-data">
    <input id="poFile" type="file" accept=".po" />
    <input id="poUpload" type="submit" value="Upload" disabled />
  </form><div id="dragText">Select translation file or drag file here to upload</div></div>`

  return `<div class="drag-text">Drop file to upload</div>
  <div id="stringsHeader">${buttons + selectors}</div>
  <div><span id="modifiedDate">Translation file last modified on: unknown date</span></div>`
}

async function buildStrings(lang, dir) {
  const enSource = await getPo("en", dir)
  const translation = lang ? await getPo(lang, dir, true) : false

  updateButtons(`${dir}/${lang}.po`)

  const uniqueStrings = []
  const translatedStrings = []
  const missingTranslations = []

  $j.each(enSource, (index, value) => {
    const string = breakText(escapeHtml(value[0]))
    if (uniqueStrings.indexOf(string) === -1) {
      uniqueStrings.push(string)
      const indexText = index.replace(`${dir}_`, "").split("|")[0]
      if (!translation[index] || !translation[index][0]) {
        let missingBlock = buildTranslationBlock(indexText, string, "", value[1])
        missingTranslations.push(`<div class="noTranslation">${missingBlock}</div>`)
      } else {
        let tString = breakText(escapeHtml(translation[index][0]))
        translatedStrings.push(
          buildTranslationBlock(indexText, string, tString, value[1])
        )
      }
    }
  })

  let html = `<div id="translationWrapper">`
  html += missingCount(missingTranslations.length)
  missingTranslations.forEach((block) => (html += translationBlock(block, true)))
  translatedStrings.forEach((block) => (html += translationBlock(block)))
  html += "</div>"
  $j("#stringsWrapper").append(html)
}

function buildTranslationBlock(index, english, translation, context = false) {
  let html = ""
  html += `<span class="indexText">${index}</span>`
  if (context) html += `&ensp;<span class="translationContext">${context}</span>`

  html += `<br><span class="englishText">${english}</span><br>`
  html += `<span class="translationText">${breakText(translation)}</span><br>`
  return html
}

function updateButtons(file) {
  $j("#downloadLink").attr("href", `${poSource}/${file}`)
  $j("#downloadLink").attr("download", file.replace(/\//g, "_"))
  $j("#downloadLink").text(`Download ${file}`)
  $j("#poFile").attr("name", `${file}`)
}

function escapeHtml(str) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return str.replace(/[&<>"']/g, (m) => {
    return map[m]
  })
}

const breakText = (text) => text.replace(/(?:\r\n|\r|\n)/g, "<br>")

const translationBlock = (block, missing = false) =>
  `<div class="translationBlock ${missing ? "noTranslation" : ""}">${block}</div>`

const missingCount = (count) =>
  `<div id="missingCount" ${
    count ? 'class="alert"' : ""
  }>There are ${count} missing translations</div>`
