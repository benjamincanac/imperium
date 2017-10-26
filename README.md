<h1 align="center"><br><img src="https://user-images.githubusercontent.com/904724/32060625-969d8f74-ba6f-11e7-8f4e-29c9fdf3da33.gif" width="400" alt="Imperium Logo"/><br><img src="https://user-images.githubusercontent.com/904724/32060809-2873e68c-ba70-11e7-881b-53ade21cef8d.png" width="260" alt="Imperium"/><br></h1>

> Node.js module to control your user's authorizations (ACL), see a [simple demo](https://imperium.glitch.me).

[![npm version](https://img.shields.io/npm/v/imperium.svg)](https://www.npmjs.com/package/imperium)
[![Travis](https://img.shields.io/travis/terrajs/imperium/master.svg)](https://travis-ci.org/terrajs/imperium)
[![Coverage](https://img.shields.io/codecov/c/github/terrajs/imperium/master.svg)](https://codecov.io/gh/terrajs/imperium)
[![license](https://img.shields.io/github/license/terrajs/imperium.svg)](https://github.com/terrajs/imperium/blob/master/LICENSE.md)

## Installation

```bash
npm install --save imperium
```

## Usage

```js
const imperium = require('imperium')
```

## Roles

Define the different roles of your applications.

Use `imperium.role('...', (req) => {})` to create a role.

The function will be used to determine if your user has the role (it can be `asynchronous` by returning a `Promise`).

For example, you can get your user in MongoDB and return:
- a `Boolean` (`true` if user has the corresponding role, otherwise `false`)
- an `Object` to compare against route actions

```js
imperium.role('admin', async (req) => {
	return req.session.role === 'admin'
})

imperium.role('user', async (req) => {
	return { user: req.session.userId }
})
```

When returning an `object`, the keys will be compared against user actions params.

## Actions

Use `imperium.role('...')` to get a role, and use `can` or `is` methods to give actions or inheritance from another role.

### `can(actionName, [params])`

Define a user action with its params to match against.

```js
imperium.role('user')
	.can('seeUser', { user: '@' })
	.can('manageUser', { user: '@' }) // '@' means itself
```

### `is(roleName, [params])`

Inherit role's actions and overwrite its params.

```js
imperium.role('admin')
	.is('user', { user: '*' }) // '*' means all, so admin can see and manage all users
```

## Middleware

You can use Imperium middleware (`can` / `is`) in any [Express](https://github.com/expressjs/express) app.

### `can(actions)`

Secure a route by checking user's actions.

`actions` should be an `action` or an `array` of `action`, giving an array will act as and `AND` operator.

An `action` should look like this:
- `action`: `string`, the user action, defined in the user role
- `[key]`: `string`, expression to be matched against user's ACL

If you give a `string` as action, it will be transformed to the `action` schema (ex: `'seeUser'` -> `{ action: 'seeUser' }`)

The keys other than `action`, will be interpolated from `req.params`, `req.query` and `req.body`.


Example:

```js
// Verify that connected user can see all users
// By omiting the `user` property, it will be defaulted as `user`: '*'
app.get('/users', imperium.can('seeUser'), ...)

// Verify that connected user can see AND manage all users
app.get('/users', imperium.can(['seeUser', 'manageUser']), ...)

// Only connected user can see itself or admin
// Ex: /users/23 will check the user ACL to be { user: '23' }
app.get('/users/:userId', imperium.can({ action: 'seeUser', user: ':userId' }), ...)

app.put('/users/:userId', imperium.can([{ action: 'manageUser', user: ':userId' }]), ...)
```

### `is(roles)`

Secure a route by checking user's role.

`roles` should be an `string` or an `array` of `string`, giving an array will act as and `OR` operator.

Example:

```js
// Only an admin will be able to call this route
app.get('/users', imperium.is('admin', ...))

// Only an admin OR user will be able to call this route
app.get('/users', imperium.is(['admin', 'user'], ...))
```

## Credits

This project has been possible thanks to [Neo9](https://github.com/neo9).

Inspired by the work of [Matthieu Oviedo](https://github.com/ovmjm).

Logo made by [Romane Forgue](https://romaneforgue.com/).

## License

MIT
