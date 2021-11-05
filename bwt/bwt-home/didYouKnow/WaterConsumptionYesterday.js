import startOfDay from 'date-fns/startOfDay'
import React from 'react'
import { connect } from 'react-redux'

import { FormattedMessage, FormattedNumber } from 'react-intl'

import style from './InfoSegment.module.css'

import srcThumbnail from 'assets/Pearl_Water.png'
import srcCircle from 'assets/circle.svg'

import { getWaterYesterdayReqCache } from '../../redux/endpoints'

const WaterConsumptionYesterday = ({ waterYesterdayReq }) => {
  const tooOld = waterYesterdayReq.lastSuccess < startOfDay(new Date())
  const waterConsumed = Math.floor(waterYesterdayReq.data)

  return (
    <div className={style.root}>
      <img src={srcThumbnail} className={style.thumbnail} alt="" />
      {waterConsumed > 0 && (
        <div>
          <img src={srcCircle} className={style.icon} alt="" />
          <div className={style.circleText}>
            <div className={style.circleValue}>
              <FormattedNumber value={waterConsumed} />
            </div>
            <div className={style.circleLabel}>
              <FormattedMessage id="waterYesterday.cicleLabel" defaultMessage="litres" />
            </div>
          </div>
        </div>
      )}
      <div className={style.details}>
        <div className={style.header}>
          {!waterConsumed ? (
            <FormattedMessage
              id="waterYesterday.noDataHeader"
              defaultMessage="Awaiting information from device"
            />
          ) : tooOld ? (
            waterYesterdayReq.isBusy ? (
              <FormattedMessage
                id="waterYesterday.updating"
                defaultMessage="Updating..."
              />
            ) : (
              <FormattedMessage
                id="waterYesterday.couldntUpdate"
                defaultMessage="Could not update"
              />
            )
          ) : (
            <FormattedMessage
              id="waterYesterday.consumptionText"
              defaultMessage={`{value, number} {value, plural, zero {litres} one {litre} other {litres}} of Pearl Water`}
              values={{
                value: waterConsumed,
              }}
              description="example: 123 litres of Pearl Water"
            />
          )}
        </div>
        <div className={style.text}>
          {!waterConsumed ? (
            <FormattedMessage
              id="waterYesterday.noDataText"
              defaultMessage="Please check back in 24 hours"
            />
          ) : waterYesterdayReq.error ? (
            <div>
              <FormattedMessage
                id="waterYesterday.error"
                defaultMessage="Error retrieving data."
              />
            </div>
          ) : (
            <FormattedMessage
              id="waterYesterday.consumptionDescription"
              defaultMessage="Your water softener produced {value, number} {value, plural, zero {litres} one {litre} other {litres}} of silky soft Pearl Water yesterday."
              values={{ value: waterConsumed }}
              description="example: Your water softener produced 123 litres of silky soft Pearl Water yesterday."
            />
          )}
        </div>
      </div>
      <div className={style.spacer} />
    </div>
  )
}

const mapStateToProps = (state, { deviceId }) => ({
  waterYesterdayReq: getWaterYesterdayReqCache(state, deviceId),
})

export default connect(mapStateToProps, null)(WaterConsumptionYesterday)
