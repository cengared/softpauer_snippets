import React from 'react'
import { FormattedMessage, FormattedDate, FormattedNumber } from 'react-intl'
import { BewadosEvents, BewadosMinerals } from 'modules/ble/util'
import { getISOWeek, startOfWeek } from 'date-fns'

const isAndroid = window.cordova?.platformId === 'android'

const handleNumber = (num) => {
  const conversion = num > 900 ? (num > 900000 ? num / 1000000 : num / 1000) : num
  return <FormattedNumber value={conversion} maximumFractionDigits={1} />
}

const handleUnit = (num) => {
  return num > 900 ? (num > 900000 ? 'm³' : 'l') : 'ml'
}

export default function BewadosReport({ reportData, history, totalValues }) {
  const logTables = parseLogData(history)
  const pageCount = logTables?.length + 1
  let currentPage = 1
  const firstPage = (
    <div className="page" key={`report_page_${currentPage}`}>
      {headerSection(currentPage++, pageCount)}
      {userDetails(reportData)}
      {consumptionDetails(history, totalValues)}
      {!logTables && noDataMessage()}
      <div className="service"></div>
    </div>
  )

  return (
    <html>
      <head>
        <link
          rel="stylesheet"
          href={`${
            isAndroid ? 'file:///android_asset/www/bewados' : 'bewados'
          }/report.css`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>

      <body>
        {firstPage}
        {logTables &&
          logTables?.map((table) => buildLogPage(table, currentPage++, pageCount))}
      </body>
    </html>
  )
}

const headerSection = (page, pageCount) => (
  <div>
    <div className="header">
      <p className="headline">
        <FormattedMessage
          id="bewados.report.headline"
          defaultMessage="Documentation according to §11 TrinkwV"
        />
      </p>
      <img
        src={`${
          isAndroid ? 'file:///android_asset/www/bewados' : 'bewados'
        }/BWT_logo_2020.png`}
        alt="BWT Logo"
      />
    </div>
    <p>
      <span>
        <FormattedMessage
          id="bewados.report.createdOnDate"
          defaultMessage="Created on {createdDate}"
          values={{
            createdDate: (
              <FormattedDate
                value={Date.now()}
                day="2-digit"
                month="2-digit"
                year="numeric"
              />
            ),
          }}
        />
      </span>
      <br />
      <span>
        <FormattedMessage
          id="bewados.report.pageCount"
          defaultMessage="Page {page} of {pageCount}"
          values={{ page, pageCount }}
        />
      </span>
    </p>
  </div>
)

const userDetails = (data) => (
  <div className="userDetails">
    <table>
      <tbody>
        <tr>
          <td>
            <FormattedMessage id="bewados.report.operator" defaultMessage="Operator" />
          </td>
          <td></td>
          <td>
            <FormattedMessage id="bewados.report.site" defaultMessage="Site" />
          </td>
          <td></td>
        </tr>
        <tr>
          <td>
            <FormattedMessage id="bewados.report.name" defaultMessage="Name" />
          </td>
          <td>{data?.userName}</td>
          <td>
            <FormattedMessage
              id="bewados.report.deviceType"
              defaultMessage="Device Type"
            />
            {':'}
          </td>
          <td>{data?.deviceType}</td>
        </tr>
        <tr>
          <td>
            <FormattedMessage id="bewados.report.street" defaultMessage="Street" />
          </td>
          <td>{data?.street}</td>
          <td>
            <FormattedMessage
              id="bewados.report.deviceName"
              defaultMessage="Device Name"
            />
            {':'}
          </td>
          <td>{data?.deviceName}</td>
        </tr>
        <tr>
          <td>
            <FormattedMessage id="bewados.report.postCode" defaultMessage="Post Code" />
          </td>
          <td>{data?.postalCode}</td>
          <td>
            <FormattedMessage
              id="bewados.report.articleNumber"
              defaultMessage="Article Number"
            />
            {':'}
          </td>
          <td>{data?.articleNumber}</td>
        </tr>
        <tr>
          <td>
            <FormattedMessage id="bewados.report.country" defaultMessage="Country" />
          </td>
          <td>{data?.country}</td>
          <td>
            <FormattedMessage
              id="bewados.report.productCode"
              defaultMessage="Product Code"
            />
            {':'}
          </td>
          <td>{data?.productCode}</td>
        </tr>
        <tr>
          <td>
            <FormattedMessage id="bewados.report.email" defaultMessage="E-mail" />
          </td>
          <td>{data?.userEmail}</td>
          <td>
            <FormattedMessage
              id="bewados.report.installationDate"
              defaultMessage="Installation Date"
            />
            {':'}
          </td>
          <td>
            <FormattedDate
              value={data?.installationDate}
              day="2-digit"
              month="2-digit"
              year="numeric"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)

const noDataMessage = () => (
  <div>
    <div className="noData">
      <p className="noDataMessage">
        <FormattedMessage
          id="bewados.report.noData"
          defaultMessage="A detailed logbook of consumption and events will appear after 1 week of use"
        />
      </p>
    </div>
  </div>
)

const buildLogPage = (logData, currentPage, pageCount) => (
  <div className="page" key={`report_page_${currentPage}`}>
    {headerSection(currentPage, pageCount)}
    <div className="logbook">
      <p className="headline">
        <FormattedMessage id="bewados.report.logbook" defaultMessage="Logbook" />
      </p>
      <table>
        <col className="narrow" />
        <col />
        <col />
        <col />
        <col className="narrow" />
        <col className="right" />
        <col className="wide" />
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th colSpan="3">
              <FormattedMessage
                id="bewados.report.consumption"
                defaultMessage="Consumption"
              />
            </th>
            <th colSpan="2">
              <FormattedMessage id="bewados.report.events" defaultMessage="Events" />
            </th>
          </tr>
          <tr>
            <th>
              <FormattedMessage
                id="bewados.report.cw"
                defaultMessage="CW"
                description="Caldendar week shorthand"
              />
            </th>
            <th>
              <FormattedMessage
                id="bewados.report.bwtMineral"
                defaultMessage="BWT Mineral"
              />
            </th>
            <th>
              <FormattedMessage
                id="bewados.report.treatedWater"
                defaultMessage="Treated Water"
              />
            </th>
            <th>
              <FormattedMessage
                id="bewados.report.bwtMineral"
                defaultMessage="BWT Mineral"
              />
            </th>
            <th>
              <FormattedMessage
                id="bewados.report.phosphate"
                defaultMessage="P- Conc."
                description="Phosphate concentration shorthand"
              />
            </th>
            <th>
              <FormattedMessage id="bewados.report.date" defaultMessage="Date" />
            </th>
            <th>
              <FormattedMessage
                id="bewados.report.notification"
                defaultMessage="Notification"
              />
            </th>
          </tr>
          <tr>
            <th></th>
            <th></th>
            <th>m³</th>
            <th>ml</th>
            <th>mg/l</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {logData?.map((log, idx) => (
            <tr key={idx}>
              <td>{log.cw}</td>
              <td>{BewadosMinerals[log.bwtMineral]}</td>
              <td>{handleNumber(log?.treatedWater)}</td>
              <td>{handleNumber(log?.dosedMineral)}</td>
              <td>{handleNumber(log?.phosphate)}</td>
              <td>
                {log?.date?.map((date, idx) => (
                  <li key={idx}>
                    <FormattedDate
                      value={date}
                      day="2-digit"
                      month="2-digit"
                      year="numeric"
                    />
                  </li>
                ))}
              </td>
              <td>
                {log?.notifs?.map((notif, idx) => (
                  <li key={idx}>{notif}</li>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

function parseLogData(history) {
  if (history.length === 0) return false

  const data = history.slice().reverse()
  const tables = []
  const maxRows = 34
  let rowCount = 0
  let events = []

  data?.forEach((log) => {
    const eventDate = new Date(log.timestamp * 1000)
    const cw = getISOWeek(eventDate)
    const existing = events.find((obj) => obj.cw === cw)
    const week = existing ? existing : { cw: cw }
    switch (log?.eventId) {
      case BewadosEvents.NoEvent:
        console.error('NoEvent detected:', log)
        break
      case BewadosEvents.WeeklySummary:
        week.bwtMineral = log.args.bwtMineral
        week.treatedWater = log.args.treatedWater
        week.dosedMineral = log.args.dosedMineral
        week.phosphate = 0.9
        rowCount++
        break
      case BewadosEvents.TestMessage:
        week.date = handleEventCell(week.date, eventDate.toLocaleDateString())
        week.notifs = handleEventCell(week.notifs, log.args.message)
        if (week.date.length > 1) rowCount++
        break
      default:
        console.error('Unsupported event detected:', log)
        break
    }
    if (!existing) events.push(week)
    if (rowCount >= maxRows) {
      tables.push(events)
      rowCount = 0
      events = []
    }
  })
  tables.push(events)
  return tables
}

function handleEventCell(cell, string) {
  if (!cell || cell.length === 0) cell = []
  cell.push(cell.includes(string) ? String.fromCharCode(160) : string)
  return cell
}

function consumptionDetails(history, totals) {
  let date = new Date()
  if (history?.length > 0) {
    date = new Date(history[0].timestamp * 1000)
  }
  let count = 0
  const consumption = {
    start: date,
    end: date,
    year: date.getFullYear(),
    water: 0,
    mineral: 0,
  }
  for (let i = 0; i < history?.length; i++) {
    date = new Date(history[i].timestamp * 1000)
    if (history[i].eventId === BewadosEvents.WeeklySummary) {
      consumption.water += history[i].args.treatedWater
      consumption.mineral += history[i].args.dosedMineral
      count++
    }
    if (count >= 4) {
      consumption.start = startOfWeek(date, { weekStartsOn: 1 })
      if (consumption.year !== date.getFullYear())
        consumption.year = `${date.getFullYear()} - ${consumption.year}`
      break
    }
  }

  return (
    <div className="consumption">
      <table>
        <col className="date" />
        <col className="text" />
        <col className="number" />
        <col className="unit" />
        <col className="setting" />
        <col className="value" />
        <tbody>
          <tr>
            <td>
              <FormattedMessage
                id="bewados.report.consumption"
                defaultMessage="Consumption"
              />
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>
              <FormattedMessage
                id="bewados.report.consumptionPeriod"
                defaultMessage="{start} to {end}"
                description="21 Sep to 20 Oct"
                values={{
                  start: (
                    <FormattedDate
                      value={consumption.start}
                      day="2-digit"
                      month="short"
                    />
                  ),
                  end: (
                    <FormattedDate value={consumption.end} day="2-digit" month="short" />
                  ),
                }}
              />
            </td>
            <td>
              <FormattedMessage
                id="bewados.report.currentFlow"
                defaultMessage="Water flow rate in current period"
              />
            </td>
            <td>{handleNumber(consumption?.water)}</td>
            <td>{handleUnit(consumption?.water)}</td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>{consumption.year}</td>
            <td>
              <FormattedMessage
                id="bewados.report.currentMineral"
                defaultMessage="BWT Mineral consumption in current period"
              />
            </td>
            <td>{handleNumber(consumption?.mineral)}</td>
            <td>{handleUnit(consumption?.mineral)}</td>
            <td></td>
            <td></td>
          </tr>
          <tr className="spacing"></tr>
          <tr>
            <td></td>
            <td>
              <FormattedMessage
                id="bewados.report.totalFlow"
                defaultMessage="Water throughput since commissioning"
              />
            </td>
            <td>{handleNumber(totals?.totalFlow)}</td>
            <td>{handleUnit(totals?.totalFlow)}</td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td>
              <FormattedMessage
                id="bewados.report.totalMineral"
                defaultMessage="BWT Mineral consumption since commissioning"
              />
            </td>
            <td>{handleNumber(totals?.totalMineral)}</td>
            <td>{handleUnit(totals?.totalMineral)}</td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
