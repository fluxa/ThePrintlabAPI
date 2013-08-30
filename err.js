function e(verbose, error) {
	return {
		verbose: verbose,
		error: error
	}
}
exports.ClientNotFound = function(verbose) {
	console.log('err.js --> verbose');
	console.log(verbose);
	var el = e(verbose, 'ClientNotFound');

	console.log(el);
	return el;
}