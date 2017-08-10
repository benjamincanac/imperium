export default class UnauthorizedError extends Error {
	public statusCode
	public context

	constructor(statusCode: number, m: string, context?: object) {
		super(m)

		this.statusCode = statusCode || 500
		this.context = context || {}

		Object.setPrototypeOf(this, UnauthorizedError.prototype)
	}
}
