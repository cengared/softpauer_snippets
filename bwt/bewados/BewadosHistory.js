import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl'
import { useDispatch } from 'react-redux'
import subDays from 'date-fns/subDays'
import isBefore from 'date-fns/isBefore'
import isWithinInterval from 'date-fns/isWithinInterval'
import eachDayOfInterval from 'date-fns/eachDayOfInterval'
import addDays from 'date-fns/addDays'
import subHours from 'date-fns/subHOurs'

import ChartPager from '../consumption/Chart'
import ToggleButton from 'modules/scanner/components/ToggleButton'
import StaticOverlay from 'modules/layout/components/StaticOverlay'
import { setActiveOverlay } from 'modules/nav/redux/manageOverlays'
import { getProductNameForId } from 'modules/products/data'

import style from './BewadosHistory.module.css'
import cx from 'classnames'

const messages = defineMessages({
  flow: {
    id: 'bewadosHistory.toggle.flow',
    defaultMessage: 'Flow volume',
  },
  mineral: {
    id: 'bewadosHistory.toggle.mineral',
    defaultMessage: 'Mineral',
  },
  history: {
    id: 'bewadosHistory.toggle.history',
    defaultMessage: 'History',
  },
})

const BewadosHistory = ({ deviceId, intl: { formatMessage }, offlineMode = true }) => {
  const dispatch = useDispatch()
  const [type, setType] = useState('flow')
  const [dates, setDates] = useState({
    start: subDays(new Date(), 6),
    end: new Date(),
  })
  const [pages, setPages] = useState([])
  const [page, setPage] = useState(pages.length - 1)
  const [once, setOnce] = useState(true)
  const productName = formatMessage(getProductNameForId(deviceId))

  const values = []
  const installationDate = useMemo(() => new Date(), [])

  const filteredValues = values
    ?.filter((val) => isWithinInterval(val.date, { start: dates.start, end: dates.end }))
    .map((val) => {
      return {
        LoggedAt: new Date(val.date).toISOString(),
        WaterConsumption: val.value,
      }
    })

  const getPages = useCallback(
    (start, until) => {
      let startx = start
      let untilx = until
      const pages = []
      const range = eachDayOfInterval({ start: start, end: until }).length

      //pages pushed should not go over start and end date

      //make startx one further than install date
      while (startx > new Date(installationDate)) {
        startx = subDays(startx, range)
        untilx = subDays(untilx, range)
      }

      const now = new Date()

      while (subDays(untilx, range) < subHours(now, 1)) {
        pages.push({
          start: isBefore(startx, new Date(installationDate))
            ? new Date(installationDate)
            : startx,
          until: isBefore(
            isBefore(untilx, now) ? untilx : now,
            new Date(installationDate)
          )
            ? new Date(installationDate)
            : isBefore(untilx, now)
            ? untilx
            : now,
        })
        startx = addDays(startx, range)
        untilx = addDays(untilx, range)
      }

      return pages
    },
    [installationDate]
  )

  useEffect(() => {
    if (once) {
      const newPages = getPages(dates.start, dates.end)
      setPages(getPages(dates.start, dates.end))
      setPage(newPages.length - 1)
      setOnce(false)
    }
  }, [dates.end, dates.start, getPages, once])

  return (
    <div className={style.root}>
      <div className={cx(style.faded, offlineMode && style.blur)}>
        <div className={style.headerContainer}>
          <div className={style.title}>
            <FormattedMessage
              id="bewadosHistory.title"
              defaultMessage="Product history"
            />
          </div>
          <div
            className={style.calendarIcon}
            onClick={() => {
              dispatch(
                setActiveOverlay('calendarOverlay', {
                  start: dates.start,
                  end: dates.end,
                  updateDates: (start, end) => {
                    setDates({ start, end })
                    const newPages = getPages(start, end)
                    setPages(newPages)
                    const currentPage = newPages.findIndex((dates) =>
                      isWithinInterval(start, {
                        start: dates.start,
                        end: dates.until,
                      })
                    )
                    setPage(currentPage)
                  },
                  installationDate,
                })
              )
            }}
          />
        </div>
        <ToggleButton
          toggles={[
            {
              name: formatMessage(messages.flow),
              onClick: () => setType('flow'),
              selected: type === 'flow',
            },
            {
              name: formatMessage(messages.mineral),
              onClick: () => setType('mineral'),
              selected: type === 'mineral',
            },
            {
              name: formatMessage(messages.history),
              onClick: () => setType('history'),
              selected: type === 'history',
            },
          ]}
        />
        <ChartPager
          values={filteredValues}
          deviceId={deviceId}
          useLitres={true}
          start={dates.start}
          until={dates.end}
          setDates={setDates}
          page={page}
          pages={pages}
          setPage={setPage}
        />
      </div>
      {offlineMode && (
        <StaticOverlay overlay={'requestInternetConnection'} params={{ productName }} />
      )}
    </div>
  )
}

export default injectIntl(BewadosHistory)
