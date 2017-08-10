import test from 'ava'
import * as assert from 'assert'
import { Imperium, ImperiumRole, UnauthorizedError } from '../src'
import imp from '../src'

test('import imperium from "imperium" -> instanceof Imperium', (t) => {
	t.true(imp instanceof Imperium)
})

test('imperium = new Imperium() => instanceof Imperium', (t) => {
	const imperium = new Imperium()

	t.true(imperium instanceof Imperium)
})

test('imperium.UnauthorizedError => class UnauthorizedError', (t) => {
	const imperium = new Imperium()

	t.is(imperium.UnauthorizedError, UnauthorizedError)
})

test('err = new UnauthorizedError() => valid object', (t) => {
	const statusCode = 200
	const message = 'test'
	const context = { role: 'user' }
	const err = new UnauthorizedError(statusCode, message, context)

	t.true(err instanceof UnauthorizedError)
	t.is(err.statusCode, statusCode)
	t.is(err.message, message)
	t.is(err.context, context)
})

test('err = new UnauthorizedError() without statusCode => valid object with statusCode 500', (t) => {
	const message = 'test'
	const err = new UnauthorizedError(undefined, message)

	t.true(err instanceof UnauthorizedError)
	t.is(err.statusCode, 500)
	t.is(err.message, message)
})

test('imperium.can middleware => exists', (t) => {
	const imperium = new Imperium()

	t.truthy(imperium.can)
})

test('imperium.is middleware => exists', (t) => {
	const imperium = new Imperium()

	t.truthy(imperium.is)
})

test('imperium.role function => exists', (t) => {
	const imperium = new Imperium()

	t.truthy(imperium.role)
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

	const role = imperium.role('user', (req) => true)

	t.true(role instanceof ImperiumRole)
})

test('imperium.role() with function (setter) => valid object', (t) => {
	const imperium = new Imperium()

	const fn = (req) => true
	const role = imperium.role('user', fn)

	t.is(role.roleName, 'user')
	t.truthy(role.role.actions)
	t.is(role.role.getAcl, fn)
	t.truthy(role.can)
	t.truthy(role.is)
})

test('imperium.role() with function (setter) => valid object', (t) => {
	const imperium = new Imperium()

	const role1 = imperium.role('user', (req) => true)
	const role2 = imperium.role('user')

	t.deepEqual(role1, role2)
})

test('imperium.role(...).can(...) add actions', (t) => {
	const imperium = new Imperium()

	const userRole = imperium.role('user', (req) => true)
	userRole.can('seeUser')

	t.truthy(userRole.role.actions.find((action) => action.action === 'seeUser'))
})

test('imperium.role(...).is(...) inherits actions', (t) => {
	const imperium = new Imperium()

	const userRole = imperium.role('user', (req) => true)
	const adminRole = imperium.role('admin', (req) => true)

	userRole.can('seeUser')

	t.truthy(userRole.role.actions.find((action) => action.action === 'seeUser'))
	t.falsy(adminRole.role.actions.find((action) => action.action === 'seeUser'))

	const role = adminRole.is('user')

	t.truthy(adminRole.role.actions.find((action) => action.action === 'seeUser'))

	t.deepEqual(role, adminRole)
})

test('imperium.role(...).is(...) with undefined role => AssertionError', (t) => {
	const imperium = new Imperium()

	const role = imperium.role('admin', (req) => true)

	const error = t.throws(() => {
		role.is('user')
	}, assert.AssertionError)

	t.is(error.message, 'Role user does not exist')
})
