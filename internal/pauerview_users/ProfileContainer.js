import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import Page from 'lib/layout/components/Page'

import ProfileContent from 'lib/users/components/ProfileContent'

import * as aS from 'lib/account/accountSelectors'
import * as aT from 'lib/account/accountThunks'
import { logUserOut } from 'lib/login/LoginThunks'
import { toggleShowImageInput } from 'lib/nav/navigationActions'

const ProfileContainer = ({
  account,
  exportData,
  deleteData,
  setAccountInfo,
  getAccountInfo,
  logout,
  toggleShowImageInput,
}) => (
  <Page>
    <ProfileContent
      account={account}
      exportData={exportData}
      deleteData={deleteData}
      setAccountInfo={setAccountInfo}
      getAccountInfo={getAccountInfo}
      logout={logout}
      toggleShowImageInput={toggleShowImageInput}
    />
  </Page>
)

const mapStateToProps = state => ({
  account: aS.getAccount(state),
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      exportData: aT.exportData,
      deleteData: aT.deleteData,
      setAccountInfo: aT.setAccountInfo,
      getAccountInfo: aT.getAccountInfo,
      logout: logUserOut,
      toggleShowImageInput: toggleShowImageInput,
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProfileContainer)
