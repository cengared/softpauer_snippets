import React, { Fragment, useEffect, useCallback, useMemo } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { FormattedMessage, FormattedNumber, injectIntl } from 'react-intl'
import { push } from 'connected-react-router'

import {
  ConnectionProvider,
  useScan,
  useConnection,
  useRead,
  useWrite,
  BLE_C,
} from '@bwt/lib'
import { getBleState } from 'modules/ble/util'

import openLocalisedLink from 'modules/nav/redux/openLocalisedLink'
import Button from 'modules/layout/components/Button'
import {
  getProductStateDesc,
  getProductShopLinks,
  getProductNameForItemNumber,
  getHideServiceDate,
  getProductUUID,
} from 'modules/products/data'

import { getDumbStateForProductCode } from '../../redux/selectors/dumbStates'
import { setActiveOverlay } from 'modules/nav/redux/manageOverlays'
import { setActiveOverlayBar } from 'modules/nav/redux/manageOverlaysBar'
import DeviceStatusLine from '../DeviceStatusLine'
import LargeCircleIndicator from '../LargeCircleIndicator'
import BewadosHistory from './BewadosHistory'
import ProductInformation from './ProductInformation'
import BewadosLinks from './BewadosLinks'

import style from '../Details.module.css'
import isNum from 'modules/util/isNum'

import srcEdit from 'assets/ic_edit_16px.svg'

const blue = '#6286A4'

