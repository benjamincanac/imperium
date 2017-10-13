<h1 align="center"><br><img src="https://user-images.githubusercontent.com/904724/28824466-5d8ece32-76c2-11e7-9410-7ef59cbc819c.png" width="400" alt="Imperium"/><br><br></h1>

> Node.js module to control your user's authorizations (ACL).

[![npm version](https://img.shields.io/npm/v/@terrajs/imperium.svg)](https://www.npmjs.com/package/@terrajs/imperium)
[![Travis](https://img.shields.io/travis/terrajs/imperium/master.svg)](https://travis-ci.org/terrajs/imperium)
[![Coverage](https://img.shields.io/codecov/c/github/terrajs/imperium/master.svg)](https://codecov.io/gh/terrajs/imperium)
[![license](https://img.shields.io/github/license/terrajs/imperium.svg)](https://github.com/terrajs/imperium/blob/master/LICENSE.md)

## Installation

```bash
npm install --save @terrajs/imperium
```

## Usage

```js
const imperium = require('@terrajs/imperium')
```

## Roles

Define the different roles of your applications.

You can use `imperium.role('...', (req) => {})` as a setter to create a role.

The function (can be `asynchronous` by returning a `Promise`) will be used to determine if your user has the role.

You can for example get your user in MongoDB and return :
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

## Actions

You can use `imperium.role('...')` as a getter in order to use the `can` and `is` functions.

```js
imperium.role('user')
	.can('seeUser', { user: '@' })
	.can('manageUser', { user: '@' }) // '@' means itself

imperium.role('admin')
	.is('user', { user: '*' }) // '*' means all, so admin can see and manage all users
```

## Middleware

You can use Imperium middleware (can / is) in any Express app.

```js
// Use imperium.can(...) to secure the route with actions
app.get('/users', imperium.can('seeUser'), ...)
app.get('/users', imperium.can(['seeUser', 'manageUser']), ...) // array acts as an AND

app.get('/users/:userId', imperium.can({ action: 'seeUser', user: ':userId' }), ...)

app.put('/users/:userId', imperium.can([{ action: 'manageUser', user: ':userId' }]), ...)

// Use imperium.is(...) to secure the route with roles
app.get('/users', imperium.is('admin', ...))
app.get('/users', imperium.is(['admin', 'user'], ...)) // array acts as an OR
```

## Credits

This project has been possible thanks to [Neo9](https://github.com/neo9).

Inspired by the work of [Matthieu Oviedo](https://github.com/ovmjm).

Logo made by [Romane Forgue](https://romaneforgue.com/).

## License

MIT
