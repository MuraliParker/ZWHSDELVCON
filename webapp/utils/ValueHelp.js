
sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/ui/core/Fragment"
],
    function (JSONModel, Device, Fragment) {
        "use strict";

       return {
            _oValueHelpDialogs: {},
            // Value Help Start
            _valueHelpRequested: function (oEvent, oFragmentInfo, oConfig) {
                this._oMultiInput = oEvent.getSource();
                if (!this._oValueHelpDialogs[oFragmentInfo.name]) {
                    this._oValueHelpDialogs[oFragmentInfo.name] = Fragment.load(oFragmentInfo);
                }
                this._oValueHelpDialogs[oFragmentInfo.name].then(function (oDialog) {
                    var oFilterBar = oDialog.getFilterBar();
                    this._oVHD = oDialog;
                    // Initialise the dialog with model only the first time. Then only open it
                    if (this._oValueHelpDialogs[oFragmentInfo.name + "bDialogInitialized"]) {
                        // Re-set the tokens from the input and update the table
                        oDialog.setTokens([]);
                        oDialog.setTokens(this._oMultiInput.getTokens());
                        oDialog.update();
                        oDialog.open();
                        this._oBasicSearchField.setValue("");
                        oFilterBar.search();
                        return;
                    }
                    this.getView().addDependent(oDialog);
                    // Set key fields for filtering in the Define Conditions Tab
                    oDialog.setRangeKeyFields([{
                        label: oConfig.rangeKey.label,
                        key: oConfig.rangeKey.key,
                        type: "string"
                    }]);
                    // Set Basic Search for FilterBar
                    oFilterBar.setFilterBarExpanded(false);
                    this._oBasicSearchField = new sap.m.SearchField();
                    oFilterBar.setBasicSearch(this._oBasicSearchField);
                    // Trigger filter bar search when the basic search is fired
                    this._oBasicSearchField.attachSearch(function () {
                        oFilterBar.search();
                    });
                    oDialog.getTableAsync().then(function (oTable) {
                        // oTable.setModel(this.oProductsModel);
                        // For Desktop and tabled the default table is sap.ui.table.Table
                        if (oTable.bindRows) {
                            // Bind rows to the ODataModel and add columns
                            oTable.bindAggregation("rows", {
                                path: oConfig.context,
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });
                            oConfig.columns.forEach((oCols) => {
                                oTable.addColumn(
                                    new sap.ui.table.Column({
                                        label: oCols.label,
                                        template: "UIModel>" + oCols.field
                                    })
                                );
                            });
                        }
                        // For Mobile the default table is sap.m.Table
                        if (oTable.bindItems) {
                            // Bind items to the ODataModel and add columns
                            let oCells = [];
                            oConfig.columns.forEach((oCols) => oCells.push(new sap.m.Label({ text: "UIModel>" + oCols.label })));
                            let oTemplate = new sap.m.ColumnListItem({
                                cells: oCells
                            });
                            oTable.bindAggregation("items", {
                                path: oConfig.context,
                                template: oTemplate,
                                events: {
                                    dataReceived: function () {
                                        oDialog.update();
                                    }
                                }
                            });
                            oConfig.columns.forEach((oCols) => {
                                oTable.addColumn(
                                    new sap.m.Column({
                                        header: new sap.m.Label({
                                            text: oCols.label
                                        })
                                    })
                                );
                            });
                        }
                        oDialog.update();
                    }.bind(this));
                    oDialog.setTokens(this._oMultiInput.getTokens());
                    // set flag that the dialog is initialized
                    this._oValueHelpDialogs[oFragmentInfo.name + "bDialogInitialized"] = true;
                    oDialog.open();
                }.bind(this));
            },

            onValueHelpOkPress: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");
                this._oMultiInput.setTokens(aTokens);
                this._oVHD.close();
            },

            onValueHelpCancelPress: function () {
                this._oVHD.close();
            },

            _valueHelpSearch: function (oEvent, oConfig) {
                var sSearchQuery = this._oBasicSearchField.getValue(),
                    aSelectionSet = oEvent.getParameter("selectionSet");
                var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                    if (oControl.getValue()) {
                        aResult.push(new sap.ui.model.Filter({
                            path: oControl.getName(),
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: oControl.getValue()
                        }));
                    }

                    return aResult;
                }, []);
                let oFilter = [];
                oConfig.columns.forEach((oCols) => {
                    oFilter.push(
                        new sap.ui.model.Filter({
                            path: oCols.field,
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sSearchQuery
                        })
                    );
                });
                aFilters.push(
                    new sap.ui.model.Filter({
                        filters: oFilter,
                        and: false
                    })
                );
                this._filterTable(
                    new sap.ui.model.Filter({
                        filters: aFilters,
                        and: true
                    })
                );
            },

            _filterTable: function (oFilter) {
                var oVHD = this._oVHD;
                oVHD.getTableAsync().then(function (oTable) {
                    if (oTable.bindRows && oTable.getBinding("rows")) {
                        oTable.getBinding("rows").filter(oFilter);
                    }
                    if (oTable.bindItems && oTable.getBinding("items")) {
                        oTable.getBinding("items").filter(oFilter);
                    }
                    // This method must be called after binding update of the table.
                    oVHD.update();
                });
            },

            
            _getValueHelpData: function (sEntitySet, sProperty) {
                this._oODataModel.read("/" + sEntitySet, {
                    success: (oData) => {
                        if (oData.results.length > 0) {
                            this._oUIModel.setProperty("/" + sProperty, oData.results);
                        } else {
                            this._oUIModel.setProperty("/" + sProperty, []);
                        }
                    },
                    error: (oError) => this._fnErrorCallback(oError)
                });
            },


        };
    });
