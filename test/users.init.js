const imperium = require('./imperium');

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
    { action: 'seeUser', user: '@' },
    { action: 'manageUser', user: '@' }
  ])

imperium.role('admin')
  .is('user', { user: '*' })
