import React, { Component } from 'react'
import ReactGA from 'react-ga'
import { css } from 'glamor'
import { touchScroll } from 'lib/styles/util'

import OvalHeader from 'lib/layout/components/OvalHeader'
import UserProfile from './UserProfile'
import UserOptions from './UserOptions'
import UserAbout from './UserAbout'
import UserSocial from './UserSocial'
import UserHeader from './UserHeader'
import history from 'lib/main/history'

//-----------------------------------------------------------------------------
const cssProfileContentContainer = css({
  label: 'ProfileContentController',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  backgroundColor: '#F4F4F4',
  position: 'relative',
})

const cssPaddingElement = css({
  paddingTop: '65%',
  transform: 'translateZ(0)',
  transition: 'all 0.5s ease',
})

const cssProfileContent = css({
  label: 'ProfileContent',
  ...touchScroll,
  overflowX: 'hidden',
  width: '100%',
  position: 'relative',
})

const cssProfileLogoutWrapper = css({
  background: 'white',
  borderRadius: '5px',
  marginLeft: '5%',
  width: '90%',
  padding: '10px 0',
})

const cssProfileLogout = css({
  fontWeight: 'bold',
  fontSize: '22px',
  color: '#111111',
  letterSpacing: '0.35px',
  display: 'flex',
  justifyContent: 'center',
})

const cssVersionNumber = css({
  display: 'flex',
  justifyContent: 'center',
  color: 'darkgrey',
  margin: '3%',
})

//-----------------------------------------------------------------------------

class ProfileContent extends Component {
  constructor(props) {
    super(props)
    this.scrollElement = null

    this.state = {
      devClickCount: 0,
    }
  }

  versionOnClick() {
    if (this.state.devClickCount == 0) {
      setTimeout(() => {
        this.setState({
          devClickCount: 0,
        })
      }, 5000)
    }

    this.setState({
      devClickCount: this.state.devClickCount + 1,
    })

    // Show dev menu
    if (this.state.devClickCount > 10) {
      alert('Dev menu unlocked')
      history.push(`/developer/`)
    }
  }

  render() {
    const {
      account,
      exportData,
      deleteData,
      setAccountInfo,
      logout,
      toggleShowImageInput,
    } = this.props

    let urlId = null
    if (account) {
      if (account.avatar) urlId = account.avatar
    }
    let name = account.firstName + ' ' + account.lastName
    let displayName = account.displayName
    let profile = { urlId, name, displayName }

    return (
      <div {...cssProfileContentContainer}>
        <div
          {...cssProfileContent}
          ref={select => (this.scrollElement = select)}
        >
          <div {...cssPaddingElement} />
          {/*<UserHeader profile={profile} colour="#1c1c1c" />*/}
          <UserProfile profile={account} setAccountInfo={setAccountInfo} />
          <UserOptions
            account={account}
            exportData={exportData}
            deleteData={deleteData}
          />
          <UserAbout />
          {/* <UserSocial /> */}
          <div
            {...cssProfileLogoutWrapper}
            onClick={() => {
              logout()
              ReactGA.event({
                category: 'Login',
                action: 'User logged out.',
              })
            }}
          >
            <div {...cssProfileLogout}>Logout</div>
          </div>
          <div {...cssVersionNumber} onClick={this.versionOnClick.bind(this)}>
            {' '}
            {'Version Number: ' + process.env.VERSION}{' '}
          </div>
        </div>
        <OvalHeader
          toggleShowImageInput={toggleShowImageInput}
          scrollElement={this.scrollElement}
          profile={profile}
        />
      </div>
    )
  }
}

export default ProfileContent
