import * as _ from 'lodash'
import * as assert from 'assert'

import { ImperiumRole } from './role'

export class Imperium {
	private roles = {}
	private actions = {}
	private getUserAcl
	private context = ['params', 'query', 'headers', 'body', 'session']

	constructor(options) {
		this.getUserAcl = options.getUserAcl
		this.context = options.context || this.context

		assert(typeof this.getUserAcl === 'function', `getUserAcl must be defined`)
	}

	public addRoles(roleNames) {
		roleNames.forEach((roleName) => {
			assert(!this.roles[roleName], `Role ${roleName} already exists`)

			this.roles[roleName] = { children: [], perms: [] }
		})
	}

	public addActions(actionNames) {
		actionNames.forEach((actionName) => {
			assert(!this.actions[actionName], `Action ${actionName} already exists`)

			this.actions[actionName] = true
		})
	}

	public check(perms, context?) {
		context = context || this.context

		return async (req, res, next) => {
			try {
				const userAcl = await this.getUserAcl(req)
				const userAclChildren = this.getUserAclChildren(userAcl)
				const userPerms = this.evaluateUserPerms(userAclChildren)
				const routePerms = this.evaluateRoutePerms(req, perms, context)

				if (!this.checkPerms(routePerms, userPerms)) return next(new Error('invalid-perms'))

				return next()
			} catch (err) {
				return next(err)
			}
		}
	}

	public role(roleName) {
		return new ImperiumRole(this, roleName)
	}

	private evaluateUserPerm(perm, context) {
		const evaluatedPerm = {}

		_.forIn(perm, (value, key) => {
			if (value === '@') evaluatedPerm[key] = context[key]
			else if (value[0] === '@') evaluatedPerm[key] = context[value.substr(1)]
			else evaluatedPerm[key] = value

			if (typeof evaluatedPerm[key] === 'undefined') {
				throw new Error(`User acl key "${key}" in "${context.role}" role is not defined`)
			}
		})

		return evaluatedPerm
	}

	private evaluateUserPerms(userAcl) {
		const evaluatedPerms = []

		userAcl.forEach((acl) => {
			const perms = this.roles[acl.role].perms

			perms.forEach((perm) => {
				evaluatedPerms.push(this.evaluateUserPerm(perm, acl))
			})
		})

		return evaluatedPerms
	}

	private evaluateRoutePerm(req, expr, context) {
		if (!(typeof expr === 'string' && expr[0] === ':')) return expr

		const exprKey = expr.substr(1)

		for (const key of context) {
			if (req[key] && req[key][exprKey]) {
				return req[key][exprKey]
			}
		}

		return null
	}

	private evaluateRoutePerms(req, perms, context) {
		return (perms || [])
			.filter((perm) => !perm.when || perm.when(req))
			.map((perm) => {
				return _.chain(perm)
					.mapValues((expr) => this.evaluateRoutePerm(req, expr, context))
					.omit('when')
					.value()
			})
	}

	private getUserAclChildren(userAcl, childrenAcl = []) {
		userAcl.forEach((acl) => {
			childrenAcl.push(acl)

			const aclRole = this.roles[acl.role]

			if (aclRole) {
				const children = aclRole.children

				if (children.length) this.getUserAclChildren(children, childrenAcl)
			}
		})

		return childrenAcl
	}

	private matchPerm(routePerm, userPerm) {
		// get all params from route and user
		const keys = _.chain(_.keys(routePerm)).concat(_.keys(userPerm)).uniq().without('action').value()

		for (const key of keys) {
			const userPermValue = userPerm[key]
			const routePermValue = routePerm[key] || '*'

			if (userPermValue !== '*') {
				if (Array.isArray(userPermValue) && userPermValue.indexOf(routePermValue) === -1) return false
				else if (userPermValue !== routePermValue) return false
			}
		}

		return true
	}

	// check if user has every perm required by the route
	private checkPerms(routePerms, userPerms) {
		return _.every(routePerms, (routePerm) => {
			return _.some(userPerms, (userPerm) => {
				return this.matchPerm(routePerm, userPerm)
			})
		})
	}
}

// export default (options) => new Imperium(options)

// module.exports = (options) => new Imperium(options)
