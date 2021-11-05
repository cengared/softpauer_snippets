import React from 'react'
import { FormattedMessage } from 'react-intl'
import style from './ExplainOverlay.module.css'

const ExplainLimescaleFiltered = () => (
  <div className={style.root}>
    <div className={style.header}>
      <FormattedMessage
        id="explainLimescaleFiltered.header"
        defaultMessage="Reduced limescale due to silky soft BWT Pearl Water"
      />
    </div>
    <div className={style.text}>
      <FormattedMessage
        id="explainLimescaleFiltered.infoParagraph1"
        defaultMessage="Softening water means removing calcium and magnesium from the water which would otherwise manifest in form of limescale in your pipes, washing machine, coffee machine and showers."
      />
    </div>
    <br />
    <div className={style.text}>
      <FormattedMessage
        id="explainLimescaleFiltered.infoParagraph2"
        defaultMessage="The amount of limescale filtered from the water is calculated using the difference in water hardness produced by your device and how much silky soft Pearl Water has been produced since installation."
      />
    </div>
  </div>
)

export default ExplainLimescaleFiltered
