var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var config = require("../../config");
var http = require('http');
var https = require('https');
var fs = require('fs');

var formidable = require('formidable');
var fs = require('fs');

// Loading default smart contract template
var inputfile = "templates/smartContractTemplate.go"
var origSmartContract = fs.readFileSync(inputfile, {
    encoding: 'utf-8'
})

//require the csvtojson converter class 
var Converter = require("csvtojson").Converter;
var util = require('util');

//CRI change:
var bodyParser = require('body-parser');

// Configure application routes
module.exports = function (app) {

    // CRI change to allow JSON parsing from requests:    
    app.use(bodyParser.json()); // Support for json encoded bodies 
    app.use(bodyParser.urlencoded({
        extended: true
    })); // Support for encoded bodies

    function log(apiMethod, apiUri, msg) {
        console.log("[" + apiMethod + "], [" + apiUri + "], [" + msg + "], [UTC:" +
            new Date().toISOString().replace(/\..+/, '') + "]");
    }

    /**
     * Adding MongoDB APIs:
     * 
     */

    /* POST Smart Contract */
    app.post('/ws/scontracts', function (req, res) {

        // console.log(util.inspect({
        //          req: req
        //      }))

        var sContractsBody = req.body.sContract;

        if (sContractsBody == null || sContractsBody == undefined) {

            log("POST", "/scontracts", "Invalid or Missing sContractsBody. Verify and try again.");
            res.status(400).end("Invalid or Missing sContractsBody. Verify and try again."); //Bad request...
            return;
        }

        console.log("Inside GET scontracts");

        /**
         * @TODO: Replace all potential incoming spaces by _
         */

        console.log("sContractsBody is [" + JSON.stringify(sContractsBody) + "]");

        // Reaplacing key properties in Smart Contract template:
        console.log("Replacing key values in Smart Contract");
        var newSmartContract = origSmartContract;
        var val = "";
        var CONST_CONTRACT_STRUCTURE_LINE = '@CONTRACT_PROPERTY_NAME@   string `json:"@CONTRACT_PROPERTY_NAME_JSON@"`';

        for (var i in sContractsBody) {
            val = sContractsBody[i].content;
            console.log("Property [" + i + "], value is [" + val + "]");

            // **************** 1. Defining contract name
            console.log("1. Defining contract name");
            newSmartContract = newSmartContract.replace(/@CONTRACT_NAME@/g, val);

            // **************** 3. Defining contract instance object name
            newSmartContract = newSmartContract.replace(/@CONTRACT_NAME_LC@/g, val.toLowerCase());

            // **************** 4. Set contract's initLedger structure
            newSmartContract = newSmartContract.replace(/@CONTRACT_NAME_UC@/g, val.toUpperCase());

            // Treat the first element as the Contract names and the rest as the fields name.
            if (i == 0)
                continue;

            // var s = "type @CONTRACT_NAME@ struct {	";
            // s = s.replace(/@CONTRACT_NAME@/g, val);
            // console.log("s is [" + s + "]");

            //console.log("newSmartContract after CONTRACT_NAME is [" + newSmartContract + "]");

            // **************** 2. Defining contract's property structure
            console.log("2. Defining contract's property structure");

            // Adding a new placeholder:            
            newSmartContract = newSmartContract.replace(/@NEW_CONTRACT_STRUCTURE@/g, CONST_CONTRACT_STRUCTURE_LINE + "\n	@NEW_CONTRACT_STRUCTURE@");

            // Setting Contract's property name: 
            newSmartContract = newSmartContract.replace(/@CONTRACT_PROPERTY_NAME@/g, val);

            // Setting Contract's property name value: 
            newSmartContract = newSmartContract.replace(/@CONTRACT_PROPERTY_NAME_JSON@/g, val.toLowerCase());

            // Assess if this is the last iteration and if so, remove new_item_line anchor.
            if (++i == sContractsBody.length)
                newSmartContract = newSmartContract.replace(/@NEW_CONTRACT_STRUCTURE@/g, "");

            // **************** 5. Defining contracts's constant values

        }





        //console.log("newSmartContract is [" + newSmartContract + "]");
        console.log("Base64 decoding Contract for ease of transformation");
        b64SContract = Buffer.from(newSmartContract).toString('base64');

        //console.log("b64SContract is [" + b64SContract + "]");


        result = {
            "SmartContractb64": b64SContract
        };

        // Returning result
        res.send(result);
    });

};