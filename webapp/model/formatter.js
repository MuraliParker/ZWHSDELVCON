sap.ui.define(["sap/ui/core/format/NumberFormat"], function (NumberFormat) {
    "use strict";

    return {
        /**
         * Rounds the currency value to 2 digits
         *
         * @public
         * @param {string} sValue value to be formatted
         * @returns {string} formatted currency value with 2 digits
         */
        currencyValue: function (sValue) {
            if (!sValue) {
                return "";
            }

            return this.formatter.floatValueFormatter(sValue);
        },

        qtyPercentCalculator: function (TotalQty, PickedQty) {
            var nTotalQty = parseFloat(TotalQty).toFixed(2);
            var nPickedQty = parseFloat(PickedQty).toFixed(2);

            return ((nPickedQty / nTotalQty) * 100);

        },
        simpleNumber: function (sNumber) {
            if (!sNumber) {
                return "";
            }
            var retVal = parseFloat(sNumber);
            if (isNaN(retVal)) {
                return sNumber;
            }
            return retVal;

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

        displayValue: function (TotalQty, PickedQty) {
            
            var nTotalQty = this.formatter.floatValueFormatter(TotalQty);
            var nPickedQty = this.formatter.floatValueFormatter(PickedQty);

            return nPickedQty + " of " + nTotalQty;
        },

        floatValueFormatter: function (sValue) {
            var oNumFormatter = NumberFormat.getIntegerInstance({
                "groupingEnabled": true,  // grouping is enabled
                "groupingSeparator": ',', // grouping separator is '.'
                "groupingSize": 3,         // the amount of digits to be grouped (here: thousand)
                "decimalSeparator": '.'    //Decimal separator
            });
            try {
                var rValue = oNumFormatter.format(sValue);
            } catch (error) {
                return sValue;
            }
            return rValue;

        },
        sernoText: function (serno) {
			// console.log("serno:",serno);
            return serno;
		}
    };
});