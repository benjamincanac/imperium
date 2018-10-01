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

Authorization must be defined inside the `start/acl.js` file. This file will be loaded only once when the server is launched.

### Roles

The documentation is available [here](/docs/master/defining-authorizations#roles).

Example:

```js
const Imperium = use('Imperium')

const Post = use('App/Models/Post')

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

### Actions

The documentation is available [here](/docs/master/defining-authorizations#actions).

Example:

```js
Imperium.role('User')
  .can('seeUser', { user: '@' })

Imperium.role('Admin')
  .is('User', { user: '*' })
```

## Protecting your routes

Adonis Imperium automaticaly share an `imperium` instance in the context of each request with the `ImperiumInit` middleware.

To validate the authorization of a user you simply need to extract it from the context.

```js
// Controller
async show ({ imperium, params }) {
  const post = await Post.find(params.id)

  const can = await imperium.can('showPost', { post: params.id })

  if (!can) {
    // abort 401
  }
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
}
```

### Middleware

You can also use the middlewares `is` and `can` in your routes.

```js
Route.put('/posts/:id', 'PostController.update')
  .middleware(['auth', 'can:updatePost'])

Route.delete('/posts/:id', 'PostController.destroy')
  .middleware(['auth', 'is:Admin'])
```

You can also use Adonis resources:

```js
Route.resource('posts', 'PostController')
  .only(['index', 'show', 'store', 'update', 'destroy']) // .apiOnly()
  .middleware(new Map([
    [['store', 'update', 'destroy'], ['auth']],
    [['store'], ['can:storePost']],
    [['update'], ['can:updatePost']],
    [['destroy'], ['is:Admin']]
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
