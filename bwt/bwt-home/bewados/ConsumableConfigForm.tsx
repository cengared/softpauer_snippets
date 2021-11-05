import React from 'react'
import { useDispatch } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { useAppSelector } from 'types/redux'
import { getActiveOverlayBarParams } from 'modules/nav/redux/selectors'
import ToggleButton from 'modules/scanner/components/ToggleButton'
import { setActiveOverlayBar } from 'modules/nav/redux/manageOverlaysBar'

import style from './ConsumableConfigForm.module.css'

export default function ConsumableConfigForm() {
  const { hideToggle } = useAppSelector(getActiveOverlayBarParams)
  const dispatch = useDispatch()
  return (
    <div className={style.root}>
      {hideToggle ? (
        <div className={style.header}>
          <FormattedMessage
            id="consumableConfigForm.toggle.enterValues"
            defaultMessage="Enter values"
          />
        </div>
      ) : (
        <div className={style.topSection}>
          <ToggleButton
            toggles={[
              {
                name: (
                  <FormattedMessage
                    id="consumableConfigForm.toggle.scan"
                    defaultMessage="Scan"
                  />
                ),
                onClick: () => dispatch(setActiveOverlayBar('scanOverlay')),
              },
              {
                name: (
                  <FormattedMessage
                    id="consumableConfigForm.toggle.enterValues"
                    defaultMessage="Enter values"
                  />
                ),
                selected: true,
              },
            ]}
          />
        </div>
      )}

      <div className={style.form}>
        <div style={{ display: 'flex', width: '100%' }}></div>
      </div>
    </div>
  )
}
