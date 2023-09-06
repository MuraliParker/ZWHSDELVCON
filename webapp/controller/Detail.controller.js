sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "whs/delivery/consolidation/whsdeliveryconsolidation/model/formatter",
    "sap/m/GroupHeaderListItem",
    "sap/m/library",
    "sap/ui/core/library",
    "sap/ui/core/message/ControlMessageProcessor",
	"sap/ui/core/message/Message",
    "sap/m/MessagePopover",
	"sap/m/MessageItem",
	"sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/core/Core"

], function (BaseController, JSONModel, formatter, GroupHeaderListItem, mobileLibrary,coreLibrary,ControlMessageProcessor,Message,MessagePopover,MessageItem,MessageToast,Fragment,oCore) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;
    var MessageType = coreLibrary.MessageType;


    return BaseController.extend("whs.delivery.consolidation.whsdeliveryconsolidation.controller.Detail", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        onInit: function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page is busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                busy: false,
                delay: 0,
                lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
            });

            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

            this.setModel(oViewModel, "detailView");

            this.setModel(new JSONModel({}),"DetailsData");

            this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

            this.enableMessageHandeller();
        },

        enableMessageHandeller: function () {
            var oMessageProcessor = new ControlMessageProcessor();
			var oMessageManager = oCore.getMessageManager();

            this.oMsgModel = new JSONModel([]);

			oMessageManager.registerMessageProcessor(oMessageProcessor);

			oMessageManager.addMessages(
				new Message({
					message: "No New messages.",
					type: MessageType.Success,
					processor: oMessageProcessor
				})
			);
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Event handler when the share by E-Mail button has been clicked
         * @public
         */
        onSendEmailPress: function () {
            var oViewModel = this.getModel("detailView");

            URLHelper.triggerEmail(
                null,
                oViewModel.getProperty("/shareSendEmailSubject"),
                oViewModel.getProperty("/shareSendEmailMessage")
            );
        },


        /**
         * Updates the item count within the line item table's header
         * @param {object} oEvent an event containing the total number of items in the list
         * @private
         */
        onListUpdateFinished: function (oEvent) {
            var sTitle,
                iTotalItems = oEvent.getParameter("total"),
                oViewModel = this.getModel("detailView");

            // only update the counter if the length is final
            if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
                if (iTotalItems) {
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
                } else {
                    //Display 'Line Items' instead of 'Line items (0)'
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
                }
                oViewModel.setProperty("/lineItemListTitle", sTitle);
            }
        },

        /* =========================================================== */
        /* begin: internal methods                                     */
        /* =========================================================== */

        /**
         * Binds the view to the object path and expands the aggregated line items.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        _onObjectMatched: function (oEvent) {
            var sObjectId = oEvent.getParameter("arguments").objectId;
            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            this.getModel().metadataLoaded().then(function () {
                var sObjectPath = this.getModel().createKey("DELIVERY_headSet", {
                    Partyno: sObjectId
                });
                this._bindView("/" + sObjectPath);
            }.bind(this));
        },

        /**
         * Binds the view to the object path. Makes sure that detail view displays
         * a busy indicator while data for the corresponding element binding is loaded.
         * @function
         * @param {string} sObjectPath path to the object to be bound to the view.
         * @private
         */
        _bindView: function (sObjectPath) {
            // Set busy indicator during view binding
            var oViewModel = this.getModel("detailView");

            // If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
            oViewModel.setProperty("/busy", false);

            // this.getView().bindElement({
            //     path: sObjectPath,
            //     events: {
            //         change: this._onBindingChange.bind(this),
            //         dataRequested: function (oEvent) {
            //             console.log("dataRequested",oEvent);
            //             oViewModel.setProperty("/busy", true);
            //         },
            //         dataReceived: function (oEvent) {
            //             console.log("dataReceived",oEvent);
            //             oViewModel.setProperty("/busy", false);
            //         }
            //     }
            // });

            this.requestDetailData(sObjectPath);
        },
        requestDetailData: function(sObjectPath){
            // Setting Busy indicator.
            var oViewModel = this.getModel("detailView");
            oViewModel.setProperty("/busy", true);

            var oDataModel = this.getView().getModel();
            var fnSuccess= function(oResponse){
                var oDatailModel= this.getModel("DetailsData");
                console.log("oDatailModel",oResponse);
                oDatailModel.setData(oResponse);
                oViewModel.setProperty("/busy", false);

                // Post Success Process*
                this._onBindingChange(sObjectPath);

            }.bind(this);
            var fnError= function(oResponse){
                console.log("oDatailModel",oResponse);
                MessageToast.show(this.getResourceBundle().getText("failToLoadData"));
                oViewModel.setProperty("/busy", false);
                this.getRouter().getTargets().display("detailObjectNotFound");
                // if object could not be found, the selection in the list
                // does not make sense anymore.
                this.getOwnerComponent().oListSelector.clearMasterListSelection();
                return;

            }.bind(this);
            oDataModel.read(sObjectPath, {
                urlParameters: {
                    "$expand": "HeadToItem,HeadToItem/NavDlvToProduct,HeadToItem/NavDlvToProduct/NavProductToSerial"
                },
                success:fnSuccess,
                error:fnError
            });
        },
        _onBindingChange: function (sObjectPath) {
            var oView = this.getView();
                // oElementBinding = oView.getElementBinding();

            // No data for the binding
            // if (!oElementBinding.getBoundContext()) {
            //     this.getRouter().getTargets().display("detailObjectNotFound");
            //     // if object could not be found, the selection in the list
            //     // does not make sense anymore.
            //     this.getOwnerComponent().oListSelector.clearMasterListSelection();
            //     return;
            // }

            // var sPath = oElementBinding.getPath(),
                var oResourceBundle = this.getResourceBundle(),
                oObject = oView.getModel().getObject(sObjectPath),
                sObjectId = oObject.Partyno,
                sObjectName = oObject.Partyno,
                oViewModel = this.getModel("detailView");

            this.getOwnerComponent().oListSelector.selectAListItem(sObjectPath);

            oViewModel.setProperty("/shareSendEmailSubject",
                oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
            oViewModel.setProperty("/shareSendEmailMessage",
                oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
        },

        _onMetadataLoaded: function () {
            // Store original busy indicator delay for the detail view
            var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
                oViewModel = this.getModel("detailView"),
                oLineItemTable = this.byId("lineItemsList"),
                iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

            // Make sure busy indicator is displayed immediately when
            // detail view is displayed for the first time
            oViewModel.setProperty("/delay", 0);
            oViewModel.setProperty("/lineItemTableDelay", 0);


            oLineItemTable.attachEventOnce("updateFinished", function () {
                // Restore original busy indicator delay for line item table
                oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
            });

            // Binding the view will set it to not busy - so the view is always busy if it is not bound
            oViewModel.setProperty("/busy", true);
            // Restore original busy indicator delay for the detail view
            oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
        },

        /**
         * Set the full screen mode to false and navigate to list page
         */
        onCloseDetailPress: function () {
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
            // No item should be selected on list after detail page is closed
            this.getOwnerComponent().oListSelector.clearMasterListSelection();
            this.getRouter().navTo("list");
        },

        /**
         * Used to create GroupHeaders with non-capitalized caption.
         * These headers are inserted into the list to
         * group the list's items.
         * @param {Object} oGroup group whose text is to be displayed
         * @public
         * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
         */
        createGroupHeader: function (oGroup) {
            var sKey = this.getResourceBundle().getText("outBoundDelivery") + " : " + this.formatter.simpleNumber(oGroup.key);
            return new GroupHeaderListItem({
                title: sKey,
                upperCase: false
            });
        },

        createGroupHeaderProd: function (oGroup) {
            var sKey = this.getResourceBundle().getText("partNumberGrp") + " : " + this.formatter.simpleNumber(oGroup.key);
            return new GroupHeaderListItem({
                title: sKey,
                upperCase: false
            });
        },

        /**
         * Toggle between full and non full screen mode.
         */
        toggleFullScreen: function () {
            var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
            if (!bFullScreen) {
                // store current layout and go full screen
                this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
                this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
            } else {
                // reset to previous layout
                this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
            }
        },
        onPrintPackingList: function (oEvent) {
            var oViewHeaderData = this.getView().getModel("DetailsData").getProperty("/");
            var oItemsList = this.byId("lineItemsList");
            var aContexts = oItemsList.getSelectedContexts(true);
            var aSelectedObj = [];
            aContexts.forEach(oContext => {
                aSelectedObj.push({ 
                        "Partyno": oContext.getObject().Partyno,
                        "Docno": oContext.getObject().Docno,
                     });
            });
            console.log("Selected Objects:", aSelectedObj);
            if (oViewHeaderData) {

                var oPostData = {
                    "Partyno": oViewHeaderData.Partyno,
                    "HeadToItem": aSelectedObj
                };
                
                this.getView().getModel().create("/DELIVERY_headSet", oPostData,
                    {
                        success: function (result) {
                            // everything is OK 
                            console.log("Succes:", result);
                            MessageToast.show(this.getResourceBundle().getText("packingListTriggerCmplts"));
                            result.HeadToItem.results = this.formatMessages(result.HeadToItem.results);
                            this.oMsgModel.setData(result);
                            this.getView().byId("idMessages").firePress();
                            this.getView().byId("lineItemsList").removeSelections(true);

                        }.bind(this),
                        error: function (err) {
                            // some error occuerd 
                            console.log("Error:", err);
                        },
                        async: true,  // execute async request to not stuck the main thread
                        urlParameters: {}  // send URL parameters if required 
                    });
            } else {
                MessageToast.show(this.getResourceBundle().getText("failedHeaderData"));
            }

        },
        formatMessages: function(aMessages){
            for (let index = 0; index < aMessages.length; index++) {
                var oMessages = aMessages[index];
                oMessages.Statuscode = this.getMessageType(oMessages.Statuscode);
                oMessages.Docno = this.formatter.simpleNumber(oMessages.Docno).toString();
            }
            return aMessages;
        },
        handleMessagePopoverPress: function (oEvent) {
            var oMessagesButton = oEvent.getSource();
			if (!this._messagePopover) {
				this._messagePopover = new MessagePopover({
					items: {
						path: 'message>/HeadToItem/results',
						template: new MessageItem({
							type: "{message>Statuscode}",
                            // description:"{message>Docno}",
							title: "{message>Status} for {message>Docno}"
						})
					}
				});
                this._messagePopover.setModel(this.oMsgModel,"message");
				oMessagesButton.addDependent(this._messagePopover);
			}
			this._messagePopover.toggle(oMessagesButton);
        },

        getMessageType: function(type){
            switch(type) {
                case "E":
                  // code block
                  return sap.ui.core.MessageType.Error;
                case "I":
                  // code block
                  return sap.ui.core.MessageType.Information;
                  case "S":
                  // code block
                  return sap.ui.core.MessageType.Success;
                  case "W":
                  // code block
                  return sap.ui.core.MessageType.Warning;
                default:
                  return sap.ui.core.MessageType.None;
              }

        },

        onExit: function() {
            if (this.oMsgModel) {
                this.oMsgModel.setData([]);
            }
        }

    });

});