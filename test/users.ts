import test from 'ava'

// Native modules
import { join } from 'path'
// NPM modules
import * as express from 'express'
import * as rp from 'request-promise-native'
import * as stdMocks from 'std-mocks'
import imperium from '../src'

/*
** Helpers
*/
let context: any = {}
const url = (path: string = '/') => `http://localhost:${context.port}` + join('/', path)
const wrapLogs = async (apiCall) => {
	// Store logs output
	// stdMocks.use()
	// Call API & check response
	let res = null
	let err = null
	try {
		res = await apiCall
	} catch (error) {
		err = error
	}
	// Get logs ouput & check logs
	const { stdout, stderr } = stdMocks.flush()
	// Restore logs output
	// stdMocks.restore()
	// Return err, res and output
	return { res, err, stdout, stderr }
}
const get = (path, options = {}) => wrapLogs(rp({ method: 'GET', uri: url(path), resolveWithFullResponse: true, json: true, ...options }))
const post = (path, options = {}) => wrapLogs(rp({ method: 'POST', uri: url(path), resolveWithFullResponse: true, json: true, ...options }))
const put = (path, options = {}) => wrapLogs(rp({ method: 'PUT', uri: url(path), resolveWithFullResponse: true, json: true, ...options }))
const del = (path, options = {}) => wrapLogs(rp({ method: 'DELETE', uri: url(path), resolveWithFullResponse: true, json: true, ...options }))

/*
** Start API
*/
test.before('Start server', async (t) => {
	stdMocks.use()
	// Require server
	const port = 4444
	const app = express()
	app.use(require('./fixtures/users/routes').default)
	app.use((err, req, res, next) => {
		if (err instanceof imperium.UnauthorizedError) {
			res.status(err.statusCode).json({ message: err.message, context: err.context })
		} else {
			res.status(500).json({ message: err.message })
		}
	})
	const server = app.listen(port)
	// Add variables to context
	context = { server, port }
	// Flush logs output
	stdMocks.flush()
	stdMocks.restore()
})

test('GET /users with admin user => 200', async (t) => {
	const { res, err } = await get('/users', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('PUT /users with admin user => 200', async (t) => {
	const { res, err } = await put('/users', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('POST /users with admin user => 200', async (t) => {
	const { res, err } = await post('/users', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('DELETE /users with admin user => 200', async (t) => {
	const { res, err } = await del('/users', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /users with normal user 1 => 403 (invalid-perms)', async (t) => {
	const { err } = await get('/users', { headers: { userId: 1 } })

	t.is(err.statusCode, 403)
	t.is(err.response.body.message, 'invalid-perms')
})

test('PUT /users with normal user 1 => 403 (invalid-perms)', async (t) => {
	const { err } = await put('/users', { headers: { userId: 1 } })

	t.is(err.statusCode, 403)
	t.is(err.response.body.message, 'invalid-perms')
})

test('POST /users with normal user 1 => 403 (invalid-perms)', async (t) => {
	const { err } = await post('/users', { headers: { userId: 1 } })

	t.is(err.statusCode, 403)
	t.is(err.response.body.message, 'invalid-perms')
})

test('DELETE /users with normal user 1 => 403 (invalid-perms)', async (t) => {
	const { err } = await del('/users', { headers: { userId: 1 } })

	t.is(err.statusCode, 403)
	t.is(err.response.body.message, 'invalid-perms')
})

test('GET /users/0 with admin user => 200', async (t) => {
	const { res, err } = await get('/users/0', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('PUT /users/1 with admin user => 200', async (t) => {
	const { res, err } = await put('/users/1', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('PUT /users/1 with normal user 1 => 200', async (t) => {
	const { res, err } = await put('/users/1', { headers: { userId: 1 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('PUT /users/2 with normal user 2 => 403 (invalid-perms)', async (t) => {
	const { res, err } = await put('/users/1', { headers: { userId: 2 } })

	t.is(err.statusCode, 403)
	t.is(err.response.body.message, 'invalid-perms')
})

test('DELETE /users/1 with admin user => 200', async (t) => {
	const { res, err } = await del('/users/1', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('DELETE /users/1 with normal user => 403 (invalid-perms)', async (t) => {
	const { res, err } = await del('/users/1', { headers: { userId: 1 } })

	t.is(err.statusCode, 403)
	t.is(err.response.body.message, 'invalid-perms')
})

test('POST /users/1 with normal user => 400 (invalid-role)', async (t) => {
	const { res, err } = await post('/users/1', { headers: { userId: 1 } })

	t.is(err.statusCode, 400)
	t.is(err.response.body.message, 'invalid-role')
	t.is(err.response.body.context.role, 'friend')
})

test.after('Stop server', async (t) => {
	await new Promise((resolve) => context.server.close(resolve))
})
