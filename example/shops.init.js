const imperium = require('./imperium');

imperium.addRoles([
  'shopOwner',
  'shopLogistician',
  'shopMember'
])

imperium.addActions([
  'addShop',
  'seeShop',
  'manageShop',
  'seeStock',
  'manageStock',
  'seeOrder',
  'manageOrder'
])

imperium.role('shopMember')
  .can([
    { action: 'seeShop', shop: '@' },
    { action: 'seeStock', shop: '@' },
    { action: 'seeOrder', user: '*', shop: '@' }
  ])

imperium.role('shopLogistician')
  .is('shopMember', { shop: '@', user: '*' })
  .can([
    { action: 'manageStock', shop: '@' },
    { action: 'manageOrder', user: '*', shop: '@' }
  ])

imperium.role('shopOwner')
  .is('shopLogistician', { shop: '@', user: '*' })
  .can([
    { action: 'manageShop', shop: '@' }
  ])

imperium.role('admin')
  .is('shopOwner', { shop: '*' })
  .can([
    { action: 'addShop' }
  ])
