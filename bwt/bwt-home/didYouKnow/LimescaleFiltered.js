import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { FormattedMessage, FormattedNumber } from 'react-intl'
import cx from 'classnames'
import startOfDay from 'date-fns/startOfDay'

import { getPerlaLimescaleFilteredRequestCache } from '../../redux/endpoints'
import { setActiveOverlay } from 'modules/nav/redux/manageOverlays'

import Button from 'modules/layout/components/Button'

import style from './InfoSegment.module.css'

import srcThumbnail from 'assets/Limescale.jpg'
import srcCircle from 'assets/circle.svg'

const LimescaleFiltered = ({ limescaleFilteredReq, setActiveOverlay }) => {
  if (!limescaleFilteredReq && !limescaleFilteredReq.data) return <Fragment />

  const tooOld = limescaleFilteredReq.lastSuccess < startOfDay(new Date())
  const rawData = limescaleFilteredReq.data ? limescaleFilteredReq.data : 0
  const useKg = rawData > 900
  const limescaleFiltered = (useKg ? rawData / 1000 : rawData).toFixed(
    useKg && rawData < 10000 ? 2 : 1
  )
  const noData =
    limescaleFilteredReq.error &&
    limescaleFilteredReq.error.Message.includes('No water hardness data available')

  return (
    <div className={style.root}>
      <img src={srcThumbnail} className={style.thumbnail} alt="" />
      {!noData && limescaleFiltered > 0 && (
        <div>
          <img src={srcCircle} className={style.icon} alt="" />
          <div className={style.circleText}>
            <div className={style.circleValue}>
              <FormattedNumber value={limescaleFiltered} />
            </div>
            <div className={style.circleLabel}>
              {useKg ? (
                <FormattedMessage
                  id="limescaleFiltered.cicleLabelKilograms"
                  defaultMessage="kg"
                />
              ) : (
                <FormattedMessage
                  id="limescaleFiltered.cicleLabelGrams"
                  defaultMessage="grams"
                />
              )}
            </div>
          </div>
        </div>
      )}
      <div className={style.details}>
        <div className={style.header}>
          {noData || !limescaleFiltered ? (
            <FormattedMessage
              id="limescaleFiltered.noDataHeader"
              defaultMessage="Awaiting information from device"
            />
          ) : tooOld ? (
            limescaleFilteredReq.isBusy ? (
              <FormattedMessage
                id="limescaleFiltered.updating"
                defaultMessage="Updating..."
              />
            ) : (
              <FormattedMessage
                id="limescaleFiltered.couldntUpdate"
                defaultMessage="Could not update"
              />
            )
          ) : useKg ? (
            <FormattedMessage
              id="limescaleFiltered.valueTextKilograms"
              defaultMessage="{value, number} kilograms of limescale filtered"
              values={{ value: limescaleFiltered }}
              description="example: 20 kilograms of limescale filtered"
            />
          ) : (
            <FormattedMessage
              id="limescaleFiltered.valueTextGrams"
              defaultMessage="{value, number} grams of limescale filtered"
              values={{ value: limescaleFiltered }}
              description="example: 120 grams of limescale filtered"
            />
          )}
        </div>
        <div className={cx(style.text, style.expandText)}>
          {noData || !limescaleFiltered ? (
            <FormattedMessage
              id="limescaleFiltered.noDataText"
              defaultMessage="Please check back in 24 hours"
            />
          ) : limescaleFilteredReq.error && !noData ? (
            <FormattedMessage
              id="limescaleFiltered.error"
              defaultMessage="Error retrieving data."
            />
          ) : (
            <FormattedMessage
              id="limescaleFiltered.valueDescription"
              defaultMessage="Silky soft Pearl Water reduces limescale."
            />
          )}
        </div>
      </div>
      <Button
        name="?"
        btnStyle={style.explainButton}
        onClick={() => setActiveOverlay('explainLimescaleFiltered')}
      />
    </div>
  )
}

const mapStateToProps = (state, { deviceId }) => ({
  limescaleFilteredReq: getPerlaLimescaleFilteredRequestCache(state, deviceId),
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ setActiveOverlay }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(LimescaleFiltered)
