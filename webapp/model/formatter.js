sap.ui.define([
	] , function () {
		"use strict";

		return {

			/**
			 * Rounds the number unit value to 2 digits
			 * @public
			 * @param {string} sValue the number string to be rounded
			 * @returns {string} sValue with 2 digits rounded
			 */
			numberUnit : function (sValue) {
				if (!sValue) {
					return "";
				}
				return parseFloat(sValue).toFixed(2);
			},
			
			formatTime2: function(sTime){
				if(sTime){
					var data_app = new Date(sTime.ms);
					return  ("0" + data_app.getUTCHours()).slice(-2).toString() + ':' + ("0" + data_app.getUTCMinutes()).slice(-2).toString() ; 
				}
			},
			
			formatStato : function (sStato) {
				switch(sStato) {
				  case "D":
				    return "Error";
				    break;
				  case "A":
				    return "Success";
				    break;
				  case "R":
				    return "Warning";
				    break;
				  default:
				    return "Information";
				}
			}

		};

	}
);