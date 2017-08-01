const _ = require('lodash')
const assert = require('assert')

class ImperiumRole {
  constructor(imperium, roleName) {
    this.imperium = imperium
    this.roleName = roleName
    this.role = this.imperium.roles[this.roleName]

    assert(this.role, `Role ${this.roleName} does not exist`)
  }

  can(perms) {
    // check if actions are valid
    perms.forEach((perm) => {
      const actionName = perm.action

      assert(this.imperium.actions[actionName], `Action ${actionName} does not exist`)

      this.role.perms.push(perm)
    })

    return this
  }

  isParentOf(childRoleName, childRolePerm) {
    const child = this.imperium.roles[childRoleName]

    assert(child, `Role ${childRoleName} does not exist`)

    this.role.children.push({ role: childRoleName, perm: childRolePerm })

    return this
  }
}

class Imperium {
  constructor(options) {
    this.roles = []
    this.actions = []
    this.getUserAcl = options.getUserAcl
    this.context = options.context || ['params', 'query', 'headers', 'body', 'session']

    assert(typeof this.getUserAcl === 'function', `getUserAcl must be defined`)
  }

  addRoles(roleNames) {
    roleNames.forEach((roleName) => {
      assert(!this.roles[roleName], `Role ${roleName} already exists`)

      this.roles[roleName] = { children: [], perms: [] }
    })
  }

  addActions(actionNames) {
    actionNames.forEach((actionName) => {
      assert(!this.actions[actionName], `Action ${actionName} already exists`)

      this.actions[actionName] = true
    })
  }

  evaluateUserPerm(perm, context) {
    _.forIn(perm, (value, key) => {
      if (value === '@') perm[key] = context[key]
      else if (value[0] === '@') perm[key] = context[value.substr(1)]
    });

    return perm;
  }

  evaluateUserPerms(userAcl) {
    const evaluatedPerms = []

    userAcl.forEach((acl) => {
      const perms = this.roles[acl.role].perms

      perms.forEach((perm) => {
        evaluatedPerms.push(this.evaluateUserPerm(perm, acl))
      })
    })

    return evaluatedPerms
  }

  evaluateRoutePerm(req, expr, context) {
    if (!(typeof expr === 'string' && expr[0] === ':')) return expr

    const exprKey = expr.substr(1)

    for (const key of context) {
      if (req[key] && req[key][exprKey]) {
        return req[key][exprKey]
      }
    }

    return null
  }

  evaluateRoutePerms(req, perms, context) {
    return (perms || [])
      .filter((perm) => !perm.when || perm.when(req))
      .map((perm) => {
        return _.chain(perm)
          .mapValues((expr) => this.evaluateRoutePerm(req, expr, context))
          .omit('when')
          .value()
      })
  }

  // TODO
  getUserAclChildren(userAcl) {
    return userAcl
  }

  matchPerm(routePerm, userPerm) {
    for (const perm in routePerm) {
      const userPermValue = userPerm[perm]
      const routePermValue = routePerm[perm]

      if (userPermValue) {
        if (userPermValue === 'object' && userPermValue.indexOf(routePermValue) === -1) return false;
        else if (userPermValue !== routePermValue) return false;
      }
    }

    return true;
  }

  // check if user has every perm required by the route
  checkPerms(routePerms, userPerms) {
    return _.every(routePerms, (routePerm) => {
      return _.some(userPerms, (userPerm) => {
        return this.matchPerm(routePerm, userPerm)
      })
    })
  }

  check(perms, context) {
    context = context || this.context

    return async (req, res, next) => {
      const userAcl = await this.getUserAcl(req)
      const userAclChildren = this.getUserAclChildren(userAcl)
      const userPerms = this.evaluateUserPerms(userAclChildren)
      const routePerms = this.evaluateRoutePerms(req, perms, context)

      if (!this.checkPerms(routePerms, userPerms)) return next(new Error('invalid-perms'));

      return next()
    }
  }

  role(roleName) {
    return new ImperiumRole(this, roleName)
  }
}

module.exports = (options) => new Imperium(options)

module.exports.Imperium = Imperium