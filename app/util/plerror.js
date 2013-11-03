
/*!
* Module dependencies.
*/

var util = require('util')

// Error codes
exports.c = {
	ClientNotFound: 'ClientNotFound',
	AddressNotFound: 'AddressNotFound',
	OrderNotFound: 'OrderNotFound',
	CouponConsumed: 'CouponConsumed',
	CouponInvalid: 'CouponInvalid',
	DBError: 'DatabaseError',
	CannotVerifyPayment: 'CannotVerifyPayment',
	MissingParameters : 'MissingParameters'
}


exports.e = function(code, verbose) {
	return {error: code, verbose: verbose};
}

exports.throw = function(code, verbose, res) {
	res.send(400, exports.e(code, verbose));
}



// function e(verbose, error, err) {
// 	console.log(util.format('%s => %s',verbose, err || error));
// 	return {
// 		verbose: verbose,
// 		error: error
// 	}
// }

// exports.ClientNotFound = function(verbose, err) {
// 	var el = e(verbose, 'ClientNotFound', err);
// 	return el;
// }

// exports.MissingParameters = function(verbose, err) {
// 	var el = e(verbose, 'MissingParameters', err);
// 	return el;
// }

// exports.AddressNotFound = function(verbose, err) {
// 	var el = e(verbose, 'AddressNotFound', err);
// 	return el;
// }

// exports.OrderNotFound = function(verbose, err) {
// 	var el = e(verbose, 'OrderNotFound', err);
// 	return el;
// }

// exports.CouponConsumed = function(verbose, err) {
// 	var el = e(verbose, 'CouponConsumed', err);
// 	return el;
// }

// exports.CannotSaveDocument = function(verbose, err) {
// 	var el = e(verbose, 'CannotSaveDocument', err);
// 	return el;
// }

// exports.CannotVerifyPayment = function(verbose, err) {
// 	var el = e(verbose, 'CannotVerifyPayment', err);
// 	return el;
// }
