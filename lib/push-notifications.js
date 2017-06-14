'use strict';

var _sendGCM = require('./sendGCM');

var _sendGCM2 = _interopRequireDefault(_sendGCM);

var _sendAPN = require('./sendAPN');

var _sendAPN2 = _interopRequireDefault(_sendAPN);

var _sendADM = require('./sendADM');

var _sendADM2 = _interopRequireDefault(_sendADM);

var _sendWNS = require('./sendWNS');

var _sendWNS2 = _interopRequireDefault(_sendWNS);

var _sendHuawei = require('./sendHuawei');

var _sendHuawei2 = _interopRequireDefault(_sendHuawei);

var _sendXiaomi = require('./sendXiaomi');

var _sendXiaomi2 = _interopRequireDefault(_sendXiaomi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultSettings = {
    gcm: {
        id: null },
    apn: { // See options at https://github.com/node-apn/node-apn/blob/master/doc/provider.markdown
        token: null,
        // {
        //     key: '',
        //     keyId: '',
        //     teamId: '',
        // },
        cert: 'cert.pem',
        key: 'key.pem',
        ca: null,
        pfx: null,
        passphrase: null,
        production: process.env.NODE_ENV === 'production',
        voip: false,
        address: null,
        port: 443,
        rejectUnauthorized: true,
        connectionRetryLimit: 10,

        cacheLength: 1000,
        connectionTimeout: 3600000,
        autoAdjustCache: true,
        maxConnections: 1,
        minConnections: 1,
        connectTimeout: 10000,
        buffersNotifications: true,
        fastMode: false,
        disableNagle: false,
        disableEPIPEFix: false
    },
    adm: {
        client_id: null, // PUT YOUR ADM CLIENT ID,
        client_secret: null },
    wns: {
        client_id: null, // PUT YOUR WNS CLIENT ID,
        client_secret: null, // PUT YOUR WNS CLIENT SECRET,
        accessToken: null,
        headers: null,
        notificationMethod: 'sendTileSquareBlock'
    },
    mpns: {
        options: {}
    },
    huawei: {
        appId: null,
        appSecret: null
    },
    xiaomi: {
        production: true,
        restrictedPackageName: null,
        appSecret: null
    }
};

function PN(options) {
    this.settings = Object.assign({}, defaultSettings, options || {});
}

PN.prototype.setOptions = function setOptions(opts) {
    this.settings = Object.assign({}, this.settings, opts);
};

PN.prototype.sendWith = function sendWith(method, regIds, data, cb) {
    return method(regIds, data, this.settings).then(function (results) {
        (cb || function (noop) {
            return noop;
        })(null, results);
        return results;
    }).catch(function (error) {
        (cb || function (noop) {
            return noop;
        })(error);
        return Promise.reject(error);
    });
};

PN.prototype.send = function send(_tokens, data, callback) {
    var promises = [];
    var regIdsGCM = [];
    var regIdsAPN = [];
    var regIdsWNS = [];
    var regIdsADM = [];
    var regIdsHuawei = [];
    var regIdsXiaomi = [];
    var regIdsUnk = [];
    var tokens = Array.isArray(_tokens || []) ? _tokens || [] : [_tokens];

    // Classify each pushId for corresponding device
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = tokens[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var token = _step.value;

            if (token.source === 'wns') {
                regIdsWNS.push(token.registrationId);
            } else if (token.source === 'adm') {
                regIdsADM.push(token.registrationId);
            } else if (token.source === 'gcm') {
                regIdsGCM.push(token.registrationId);
            } else if (token.source === 'apn') {
                regIdsAPN.push(token.registrationId);
            } else if (token.source === 'huawei') {
                regIdsHuawei.push(token.registrationId);
            } else if (token.source === 'xiaomi') {
                regIdsXiaomi.push(token.registrationId);
            } else {
                regIdsUnk.push(token.registrationId);
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    try {
        // Android GCM
        if (regIdsGCM.length > 0) {
            promises.push(this.sendWith(_sendGCM2.default, regIdsGCM, data));
        }

        // iOS APN
        if (regIdsAPN.length > 0) {
            promises.push(this.sendWith(_sendAPN2.default, regIdsAPN, data));
        }

        // Microsoft WNS
        if (regIdsWNS.length > 0) {
            promises.push(this.sendWith(_sendWNS2.default, regIdsWNS, data));
        }

        // Amazon ADM
        if (regIdsADM.length > 0) {
            promises.push(this.sendWith(_sendADM2.default, regIdsADM, data));
        }

        // Huawei push
        if (regIdsHuawei.length > 0) {
            promises.push(this.sendWith(_sendHuawei2.default, regIdsHuawei, data));
        }

        // Xiaomi push
        if (regIdsXiaomi.length > 0) {
            promises.push(this.sendWith(_sendXiaomi2.default, regIdsXiaomi, data));
        }
    } catch (err) {
        promises.push(Promise.reject(err));
    }

    // Unknown
    if (regIdsUnk.length > 0) {
        var results = {
            method: 'unknown',
            success: 0,
            failure: regIdsUnk.length,
            message: []
        };
        regIdsUnk.forEach(function (regId) {
            results.message.push({
                regId: regId,
                error: new Error('Unknown registration id')
            });
        });
        promises.push(Promise.resolve(results));
    }

    // No regIds detected
    if (promises.length === 0) {
        promises.push(Promise.resolve({
            method: 'none',
            success: 0,
            failure: 0,
            message: []
        }));
    }

    return Promise.all(promises).then(function (results) {
        var cb = callback || function (noop) {
            return noop;
        };
        cb(null, results);
        return results;
    }).catch(function (err) {
        var cb = callback || function (noop) {
            return noop;
        };
        cb(err);
        return Promise.reject(err);
    });
};

module.exports = PN;