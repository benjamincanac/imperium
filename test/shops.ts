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
	stdMocks.use()
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
	stdMocks.restore()
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
	app.use(require('./fixtures/shops/routes').default)
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

test('GET /shops with admin user => 200', async (t) => {
	const { res, err } = await get('/shops', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /shops with normal user 1 => 403 (invalid-perms)', async (t) => {
	const { res, err } = await get('/shops', { headers: { userId: 1 } })

	t.is(err.statusCode, 403)
	t.is(err.response.body.message, 'invalid-perms')
})

test('POST /shops with admin user => 200', async (t) => {
	const { res, err } = await post('/shops', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('POST /shops with normal user 1 => 403 (invalid-perms)', async (t) => {
	const { res, err } = await post('/shops', { headers: { userId: 1 } })

	t.is(err.statusCode, 403)
	t.is(err.response.body.message, 'invalid-perms')
})

test('GET /orders with admin user => 200', async (t) => {
	const { res, err } = await get('/orders', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /orders with normal user 1 => 403 (invalid-perms)', async (t) => {
	const { res, err } = await get('/orders', { headers: { userId: 1 } })

	t.is(err.statusCode, 403)
	t.is(err.response.body.message, 'invalid-perms')
})

test('GET /orders?userId=1 with normal user 1 => 200', async (t) => {
	const { res, err } = await get('/orders?userId=1', { headers: { userId: 1 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /orders?userId=1 with normal user 2 => 403 (invalid-perms)', async (t) => {
	const { res, err } = await get('/orders?userId=1', { headers: { userId: 2 } })

	t.is(err.statusCode, 403)
	t.is(err.response.body.message, 'invalid-perms')
})

test('GET /orders?userId=1 with admin user => 200', async (t) => {
	const { res, err } = await get('/orders?userId=1', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /orders?shopId=0 with admin user => 200', async (t) => {
	const { res, err } = await get('/orders?shopId=0', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /orders?shopId=1 with admin user => 200', async (t) => {
	const { res, err } = await get('/orders?shopId=1', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /orders?shopId=0 with normal user 1 => 200', async (t) => {
	const { res, err } = await get('/orders?shopId=0', { headers: { userId: 1 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /orders?shopId=1 with normal user 1 => 200', async (t) => {
	const { res, err } = await get('/orders?shopId=1', { headers: { userId: 1 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /orders?shopId=0 with normal user 2 => 200', async (t) => {
	const { res, err } = await get('/orders?shopId=0', { headers: { userId: 2 } })

	t.is(err.statusCode, 403)
	t.is(err.response.body.message, 'invalid-perms')
})

test('GET /orders?shopId=1 with normal user 2 => 200', async (t) => {
	const { res, err } = await get('/orders?shopId=1', { headers: { userId: 2 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /shops/0 with admin user => 200', async (t) => {
	const { res, err } = await get('/shops/0', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('PUT /shops/0 with admin user => 200', async (t) => {
	const { res, err } = await put('/shops/0', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /shops/1 with admin user => 200', async (t) => {
	const { res, err } = await get('/shops/1', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('PUT /shops/1 with admin user => 200', async (t) => {
	const { res, err } = await put('/shops/1', { headers: { userId: 0 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /shops/0 with normal user 1 => 200', async (t) => {
	const { res, err } = await get('/shops/0', { headers: { userId: 1 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('PUT /shops/0 with normal user 1 => 200', async (t) => {
	const { res, err } = await put('/shops/0', { headers: { userId: 1 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /shops/1 with normal user 2 => 200', async (t) => {
	const { res, err } = await get('/shops/1', { headers: { userId: 2 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('PUT /shops/1 with normal user 2 => 200', async (t) => {
	const { res, err } = await put('/shops/1', { headers: { userId: 2 } })

	t.falsy(err)
	t.is(res.statusCode, 200)
})

test('GET /shops/0 with normal user 2 => 200', async (t) => {
	const { res, err } = await get('/shops/0', { headers: { userId: 2 } })

	t.is(err.statusCode, 403)
	t.is(err.response.body.message, 'invalid-perms')
})

test('PUT /shops/0 with normal user 2 => 403 (invalid-perms)', async (t) => {
	const { res, err } = await put('/shops/0', { headers: { userId: 2 } })

	t.is(err.statusCode, 403)
	t.is(err.response.body.message, 'invalid-perms')
})

test('DELETE /shops/0 with admin user => 400', async (t) => {
	const { res, err } = await del('/shops/0', { headers: { userId: 0 } })

	t.is(err.statusCode, 400)
	t.is(err.response.body.message, 'Route acl key ":shop" is not defined')
})
