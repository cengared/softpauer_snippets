import React from 'react'
import { FormattedDate, FormattedMessage } from 'react-intl'
import cx from 'classnames'
import { BLE_C, useRead } from '@bwt/lib'

import style from './ProductInformation.module.css'

const unknownInformation = (
  <FormattedMessage id="bewados.productInformation.unknown" defaultMessage="Unknown" />
)

const getElapsedTime = (epoch) => {
  const days = epoch / (3600 * 24)
  const hours = (days % 1) * 24
  const minutes = (hours % 1) * 60
  return (
    (days >= 1 ? `${Math.floor(days)}d ` : '') +
    (days >= 1 || hours >= 1 ? `${Math.floor(hours)}h ` : '') +
    `${Math.floor(minutes)}m `
  )
}

export default function ProductInformation({ connected, offlineMode }) {
  const { data: deviceInfo, date: deviceInfoDate } = useRead(BLE_C.deviceInfo)
  const { data: deviceConfig } = useRead(BLE_C.deviceConfiguration)

  const activeAqaAlerts = []
  deviceConfig?.aqaVolumeEn && activeAqaAlerts.push('Aqa Volume')
  deviceConfig?.aqaWatchEn && activeAqaAlerts.push('Aqa Watch')
  deviceConfig?.aqaMaxFlowEn && activeAqaAlerts.push('Aqa Max Flow')

  return (
    <div className={style.root}>
      <div className={style.title}>
        <FormattedMessage
          id="bewados.productInformation.title"
          defaultMessage="Product information"
        />
      </div>
      <div className={style.table}>
        <div className={cx(style.group, !connected && style.hidden)}>
          <div className={style.row}>
            <div className={style.header}>
              <FormattedMessage
                id="bewados.productInformation.connectionType"
                defaultMessage="Connection type:"
              />
            </div>
            <div className={style.value}>
              {offlineMode ? (
                <FormattedMessage
                  id="bewados.productInformation.bluetooth"
                  defaultMessage="Bluetooth"
                />
              ) : (
                'Online'
              )}
            </div>
          </div>
          <div className={style.row}>
            <div className={style.header}>
              <FormattedMessage
                id="bewados.productInformation.connectionStrength"
                defaultMessage="Connection strength:"
              />
            </div>
            <div className={style.value}>{'good'}</div>
          </div>
        </div>
        <div className={style.group}>
          <div className={style.row}>
            <div className={style.header}>
              <FormattedMessage
                id="bewados.productInformation.dosingRate"
                defaultMessage="Dosing rate:"
              />
            </div>
            <div className={style.value}>
              {deviceConfig?.dosingRate ?? unknownInformation}
            </div>
          </div>
          <div className={style.row}>
            <div className={style.header}>
              <FormattedMessage
                id="bewados.productInformation.aqaAlert"
                defaultMessage="AQA Alert Functions:"
              />
            </div>
            <div className={style.value}>
              {activeAqaAlerts.length > 0 ? (
                <div className={style.aqaAlerts}>
                  {activeAqaAlerts.map((alert, idx) => (
                    <span key={idx}>{alert}</span>
                  ))}
                </div>
              ) : (
                <FormattedMessage
                  id="bewados.productInformation.aqaAlertsOff"
                  defaultMessage="Off"
                />
              )}
            </div>
          </div>
        </div>
        <div className={style.group}>
          <div className={style.row}>
            <div className={style.header}>
              <FormattedMessage
                id="bewados.productInformation.hardwareRevision"
                defaultMessage="Hardware revision:"
              />
            </div>
            <div className={style.value}>{deviceInfo?.hwRev || unknownInformation}</div>
          </div>
          <div className={style.row}>
            <div className={style.header}>
              <FormattedMessage
                id="bewados.productInformation.softwareRevision"
                defaultMessage="Software revision:"
              />
            </div>
            <div className={style.value}>{deviceInfo?.fwRev || unknownInformation}</div>
          </div>
        </div>
        <div className={cx(style.group, !connected && style.hidden)}>
          <div className={style.row}>
            <div className={style.header}>
              <FormattedMessage
                id="bewados.productInformation.commDate"
                defaultMessage="Commissioning date:"
              />
            </div>
            <div className={style.value}>
              {deviceInfo?.commDate ? (
                <FormattedDate
                  value={new Date(deviceInfo?.commDate)}
                  year="numeric"
                  month="2-digit"
                  day="2-digit"
                />
              ) : (
                unknownInformation
              )}
            </div>
          </div>
          <div className={style.row}>
            <div className={style.header}>
              <FormattedMessage
                id="bewados.productInformation.lastReboot"
                defaultMessage="Last reboot:"
              />
            </div>
            <div className={style.value}>
              {deviceInfo?.uptime ? (
                <FormattedDate
                  value={deviceInfoDate - deviceInfo?.uptime * 1000}
                  year="numeric"
                  month="2-digit"
                  day="2-digit"
                  hour="2-digit"
                  minute="2-digit"
                  second="2-digit"
                />
              ) : (
                unknownInformation
              )}
            </div>
          </div>
          <div className={style.row}>
            <div className={style.header}>
              <FormattedMessage
                id="bewados.productInformation.timeOn"
                defaultMessage="Time powered on:"
              />
            </div>
            <div className={style.value}>
              {deviceInfo?.operatingTime
                ? getElapsedTime(deviceInfo?.operatingTime)
                : unknownInformation}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
