import React, { Component } from 'react'
import { css } from 'glamor'
import { skin } from 'lib/styles/skins'

//-----------------------------------------------------------------------------

const cssUserSocialContainer = css({
  label: 'UserSocialContainer',
  background: '#f4f4f4',
  padding: '12px 0',
})

const cssUserSocialWrapper = css({
  background: 'white',
  borderRadius: '5px',
  marginLeft: '5%',
  width: '90%',
  padding: '10px 0',
})

const cssUserSocialHeader = css({
  fontWeight: 'bold',
  fontSize: '22px',
  color: '#111111',
  letterSpacing: '0.35px',
  marginLeft: '5%',
  width: '90%',
  paddingBottom: '10px',
})

const cssUserSocialFieldContainer = css({
  display: 'flex',
  marginLeft: '5%',
  width: '90%',
  padding: '10px 0',
})

const cssUserSocialFieldName = css({
  display: 'flex',
  width: '75%',
})

const cssUserSocialFieldIcon = css({
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

class UserSocial extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return (
      <div {...cssUserSocialContainer}>
        <div {...cssUserSocialWrapper}>
          <div {...cssUserSocialHeader}>Find us on</div>
          <div {...cssHorizontalLine} />
          <div {...cssUserSocialFieldContainer}>
            <div {...cssUserSocialFieldName}>Facebook</div>
            <img
              {...cssUserSocialFieldIcon}
              src={skin.userArrow}
              onClick={() =>
                window.open(
                  encodeURI('https://www.facebook.com/pauerview'),
                  '_system',
                  'usewkwebview=yes,location=yes'
                )
              }
            />
          </div>
          <div {...cssUserSocialFieldContainer}>
            <div {...cssUserSocialFieldName}>Twitter</div>
            <img
              {...cssUserSocialFieldIcon}
              src={skin.userArrow}
              onClick={() =>
                window.open(
                  encodeURI('https://www.twitter.com/pauerview'),
                  '_system',
                  'usewkwebview=yes,location=yes'
                )
              }
            />
          </div>
          <div {...cssUserSocialFieldContainer}>
            <div {...cssUserSocialFieldName}>Web</div>
            <img
              {...cssUserSocialFieldIcon}
              src={skin.userArrow}
              onClick={() =>
                window.open(
                  encodeURI('http://192.168.23.205/'),
                  '_system',
                  'usewkwebview=yes,location=yes'
                )
              }
            />
          </div>
        </div>
      </div>
    )
  }
}

export default UserSocial
