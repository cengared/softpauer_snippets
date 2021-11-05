import React from 'react'
import { css } from 'glamor'

//-----------------------------------------------------------------------------
const cssProfileHeader = css({
  letterSpacing: '0.35px',
  textAlign: 'center',
})

const cssProfileName = css({
  fontWeight: 'bold',
  fontSize: '22px',
  padding: '5px 0',
})

const cssProfileDisplayName = css({
  fontStyle: 'italic',
  fontSize: '16px',
  paddingBottom: '5px',
})

//-----------------------------------------------------------------------------
const UserHeader = ({ profile, opacity, colour, inHeader }) => {
  let style = inHeader
    ? { position: 'absolute', top: '5%', maxWidth: window.innerWidth / 2 }
    : { position: 'relative' }
  return (
    <div
      {...cssProfileHeader}
      style={{
        transition: 'all 0.5s ease',
        opacity: opacity,
        color: colour,
        alignSelf: 'center',
        ...style,
      }}
    >
      <div {...cssProfileName}>{profile.name}</div>
      <div {...cssProfileDisplayName}>@{profile.displayName}</div>
    </div>
  )
}

export default UserHeader
