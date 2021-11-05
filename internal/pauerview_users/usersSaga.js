import { put, takeEvery } from 'redux-saga/effects'

import { requestFetch } from 'lib/sync/syncActions'
import * as c from './usersConstants'
import { AVATAR_UPLOAD_SUCCESS } from 'lib/images/imagesConstants'

function* fetchUsers() {
  yield put(requestFetch(c.NAME, api => api.users.fetch))
}

export default function* usersSaga() {
  yield takeEvery([c.FETCH_USERS, AVATAR_UPLOAD_SUCCESS], fetchUsers)
}
