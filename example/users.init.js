const imperium = require('./imperium')

imperium.addRoles([
  'admin',
  'user'
])

imperium.addActions([
  'seeUser',
  'manageUser'
])

imperium.role('user')
  .can([
    { action: 'seeUser', user: '@', bucket: 'front' },
    { action: 'manageUser', user: '@', bucket: 'front' }
  ])

imperium.role('admin')
  .isParentOf('user', { user: '*', bucket: '*' })
