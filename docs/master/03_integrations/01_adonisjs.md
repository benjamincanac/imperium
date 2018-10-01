---
permalink: adonisjs
category: Integrations
title: AdonisJs
---

[AdonisJs](https://adonisjs.com) is a Node.js web framework with a breath of fresh air and drizzle of elegant syntax on top of it.

## Getting Started

Install the package using the `adonis` CLI.

```bash
> adonis install adonis-imperium
```

Follow instructions that are displayed ([or read them here](https://github.com/cmty/adonis-imperium/blob/master/instructions.md)).

## Defining your authorization

Authorization must be defined inside the `start/acl.js` file. This file will be loaded only once when the server is launch.

### Roles

Define the different roles of your applications.

Use `Imperium.role('...', (ctx) => {})` to create a role.

The function will be used to determine if your user has the role (it can be `asynchronous` by returning a `Promise`).

For example, you can get your user from your database and return:

- a `Boolean` (`true` if user has the corresponding role, otherwise `false`)
- an `Object` to compare against route actions
- an `Array` of objects

```js
const Imperium = use('Imperium')

Imperium.role('Admin', ({ auth }) => {
  return auth.user.role === 'admin'
})

Imperium.role('Author', async ({ auth }) => {
  const posts = await Post.query()
    .where('author_id', auth.user.id)
    .fetch()

  return posts.toJSON().map((post) => ({ post: post.id }))
})

Imperium.role('User', async ({ auth }) => {
  return { user: auth.user.id }
})
```

When returning an `object`, the keys will be compared against user actions params.

### Actions

Use `imperium.role('...')` to get a role, and use `can` or `is` methods to give actions or inheritance from another role.

### `can(actionName, [params])`

Define a user action with its params to match against.

```js
Imperium.role('User')
  .can('updateUser', { user: '@' })
```

### `is(roleName, [params])`

Inherit role's actions and overwrite its params.

```js
Imperium.role('Admin')
  .is('User', { user: '*' }) // '*' means all, so admin can see and manage all users
```

## Usage

Adonis Imperium automaticaly share an instance of the `imperium` instance in the context of each request.
To validate the authorization of a user you simply need to extract it from the context.

```js
// Controller
async show ({ imperium, params }) {
  const post = await Post.find(params.id)

  const can = await imperium.can('showPost', { post: params.id })

  if (!can) {
    // abort 401
  }

  // ...
}
```

```js
// RouteValidator
async authorize () {
  const { imperium, params } = this.ctx

  const can = await imperium.can('showPost', { post: params.id })

  if (!can) {
    // abort 401
  }

  // ...
}
```

### Middleware

You can also use the middlewares `is` and `can` in your routes.

```js
Route.get('/posts', 'PostController.index')
  .middleware(['auth', 'is:Admin'])

Route.put('/posts/:id', 'PostController.update')
  .middleware(['auth', 'can:updatePost'])
```

You can also use AdonisJs resources:

```js
Route.resource('posts', 'PostController')
  .only(['index', 'show', 'store', 'update', 'destroy']) // .apiOnly()
  .middleware(new Map([
    [['store', 'update', 'destroy'], ['auth']],
    [['store'], ['can:storePost']],
    [['update'], ['can:updatePost']],
    [['destroy'], ['can:destroyPost']]
  ]))
  .validator(new Map([
    [['store'], ['StorePost']],
    [['update'], ['UpdatePost']]
  ]))
```

### Config

In order to configure how the `can` middleware will process the route context (like in validators or controllers) you can define functions in `config/acl.js`:

```js
module.exports = {
  updatePost: ({ params }) => ({ post: params.id }),
  destroyPost: ({ params }) => ({ post: params.id }),
  storePost: ({ params, request }) => {
    const { type } = request.post()

    return {
      type
    }
  }
}
```

### API

```js
imperium.can('Action', resource)
imperium.cannot('Action', resource)
imperium.is('Role')
imperium.isnot('Role')
```
