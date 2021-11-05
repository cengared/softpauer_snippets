import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import {
  Button,
  useScan,
  useRead,
  useWrite,
  useConnection,
  BLE_C,
  Cursor,
  ClearHistory,
  ConnectionProvider,
} from '@bwt/lib'
import { addWeeks, subWeeks, endOfWeek } from 'date-fns'
import Json from 'modules/util/Json'
import { useAppSelector } from 'types/redux'
import { getActiveOverlayBarParams } from 'modules/nav/redux/selectors'
import { getProductUUID } from 'modules/products/data'
import { BewadosPayload } from 'modules/ble/util'

import style from './BewadosDemo.module.css'

const numEntries = 52

function randomNumber(min: number, max: number) {
  return (
    Math.floor(Math.random() * (Math.floor(max) - Math.floor(min) + 1)) + Math.floor(min)
  )
}

function BewadosHistory() {
  const history: any[] = useMemo(() => [], [])
  const [fetchHistory, fetchingHistory] = useState(false)
  const [historyLimit, setHistoryLimit] = useState(0)

  const {
    data: historySnapshot,
    refetch: refetchHistorySnapshot,
    busy: busyReadingSnapshot,
  } = useRead(BLE_C.historySnapshot) // 0602
  const {
    data: entryPayload,
    refetch: refetchEntryPayload,
    busy: busyReadingEntries,
  } = useRead(BLE_C.entryPayload) // 0604

  const [setCursor] = useWrite<Cursor>(BLE_C.cursor) // 0603
  const [clearHistory, clearHistoryState] = useWrite<ClearHistory>(BLE_C.clearHistory) // 0606
  const [pushEntry, pushEntryState] = useWrite<BewadosPayload>(BLE_C.pushEntry) // 0607

  useEffect(() => {
    if (fetchHistory) {
      if (!(busyReadingEntries || busyReadingSnapshot)) {
        history.push(entryPayload as BewadosPayload)
        !busyReadingEntries && refetchEntryPayload()
        if (historyLimit && history.length >= historyLimit) {
          fetchingHistory(false)
        }
      }
    } else {
      const task = setInterval(() => {
        !busyReadingSnapshot && refetchHistorySnapshot()
      }, 5000)
      return () => clearInterval(task)
    }
  }, [
    history,
    historyLimit,
    fetchHistory,
    historySnapshot,
    entryPayload,
    busyReadingEntries,
    busyReadingSnapshot,
    fetchingHistory,
    refetchEntryPayload,
    refetchHistorySnapshot,
  ])

  return (
    <div>
      <p className={style.title}>Bewados History</p>
      <div className={style.button}>
        <Button
          id={'allHistory'}
          disabled={fetchHistory || historySnapshot?.entryCount === 0}
          onClick={() => {
            setCursor({ offset: 0, autoIncrement: true })
            refetchEntryPayload()
            setHistoryLimit(historySnapshot?.entryCount ?? 0)
            fetchingHistory(true)
            history.length = 0
          }}
          height={'short'}
          metal
        >
          show all history
        </Button>
      </div>
      <div className={style.button}>
        <Button
          id={'yearHistory'}
          disabled={fetchHistory || historySnapshot?.entryCount === 0}
          onClick={() => {
            setCursor({ offset: 0, autoIncrement: true })
            refetchEntryPayload()
            setHistoryLimit(52)
            fetchingHistory(true)
            history.length = 0
          }}
          height={'short'}
          metal
        >
          show one year history
        </Button>
      </div>
      <div className={style.button}>
        <Button
          id={'addWeek'}
          disabled={pushEntryState.busy}
          onClick={() => {
            const entry = {
              timestamp: Math.floor(Date.now() / 1000),
              eventId: 1,
              args: {
                bwtMineral: 0,
                dosedMineral: randomNumber(50, 150),
                treatedWater: randomNumber(1500000, 3000000),
              },
            }
            pushEntry(entry)
            history.length = 0
          }}
          height={'short'}
          metal
        >
          add a weekly summary to history
        </Button>
      </div>
      <div className={style.button}>
        <Button
          id={'addBulk'}
          disabled={pushEntryState.busy}
          onClick={() => {
            const startDate = endOfWeek(subWeeks(new Date(), numEntries), {
              weekStartsOn: 1,
            })
            for (let i = 0; i < numEntries; i++) {
              const date = addWeeks(startDate, (historySnapshot?.entryCount ?? 0) + i)
              if (!pushEntryState.busy) {
                const entry = {
                  timestamp: Math.floor(date.getTime() / 1000),
                  eventId: 1,
                  args: {
                    bwtMineral: 0,
                    dosedMineral: randomNumber(50, 150),
                    treatedWater: randomNumber(1500000, 3000000),
                  },
                }
                pushEntry(entry)
              }
            }
            history.length = 0
          }}
          height={'short'}
          metal
        >
          bulk add weekly summaries to history
        </Button>
      </div>
      <div className={style.button}>
        <Button
          id={'clear'}
          disabled={clearHistoryState.busy}
          onClick={() => {
            clearHistory({ password: 'badcab1e' })
            refetchHistorySnapshot()
            history.length = 0
          }}
          height={'short'}
          metal
        >
          clear history
        </Button>
      </div>
      {`${history.length} entries processed out of ${
        historySnapshot?.entryCount ?? 0
      } total entries`}
      {history.length > 0 && handleObject(history)}
    </div>
  )
}

