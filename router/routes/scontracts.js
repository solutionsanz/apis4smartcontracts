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
        var CONST_INITLEDGER_CONTRACT_STRUCTURE_LINE = '@CONTRACT_NAME@';

        /**
         * Setting default random Contract's Init Ledger data
         */
        // **************** Set contract's initLedger structure
        console.log("Set contract's initLedger structure");

        for (var x = 0; x < 10; ++x) {

            var sContractParamsJSON = {};

            for (var i in sContractsBody) {

                // Treat the first element as the Contract names and the rest as the fields name.
                if (i == 0)
                    continue;

                val = sContractsBody[i].content;
                sContractParamsJSON[val] = getRandomData();
            }

            console.log("Random InitLedger Structure is [" + JSON.stringify(sContractParamsJSON) + "]");
            // Adding a new placeholder:
            newSmartContract = newSmartContract.replace(/@NEW_INITLEDGER_CONTRACT_ITEM@/g, CONST_INITLEDGER_CONTRACT_STRUCTURE_LINE + JSON.stringify(sContractParamsJSON) + "," + "\n		@NEW_INITLEDGER_CONTRACT_ITEM@");

        }


        /**
         * Setting default Contract's name and properties
         */
        for (var i in sContractsBody) {
            val = sContractsBody[i].content;
            console.log("Property [" + i + "], value is [" + val + "]");

            // **************** 1. Defining contract name
            console.log("1. Defining contract name");
            newSmartContract = newSmartContract.replace(/@CONTRACT_NAME@/g, val);

            // **************** 2. Defining contract instance object name
            console.log("2. Defining contract instance object name");
            newSmartContract = newSmartContract.replace(/@CONTRACT_NAME_LC@/g, val.toLowerCase());

            // **************** 3. Defining contracts's constant values
            console.log("3. Defining contracts's constant values");
            newSmartContract = newSmartContract.replace(/@CONTRACT_NAME_UC@/g, val.toUpperCase());

            // Treat the first element as the Contract names and the rest as the fields name.
            if (i == 0)
                continue;

            // var s = "type @CONTRACT_NAME@ struct {	";
            // s = s.replace(/@CONTRACT_NAME@/g, val);
            // console.log("s is [" + s + "]");

            //console.log("newSmartContract after CONTRACT_NAME is [" + newSmartContract + "]");

            // **************** 4. Defining contract's property structure
            console.log("4. Defining contract's property structure");

            // Adding a new placeholder:            
            newSmartContract = newSmartContract.replace(/@NEW_CONTRACT_STRUCTURE@/g, CONST_CONTRACT_STRUCTURE_LINE + "\n	@NEW_CONTRACT_STRUCTURE@");

            // Setting Contract's property name: 
            newSmartContract = newSmartContract.replace(/@CONTRACT_PROPERTY_NAME@/g, val);

            // Setting Contract's property name value: 
            newSmartContract = newSmartContract.replace(/@CONTRACT_PROPERTY_NAME_JSON@/g, val.toLowerCase());

            // Assess if this is the last iteration and if so, remove new_item_line anchors.
            console.log("****** 1+Number(i) is [" + 1+Number(i) + "], sContractsBody.length is [" + sContractsBody.length + "], 1+Number(i) == sContractsBody.length is [" + (1+Number(i) == sContractsBody.length) + "]");
            if (1 + Number(i) == sContractsBody.length) {

                console.log("Yes Removing NEW_CONTRACT_STRUCTURE is set to true");

                newSmartContract = newSmartContract.replace(/@NEW_CONTRACT_STRUCTURE@/g, "");
                newSmartContract = newSmartContract.replace(/@NEW_INITLEDGER_CONTRACT_ITEM@/g, "");
            }

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

    function getRandomData() {

        var things = ['Rock', 'Paper', 'Scissor'];
        return things[Math.floor(Math.random() * things.length)];
    }

};