const BewadosDetails = ({
  device,
  subscription,
  daysRemaining,
  value,
  colour,
  serviceDue,
  nextServiceDate,
  setActiveOverlay,
  setActiveOverlayBar,
  openLocalisedLink,
  push,
  intl: { formatMessage },
}) => {
  const connection = useConnection()
  const { connected } = connection

  const { data: systemTime } = useRead(BLE_C.systemTime)
  const [setSystemTime, writeSystemTimeState] = useWrite(BLE_C.systemTime)
  const deviceTime = useMemo(() => Math.floor(Date.now() / 1000), [])

  useEffect(() => {
    if (connected && !writeSystemTimeState.done && systemTime?.time) {
      // if there is a difference of more than 5 seconds between Bewados & user device
      if (Math.abs(systemTime.time - deviceTime) > 5) {
        if (!writeSystemTimeState.busy) {
          setSystemTime({ time: deviceTime }) // set the Bewados time to user device time
        }
      }
    }
    if (writeSystemTimeState.error) {
      alert(writeSystemTimeState.error)
      console.error(writeSystemTimeState.error)
    }
  }, [connected, deviceTime, systemTime, writeSystemTimeState, setSystemTime])

  const { productCode, productId, name, itemNumber } = device
  const {
    message: connectionMessage,
    icon: connectionIcon,
    help: connectionHelp,
    showDetails,
  } = getBleState(connection)

  const { data: remainingConsumableCapacity } = useRead(BLE_C.remainingConsumableCapacity)
  daysRemaining = remainingConsumableCapacity?.[1]?.remCapacityPct
  value = daysRemaining / 100
  colour = blue

  const { statusText = '', buttons = {}, showLow } = getProductStateDesc(productId, value)
  const shopLinks = getProductShopLinks(productId)
  const itemName = getProductNameForItemNumber(itemNumber)
  const showServiceDate = !getHideServiceDate(productId)
  const nameToShow = name ? name : formatMessage(itemName)

  const offlineMode = true

  return (
    <div className={style.root}>
      <div className={style.detailsSeg}>
        <div className={style.descWrapper}>
          <div
            className={style.segName}
            onClick={() =>
              setActiveOverlay('editDumbDevice', {
                initialName: nameToShow,
                productCode,
              })
            }
          >
            <div className={style.name}>
              <div className={style.ellipsis}>{nameToShow}</div>
            </div>
            <div>
              <img src={srcEdit} className={style.icon} alt="edit icon" />
            </div>
          </div>
          <div
            onClick={() =>
              connectionHelp &&
              setActiveOverlay('cannotSeeBluetoothDevice', {
                productName: nameToShow,
              })
            }
          >
            <DeviceStatusLine
              message={<FormattedMessage {...connectionMessage} />}
              iconStatus={connectionIcon}
              help={connectionHelp}
            />
          </div>
        </div>
      </div>
      <div className={style.statsSeg}>
        <div className={style.circleWrapper}>
          <LargeCircleIndicator
            topLabel={'<Mineral Name>'}
            bottomLabel={
              isNum(daysRemaining) ? (
                <FormattedMessage
                  id="percentageCircle.DaysLeft.Text"
                  defaultMessage={`{dayCount, number} {dayCount, plural, one {day} other {days}}`}
                  values={{ dayCount: daysRemaining }}
                  description="example: 12 days"
                />
              ) : (
                <FormattedMessage
                  id="percentageCircle.pleaseCheck"
                  defaultMessage="Please check"
                />
              )
            }
            value={value}
            middleLabel={
              showLow ? (
                <FormattedMessage
                  id="percentageCircle.low"
                  defaultMessage="Low"
                  description="count"
                />
              ) : isNum(value) ? (
                <FormattedNumber
                  value={value}
                  // eslint-disable-next-line
                  style="percent"
                />
              ) : (
                '?'
              )
            }
            colour={colour}
            boldBottomLabel={value === 0}
          />
        </div>
        <div className={style.statsTextSeg}>
          <div className={style.statsTextSegText}>
            {statusText && <FormattedMessage {...statusText} />}
          </div>
          <div>
            {buttons.actionButton && (
              <div className={style.actionButton}>
                <Button
                  btnStyle="pink widePadding stretchWidth"
                  name={<FormattedMessage {...buttons.actionButton} />}
                  onClick={() => {
                    window?.QRScanner
                      ? setActiveOverlayBar('codeReaderOverlay')
                      : setActiveOverlayBar('consumableConfigForm', { hideToggle: true })
                  }}
                />
              </div>
            )}
            {buttons.buy && shopLinks ? (
              <div className={style.actionButton}>
                <Button
                  btnStyle="greyBorder widePadding stretchWidth"
                  name={
                    <FormattedMessage
                      {...buttons.buy}
                      values={{ mineralName: '<Mineral Name>' }}
                    />
                  }
                  onClick={() => openLocalisedLink(shopLinks)}
                />
              </div>
            ) : (
              <div className={style.actionButton}>
                <Button
                  btnStyle="greyBorder widePadding stretchWidth"
                  name={'Bewados BLE Demo'}
                  onClick={() =>
                    setActiveOverlayBar('bewadosDemo', {
                      productCode: productCode,
                      productId: productId,
                    })
                  }
                />
              </div>
            )}
            {buttons.contact && (
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
            {subscription && subscription.status && <div>Subscribed</div>}
          </div>
        </div>
      </div>
      {showDetails && productId && (
        <div>
          <div className={style.border} />
          <BewadosHistory deviceId={productId} offlineMode={offlineMode} />
          <ProductInformation connected={connected} offlineMode={offlineMode} />
        </div>
      )}

      <div className={style.serviceDateSeg}>
        {showServiceDate && (
          <Fragment>
            {serviceDue ? (
              <FormattedMessage
                id="fullPageOwnedProduct.nextServiceDue"
                defaultMessage="Service due"
              />
            ) : (
              <FormattedMessage
                id="fullPageOwnedProduct.nextServiceDate"
                defaultMessage={`Service: {nextServiceDate, date, twoDigit}`}
                values={{ nextServiceDate }}
              />
            )}
            <div className={style.divide} />
          </Fragment>
        )}
        <FormattedMessage
          id="fullPageOwnedProduct.productCode"
          defaultMessage={`Product Code: {productCode}`}
          values={{ productCode }}
        />
      </div>

      <BewadosLinks connected={connected} device={device} productCode={productCode} />

      <div
        className={style.removeLink}
        onClick={() => setActiveOverlay('confirmDeleteDumbDevice')}
        data-testhandle="remove_device"
      >
        <FormattedMessage
          id="dumbDetails.removeDeviceLink"
          defaultMessage="Remove device"
        />
      </div>
    </div>
  )
}

const ReduxConnectedDetails = connect(
  (state, { device }) => ({
    ...getDumbStateForProductCode(state, device.productCode),
  }),
  (dispatch) =>
    bindActionCreators(
      { setActiveOverlay, push, openLocalisedLink, setActiveOverlayBar },
      dispatch
    )
)(injectIntl(BewadosDetails))

function ScanTrigger({ productId, serviceUuid }) {
  const { device, error } = useConnection()
  const { isScanning, scan } = useScan()
  useEffect(() => {
    if (!isScanning) {
      if (!device || error === 'timed-out') {
        scan({ [serviceUuid]: productId })
      }
    }
  }, [device, isScanning, scan, productId, serviceUuid, error])
  return <Fragment />
}

export default function FullyConnectedBewadosDetails({ device }) {
  const { productCode, productId } = device
  const { devices } = useScan()
  const bleDevice = devices.find((x) => x && x.name?.includes(productCode))
  const serviceUuid = getProductUUID(productId)
  const codeToUuid = useCallback(
    (code) => serviceUuid.slice(0, 4) + code + serviceUuid.slice(8, serviceUuid.length),
    [serviceUuid]
  )
  return (
    <ConnectionProvider device={bleDevice} codeToUuid={codeToUuid}>
      <ScanTrigger productId={productId} serviceUuid={serviceUuid} />
      <ReduxConnectedDetails device={device} bleDevice={bleDevice} />
    </ConnectionProvider>
  )
}
