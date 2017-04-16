const express = require('express');
const router = express.Router();
const http = require('http');
const request = require('request');
const getip = require('client-ip');
const fs = require('fs');
const path = require('path');
const jsonParser = require('json-parser');
const fetch = require('node-fetch');
const xml = require('xml');
const js2xmlparser = require("js2xmlparser");

const getGeoJSON = require('../utilities/helperFunctions.js').getGeoJSON;
const getCityFromIP = require('../utilities/helperFunctions.js').getCityFromIP;
const getCityStats = require('../utilities/helperFunctions.js').getCityStats;
const getItemStats = require('../utilities/helperFunctions.js').getItemStats;
const filterPrices = require('../utilities/helperFunctions.js').filterPrices;

router.get('/home', function (req, res, next) {
    res.render('index');
});

router.get('/numbeo', function (req, res, next) {
    let ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    Promise.all([getCityFromIP(ip).then((city) => getCityStats(city)), getCityStats('Blagoevgrad')])
    // too slow :(
        .then((bothCityStats) => filterPrices(bothCityStats, false))
        .then((bothCityStats) => res.json(bothCityStats));
});

router.get('/numbeo/xml/:city', function (req, res, next) {
    let city = req.params.city;
    res.set('Content-Type', 'text/xml');
    // res.send(xml({name: "Blagoevgrad",
    //     city: "Blago"}))
    Promise.all([getCityStats(city), getCityStats('Blagoevgrad')])
        .then((bothCityStats) => filterPrices(bothCityStats, true))
        .then((bothCityStats) => {
            //console.log(JSON.parse(JSON.stringify(bothCityStats[0]).replace(/\,(?!\s*[\{\"\w])/g, '')));
            //res.send(xml(bothCityStats[0]));
            let preXML = new Object();
            preXML[city]=bothCityStats[0].prices;
            preXML["blagoevgrad"]=bothCityStats[1].prices;
            // let preXML = {city: bothCityStats[0].prices,
            //               blagoevgrad: bothCityStats[1].prices};
            res.send(js2xmlparser.parse("Stats", preXML))}
        );
});

router.get('/numbeo/xml/single/:city', function (req, res, next) {
    let city = req.params.city;
    res.set('Content-Type', 'text/xml');
    Promise.all([getCityStats(city), getCityStats('Blagoevgrad')])
        .then((bothCityStats) => filterPrices(bothCityStats, true))
        .then((bothCityStats) => {
            let preXML = new Array();
            for (let i = 0; i < bothCityStats[0].prices.length; i++) {
                let obj = bothCityStats[0].prices[i];
                obj=Object.assign({city: city},obj);//obj["city"]=city;
                preXML.push(obj);
                obj = bothCityStats[1].prices[i];
                obj=Object.assign({city: "Blagoevgrad"},obj);//obj["city"]="Blagoevgrad";
                preXML.push(obj);
            }
            // for (let i = 0; i < bothCityStats[1].prices.length; i++) {
            //     let
            // }
            //preXML[city]=bothCityStats[0].prices;
            //preXML["blagoevgrad"]=bothCityStats[1].prices;
            res.send(js2xmlparser.parse("Stats", preXML))}
        );
});

router.get('/testIP', function (req, res, next) {
    let ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    getGeoJSON(ip)
        .then((geoJSON) => res.json(geoJSON));
});

router.get('/getItem/:city/:item', function (req, res, next) {
    let city = req.params.city;
    let item = req.params.item;
    getItemStats(city, item)
        .then((resJSON) => res.json(resJSON[0]));
    //res.render('test', {title: 'Arguments', text: city});
});

router.get('/', function (req, res, next) {
    res.render('small');
    // res.render('test', {title: 'Express app for cost comparison', text: "Checks client IP and compares cost of a burger in that city against Blago"});
});

module.exports = router;

