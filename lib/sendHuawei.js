'use strict';

var Huawei = require('huawei-push');

var Message = Huawei.Message;
var Notification = Huawei.Notification;

var method = 'huawei';

module.exports = function (regIds, data, settings) {
    var message = new Message();
    message.title(data.title).content(data.body);

    var notification = new Notification({
        appId: settings.huawei.appId,
        appSecret: settings.huawei.appSecret
    });

    var callback = function callback(err, result) {
        console.log(err, result);
    };

    return notification.send(regIds, message, callback).then(function (response) {
        var resumed = {
            method: method,
            success: 0,
            failure: 0,
            message: []
        };
        (response.sent || []).forEach(function (token) {
            resumed.success += 1;
            resumed.message.push({
                regId: token,
                error: null
            });
        });
        (response.failed || []).forEach(function (failure) {
            resumed.failure += 1;
            if (failure.error) {
                // A transport-level error occurred (e.g. network problem)
                resumed.message.push({
                    regId: failure.device,
                    error: failure.error
                });
            } else {
                // `failure.status` is the HTTP status code
                // `failure.response` is the JSON payload
                resumed.message.push({
                    regId: failure.device,
                    error: new Error(failure.response.reason || failure.response)
                });
            }
        });
        return resumed;
    });
};