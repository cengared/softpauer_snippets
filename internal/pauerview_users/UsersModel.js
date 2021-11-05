import { Record, Map } from 'immutable'

export const UserRecord = Record(
  {
    id: null,
    name: '',
    avatar: '',
    score: 0,
  },
  'UserRecord'
)

export const UserRecordMap = Map
