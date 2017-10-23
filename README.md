<h1 align="center"><br><img src="https://user-images.githubusercontent.com/904724/28824466-5d8ece32-76c2-11e7-9410-7ef59cbc819c.png" width="400" alt="Imperium"/><br><br></h1>

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

You can use `imperium.role('...', (req) => {})` as a setter to create a role.

The function (can be `asynchronous` by returning a `Promise`) will be used to determine if your user has the role.

For example, you can get your user in MongoDB and return:
- a `Boolean` (`true` if user has the corresponding role, otherwise `false`)
- an `Object` to compare with the route actions

```js
imperium.role('admin', async (req) => {
	return req.session.role === 'admin'
})

imperium.role('user', async (req) => {
	return { user: req.session.userId }
})
```

When returning an `object`, the keys will be used to match against user actions params.

## Actions

You can use `imperium.role('...')` as a getter in order to use `can` and `is` functions.

- `can(actionName, [params])`: Define user action with its params to match against
- `is(roleName, [params])`: Inherit role's actions and overwrite its params

```js
imperium.role('user')
	.can('seeUser', { user: '@' })
	.can('manageUser', { user: '@' }) // '@' means itself

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
