import { Set } from 'immutable'

export const getUsers = state => state.users.get('items')

export const getUserForId = (state, userId) => getUsers(state).get(userId)

export const getUsersSubset = (state, ids) => {
  const users = getUsers(state)
  return new Set(ids).toMap().map(userId => users.get(userId))
}
