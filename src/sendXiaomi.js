var MiPush = require('../lib');
var Message = MiPush.Message;
var Notification = MiPush.Notification;

const method = 'xiaomi';

module.exports = (regIds, data, settings) => {
    var message = new Message();
    message
    .title(data.title)
    .description('push')
    .payload(data.content)
    .passThrough(0)
    .notifyType(-1)
    .extra('badge', 6);

    var notification = new Notification({
        production: settings.production,
        appSecret: settings.appSecret
    });

    const resumed = {
        method,
        success: 0,
        failure: 0,
        message: [],
    };

    regIds.forEach((regId) => {
        notification.send(regId, message, (err, response) => {
            resumed.success += err || response.error ? 0 : 1;
            resumed.failure += err || response.error ? 1 : 0;
            resumed.message.push({
                regId,
                error: err || (response.error ? new Error(response.error) : null),
            });
            promises.push(Promise.resolve());
        });
    });

    return Promise.all(promises)
        .then(() => resumed);
};
