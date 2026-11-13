sap.ui.define([
		"zovertime_process/SanofiOvertmeProcess/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("zovertime_process.SanofiOvertmeProcess.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);