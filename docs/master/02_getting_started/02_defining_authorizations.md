---
permalink: defining-authorizations
category: Getting Started
title: Defining Authorizations
---

## Usage

```js
const imperium = require('imperium')
```

## Roles

Define the different roles of your applications.

Use `imperium.role('...', (ctx) => {})` to create a role.

The function will be used to determine if your user has the role (it can be `asynchronous` by returning a `Promise`).

This function needs to return:

- a `boolean` (`true` if user has the corresponding role, otherwise `false`)
- an `object` to compare against route actions
- an `array` of objects, in this case at least one needs to match

```js
imperium.role('admin', async ({ session }) => {
  return session.role === 'admin'
})

imperium.role('user', async ({ session }) => {
  return { user: session.user.id }
})

imperium.role('author', async ({ session }) => {
  // Fetch posts from DB which belongs to current session
  const posts = await Posts.find({ author_id: session.user.id })
  // Returns an array of posts
  return posts.map((post) => ({ post: post.id }))
})
```

When returning an `object` or an `array`, the keys will be compared against user actions params.

## Actions

Use `imperium.role('...')` to get a role, and use `can` or `is` methods to give actions or inherit from another role.

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

Once your ACLs are defined, you can learn how to protect your routes [here](03_protecting_routes.md).
