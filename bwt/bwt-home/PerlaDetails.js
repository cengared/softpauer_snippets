import React from 'react'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { push } from 'connected-react-router'

import style from './Details.module.css'

import { getSubscriptionForProductCode } from 'modules/subscriptions/redux/selectors'

import Button from 'modules/layout/components/Button'
import PerlaStatusLine from './PerlaStatusLine'
import LargePerlaCircleIndicator from './LargePerlaCircleIndicator'
import LastFetched from './LastFetched'
import MyConsumption from './consumption/MyConsumption'
import DocumentationLinks from './DocumentationLinks'
import HolidayMode from './HolidayMode'
import Firmware from './Firmware'
import DidYouKnow from './didYouKnow/DidYouKnow'
import SignalStrength from './perla/SignalStrength'
import Telemetry from './perla/Telemetry'
import PerlaHybridDetails from './PerlaHybridDetails'

import openLocalisedLink from 'modules/nav/redux/openLocalisedLink'
import { setActiveOverlay } from 'modules/nav/redux/manageOverlays'
import { calcPerlaState } from '../util'
import {
  getPerlaTelemetryRequestCache,
  getDeviceNotificationsRequestCache,
} from '../redux/endpoints'

import { getProductShopLinks } from 'modules/products/data'

import srcEdit from 'assets/ic_edit_16px.svg'

const getPerlaShopLinks = (productId) => {
  return getProductShopLinks(productId)
}

