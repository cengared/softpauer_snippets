import React, { useState } from 'react'
import { FormattedMessage } from 'react-intl'

import PageSwiper from 'modules/layout/components/PageSwiper'
import Dots from 'modules/layout/components/Dots'

import WaterConsumptionYesterday from './WaterConsumptionYesterday'
import LimescaledFiltered from './LimescaleFiltered'

import style from './DidYouKnow.module.css'

const DidYouKnow = ({ deviceId }) => {
  const [selectedIdx, setSelectedIdx] = useState(0)
  let componentKey = 0
  const components = [
    <WaterConsumptionYesterday deviceId={deviceId} key={componentKey++} />,
    <LimescaledFiltered deviceId={deviceId} key={componentKey++} />,
  ]

  return (
    <div className={style.root}>
      <div className={style.border} />
      <div className={style.title}>
        <FormattedMessage id="didYouKnow.title" defaultMessage="Did you know...?" />
      </div>
      <div className={style.swiper}>
        <PageSwiper
          swipePeek={false}
          showPeek={true}
          noAnimation={true}
          selectedIdx={selectedIdx}
          onSelectIdx={(idx) => setSelectedIdx(idx)}
        >
          {components}
        </PageSwiper>
        <Dots currentIndex={selectedIdx} totalProducts={components.length} />
      </div>
    </div>
  )
}

export default DidYouKnow
