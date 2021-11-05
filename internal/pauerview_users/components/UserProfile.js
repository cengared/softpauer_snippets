import React, { Component } from 'react'
import { css } from 'glamor'

import { skin } from 'lib/styles/skins'
import * as check from 'lib/util/validationChecks'

import Button from 'lib/layout/components/Button'
import ErrorToast from 'lib/layout/components/ErrorToast'

//-----------------------------------------------------------------------------

const cssUserProfileContainer = css({
  label: 'UserProfileContainer',
  background: '#f4f4f4',
  padding: '12px 0',
})

const cssUserProfileWrapper = css({
  lable: 'UserProfileWrapper',
  background: 'white',
  borderRadius: '5px',
  marginLeft: '5%',
  width: '90%',
  padding: '10px 0',
})

const cssUserProfileHeaderWrapper = css({
  display: 'flex',
  marginLeft: '5%',
  width: '90%',
  padding: '10px 0',
  justifyContent: 'space-between',
})

const cssUserProfileHeader = css({
  fontWeight: 'bold',
  fontSize: '22px',
  color: '#111111',
  letterSpacing: '0.35px',
})

const cssHorizontalLine = css({
  width: '90%',
  marginLeft: '5%',
  height: '2px',
  background: '#f4f4f4',
  marginBottom: '10px',
})

const cssUserProfileEditIcon = css({
  display: 'flex',
})

const cssUserProfileFields = css({
  label: 'ProfileFields',
})

const cssUserProfileFieldContainer = css({
  display: 'flex',
  marginLeft: '5%',
  width: '90%',
  padding: '10px 0',
})

const cssUserProfileFieldName = css({
  display: 'flex',
  width: '50%',
})

const cssUserProfileFieldData = css({
  display: 'inline-block',
  width: '60%',
  color: '#8b8b8b',
  height: '24px',
  borderBottom: '2px solid #f4f4f4',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const cssUserProfileInput = css({
  display: 'inline-block',
  width: '60%',
  color: '#111111',
  backgroundColor: 'white',
  height: '20px',
  border: 'none',
  borderBottom: '2px solid #f4f4f4',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const cssUserProfileSaveWrapper = css({
  display: 'flex',
  marginLeft: '5%',
  width: '90%',
  justifyContent: 'flex-end',
})

//-----------------------------------------------------------------------------

class UserProfile extends Component {
  constructor(props) {
    super(props)
    this.state = {
      editProfile: false,
      hasError: false,
      errorText: null,
    }
  }

  render() {
    const { profile, setAccountInfo } = this.props
    const { editProfile, hasError, errorText } = this.state
    let icon = editProfile ? skin.userExit : skin.userEdit

    const setter = propName => details => {
      const nextDetails = { ...this.state.details }
      nextDetails[propName] = details.target.value
      this.setState({ details: nextDetails })
    }

    const viewProfile = profile => {
      let dobString = new Date(profile.dob).toLocaleDateString()
      return (
        <div {...cssUserProfileFields}>
          <div {...cssUserProfileFieldContainer}>
            <div {...cssUserProfileFieldName}>First Name</div>
            <div {...cssUserProfileFieldData}>{profile.firstName}</div>
          </div>
          <div {...cssUserProfileFieldContainer}>
            <div {...cssUserProfileFieldName}>Last Name</div>
            <div {...cssUserProfileFieldData}>{profile.lastName}</div>
          </div>
          <div {...cssUserProfileFieldContainer}>
            <div {...cssUserProfileFieldName}>Display Name</div>
            <div {...cssUserProfileFieldData}>{profile.displayName}</div>
          </div>
          <div {...cssUserProfileFieldContainer}>
            <div {...cssUserProfileFieldName}>Email</div>
            <div {...cssUserProfileFieldData}>{profile.email}</div>
          </div>
          <div {...cssUserProfileFieldContainer}>
            <div {...cssUserProfileFieldName}>Date of Birth</div>
            <div {...cssUserProfileFieldData}>{dobString}</div>
          </div>
        </div>
      )
    }

    const editingProfile = profile => {
      return (
        <div {...cssUserProfileFields}>
          <div {...cssUserProfileFieldContainer}>
            <div {...cssUserProfileFieldName}>First Name</div>
            <input
              {...cssUserProfileInput}
              defaultValue={profile.firstName}
              onChange={setter('firstName')}
              placeholder="First Name"
            />
          </div>
          <div {...cssUserProfileFieldContainer}>
            <div {...cssUserProfileFieldName}>Last Name</div>
            <input
              {...cssUserProfileInput}
              defaultValue={profile.lastName}
              onChange={setter('lastName')}
              placeholder="Last Name"
            />
          </div>
          <div {...cssUserProfileFieldContainer}>
            <div {...cssUserProfileFieldName}>Display Name</div>
            <input
              {...cssUserProfileInput}
              defaultValue={profile.displayName}
              onChange={setter('displayName')}
              placeholder="Display Name"
            />
          </div>
          <div {...cssUserProfileFieldContainer}>
            <div {...cssUserProfileFieldName}>Email</div>
            <input
              {...cssUserProfileInput}
              defaultValue={profile.email}
              onChange={setter('email')}
              placeholder="Email"
            />
          </div>
          <div {...cssUserProfileFieldContainer}>
            <div {...cssUserProfileFieldName}>Date of Birth</div>
            <input
              {...cssUserProfileInput}
              defaultValue={profile.dob}
              onChange={setter('dob')}
              type="date"
            />
          </div>
          <div {...cssUserProfileSaveWrapper}>
            <Button
              style="vote"
              name="Save"
              onClick={() => checkChanges(this.state.details)}
            />
          </div>
        </div>
      )
    }

    const checkChanges = e => {
      let errorText = 'There is an issue with your changes: \n'
      let hasError = false

      if (!check.nameValid(e.firstName)) {
        errorText += '- First name is invalid. \n'
        hasError = true
      }

      if (!check.nameValid(e.lastName)) {
        errorText += '- Last name is invalid. \n'
        hasError = true
      }

      if (!check.nameValid(e.displayName)) {
        errorText += '- Display name is invalid. \n'
        hasError = true
      }

      if (!check.emailValid(e.email)) {
        errorText += '- Email address is no longer valid. \n'
        hasError = true
      }

      if (!check.ageValid(e.dob)) {
        errorText += '- You must be ' + skin.minimumAge + ' to use the app. \n'
        hasError = true
      }

      if (!hasError) {
        setAccountInfo(e)
        this.setState({ editProfile: false })
      } else {
        this.setState({
          errorText,
          hasError,
        })

        if (!this.state.hasError) {
          setTimeout(() => {
            hasError = false
            this.setState({
              errorText,
              hasError,
            })
          }, 4500)
        }
      }
    }

    return (
      <div {...cssUserProfileContainer}>
        <ErrorToast errorText={errorText} showError={hasError} />
        <div {...cssUserProfileWrapper}>
          <div
            {...cssUserProfileHeaderWrapper}
            onClick={() =>
              this.setState({
                editProfile: !editProfile,
                details: {
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  displayName: profile.displayName,
                  email: profile.email,
                  dob: profile.dob,
                },
              })
            }
          >
            <div {...cssUserProfileHeader}>Edit profile</div>
            <img {...cssUserProfileEditIcon} src={icon} />
          </div>
          <div {...cssHorizontalLine} />
          {editProfile ? editingProfile(profile) : viewProfile(profile)}
        </div>
      </div>
    )
  }
}

export default UserProfile
