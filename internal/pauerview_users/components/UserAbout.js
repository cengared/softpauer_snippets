import React, { Component } from 'react'
import { css } from 'glamor'
import { skin } from 'lib/styles/skins'

import history from 'lib/main/history'

//-----------------------------------------------------------------------------

const cssUserAboutContainer = css({
  label: 'UserAboutContainer',
  background: '#f4f4f4',
  padding: '12px 0',
})

const cssUserAboutWrapper = css({
  background: 'white',
  borderRadius: '5px',
  marginLeft: '5%',
  width: '90%',
  padding: '10px 0',
})

const cssUserAboutHeader = css({
  fontWeight: 'bold',
  fontSize: '22px',
  color: '#111111',
  letterSpacing: '0.35px',
  marginLeft: '5%',
  width: '90%',
  paddingBottom: '10px',
})

const cssUserAboutFieldContainer = css({
  display: 'flex',
  marginLeft: '5%',
  width: '90%',
  padding: '10px 0',
})

const cssUserAboutFieldName = css({
  display: 'flex',
  width: '75%',
})

const cssUserAboutFieldIcon = css({
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

class UserAbout extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return (
      <div {...cssUserAboutContainer}>
        <div {...cssUserAboutWrapper}>
          <div {...cssUserAboutHeader}>About</div>
          <div {...cssHorizontalLine} />
          <div {...cssUserAboutFieldContainer}>
            <div {...cssUserAboutFieldName}>Terms</div>
            <img
              {...cssUserAboutFieldIcon}
              src={skin.userArrow}
              onClick={() => history.replace('/about/terms')}
            />
          </div>
          <div {...cssUserAboutFieldContainer}>
            <div {...cssUserAboutFieldName}>Data</div>
            <img
              {...cssUserAboutFieldIcon}
              src={skin.userArrow}
              onClick={() => history.replace('/about/data')}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default UserAbout
