define(function() {

	/***************
	 *
	 * Uiid.js
	 */
	var S4 = function() {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	};
	var uuid = function uuid() {
		return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
	}
	/**************
	 *
	 * Inherit.js
	 */
	var inherits = function(ctor, superCtor) {
		ctor.super_ = superCtor;
		ctor.prototype = Object.create(superCtor.prototype, {
			constructor : {
				value : ctor,
				enumerable : false,
				writable : true,
				configurable : true
			}
		});
	};
	return {
		uuid : uuid,
		inherits : inherits
	}
})