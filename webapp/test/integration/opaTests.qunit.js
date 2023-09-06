/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require([
		"whs/delivery/consolidation/whsdeliveryconsolidation/test/integration/AllJourneys"
	], function() {
		QUnit.start();
	});
});