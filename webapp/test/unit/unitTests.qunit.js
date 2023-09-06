/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"whs/delivery/consolidation/whsdeliveryconsolidation/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});