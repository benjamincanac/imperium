import * as _ from 'lodash'
import * as assert from 'assert'

import UnauthorizedError from './unauthorized-error'
import ImperiumRole from './role'

const EXPR_REGEXP = /:[A-Za-z0-9_]+/g

class Imperium {
	public UnauthorizedError = UnauthorizedError

	private roles = {}
	private context = ['params', 'query', 'headers', 'body']

	public role(roleName: string, getAcl?): any {
		if (!this.roles[roleName] && getAcl) this.addRole(roleName, getAcl)

		return new ImperiumRole(this, roleName)
	}

	// check if user has role
	public is(roleName: string | string[]) {
		const roleNames: string[] = Array.isArray(roleName) ? roleName : [roleName]

		return async (req, res, next) => {
			try {
				const promises = roleNames.map(async (name) => {
					const role = this.roles[name]

					if (!role) throw new UnauthorizedError(400, 'invalid-role', { role: name })

					const acl = await role.getAcl(req)

					return !!acl
				})

				const hasRoles = await Promise.all(promises)

				if (hasRoles.indexOf(true) === -1) return next(new UnauthorizedError(403, 'invalid-perms'))

				return next()
			} catch (err) {
				return next(err)
			}
		}
	}

	public can(actions: string | object | object[]) {
		let validActions: any[] = Array.isArray(actions) ? actions : [actions]

		validActions = validActions.map((validAction) => {
			return typeof validAction === 'string' ? { action: validAction } : validAction
		})

		return async (req, res, next) => {
			try {
				const routePerms = this.evaluateRouteActions(req, validActions, this.context)

				const roles: any = _.chain(this.roles)
					.mapValues((value, role) => _.merge({}, value, { role }))
					.values()
					.filter((role: any) => _.intersectionBy(role.actions, routePerms, 'action').length)
					.value()

				const userPerms = await this.evaluateUserActions(req, roles)

				if (!this.checkPerms(routePerms, userPerms)) return next(new UnauthorizedError(403, 'invalid-perms'))

				return next()
			} catch (err) {
				return next(err)
			}
		}
	}

	private addRole(roleName, getAcl) {
		assert(!this.roles[roleName], `Role ${roleName} already exists`)

		this.roles[roleName] = { actions: [], getAcl }
	}

	private evaluateRouteActions(req, actions: any[], context) {
		return actions
			.filter((action) => !action.when || action.when(req))
			.map((action) => {
				return _.chain(action)
					.mapValues((expr, key) => this.evaluateRouteAction(req, expr, key, context))
					.omit('when')
					.value()
			})
	}

	private evaluateRouteAction(req, expr, key, context) {
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
			throw new UnauthorizedError(400, `Route acl key${exprKeysLeft.length > 1 ? 's' : ''} "${exprKeysLeft.map((exprKeyLeft) => exprKeyLeft.substr(1)).join(', ')}" ${exprKeysLeft.length > 1 ? 'are' : 'is'} not defined`)
		}

		return evaluatedExpr
	}

	private async evaluateUserActions(req, roles) {
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

	private evaluateUserAction(action, context) {
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

	private matchPerm(routePerm, userPerm) {
		// get all params from route and user
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
	private checkPerms(routePerms, userPerms) {
		return _.every(routePerms, (routePerm) => {
			return _.some(userPerms, (userPerm) => {
				return this.matchPerm(routePerm, userPerm)
			})
		})
	}
}

export { Imperium, ImperiumRole, UnauthorizedError }

export default new Imperium()
