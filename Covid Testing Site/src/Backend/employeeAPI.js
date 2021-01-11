const mysql = require('mysql');
const express = require('express');
const employeeAPI = express.Router();

let sqlManager = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    database: "covidtesting" //Change this to your local database name
});

sqlManager.connect((err) => {
    if (err) throw err;
});

employeeAPI.post("/addTest", (req, res) => {
    let barcode = req.body.barcode;
    let employeeID = req.body.employeeId;
    if (barcode && employeeID) {
        sqlManager.query('INSERT INTO EmployeeTest (testBarcode, employeeID, collectionTime, collectedBy) VALUES (?, ?, "2020-01-19 03:14:07", "100");', [barcode, employeeID], function (error, results, fields) {
            if (error != null) {
                throw new Error("Error: " + error);
            }
            console.log("Successfully saved employee test result.");
            res.redirect('../static/testCollection.html');
            res.end();
        });
    } else {
        res.send('Please enter the employeeID and barcode.');
        res.end();
    }
    return false;
});

employeeAPI.get("/queryDB/all", (req, res) => {
    sqlManager.query('SELECT testBarcode, employeeID FROM EmployeeTest;', function (error, results, fields) {
        if (error != null) {
            throw new Error('Database failed to connect!');
        }
        res.json(results);
    });
});

employeeAPI.get("/deleteTest/:barcodeID", (req, res) => {
    let id = req.params.barcodeID;
    let poolMapQuery = `SELECT * FROM PoolMap WHERE PoolMap.testBarcode = '${id}';`;
    sqlManager.query(poolMapQuery, (error, results, fields) => {
        if (results != undefined && results.length > 0) {
            throw new Error("Can't delete test. Test barcode is already used in pool.");
        }

        let deleteTestQuery = `DELETE FROM EmployeeTest WHERE EmployeeTest.testBarcode = '${id}';`;
        sqlManager.query(deleteTestQuery, (error, results, fields) => {
            if (error) throw error;
            res.send("Successfully deleted test.");
            res.send();
        });
    });
});

employeeAPI.post("/addPool", (req, res) => {
    let poolBarcode = req.body.poolBarcode;
    let testList = req.body.testList;
    console.log(poolBarcode);
    console.log(testList);

    if (poolBarcode && testList) {
        sqlManager.query('INSERT INTO Pool (poolBarcode) VALUES (?);', [poolBarcode], function (error, results, fields) {
            if (error) throw error;
            try {
                if (didCreatePoolMap(poolBarcode, testList)) res.end();
            } catch (error) {
                throw error;
            }
        });
    } else {
        res.send('Please enter the employeeID and barcode.');
        res.end();
    }
    return false;
});

function didCreatePoolMap(poolBarcode, testList) {
    let combinedValues = [];
    for (let i = 0; i < testList.length; i++) {
        combinedValues.push([testList[i], poolBarcode]);
    }

    console.log(combinedValues);
    sqlManager.query('INSERT INTO PoolMap (testBarcode, poolBarcode) VALUES ?;', [combinedValues], function (error, results, fields) {
        if (error) throw error;
        return true
    });
}

employeeAPI.get("/queryDB/savedPools", (req, res) => {
    let barcodeQuery = 'SELECT * FROM PoolMap;';
    sqlManager.query(barcodeQuery, function (error, results, fields) {
        if (error) throw error;
        let poolMap = new Map();

        for (let i = 0; i < results.length; i++) {
            let poolBarcode = results[i]["poolBarcode"];
            if (poolMap.has(poolBarcode)) {
                poolMap.get(poolBarcode).push(results[i]["testBarcode"]);
            } else {
                poolMap.set(results[i]["poolBarcode"], [results[i]["testBarcode"]]);
            }
        }
        res.json(Object.fromEntries(poolMap));
    });
});

