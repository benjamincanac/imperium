const test = require('ava')
const assert = require('assert')

const Imperium = require('../src')
const ImperiumDoor = require('../src/Door')
const ImperiumRole = require('../src/Role')

test('imperium => instanceof Imperium', (t) => {
  const imperium = new Imperium()

  t.true(imperium instanceof Imperium)
})

test('imperium.door => instanceof ImperiumDoor', (t) => {
  const imperium = new Imperium()
  const door = imperium.door()

  t.true(door instanceof ImperiumDoor)
})

test('imperium.role() without function (getter) => AssertionError', (t) => {
  const imperium = new Imperium()

  const error = t.throws(() => {
    imperium.role('user')
  }, assert.AssertionError)

  t.is(error.message, 'Role user does not exist')
})

test('imperium.role() with function (setter) => instanceof ImperiumRole', (t) => {
  const imperium = new Imperium()
  const role = imperium.role('user', () => true)

  t.true(role instanceof ImperiumRole)
})

test('imperium.role() with function (setter) => valid object', (t) => {
  const imperium = new Imperium()
  const fn = () => true
  const role = imperium.role('user', fn)

  t.is(role.roleName, 'user')
  t.is(role.role.process, fn)
  t.deepEqual(role.role.actions, [])
  t.truthy(role.can)
  t.truthy(role.is)
})

test('imperium.role() with function (setter) => valid object', (t) => {
  const imperium = new Imperium()
  const role1 = imperium.role('user', () => true)
  const role2 = imperium.role('user')

  t.deepEqual(role1, role2)
})

test('imperium.role(...).can(...) add actions', (t) => {
  const imperium = new Imperium()
  const role = imperium.role('user', () => true)
    .can('seeUser')

  t.deepEqual(role.role.actions[0], { name: 'seeUser', params: {} })
})

test('imperium.role(...).is(...) inherits actions', (t) => {
  const imperium = new Imperium()
  const adminRole = imperium.role('admin', () => true)
  const userRole = imperium.role('user', () => true)
    .can('seeUser')

  t.deepEqual(userRole.role.actions[0], { name: 'seeUser', params: {} })
  t.notDeepEqual(adminRole.role.actions[0], { name: 'seeUser', params: {} })

  const role = adminRole.is('user')

  t.deepEqual(adminRole.role.actions[0], { name: 'seeUser', params: {} })
  t.deepEqual(role, adminRole)
})

test('imperium.role(...).is(...) inherits actions params', (t) => {
  const imperium = new Imperium()
  const adminRole = imperium.role('admin', () => true)
  const userRole = imperium.role('user', () => true)
    .can('seeUser', { user: '@' })

  t.deepEqual(userRole.role.actions[0], { name: 'seeUser', params: { user: '@' } })
  t.falsy(adminRole.role.actions[0])

  const role = adminRole.is('user', { user: '*' })

  t.deepEqual(adminRole.role.actions[0], { name: 'seeUser', params: { user: '*' } })
  t.deepEqual(role, adminRole)
})

test('imperium.role(...).is(...) with undefined role => AssertionError', (t) => {
  const imperium = new Imperium()
  const role = imperium.role('admin', () => true)

  const error = t.throws(() => {
    role.is('moderator')
  }, assert.AssertionError)

  t.is(error.message, 'Role moderator does not exist')
})

test('imperium.roles() function => array of roles', (t) => {
  const imperium = new Imperium()

  imperium.role('user', () => true)
    .can('seeUser', { user: '@' })
  imperium.role('admin', () => true)
    .is('user', { user: '*' })

  const roles = imperium.roles()

  t.deepEqual(roles, [{
    name: 'user',
    actions: [{
      name: 'seeUser',
      params: { user: '@' }
    }]
  }, {
    name: 'admin',
    actions: [{
      name: 'seeUser',
      params: { user: '*' }
    }]
  }])
})

test('imperium.door().is(...) with invalid role => false', async (t) => {
  const imperium = new Imperium()

  const door = imperium.door()
  const is = await door.is('admin')

  t.false(is)
})

