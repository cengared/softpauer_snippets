const showLogs = !!(process.env.NODE_ENV !== 'production')

const logStatus = (status: QRScannerStatus) => showLogs && console.log(status)

const checkError = (err: QRScannerError, status: QRScannerStatus) => {
  err && console.error(err)
  showLogs && console.log(status)
}

export const prepare = () =>
  window?.QRScanner.prepare((err, status) => {
    if (err) {
      console.error(err)
    } else {
      console.log('QR Scanner initialised!')
    }
    showLogs && console.log(status)
  })

export const scan = (callback: any) => window?.QRScanner.scan(callback)

export const cancelScan = (callback = logStatus) => window?.QRScanner.cancelScan(callback)

export const show = (callback = logStatus) => window?.QRScanner.show(callback)

export const hide = (callback = logStatus) => window?.QRScanner.hide(callback)

export const lightOn = (callback = checkError) => window?.QRScanner.enableLight(callback)

export const lightOff = (callback = checkError) =>
  window?.QRScanner.disableLight(callback)

export const toggleLight = () => {
  window?.QRScanner.getStatus((status) => {
    if (status.lightEnabled) lightOff()
    else lightOn()
  })
}

export const pausePreview = (callback = logStatus) =>
  window?.QRScanner.pausePreview(callback)

export const resumePreview = (callback = logStatus) =>
  window?.QRScanner.resumePreview(callback)

export const status = () =>
  window.QRScanner.getStatus((status: QRScannerStatus) => status)

export const appSettings = () =>
  window.QRScanner.getStatus((status) => {
    if (!status.authorized && status.canOpenSettings) {
      if (
        window.confirm(
          'Would you like to enable QR code scanning? You can allow camera access in your settings.'
        )
      ) {
        QRScanner.openSettings()
      }
    }
  })

export const destroy = () =>
  window?.QRScanner.destroy(() => console.log('QR Scanner instance destroyed'))