employeeAPI.get("/queryDB/deletePool/:id", (req, res) => {
    let id = req.params.id;
    console.log(id);
    let deletePoolMapQuery = `DELETE FROM PoolMap WHERE poolBarcode = '${id}';`;
    sqlManager.query(deletePoolMapQuery, function (error, results, fields) {
        if (error) throw error;
        let deletePoolQuery = `DELETE FROM Pool WHERE poolBarcode = '${id}';`;
        sqlManager.query(deletePoolQuery, function (error, results, fields) {
            if (error) throw error;
            res.json({
                message: "Succesfully deleted pool."
            });
            res.end();
        });
    });
});

employeeAPI.post("/editPool", (req, res) => {
    let poolIdList = req.body.poolBarcode;
    let testList = req.body.testBarcodeList;
    let deletePoolMapQuery = `DELETE FROM PoolMap WHERE poolBarcode IN (?);`;
    console.log(poolIdList);
    sqlManager.query(deletePoolMapQuery, [poolIdList], function (error, results, fields) {
        if (error) throw error;
        if (didAddNewPoolTests(poolIdList, testList)) {
            res.redirect('../static/editPoolMaps.html');
            console.log('Successfully edited pool.');
            res.end();
        }
    });
});

function didAddNewPoolTests(poolList, testList) {
    let resQueryList = [];

    if (typeof testList == "string") {
        testList = [testList];
        poolList = [poolList];
    }

    for (let i = 0; i < testList.length; i++) {
        let tempArray = testList[i].split(",");
        for (let j = 0; j < tempArray.length; j++) {
            resQueryList.push([poolList[i], tempArray[j]]);
        }
    }

    let editTestsQuery = 'INSERT INTO PoolMap (poolBarcode, testBarcode) VALUES ?;';
    sqlManager.query(editTestsQuery, [resQueryList], function (error, results, fields) {
        if (error) throw error;
    });
    return true;
}

employeeAPI.post("/addWell", (req, res) => {
    let wellID = req.body.wellBarcode;
    let poolID = req.body.poolBarcode;
    let result = req.body.result;
    let addWellQuery = `INSERT INTO Well VALUES (?);`;
    sqlManager.query(addWellQuery, [wellID], function (error, results, fields) {
        if (error) throw error;
        let wellData = [poolID, wellID, "2020-01-19 03:14:07", "2020-01-19 5:00:00", result];
        if (didAddWellTesting(wellData)) {
            res.redirect('../static/wellTesting.html');
            res.end();
        }
    });
});

function didAddWellTesting(wellTestingData) {
    let addWellTestingQuery = `INSERT INTO WellTesting VALUES (?);`;
    sqlManager.query(addWellTestingQuery, [wellTestingData], function (error, results, fields) {
        if (error) throw error;
    });
    return true;
}

employeeAPI.get("/queryDB/wellTesting", (req, res) => {
    sqlManager.query('SELECT * FROM WellTesting;', function (error, results, fields) {
        if (error) throw error;
        res.json(results);
        res.end();
    });
});

employeeAPI.get("/deleteWell/:wellId", (req, res) => {
    let wellID = req.params.wellId;
    console.log(wellID);
    let deleteWellTestingQuery = `DELETE FROM WellTesting WHERE wellBarcode = '${wellID}';`;
    sqlManager.query(deleteWellTestingQuery, (error, results, fields) => {
        if (error) throw error;
        let deleteWellQuery = `DELETE FROM Well WHERE wellBarcode = '${wellID}';`;
        sqlManager.query(deleteWellQuery, (error, results, fields) => {
            if (error) throw error;
            res.send("Successfully deleted well.");
            res.end();
        });
    });
});

employeeAPI.get("/editWell/:wellID/:newResult", (req, res) => {
    let wellID = req.params.wellID;
    let result = req.params.newResult;
    let editQuery = `UPDATE WellTesting SET result = '${result}' WHERE wellBarcode = '${wellID}';`;
    sqlManager.query(editQuery, (error, results, fields) => {
        if (error) throw error;
        res.send("Successfully deleted well.");
        res.end();
    });
})

module.exports = employeeAPI;