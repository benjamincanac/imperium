import * as _ from 'lodash'
import * as assert from 'assert'

import AuthorizationError from './authorization-error'
import { ImperiumRole } from './role'

export class Imperium {
	public AuthorizationError = AuthorizationError

	private roles = {}
	private context = ['params', 'query', 'headers', 'body', 'session']

	public role(roleName: string, getAcl?): any {
		if (!this.roles[roleName] && getAcl) return this.addRole(roleName, getAcl)

		return new ImperiumRole(this, roleName)
	}

	// check if user has role
	public is(roleName: string) {
		return async (req, res, next) => {
			try {
				const role = this.roles[roleName]
				const acl = await role.getAcl(req)

				if (!acl) return next(new AuthorizationError(403, 'invalid-perms'))

				return next()
			} catch (err) {
				return next(err)
			}
		}
	}

	public can(actions: string | object | object[]) {
		return async (req, res, next) => {
			try {
				const routePerms = this.evaluateRouteActions(req, actions, this.context)

				const roles: any = _.chain(this.roles)
					.mapValues((value, role) => _.merge({}, value, { role }))
					.values()
					.filter((role: any) => _.intersectionBy(role.actions, routePerms, 'action').length)
					.value()

				const userPerms = await this.evaluateUserActions(req, roles)

				if (!this.checkPerms(routePerms, userPerms)) return next(new AuthorizationError(403, 'invalid-perms'))

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

	private evaluateRouteActions(req, actions: string | object | object[], context) {
		let validActions = []

		if (typeof actions === 'string') validActions.push({ action: actions })
		else if (Array.isArray(actions)) validActions = actions
		else if (typeof actions === 'object') validActions.push(actions)
		else throw new Error('invalid-actions-format')

		return validActions
			.filter((action) => !action.when || action.when(req))
			.map((action) => {
				return _.chain(action)
					.mapValues((expr) => this.evaluateRouteAction(req, expr, context))
					.omit('when')
					.value()
			})
	}

	private evaluateRouteAction(req, expr, context) {
		if (!(typeof expr === 'string' && expr[0] === ':')) return expr

		const exprKey = expr.substr(1)

		for (const key of context) {
			if (req[key] && req[key][exprKey]) {
				return req[key][exprKey]
			}
		}

		return null
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

			if (typeof evaluatedAction[key] === 'undefined') {
				throw new AuthorizationError(400, `User acl key "${key}" in "${context.role}" role is not defined`)
			}
		})

		return evaluatedAction
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

export type AuthorizationError = AuthorizationError

export default new Imperium()
