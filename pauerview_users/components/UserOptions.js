import React, { Component } from 'react'
import { css } from 'glamor'
import { skin } from 'lib/styles/skins'

//-----------------------------------------------------------------------------

const cssUserOptionsContainer = css({
  label: 'UserOptionsContainer',
  background: '#f4f4f4',
  padding: '12px 0',
})

const cssUserOptionsWrapper = css({
  background: 'white',
  borderRadius: '5px',
  marginLeft: '5%',
  width: '90%',
  padding: '10px 0',
})

const cssUserOptionsHeader = css({
  fontWeight: 'bold',
  fontSize: '22px',
  color: '#111111',
  letterSpacing: '0.35px',
  marginLeft: '5%',
  width: '90%',
  paddingBottom: '10px',
})

const cssUserOptionsFieldContainer = css({
  display: 'flex',
  marginLeft: '5%',
  width: '90%',
  padding: '10px 0',
})

const cssUserOptionsFieldName = css({
  display: 'flex',
  width: '75%',
})

const cssUserOptionsFieldIcon = css({
  display: 'flex',
  width: '25%',
  color: '#8b8b8b',
  height: '20px',
})

const cssHorizontalLine = css({
  width: '90%',
  marginLeft: '5%',
  height: '2px',
  background: '#f4f4f4',
  marginBottom: '10px',
})

//-----------------------------------------------------------------------------

class UserOptions extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const { exportData, deleteData, account } = this.props

    return (
      <div {...cssUserOptionsContainer}>
        <div {...cssUserOptionsWrapper}>
          <div {...cssUserOptionsHeader}>Options</div>
          <div {...cssHorizontalLine} />
          <div {...cssUserOptionsFieldContainer}>
            <div {...cssUserOptionsFieldName}>Export my data</div>
            <img
              {...cssUserOptionsFieldIcon}
              src={skin.userArrow}
              onClick={() => {
                exportData()
              }}
            />
          </div>
          <div {...cssUserOptionsFieldContainer}>
            <div {...cssUserOptionsFieldName}>Delete my account</div>
            <img
              {...cssUserOptionsFieldIcon}
              src={skin.userArrow}
              onClick={() => {
                if (
                  confirm(
                    'Are you sure you want to delete all of your user data? A backup of your data will be emailed to you as part of this process.'
                  )
                ) {
                  deleteData()
                }
              }}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default UserOptions
