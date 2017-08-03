import * as assert from 'assert'
import { merge } from 'lodash'

export class ImperiumRole {
	private role

	constructor(private imperium, private roleName) {
		this.role = this.imperium.roles[this.roleName]

		assert(this.role, `Role ${this.roleName} does not exist`)
	}

	public can(perms) {
		perms.forEach((perm) => {
			const actionName = perm.action

			assert(this.imperium.actions[actionName], `Action ${actionName} does not exist`)

			this.role.perms.push(perm)
		})

		return this
	}

	public is(childRoleName, childRolePerm) {
		const child = this.imperium.roles[childRoleName]

		assert(child, `Role ${childRoleName} does not exist`)

		this.role.children.push(merge({ role: childRoleName }, childRolePerm))

		return this
	}
}
