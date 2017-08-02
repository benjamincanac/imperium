<h1 align="center"><br><img src="https://user-images.githubusercontent.com/904724/28824466-5d8ece32-76c2-11e7-9410-7ef59cbc819c.png" width="500" alt="Imperium Logo"/><br><br></h1>

> Imperium is a node.js module to control your user's authorizations (ACL).

## Warning

:warning: Imperium is actually in heavy development and will be available soon :rocket:

## Installation

```
npm install --save imperium
```

## Usage

```js
const Imperium = require('imperium')

const imperium = Imperium(/* options */)

// User roles
imperium.addRoles([
  'admin',
  'user'
])

// List of user actions
imperium.addActions([
  'manageUser',
  'seeUser'
])

// Define user permissions
imperium.role('user').can([
  // '@' means itself
  { action: 'manageUser', user: '@' },
  { action: 'seeUser', user: '@' }
])

// Define admin permissions
imperium.role('admin').is('user', { user: '*' })
// '*' means all, so admin will be able to manage and see all users

// Use imperium.check(...) to secure the route
app.put('/users/:id', imperium.check([{ action: 'manageUser', user: ':id' }]), updateUser)
```

## API

### Imperium(options)

## Credits

This project has been possible thanks to [Neo9](https://github.com/neo9).

Inspired by the work of [Matthieu Oviedo](https://github.com/ovmjm).

Logo made by [Romane Forgue](https://romaneforgue.com/).

## License

MIT
