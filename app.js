const gplay = require('google-play-scraper');
const request = require("request");


exports.getAppInfoHandler = function(event, context, callback) {
    console.log(event)
    if (!event || !event.id) {
        context.callbackWaitsForEmptyEventLoop = false;
        callback(null, {
            status: "error",
            message: "the app id is not valid"
        });
    }

    gplay.app({ appId: event.id || 'com.dxco.pandavszombies', lang: event.lang || "en", country: event.country || "us" })
        .then(function(app) {
            app.offerId = event.offer_id
            app = JSON.stringify(app)


            context.callbackWaitsForEmptyEventLoop = false;

            callback(null, app);

        })
        .catch(function(e) {

            context.callbackWaitsForEmptyEventLoop = false;
            callback(e, "error");



            //logger.error("url:" + req.url + ", satusCode:" + res.statusCode + ",the app id is not valid")
        });
    // Use callback() and return information to the caller.  
}
