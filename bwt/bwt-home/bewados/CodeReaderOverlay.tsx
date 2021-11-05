import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import ToggleButton from 'modules/scanner/components/ToggleButton'
import { setActiveOverlayBar } from 'modules/nav/redux/manageOverlaysBar'
import * as qr from './scanManager'

import cx from 'classnames'
import style from './CodeReaderOverlay.module.css'

export default function CodeReaderOverlay() {
  const dispatch = useDispatch()
  const [prepared, setPrepared] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [data, setData] = useState({})

  useEffect(() => {
    // console.log('CodeReaderOverlay', qr.status())

    if (!prepared) {
      qr.prepare()
      setPrepared(true)
    }
    if (prepared && !scanning) {
      qr.show()
      console.log('showing qr')
      qr.scan((err: QRScannerError, contents: JSON) => {
        console.log('STARTING SCAN')
        setScanning(true)
        if (err || contents) {
          if (err) {
            console.error(err)
          }
          if (contents) {
            qr.pausePreview()
            setData(contents)
            window.alert(contents)
          }
          setScanning(false)
        }
      })
    }
  }, [prepared, scanning, data])

  return (
    <div className={style.root}>
      <div className={cx(style.topSection, style.fadedBackground)}>
        <ToggleButton
          toggles={[
            {
              name: (
                <FormattedMessage
                  id="codeReaderOverlay.toggle.scan"
                  defaultMessage="Scan"
                />
              ),
              selected: true,
            },
            {
              name: (
                <FormattedMessage
                  id="codeReaderOverlay.toggle.enterValues"
                  defaultMessage="Enter values"
                />
              ),
              onclick: () =>
                dispatch(
                  setActiveOverlayBar('consumableConfigForm', { hideToggle: false })
                ),
            },
          ]}
        />
      </div>

      <div className={style.fullWidth} style={{ height: '25vh' }}>
        <div className={style.fadedBackground} style={{ width: '25vw' }} />
        <div>
          <div className={style.qrOutline} />
        </div>
        <div className={style.fadedBackground} style={{ width: '25vw' }} />
      </div>
      <div className={style.messageBox} onClick={() => qr.toggleLight()}>
        <FormattedMessage
          id="codeReaderOverlay.messageBox"
          defaultMessage="Find and scan the QR code on the consumable pouch."
        />
      </div>
      <div className={cx(style.bottomSection, style.fadedBackground)} />
    </div>
  )
}
