const supportedLanguages = ["en", "de", "fr", "it", "da", "hu", "nl", "fr-BE", "nl-BE", "es", "pl", "zh",  "ru", "no", "fi", "sv", "uk", "cs", "sk", "ro"]

jQuery(function ($) {
  const wpMediaLibrary = wp.media({
    frame: "select",
    multiple: false,
    library: {
      order: "DESC",
      orderby: "date",
      type: "image",
      search: null,
      uploadedTo: null, // wp.media.view.settings.post.id (for current post ID)
    },
    button: {
      text: "Done",
    },
  })

  $("html").on("dragover", function (e) {
    e.preventDefault()
    e.stopPropagation()
    $("h1").text("Drag here")
  })

  $("html").on("drop", function (e) {
    e.preventDefault()
    e.stopPropagation()
  })

  if ($(".upcp-product-page-breadcrumbs").length) {
    console.log("Product page")
    productPage()
  }

  if ($("#stringsWrapper").length) {
    console.log("Translations page")
    translationPage()
  }

  if ($("#addProductRoot").length) {
    console.log("Add product page")
    addProductPage(wpMediaLibrary)
  }
})

function productPage() {
  const tagTitleElement = $j(".upcp-tabbed-tag-container .upcp-tab-title")[0]
  if (tagTitleElement) {
    tagTitleElement.innerText = "Country Availability:"
    if (!tagTitleElement.nextSibling)
      $j(".upcp-tabbed-tag-container")[0].innerHTML += "None set"
  }

  $j(".upcp-product-page-breadcrumbs").append(productPageHeader())

  const translationCookie = readCookie("translation") ? readCookie("translation") : false
  $j("#languageSelect").val(translationCookie ? translationCookie : "")
  processPage(translationCookie)

  $j("#languageSelect").change(() => {
    setCookie("translation", $j("#languageSelect").val(), 365)
    window.location.reload()
  })
}

function translationPage() {
  $j("#stringsWrapper").prepend(stringsPageHeader())

  const languageCookie = readCookie("language") ? readCookie("language") : "de"
  $j("#languageSelect").val(languageCookie)
  const folderCookie = readCookie("folder") ? readCookie("folder") : "Core"
  $j("#folderSelect").val(folderCookie)
  buildStrings(languageCookie, folderCookie)

  $j("#languageSelect").change(() => {
    setCookie("language", $j("#languageSelect").val(), 365)
    $j("#translationWrapper").remove()
    buildStrings($j("#languageSelect").val(), $j("#folderSelect").val())
  })

  $j("#folderSelect").change(() => {
    setCookie("folder", $j("#folderSelect").val(), 365)
    $j("#translationWrapper").remove()
    buildStrings($j("#languageSelect").val(), $j("#folderSelect").val())
  })

  // Drag enter
  $j("#stringsHeader").on("dragenter", function (e) {
    e.stopPropagation()
    e.preventDefault()
    $j("#stringsHeader").addClass("drag-highlight")
    $j(".drag-text").show()
  })

  // Drag over
  $j("#stringsHeader").on("dragover", function (e) {
    e.stopPropagation()
    e.preventDefault()
    $j("#stringsHeader").addClass("drag-highlight")
    $j(".drag-text").show()
  })

  // Drop
  $j("#stringsHeader").on("drop", function (e) {
    e.stopPropagation()
    e.preventDefault()
    uploadPo(
      e.originalEvent.dataTransfer.files[0],
      $j("#languageSelect").val(),
      $j("#folderSelect").val()
    )
    $j("#stringsHeader").removeClass("drag-highlight")
    $j(".drag-text").hide()
  })

  $j("#poFile").change((event) => {
    event.preventDefault()
    $j("#poUpload").removeAttr("disabled")
  })

  $j("#poUpload").click((event) => {
    event.preventDefault()
    uploadPo(
      $j("#poFile").get(0).files[0],
      $j("#languageSelect").val(),
      $j("#folderSelect").val()
    )
  })
}

function addProductPage(wpMediaLibrary) {
  buildAddProductForm()

  $j("#addProductImage").on("click", (e) => {
    e.preventDefault()
    wpMediaLibrary.open()
  })

  wpMediaLibrary.on("select", function () {
    const image = wpMediaLibrary.state().get("selection").first().toJSON()

    $j("#productImage").html(`<img id="selectedImage" src="${image.url}"/>`)
  })

  $j("#selectAllCountries").on("click", (e) => {
    e.preventDefault()
    $j(".countriesSelection input:checkbox").prop("checked", true)
  })

  $j("#selectNoCountries").on("click", (e) => {
    e.preventDefault()
    $j(".countriesSelection input:checkbox").prop("checked", false)
  })

  $j("input[name='product_name']").on("keyup", () => {
    $j("input[name='short_name']").val($j("input[name='product_name']").val())
  })
}
