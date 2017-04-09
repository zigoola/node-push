var MiPush = require('xiaomi-push');
var Message = MiPush.Message;
var Notification = MiPush.Notification;

const method = 'xiaomi';

module.exports = (regIds, data, settings) => {
    var message = new Message();
    message.title(data.title)
    .description(data.alert)
    .notifyType(-1)
    .passThrough(0)
    .extra('_id', data._id)
    .extra('message', data.message)
    .extra('badge', 6);

    var notification = new Notification({
        production: settings.xiaomi.production,
        appSecret: settings.xiaomi.appSecret,
    });

    const resumed = {
        method,
        success: 0,
        failure: 0,
        message: [],
    };

    var promises = [];

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
