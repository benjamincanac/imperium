const _ = require('lodash')
const assert = require('assert')

const ImperiumRole = require('./role')
const UnauthorizedError = require('./unauthorized-error')

const EXPR_REGEXP = /:[A-Za-z0-9_]+/g

class Imperium {
	constructor() {
		this.roles = {}
		this.context = ['params', 'query', 'headers', 'body']
	}

	role(roleName, getAcl) {
		if (!this.roles[roleName] && getAcl) this.addRole(roleName, getAcl)

		return new ImperiumRole(this, roleName)
	}

	// check if user has role
	is(roleName) {
		const roleNames = Array.isArray(roleName) ? roleName : [roleName]

		return async (req, res, next) => {
			try {
				const promises = roleNames.map(async (name) => {
					const role = this.roles[name]

					if (!role) throw new UnauthorizedError('invalid-role', 400, { role: name })

					const acl = await role.getAcl(req)

					return !!acl
				})

				const hasRoles = await Promise.all(promises)

				if (hasRoles.indexOf(true) === -1) return next(new UnauthorizedError('invalid-perms', 403))

				return next()
			} catch (err) {
				return next(err)
			}
		}
	}

	// check if user can do actions
	can(actions) {
		let validActions = Array.isArray(actions) ? actions : [actions]

		validActions = validActions.map((validAction) => {
			return typeof validAction === 'string' ? { action: validAction } : validAction
		})

		return async (req, res, next) => {
			try {
				const routePerms = this.evaluateRouteActions(req, validActions, this.context)

				const roles = _.chain(this.roles)
					.mapValues((value, role) => _.merge({}, value, { role }))
					.values()
					.filter((role) => _.intersectionBy(role.actions, routePerms, 'action').length)
					.value()

				const userPerms = await this.evaluateUserActions(req, roles)

				if (!this.checkPerms(routePerms, userPerms)) return next(new UnauthorizedError('invalid-perms', 403))

				return next()
			} catch (err) {
				return next(err)
			}
		}
	}

	addRole(roleName, getAcl) {
		assert(!this.roles[roleName], `Role ${roleName} already exists`)

		this.roles[roleName] = { actions: [], getAcl }
	}

	evaluateRouteActions(req, actions, context) {
		return actions
			.filter((action) => !action.when || action.when(req))
			.map((action) => {
				return _.chain(action)
					.mapValues((expr, key) => this.evaluateRouteAction(req, expr, key, context))
					.omit('when')
					.value()
			})
	}

	evaluateRouteAction(req, expr, key, context) {
		// expr does not contain ':'
		if (!(typeof expr === 'string' && expr.indexOf(':') !== -1)) return expr

		// alias shortcut ex: { user: ':' } => { user: ':user' }
		if (expr === ':') expr += key

		let evaluatedExpr = expr
		// ex: ':owner/:name' => [ ':owner', ':name' ]
		const exprKeys = expr.match(EXPR_REGEXP)

		for (let exprKey of exprKeys) {
			exprKey = exprKey.substr(1)
			// context: ['params', 'body', ...]
			for (const contextKey of context) {
				if (req[contextKey] && req[contextKey][exprKey]) {
					evaluatedExpr = evaluatedExpr.replace(`:${exprKey}`, req[contextKey][exprKey])
					break
				}
			}
		}

		const exprKeysLeft = evaluatedExpr.match(EXPR_REGEXP)

		if (exprKeysLeft) {
			throw new UnauthorizedError(`Route acl key${exprKeysLeft.length > 1 ? 's' : ''} "${exprKeysLeft.map((exprKeyLeft) => exprKeyLeft.substr(1)).join(', ')}" ${exprKeysLeft.length > 1 ? 'are' : 'is'} not defined`, 400)
		}

		return evaluatedExpr
	}

	async evaluateUserActions(req, roles) {
		const evaluatedActions = []

		const aclPromises = roles.map(async (role) => {
			const acl = await role.getAcl(req)

			if (!acl) return

			role.actions.forEach((action) => {
				evaluatedActions.push(_.merge({}, { action: action.action }, this.evaluateUserAction(action.params, acl)))
			})
		})

		await Promise.all(aclPromises)

		return evaluatedActions
	}

	evaluateUserAction(action, context) {
		const evaluatedAction = {}

		_.forIn(action, (value, key) => {
			if (value === '@') evaluatedAction[key] = context[key]
			else if (value[0] === '@') evaluatedAction[key] = context[value.substr(1)]
			else evaluatedAction[key] = value

			// TODO: Check if this line is relevant
			// if (typeof evaluatedAction[key] === 'undefined') throw new UnauthorizedError(400, `User acl key "${key}" in "${context.role}" role is not defined`)
		})

		return evaluatedAction
	}

	matchPerm(routePerm, userPerm) {
		// Get all params from route and user
		const keys = _.chain(_.keys(routePerm)).concat(_.keys(userPerm)).uniq().value()

		for (const key of keys) {
			const userPermValue = userPerm[key]
			const routePermValue = routePerm[key] || '*'

			if (userPermValue !== '*') {
				if (Array.isArray(userPermValue)) {
					if (userPermValue.indexOf(routePermValue) === -1) return false
				} else if (userPermValue !== routePermValue) return false
			}
		}

		return true
	}

	// check if user has every perm required by the route
	checkPerms(routePerms, userPerms) {
		return _.every(routePerms, (routePerm) => {
			return _.some(userPerms, (userPerm) => {
				return this.matchPerm(routePerm, userPerm)
			})
		})
	}
}

module.exports = new Imperium()
module.exports.Imperium = Imperium
module.exports.ImperiumRole = ImperiumRole
module.exports.UnauthorizedError = UnauthorizedError
