/*global location history */
sap.ui.define([
		"zovertime_process/SanofiOvertmeProcess/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"zovertime_process/SanofiOvertmeProcess/model/formatter",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/MessageToast",
		"sap/m/MessageBox",
		"sap/m/Dialog",
		"sap/m/library",
		"sap/m/Button",
		"sap/m/Text"
	], function (BaseController, JSONModel, formatter, Filter, FilterOperator,MessageToast,MessageBox,Dialog,mobileLibrary,Button,Text) {
		"use strict";

		return BaseController.extend("zovertime_process.SanofiOvertmeProcess.controller.Worklist", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit : function () {
				
				// shortcut for sap.m.ButtonType
				this.ButtonType = mobileLibrary.ButtonType;
			
				// shortcut for sap.m.DialogType
				this.DialogType = mobileLibrary.DialogType;
				
			//	sap.ui.getCore().getConfiguration().setLanguage("it-IT");
				
				var oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("table");

				// Put down worklist table's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the table is
				// taken care of by the table itself.
				iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
				this._oTable = oTable;
				// keeps the search state
				this._aTableSearchState = [];

				// Model used to manipulate control states
				oViewModel = new JSONModel({
					worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
					shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
					shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
					shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
					tableNoDataText : this.getResourceBundle().getText("tableNoDataText"),
					tableBusyDelay : 0,
					Totale: 0,
					Richiesto: 0,
					Approvato: 0,
					Rifiutato: 0,
					DaAutorizzare: 0
				});
				this.setModel(oViewModel, "worklistView");
				
				this._mFilters = {
					"Richiesto": [new Filter("Status", FilterOperator.EQ, "R")],
					"Approvato": [new Filter("Status", FilterOperator.EQ, "A")],
					"Rifiutato": [new Filter("Status", FilterOperator.EQ, "D")],
					"DaAutorizzare": [new Filter("Status", FilterOperator.EQ, "")],
					"all": []
				};
				this._sStatusFilterKey = "all";
				this._aCounterFilters = [];
				
				
				
				var oModelData      = new JSONModel();
				var oOggi           = new Date();
				var oMesePrecedente = new Date(oOggi.getTime());
				var iMeseCorrente   = oMesePrecedente.getMonth();
				oMesePrecedente.setMonth(iMeseCorrente - 1);
				oModelData.setData({
					dateValue: oMesePrecedente
				});
				this.getView().setModel(oModelData,"DataModel");
				this._loadStatusCounters();

				// Make sure, busy indication is showing immediately so there is no
				// break after the busy indication for loading the view's meta data is
				// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
				oTable.attachEventOnce("updateFinished", function(){
					// Restore original busy indicator delay for worklist's table
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				});
				
				
			    // disable checkboxes
	    		var vw = this.getView();
	    // disable checkboxes
		    var tbl = vw.byId('table');
		    tbl.addDelegate({
		      onAfterRendering: function() {
		        var header = this.$().find('thead');
		        var selectAllCb = header.find('.sapMCb');
		        selectAllCb.remove();
		      }
		    }, tbl);
        
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Triggered by the table's 'updateFinished' event: after new table
			 * data is available, this handler method updates the table counter.
			 * This should only happen if the update was successful, which is
			 * why this handler is attached to 'updateFinished' and not to the
			 * table's list binding's 'dataReceived' method.
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */
			onQuickFilter: function(oEvent) {
				this._sStatusFilterKey = oEvent.getParameter("selectedKey") || "all";
				this._oTable.getBinding("items").filter(this._getTableFilters());
			},

			_getTableFilters: function() {
				return this._aCounterFilters.concat(this._mFilters[this._sStatusFilterKey] || []);
			},

			_loadStatusCounters: function() {
				this.getOwnerComponent().getModel().read("/overtimeSet", {
					filters: this._aCounterFilters,
					success: function(oData) {
						var oCounts = {
							Totale: 0,
							Richiesto: 0,
							Approvato: 0,
							Rifiutato: 0,
							DaAutorizzare: 0
						};

						(oData.results || []).forEach(function(oRequest) {
							oCounts.Totale++;
							switch (oRequest.Status) {
								case "R": oCounts.Richiesto++; break;
								case "A": oCounts.Approvato++; break;
								case "D": oCounts.Rifiutato++; break;
								default: oCounts.DaAutorizzare++; break;
							}
						});

						var oViewModel = this.getModel("worklistView");
						Object.keys(oCounts).forEach(function(sKey) {
							oViewModel.setProperty("/" + sKey, oCounts[sKey]);
						});
					}.bind(this),
					error: function(oError) {
						console.error("Failed to load overtime status counters", oError);
						MessageBox.error("Impossible de charger les compteurs des demandes.");
					}
				});
			},
		
			onUpdateFinished : function (oEvent) {
				// update the worklist's object counter after the table update
				var sTitle,
					oTable = oEvent.getSource(),
					iTotalItems = oEvent.getParameter("total");
				// only update the counter if the length is final and
				// the table is not empty
				if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
					sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
				} else {
					sTitle = this.getResourceBundle().getText("worklistTableTitle");
				}
				this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
				
				
				this.updateEnable();

			},
			
			/**
			 * Event handler when a table item gets pressed
			 * @param {sap.ui.base.Event} oEvent the table selectionChange event
			 * @public
			 */
			onPress : function (oEvent) {
				// The source is the list item that got pressed
				this._showObject(oEvent.getSource());
			},

			/**
			 * Event handler for navigating back.
			 * We navigate back in the browser historz
			 * @public
			 */
			onNavBack : function() {
				history.go(-1);
			},


			onSearch : function (oEvent) {
				if (oEvent.getParameters().refreshButtonPressed) {
					// Search field's 'refresh' button has been pressed.
					// This is visible if you select any master list item.
					// In this case no new search is triggered, we only
					// refresh the list binding.
					this.onRefresh();
				} else {
					var aTableSearchState = [];
					var sQuery = oEvent.getParameter("query");

					if (sQuery && sQuery.length > 0) {
						aTableSearchState = [new Filter("Atext", FilterOperator.Contains, sQuery)];
					}
					this._applySearch(aTableSearchState);
				}

			},

			/**
			 * Event handler for refresh event. Keeps filter, sort
			 * and group settings and refreshes the list binding.
			 * @public
			 */
			onRefresh : function () {
				var oTable = this.byId("table");
				oTable.getBinding("items").refresh();
			},

			/* =========================================================== */
			/* internal methods                                            */
			/* =========================================================== */

			/**
			 * Shows the selected item on the object page
			 * On phones a additional history entry is created
			 * @param {sap.m.ObjectListItem} oItem selected Item
			 * @private
			 */
			_showObject : function (oItem) {
				this.getRouter().navTo("object", {
					objectId: oItem.getBindingContext().getProperty("ItemId")
				});
			},

			/**
			 * Internal helper method to apply both filter and search state together on the list binding
			 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
			 * @private
			 */
			_applySearch: function(aTableSearchState) {
				var oTable = this.byId("table"),
					oViewModel = this.getModel("worklistView");
				oTable.getBinding("items").filter(aTableSearchState, "Application");
				// changes the noDataText of the list in case there are no filter results
				if (aTableSearchState.length !== 0) {
					oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
				}
			},
			
			_showErrorMessage: function(sMsg) {
				MessageBox.error(sMsg, {
					styleClass: this.getOwnerComponent().getContentDensityClass()
				});
			},
			
		_handleReorderActionResult : function (sItemId, bSuccess, iRequestNumber, iTotalRequests){
			// we could create a counter for successful and one for failed requests
			// however, we just assume that every single request was successful and display a success message once
			if (iRequestNumber === iTotalRequests) {
				MessageToast.show(this.getModel("i18n").getResourceBundle().getText("RequestUpdatedSuccessMsg", [iTotalRequests]));
			
				this.getModel().refresh();

				var oTable = this.byId("table");
				oTable.removeSelections(true);
				
				this.updateEnable();
				this._loadStatusCounters();
			}
		},
		
			updateEnable: function(){
				var oTable = this.byId("table");
				var aItems = oTable.getItems();
		
				for (var i = 0; i < aItems.length; i++) {
					// a row is selectable only while its status is empty ("to be authorized")
					var bEditable = aItems[i].getBindingContext().getObject().Status === '';
					aItems[i].getMultiSelectControl(/* bCreateIfNotExist = */ true).setEnabled(bEditable);
				}
			},
		
			onRequest: function() {
				var that = this;
				var aSelectedRequest,
				    i, 
				    sPath, 
				    oRequestObject;
				
			   //Saad Igueninni  
               // used only to decide whether to open the popup; 
			   // selection must be read again in Confirm because the dialog is reused
				aSelectedRequest = this.byId("table").getSelectedItems();
				if (aSelectedRequest.length) {
					if (!this.oApproveDialog) {
						this.oApproveDialog = new Dialog({
							type: that.DialogType.Message,
							title: "Confirm",
							content: new Text({ text: this.getResourceBundle().getText("ConfirmContent") }),
							beginButton: new Button({
								type: that.ButtonType.Emphasized,
								text: this.getResourceBundle().getText("Confirm"),
								press: function () {
								
								var aSelectedRequest = this.byId("table").getSelectedItems(); ///SIG add
								
								for (i = 0; i < aSelectedRequest.length; i++) {
									sPath = aSelectedRequest[i].getBindingContext().getPath();
									oRequestObject = aSelectedRequest[i].getBindingContext().getObject();
									oRequestObject.Status = 'R';
								//	oProductObject.UnitsInStock += 10;
									that.getModel().update(sPath, oRequestObject, {
										success :that._handleReorderActionResult.bind(that, oRequestObject.ItemId, true, i + 1,aSelectedRequest.length),
										error : that._handleReorderActionResult.bind(that, oRequestObject.ItemId, false,  i + 1, aSelectedRequest.length)
									});
								}
							

								that.oApproveDialog.close();
								}.bind(this)
							}),
							endButton: new Button({
								text: this.getResourceBundle().getText("Cancel"),
								press: function () {
									this.oApproveDialog.close();
								}.bind(this)
							})
				});
					}
					
					this.oApproveDialog.open();
				}
				else {
					that._showErrorMessage(that.getModel("i18n").getResourceBundle().getText("NoRequestSelected"));
				} 
					
					
				},
			
			handleChange: function (oEvent) {
			//	this.getView().getModel("objectView").setProperty("/busy", true);

				var la_filters = [];
				var startDate = this.getView().getModel("DataModel").getProperty("/dateValue");
				if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
					return;
				}
				var formattedDate = startDate.getFullYear() + "-" + (startDate.getMonth() + 1) + "-" + startDate.getDate();
				var lo_pickedDateFilter = new sap.ui.model.Filter({
				    	path: "Data",
				        operator: sap.ui.model.FilterOperator.EQ,
				        value1: formattedDate
			      });
				la_filters.push(lo_pickedDateFilter);
				
				var oTable = this.getView().byId("table");
    				var oBinding = oTable.getBinding("items");
				this._aCounterFilters = la_filters;
				oBinding.filter(this._getTableFilters());
				this._loadStatusCounters();

			}

		});
	}
);