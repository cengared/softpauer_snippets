import React from 'react'
import { css } from 'glamor'

import ConnectedFadingImage from 'lib/images/components/ConnectedFadingImage'
import placeholder from 'assets/user/placeholder.svg'
import { eINPUT_TYPE } from 'lib/nav/navigationReducer'

import { bgUrl } from 'lib/styles/util'

const cssAvatarContainer = css({
  label: 'AvatarContainer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  pointerEvents: 'auto',
})

const cssAvatarWrapper = css({
  height: '150px',
  width: '150px',
  borderRadius: '50%',
  overflow: 'hidden',
})

const Avatar = ({ urlId, toggleShowImageInput, scale, translate, size }) => {
  let scaler = (scale + 1) / 2
  let width = window.innerWidth
  let translateX = (width / 1.35) * translate
  let translateY = (width / 2) * translate
  return (
    <div {...css(cssAvatarContainer)}>
      <div
        {...css(cssAvatarWrapper, urlId ? '' : bgUrl(placeholder))}
        style={{
          transform:
            'scale(' +
            scaler +
            ') translate(-' +
            translateX +
            'px, -' +
            translateY +
            'px)',
          transition: 'all 0.5s ease',
          width: size,
          height: size,
        }}
        onClick={() => {
          toggleShowImageInput(eINPUT_TYPE.ePROFILE_IMAGE)
        }}
      >
        {urlId && <ConnectedFadingImage id={urlId} size={512} type="Avatar" />}
      </div>
    </div>
  )
}

export default Avatar
