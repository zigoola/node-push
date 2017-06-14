const Huawei = require('huawei-push');

const Message = Huawei.Message;
const Notification = Huawei.Notification;

const method = 'huawei';

module.exports = (regIds, data, settings) => {
    const message = new Message();
    message.title(data.title)
        .content(data.body);

    const notification = new Notification({
        appId: settings.huawei.appId,
        appSecret: settings.huawei.appSecret,
    });

    const callback = (err, result) => {
        console.log(err, result);
    };

    return notification.send(regIds, message, callback)
        .then((response) => {
            const resumed = {
                method,
                success: 0,
                failure: 0,
                message: [],
            };
            (response.sent || []).forEach((token) => {
                resumed.success += 1;
                resumed.message.push({
                    regId: token,
                    error: null,
                });
            });
            (response.failed || []).forEach((failure) => {
                resumed.failure += 1;
                if (failure.error) {
                    // A transport-level error occurred (e.g. network problem)
                    resumed.message.push({
                        regId: failure.device,
                        error: failure.error,
                    });
                } else {
                    // `failure.status` is the HTTP status code
                    // `failure.response` is the JSON payload
                    resumed.message.push({
                        regId: failure.device,
                        error: new Error(failure.response.reason || failure.response),
                    });
                }
            });
            return resumed;
        });
};
