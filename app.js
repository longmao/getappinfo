var gplay = require('google-play-scraper');
var express = require('express')
var cluster = require('cluster');
var http = require('http');
var logger = require("./logger");
var util = require("./util/util.js")();
var app = express()
var numCPUs = require('os').cpus().length;
var _ = require("./util/lodash.js")

var path = require('path')
var childProcess = require('child_process')
var phantomjs = require('phantomjs')
var binPath = phantomjs.path


var request = require('request');

require('events').EventEmitter.defaultMaxListeners = Infinity;

var http = require('http');
var websocket_server = require('websocket').server



app.use(require("morgan")("combined", { "stream": logger.stream }));


if (cluster.isMaster) {
    console.log('[master] ' + "start master...");

    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('listening', function(worker, address) {
        console.log('[master] ' + 'listening: worker' + worker.id + ',pid:' + worker.process.pid + ', Address:' + address.address + ":" + address.port);
    });

} else if (cluster.isWorker) {
    console.log('[worker] ' + "start worker ..." + cluster.worker.id);
    app.listen(8888);
}


var socket = new websocket_server({
    httpServer: http.createServer().listen(1337)
});




app.get('/getAppInfo', function(req, res) {
    if (!req.query || !req.query.id) return res.send({ msg: "app id can not empty" })

    gplay.app({ appId: req.query.id || 'com.dxco.pandavszombies', lang: req.query.lang || "en", country: req.query.country || "us" })
        .then(function(app) {
            console.log('worker' + cluster.worker.id);
            res.send(app);
        })
        .catch(function(e) {
            res.send({
                status: "error",
                message: "the app id is not valid"
            });
            logger.error("url:" + req.url + ", satusCode:" + res.statusCode + ",the app id is not valid")
        });
})
var connection;
socket.on('request', function(request) {

    connection = request.accept(null, request.origin);

    connection.on('message', function(message) {
        console.log(message)
        if (message.utf8Data === "startCrawl") {
            if(util.isFetchingData) return
            util.isFetchingData = true
            util.writeData(util.get_cache_json_url("./"), "", "", function() {
                util.getData(util.get_google_play_apps("./"), function(data) {
                    var arr = data.split("\n")

                    var arr_app_id = []
                    arr.forEach(function(i) {

                        var id = i.replace("\n", "");
                        id = id.replace("\r", "")
                        id && arr_app_id.push(id);
                    })
                    console.log(arr_app_id.length)
                    arr_app_id = _.uniq(arr_app_id)
                    console.log(arr_app_id.length)
                    var arr_app_id_length = 3 || arr_app_id.length
                    if (util.isFinishFetchData) return
                    for (var j = 0; j < arr_app_id_length; j++) {
                        var url = "http://localhost:8888/getAppInfo?id=" + arr_app_id[j] + "&lang=en&country=us";
                        util.saveToJSONFile(arr_app_id[j], url, arr_app_id_length, function(data) {
                            connection.sendUTF(data);
                        })
                    }
                })

            })
        }


    });

    connection.on('close', function(connection) {
        console.log("close")
        console.log('connection closed');
    });
});



app.get('/getAppInfoFromFile', function(req, res) {

    res.sendFile('index.html', { root: __dirname }, function() {

    })





})
app.get('/getFinalSpiderHtml', function(req, res) {
    var url = req.query.url || "http://global.ymtracking.com/trace?offer_id=116686&aff_id=1&aff_sub=unlock%40%4056f33980e4b0f048710723e4&android_id=375dec1f7a6c588e";
    var childArgs = [
        path.join(__dirname, 'phantomjs-script.js'),
        url
    ]
    childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
        request(stdout, function(error, response, body) {
            response.headers['statusCode'] = response.statusCode
            res.send({
                html: body,
                headers: response.headers,
                finalUrl: stdout
            });
        })
    })




})

app.get('/', function(req, res) {
    res.sendFile('index.html', { root: __dirname })
});


app.use(function(req, res, next) {
    res.status(404).send("Sorry, page not found");
});
