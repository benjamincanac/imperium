class HttpError extends Error {
	public statusCode

	constructor(statusCode: number, m: string) {
		super(m)

		this.statusCode = statusCode || 500
	}
}

export default HttpError