test('imperium.door().is(...) with valid role => true', async (t) => {
  const imperium = new Imperium()

  imperium.role('admin', () => true)

  const door = imperium.door()
  const is = await door.is('admin')

  t.true(is)
})

test('imperium.door().isnot(...) with valid role => true', async (t) => {
  const imperium = new Imperium()

  imperium.role('admin', () => true)

  const door = imperium.door()
  const isnot = await door.isnot('admin')

  t.false(isnot)
})

test('imperium.door().cannot(...) with valid action => false', async (t) => {
  const imperium = new Imperium()

  imperium.role('user', () => true)

  const door = imperium.door()
  const cannot = await door.cannot('seeUser')

  t.true(cannot)
})

test('imperium.door().can(...) with invalid action => false', async (t) => {
  const imperium = new Imperium()

  imperium.role('admin', () => true)

  const door = imperium.door()
  const can = await door.can('seeUser')

  t.false(can)
})

test('imperium.door().can(...) with valid action => true', async (t) => {
  const imperium = new Imperium()

  imperium.role('admin', () => true)
    .can('seeUser')

  const door = imperium.door()
  const can = await door.can('seeUser')

  t.true(can)
})

test('imperium.door().can(...) with invalid process fn => false', async (t) => {
  const imperium = new Imperium()

  imperium.role('admin', () => false)
    .can('seeUser')

  const door = imperium.door()
  const can = await door.can('seeUser')

  t.false(can)
})

test('imperium.door().can(...) with invalid process fn => false', async (t) => {
  const imperium = new Imperium()

  imperium.role('user', () => false)
    .can('seeUser', { user: '@' })

  const door = imperium.door()
  const can = await door.can('seeUser', { user: 1 })

  t.false(can)
})

test('imperium.door().can(...) with valid process fn => true', async (t) => {
  const imperium = new Imperium()

  imperium.role('user', (ctx) => ({ user: ctx.user }))
    .can('seeUser', { user: '@' })
  imperium.role('admin', () => true)
    .is('user', { user: '*' })

  const door = imperium.door({ user: 1 })
  const can = await door.can('seeUser', { user: 1 })

  t.true(can)
})

test('imperium.door().can(...) with process fn array => true', async (t) => {
  const imperium = new Imperium()

  imperium.role('user', () => {
    return [{ user: 1 }, { user: 2 }]
  })
    .can('seeUser', { user: '@' })

  const door = imperium.door()
  const can1 = await door.can('seeUser', { user: 1 })
  const can2 = await door.can('seeUser', { user: 2 })
  const can3 = await door.can('seeUser', { user: 3 })

  t.true(can1)
  t.true(can2)
  t.false(can3)
})

test('imperium.door().can(...) with action param * => true', async (t) => {
  const imperium = new Imperium()

  imperium.role('admin', () => true)
    .can('seeUser', { user: '*' })

  const door = imperium.door()
  const can = await door.can('seeUser', { user: 1 })

  t.true(can)
})

test('imperium.door().can(...) with action param array => true', async (t) => {
  const imperium = new Imperium()

  imperium.role('user', () => ({ user: [1, 2] }))
    .can('seeUser', { user: '@' })

  const door = imperium.door()
  const can1 = await door.can('seeUser', { user: 1 })
  const can2 = await door.can('seeUser', { user: 2 })
  const can3 = await door.can('seeUser', { user: 3 })

  t.true(can1)
  t.true(can2)
  t.false(can3)
})

test('imperium.door().can(...) with action param array => true', async (t) => {
  const imperium = new Imperium()

  imperium.role('user', () => ({ user: [1, 2] }))
    .can('seeUser', { user: '@', bucket: 'front' })

  const door = imperium.door()
  const can1 = await door.can('seeUser', { user: 1, bucket: 'front' })
  const can2 = await door.can('seeUser', { user: 2 })

  t.true(can1)
  t.false(can2)
})