function handleObject(obj: unknown, header?: string) {
  return (
    <div>
      {header && <p className={style.header}>{`${header}:`}</p>}
      {obj ? <Json obj={obj} /> : <pre>Reading from device...</pre>}
    </div>
  )
}

function BewadosDemo() {
  const connection = useConnection()
  const { data: deviceInfo } = useRead(BLE_C.deviceInfo)
  const { data: deviceConfig } = useRead(BLE_C.deviceConfiguration)
  const { data: systemTime } = useRead(BLE_C.systemTime)
  const { data: sensorValues } = useRead(BLE_C.readSensorValues)
  const { data: dosedMineral } = useRead(BLE_C.readDosedMineral)
  const [writeSystemTime, writeSystemTimeState] = useWrite<{
    time: number | null
  }>(BLE_C.systemTime)

  return (
    <div className={style.page}>
      <BewadosHistory />
      <div>
        <p className={style.title}>Bewados Info</p>
        {handleObject(connection, 'connection')}
        {handleObject(deviceInfo, 'device info')}
        {handleObject(deviceConfig, 'device config')}
        {handleObject(sensorValues, 'sensor values')}
        {handleObject(dosedMineral, 'dosed mineral')}
        {handleObject(
          {
            ...systemTime,
            deviceTime: Math.floor(Date.now() / 1000),
            ...writeSystemTimeState,
          },
          'system time'
        )}
        <div className={style.button}>
          <Button
            id={'randomTime'}
            onClick={() => {
              writeSystemTime({
                time: randomNumber(1, Date.now() / 1000),
              })
            }}
            height={'short'}
            metal
          >
            set random bewados time
          </Button>
        </div>
        <div className={style.button}>
          <Button
            id={'syncTime'}
            onClick={() => {
              writeSystemTime({ time: Math.floor(Date.now() / 1000) })
            }}
            height={'short'}
            metal
          >
            sync bewados time to device
          </Button>
        </div>
      </div>
    </div>
  )
}

function ScanTrigger({
  productId,
  serviceUuid,
}: {
  productId: string
  serviceUuid: string
}) {
  const { device, error } = useConnection()
  const { isScanning, scan } = useScan()
  useEffect(() => {
    if (!isScanning) {
      if (!device || error === 'timed-out') {
        scan({ [serviceUuid as string]: productId })
      }
    }
  }, [device, isScanning, scan, productId, serviceUuid, error])
  return <Fragment />
}

export default function ConnectedBewadosDemo() {
  const { productCode, productId } = useAppSelector(getActiveOverlayBarParams)
  const { devices } = useScan()
  const bleDevice = devices.find((x) => x && x.name?.includes(productCode))
  const serviceUuid = getProductUUID(productId) as string
  const codeToUuid = useCallback(
    (code) => serviceUuid.slice(0, 4) + code + serviceUuid.slice(8, serviceUuid?.length),
    [serviceUuid]
  )
  return (
    <ConnectionProvider device={bleDevice} codeToUuid={codeToUuid}>
      <ScanTrigger productId={productId} serviceUuid={serviceUuid} />
      <BewadosDemo />
    </ConnectionProvider>
  )
}
