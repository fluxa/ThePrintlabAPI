function e(verbose, error) {
	return {
		verbose: verbose,
		error: error
	}
}

exports.ClientNotFound = function(verbose) {
	var el = e(verbose, 'ClientNotFound');
	return el;
}

exports.MissingParameters = function(verbose) {
	var el = e(verbose, 'MissingParameters');
	return el;
}

exports.AddressNotFound = function(verbose) {
	var el = e(verbose, 'AddressNotFound');
	return el;
}

exports.OrderNotFound = function(verbose) {
	var el = e(verbose, 'OrderNotFound');
	return el;
}

exports.CouponConsumed = function(verbose) {
	var el = e(verbose, 'CouponConsumed');
	return el;
}

exports.CannotSaveDocument = function(verbose) {
	var el = e(verbose, 'CannotSaveDocument');
	return el;
}