import React, { useEffect, useMemo, useState } from 'react'
import ReactDOMServer from 'react-dom/server'
import { useDispatch } from 'react-redux'
import { IntlProvider, FormattedMessage } from 'react-intl'
import { useAppSelector } from 'types/redux'
import { useRead, useWrite, BLE_C, Button, Cursor } from '@bwt/lib'
import { Device } from 'modules/ownedProducts/types'
import BewadosReport from './BewadosReport'
import openLocalisedLink from 'modules/nav/redux/openLocalisedLink'
import generateBewadosReport from 'modules/ownedProducts/redux/generateBewadosReport'
import { setActiveOverlay, closeActiveOverlay } from 'modules/nav/redux/manageOverlays'
import { getDetailLinks, getProductNameForId } from 'modules/products/data'
import { BewadosPayload, ReadDosedMineral } from 'modules/ble/util'
import { getProductData } from '../../redux/endpoints'
import { getAccountInfo } from 'modules/account/redux/selectors'
import { getInstallationDateStrForProductCode } from 'modules/ownedProducts/redux/selectors/common'
import { getLocale } from 'modules/intl/redux'
import locales from 'i18n/locales'
import { subYears } from 'date-fns'
import style from './BewadosLinks.module.css'

export default function BewadosLinks({
  connected,
  device,
  productCode,
}: {
  connected: boolean
  device: Device
  productCode: string
}) {
  const dispatch = useDispatch()
  const detailLinks = getDetailLinks(device.productId)

  const eventHistory: BewadosPayload[] = useMemo(() => [], [])
  const [buildingHistory, setBuildingHistory] = useState(false)

  const {
    data: entryPayload,
    refetch: refetchEntryPayload,
    busy: busyReadingEntries,
  } = useRead(BLE_C.entryPayload)

  // const { data: historySnapshot } = useRead(BLE_C.historySnapshot)
  const { data: readSensorValues } = useRead(BLE_C.readSensorValues)
  const { data: readDosedMineral } = useRead(BLE_C.readDosedMineral)
  const [setCursor] = useWrite<Cursor>(BLE_C.cursor)

  const locale = useAppSelector((state) => getLocale(state)) as string
  const lang = locale.split('-')[0] ?? 'en'
  const translations: { [key: string]: {} } = {}
  for (const [key, value] of Object.entries(locales)) {
    translations[key] = value
  }
  const messages = translations[locale] ? translations[locale] : translations[lang]

  const installationDate = useAppSelector((state) =>
    getInstallationDateStrForProductCode(state, productCode)
  )
  const productName = useAppSelector(
    (state) => getProductData(state, productCode)?.ProductName
  )
  const accountInfo = useAppSelector((state) => getAccountInfo(state))
  const displayName = getProductNameForId(device.productId)?.defaultMessage

  const reportData = useMemo(
    () => ({
      productCode: productCode,
      articleNumber: device?.itemNumber,
      installationDate: installationDate,
      deviceName: device.name ? device.name : displayName,
      deviceType: productName?.replace(/ *\([^)]*\) */g, ''),
      userName: accountInfo.firstName + ' ' + accountInfo.lastName,
      street: accountInfo.street,
      postalCode: accountInfo.postalCode,
      country: accountInfo.countryCode,
      userEmail: accountInfo.email,
    }),
    [accountInfo, device, displayName, installationDate, productCode, productName]
  )

  const totalValues = useMemo(
    () => ({
      totalFlow: readSensorValues?.flow?.[1]?.totFlow,
      totalMineral: (readDosedMineral as ReadDosedMineral)?.dosedMineral,
    }),
    [readDosedMineral, readSensorValues]
  )

  useEffect(() => {
    const payload = entryPayload as BewadosPayload
    const endTimestamp = Math.floor(subYears(Date.now(), 1).getTime() / 1000)
    if (buildingHistory) {
      if (!busyReadingEntries) {
        if (!payload || endTimestamp > payload.timestamp) {
          const html = ReactDOMServer.renderToStaticMarkup(
            <IntlProvider defaultLocale="en-GB" locale={locale} messages={messages}>
              <BewadosReport
                reportData={reportData}
                history={eventHistory}
                totalValues={totalValues}
              />
            </IntlProvider>
          )
          if (html) {
            // console.log(html)
            setBuildingHistory(false)
            dispatch(generateBewadosReport(productCode, html))
            dispatch(closeActiveOverlay())
            eventHistory.length = 0
          }
        } else {
          eventHistory.push(payload)
          !busyReadingEntries && refetchEntryPayload()
        }
      }
    }
  }, [
    buildingHistory,
    busyReadingEntries,
    entryPayload,
    eventHistory,
    locale,
    messages,
    productCode,
    reportData,
    totalValues,
    dispatch,
    refetchEntryPayload,
    setBuildingHistory,
  ])

  return (
    <div className={style.root}>
      <div className={style.button}>
        <Button
          id="bewados-links.generate-report"
          outline
          height="medium"
          onClick={() => {
            eventHistory.length = 0
            setBuildingHistory(true)
            setCursor({ offset: 0, autoIncrement: true })
            refetchEntryPayload()
            dispatch(setActiveOverlay('loadingSpinner'))
          }}
          disabled={!connected || buildingHistory}
        >
          {
            <FormattedMessage
              id="bewadosLinks.consumableReport"
              defaultMessage="Download consumable report"
            />
          }
        </Button>
      </div>
      <div className={style.button}>
        <Button
          id="bewados-links.download-device-manual"
          outline
          height="medium"
          onClick={() => dispatch(openLocalisedLink({}))}
        >
          {
            <FormattedMessage
              id="bewadosLinks.deviceManual"
              defaultMessage="Download device manual"
            />
          }
        </Button>
      </div>
      <div
        className={style.link}
        onClick={() => dispatch(openLocalisedLink(detailLinks))}
      >
        {detailLinks && (
          <FormattedMessage
            id="bewadosLinks.productDetail"
            defaultMessage="Product details"
          />
        )}
      </div>
    </div>
  )
}