const PerlaDetails = ({
  product,
  openLocalisedLink,
  push,
  setActiveOverlay,
  subscription,
  telemetryReqCache,
  notificationsReqCache,
}) => {
  let id = null
  let productCode = null
  let nickname = ''
  let nextServiceDate = ''
  let stateCode = ''
  let stateBody = ''
  let lastTimeDataReceived = ''
  let holidayModeActive = false
  let holidayModeStart = null
  let itemNumber = null
  let productId = null
  let firmwareVersion = null
  let lastFirmwareUpdate = null

  if (product) {
    if (product.id) id = product.id
    if (product.productCode) productCode = product.productCode
    if (product.nickname) nickname = product.nickname
    if (product.nextServiceDate) nextServiceDate = product.nextServiceDate
    if (product.stateBody) stateBody = product.stateBody
    if (product.stateCode) stateCode = product.stateCode

    if (product.lastTimeDataReceived) lastTimeDataReceived = product.lastTimeDataReceived
    if (product.holidayModeActive) holidayModeActive = product.holidayModeActive
    if (product.holidayModeStart) holidayModeStart = product.holidayModeStart
    if (product.itemNumber) itemNumber = product.itemNumber
    if (product.productId) productId = product.productId
    if (product.firmwareVersion) firmwareVersion = product.firmwareVersion
    if (product.lastFirmwareUpdate) lastFirmwareUpdate = product.lastFirmwareUpdate
  } else {
    return <div />
  }

  const { status, serviceDue } = calcPerlaState(product)

  const waitingForHolidayModeToStart = holidayModeStart > new Date()
  const showServiceButton =
    serviceDue || status === 'disconnected' || status === 'warning'

  const showSubscribed = subscription && subscription.status
  const perlaShopLinks = getPerlaShopLinks(productId)
  const perlaTabsLinks = perlaShopLinks.perlaTabs || perlaShopLinks
  // BWT Perla One doesn't support holiday mode.
  const isPerlaOne = productId === 'bwt-perla-one'
  const isCillitDuo = productId === 'cillit-duo'
  const supportsHolidayMode = !isPerlaOne && !isCillitDuo
  const isHybrid = productId === 'bwt-perla-hybrid'
  const isSimplex = isPerlaOne || isHybrid || productId === 'bwt-perla-home'

  const telemetryData = (telemetryReqCache || {}).data

  const wlanQuality = (telemetryData || {}).WLANQuality || 0
  const gsmQuality = (telemetryData || {}).GSMQuality || 0
  const lanQuality = (telemetryData || {}).ConnectedToLan || false
  const signalType = lanQuality
    ? 'lan'
    : wlanQuality
    ? 'wlan'
    : gsmQuality
    ? 'gsm'
    : 'n/a'
  const signalStrength =
    signalType === 'wlan'
      ? wlanQuality
      : signalType === 'gsm'
      ? gsmQuality
      : lanQuality
      ? 100
      : 0

  const notificationData = isHybrid ? (notificationsReqCache || {}).data : false
  const lastMessageId =
    notificationData && notificationData.HasMore ? notificationData.LastMessageId : false

  return (
    <div>
      <div className={style.detailsSeg}>
        <div className={style.descWrapper}>
          <div className={style.segName} onClick={() => setActiveOverlay('editDevice')}>
            <div className={style.name}>{nickname}</div>
            <div>
              <img src={srcEdit} className={style.icon} alt="edit icon" />
            </div>
          </div>
          <PerlaStatusLine device={product} />
        </div>
      </div>
      <div className={style.statsSeg}>
        <div className={style.circleWrapper}>
          <LargePerlaCircleIndicator device={product} />
          <LastFetched date={lastTimeDataReceived} />
          {status === 'disconnected' ? (
            <SignalStrength strength={0} type="n/a" />
          ) : (
            <SignalStrength strength={signalStrength} type={signalType} />
          )}
        </div>
        <div className={style.statsTextSeg}>
          <div className={style.statsTextSegText}>
            {status !== 'disconnected' &&
              (status === 'information' && serviceDue ? (
                <FormattedMessage
                  id="fullPageOwnedProduct.maintenancePlease"
                  defaultMessage="Please request maintenance."
                />
              ) : (
                stateBody
              ))}
          </div>
          <div>
            {showServiceButton && (
              <div className={style.actionButton}>
                <Button
                  btnStyle="pink widePadding stretchWidth"
                  name={
                    <FormattedMessage
                      id="fullPageOwnedProduct.requestServiceButton"
                      defaultMessage="Contact partner"
                    />
                  }
                  onClick={() => push('/service/')}
                />
              </div>
            )}
            <div className={style.actionButton}>
              {showSubscribed ? (
                <Button
                  btnStyle="greyBorder widePadding stretchWidth"
                  name={
                    <FormattedMessage
                      id="fullPageOwnedProduct.perlaTabsSubscribed"
                      defaultMessage="Perla Tabs subscribed"
                      definition="product name: Perla Tabs"
                    />
                  }
                  disabled={true}
                />
              ) : (
                <Button
                  btnStyle="greyBorder widePadding stretchWidth"
                  name={
                    <FormattedMessage
                      id="fullPageOwnedProduct.buyPerlaTabsButton"
                      defaultMessage="Buy Perla Tabs"
                      definition="product name: Perla Tabs"
                    />
                  }
                  onClick={() => openLocalisedLink(perlaTabsLinks)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {isHybrid && (
        <PerlaHybridDetails
          product={product}
          notificationData={notificationData}
          lastMessageId={lastMessageId}
          orderAsc={!isHybrid}
        />
      )}
      {stateCode !== 'disconnected' && id && <DidYouKnow deviceId={id} />}
      {stateCode !== 'disconnected' && id && (
        <MyConsumption deviceId={id} deviceName={product.name} />
      )}

      {stateCode !== 'disconnected' && (
        <Telemetry telemetry={(telemetryReqCache || {}).data} isSimplex={isSimplex} />
      )}

      {supportsHolidayMode && stateCode !== 'disconnected' && (
        <HolidayMode
          id={id}
          active={holidayModeActive}
          start={holidayModeStart}
          waiting={waitingForHolidayModeToStart}
        />
      )}

      <Firmware
        firmwareVersion={firmwareVersion}
        lastFirmwareUpdate={lastFirmwareUpdate}
      />

      <div className={style.serviceDateSeg}>
        {serviceDue ? (
          <FormattedMessage
            id="fullPageOwnedProduct.nextServiceDue"
            defaultMessage="Service due"
          />
        ) : nextServiceDate ? (
          <FormattedMessage
            id="fullPageOwnedProduct.nextServiceDate"
            defaultMessage={`Service: {nextServiceDate, date, twoDigit}`}
            values={{ nextServiceDate: nextServiceDate }}
          />
        ) : (
          <FormattedMessage
            id="fullPageOwnedProduct.noNextServiceDate"
            defaultMessage={`Service: Unknown`}
          />
        )}
        <div className={style.divide} />
        <FormattedMessage
          id="fullPageOwnedProduct.productCode"
          defaultMessage={`Product Code: {productCode}`}
          values={{ productCode }}
        />
      </div>

      <DocumentationLinks itemNumber={itemNumber} deviceId={id} />

      <div
        className={style.removeLink}
        onClick={() => setActiveOverlay('confirmDeleteDevice', { productCode })}
      >
        <FormattedMessage
          id="perlaDetails.removeDeviceLink"
          defaultMessage="Remove device"
        />
      </div>
    </div>
  )
}

const mapStateToProps = (state, { product, orderAsc }) => ({
  subscription: product && getSubscriptionForProductCode(state, product.productCode),
  telemetryReqCache: product && getPerlaTelemetryRequestCache(state, product.id),
  notificationsReqCache:
    product &&
    getDeviceNotificationsRequestCache(
      state,
      product.id,
      product.productId !== 'bwt-perla-hybrid'
    ),
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ openLocalisedLink, push, setActiveOverlay }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(PerlaDetails)
