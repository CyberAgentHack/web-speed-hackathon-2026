function getErrorMessage(err) {
	try {
		if (err instanceof Error) {
			let { stack } = err;
			if (typeof stack == "string" && stack !== "") return stack;
		}
		let { message } = err;
		if (typeof message == "string" && message !== "") return message;
	} catch {}
	return "Unknown error";
}
export { getErrorMessage as t };
