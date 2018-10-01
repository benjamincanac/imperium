---
permalink: protecting-routes
category: Getting Started
title: Protecting Routes
---

## Door

In order to protect your route, you need to get an instance of `ImperiumDoor` with the context of the current route by using the `door` method:

Example with an Express middleware:

```js
const imperium = require('imperium')

function (req, res, next) {
  req.imperium = imperium.door(req)

  next()
}
```

The context passed to the door, in our example `req`, will be used to process the role fonctions defined earlier.

Once your door is created you can use the `can` and `is` methods to validate your route:

### `can(actionName, [params])`

Check if a user can do this action.

Example with an Express controller:

```js
function (req, res, next) {
  if (req.imperium.cannot('seeUser', { user: req.params.userId })) throw ...
}
```

### `cannot(actionName, [params])`

Inverse of `can` method, it can be used to ensure that your code is affirmative.

### `is(roleName)`

Check if a user has the role.

Example with an Express controller:

```js
function (req, res, next) {
  if (req.imperium.isnot('admin')) throw ...
}
```

### `isnot(roleName)`

Inverse of `is` method, it can be used to ensure that your code is affirmative.
