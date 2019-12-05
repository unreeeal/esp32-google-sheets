var timeZone = "CST"; //get yours at https://www.timeanddate.com/time/zones/
var dateTimeFormat = "dd/MM/yyyy HH:mm";
var sentEmailIfUnitIsOutForMinutes = 15;

var enableSendingEmails = false;
var emailAddress = ""; // comma separate for several emails
// 'bob@example.com';
// 'bob@example.com,admin@example.com';


function doGet(e) {
      var result = 'Ok'; // default result
    if (e.parameter == 'undefined') {
        result = 'No Parameters';
    } else {
      
        var alarm= e.parameter.alarm;
        if (typeof alarm != 'undefined') {

            sendEmail("alarm text:" + stripQuotes(alarm));
            return ContentService.createTextOutput(result);
        }

        var sheet = getSpreadSheet();
        var lastRow = sheet.getLastRow();
        var newRow = 1;
        if (lastRow > 0) {
            var lastVal = sheet.getRange(lastRow, 1).getValue();
          //if there was no info for (sentEmailIfUnitIsOutForMinutes) checkIfDead() function will append row with 'dead' text
          // so checking do we need to override it
            if (lastVal == 'dead')
                newRow = lastRow; //to overwrite "dead" value
            else
                newRow = lastRow + 1;

        }

        var rowData = [];
        var namesOfParams=[];
        for (var param in parseQuery(e.queryString))
          namesOfParams.push(param);
//      namesOfParams=namesOfParams.reverse();
      
      //creatating headers if first row
        if (newRow == 1) {
            rowData[0] = "Date";
            var i = 1;
            for (var i=0; i<namesOfParams.length;i++  ) {
                rowData[i+1] = namesOfParams[i];

            }
            var newRange = sheet.getRange(newRow, 1, 1, rowData.length);
            newRange.setValues([rowData]);
            rowData = [];
            newRow++;
        }

        rowData[0] = Utilities.formatDate(new Date(), timeZone, dateTimeFormat);
    
        for (var i=0; i<namesOfParams.length;i++  ) {

            var value = stripQuotes(e.parameter[namesOfParams[i]]);

            rowData[i+1] = value;

        }
        var newRange = sheet.getRange(newRow, 1, 1, rowData.length);
        newRange.setValues([rowData]);
    }
    // Return result of operation
    return ContentService.createTextOutput(result);
}

function checkIfDead() {
    if (!enableSendingEmails)
        return;
    var res = '';
    var currentDate = new Date(Utilities.formatDate(new Date(), timeZone, dateTimeFormat));
    var sheet = getSpreadSheet();

    var data = sheet.getDataRange().getValues();
    if (data.length == 0)
        return;
    var lastRow = sheet.getLastRow();
    var lastVal = sheet.getRange(lastRow, 1).getValue();
  //if there was no info for (sentEmailIfUnitIsOutForMinutes) checkIfDead() function will append row with 'dead' text  
  // so if the last row contains 'dead' an message have been sent already
    if (lastVal == 'dead')
        return;
    Logger.log('w');
    var recordDate = new Date(lastVal);
    var deltaMills = Math.abs(currentDate - recordDate);
    var delta = Math.floor(deltaMills / 1000 / 60);
    Logger.log(delta);
    if (delta > sentEmailIfUnitIsOutForMinutes) {
        Logger.log("sending email delta " + delta);
        res = lastVal;
      //appending 'dead' value to not check it next time
        sheet.getRange(lastRow + 1, 1).setValue('dead');

    }

    if (res.length > 0)
        sendEmail("no data for " + sentEmailIfUnitIsOutForMinutes + "mins", res);
}
/**
 * Remove leading and trailing single or double quotes
 */
function stripQuotes(value) {
    return value.replace(/^["']|['"]$/g, "");
}

function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

function sendEmail(message) {

    var subject = 'Something wrong with your esp';
    MailApp.sendEmail(emailAddress, subject, message);

}


function getSpreadSheet() {
    return SpreadsheetApp.getActiveSheet();

}
