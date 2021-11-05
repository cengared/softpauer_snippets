import createSyncReducer from 'lib/sync/createSyncReducer'
import * as c from './usersConstants'
import { UserRecord, UserRecordMap } from './UsersModel'

const initialState = new UserRecordMap()

const usersReducer = (state = initialState, action) => {
  switch (action.type) {
    default:
      return state
  }
}

export default createSyncReducer(c.NAME, usersReducer, UserRecord)
