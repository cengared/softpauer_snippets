export const transformUsersResponse = users => {
  const result = {}
  ;(users || []).forEach(user => {
    user.score = Math.floor(Math.random() * 1000)
    user.id = user.guid
    result[user.uid] = user
  })
  return result
}
