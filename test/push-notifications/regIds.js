import { describe, it, before, after, beforeEach, afterEach } from 'mocha'; // eslint-disable-line import/no-extraneous-dependencies
import { expect } from 'chai'; // eslint-disable-line import/no-extraneous-dependencies
import sinon from 'sinon'; // eslint-disable-line import/no-extraneous-dependencies
import PN from '../../src';
import sendGCM from '../../src/sendGCM';
import sendAPN from '../../src/sendAPN';
import sendADM from '../../src/sendADM';
import sendWNS from '../../src/sendWNS';
import sendHuawei from '../../src/sendHuawei';
import sendXiaomi from '../../src/sendXiaomi';

const regIds = [
    {registrationId: 'APA91bFQCD9Ndd8uVggMhj1usfeWsKIfGyBUWMprpZLGciWrMjS-77bIY24IMQNeEHzjidCcddnDxqYo-UEV03xw6ySmtIgQyzTqhSxhPGAi1maf6KDMAQGuUWc6L5Khze8YK9YrL9I_WD1gl49P3f_9hr08ZAS5Tw', source: 'gcm'}, // android
    {registrationId: '43e798c31a282d129a34d84472bbdd7632562ff0732b58a85a27c5d9fdf59b69', source: 'apn'},// ios
    {registrationId: 'https://db5.notify.windows.com/?token=AwYAAAD8sfbDrL9h7mN%2bmwlkSkQZCIfv4QKeu1hYRipj2zNvXaMi9ZAax%2f6CDfysyHp61STCO1pCFPt%2b9L4Jod72JhIcjDr8b2GxuUOBMTP%2b6%2bqxEfSB9iZfSATdZbdF7cJHSRA%3d', source: 'wns'}, // windows phone
    {registrationId: 'amzn1.adm-registration.v2.Y29tLmFtYXpvbi5EZXZpY2VNZXNzYWdpbmcuUmVnaXN0cmF0aW9uSWRFbmNyeXB0aW9uS2V5ITEhOE9rZ2h5TXlhVEFFczg2ejNWL3JMcmhTa255Uk5BclhBbE1XMFZzcnU1aFF6cTlvdU5FbVEwclZmdk5oTFBVRXVDN1luQlRSNnRVRUViREdQSlBvSzRNaXVRRUlyUy9NYWZCYS9VWTJUaGZwb3ZVTHhlRTM0MGhvampBK01hVktsMEhxakdmQStOSXRjUXBTQUhNU1NlVVVUVkFreVRhRTBCYktaQ2ZkUFdqSmIwcHgzRDhMQnllVXdxQ2EwdHNXRmFVNklYL0U4UXovcHg0K3Jjb25VbVFLRUVVOFVabnh4RDhjYmtIcHd1ZThiekorbGtzR2taMG95cC92Y3NtZytrcTRPNjhXUUpiZEk3QzFvQThBRTFWWXM2NHkyMjdYVGV5RlhhMWNHS0k9IW5GNEJMSXNleC9xbWpHSU52NnczY0E9PQ', source: 'adm'}, // amazon
    {registrationId: 'lakjkljaklalkdjfklajfpijwojaosfjkjaskldfjkaljfkljakfljkasf', source: 'huawei'}, // huawei
    {registrationId: 'lakjkljaklalkdjfklajfpijwojaosfjkjaskldfjkaljfkljakfljkasf', source: 'xiaomi'}, // xiaomi
    {registrationId: 'abcdef', source: ''}, // unknown
];
const data = {
    title: 'title',
    body: 'body',
};

describe('push-notifications: call with registration ids for android, ios, windows phone and amazon', () => {
    let pn;
    let sendWith;

    before(() => {
        pn = new PN();
        sendWith = sinon.stub(PN.prototype, 'sendWith', (method, _regIds, _data, cb) => {
            const result = {
                method: '',
                success: 1,
                failure: 0,
                message: _regIds.map(regId => ({ regId })),
            };
            switch (regIds.indexOf(_regIds[0])) {
                case 0:
                    expect(method).to.equal(sendGCM);
                    break;

                case 1:
                    expect(method).to.equal(sendAPN);
                    break;

                case 2:
                    expect(method).to.equal(sendWNS);
                    break;

                case 3:
                    expect(method).to.equal(sendADM);
                    break;

                default:
                    expect('Method should be sendGCM, sendAPN, sendWNS or sendADM').to.equal(true);
                    break;

            }
            expect(data).to.equal(data);
            _regIds.forEach(regId => expect(regIds).to.include(regId));
            expect(cb).to.equal(undefined);
            // (cb || (noop => noop))();
            return Promise.resolve(result);
        });
    });

    after(() => {
        sendWith.restore();
    });

    it('should call the correct method for each registration id (array) and should resolve with results (callback)', (done) => {
        pn.send(regIds, data, (err, results) => {
            try {
                expect(err).to.equal(null);
                results.forEach((result) => {
                    if (result.method === '') {
                        expect(result.success).to.equal(1);
                        expect(result.failure).to.equal(0);
                    } else {
                        expect(result.method).to.equal('unknown');
                        expect(result.success).to.equal(0);
                        expect(result.failure).to.equal(1);
                        expect(result.message[0]).to.have.property('error');
                        expect(result.message[0].error).to.be.instanceOf(Error);
                        expect(result.message[0].error.message).to.equal('Unknown registration id');
                    }
                    expect(result.message.length).to.equal(1);
                    expect(result.message[0]).to.have.property('regId');
                    expect(regIds).to.include(result.message[0].regId);
                });
                done(err);
            } catch (e) {
                done(err || e);
            }
        });
    });

    it('should call the correct method for each registration id (array) and should resolve with results (promise)', (done) => {
        pn.send(regIds, data)
            .then((results) => {
                results.forEach((result) => {
                    if (result.method === '') {
                        expect(result.success).to.equal(1);
                        expect(result.failure).to.equal(0);
                    } else {
                        expect(result.method).to.equal('unknown');
                        expect(result.success).to.equal(0);
                        expect(result.failure).to.equal(1);
                        expect(result.message[0]).to.have.property('error');
                        expect(result.message[0].error).to.be.instanceOf(Error);
                        expect(result.message[0].error.message).to.equal('Unknown registration id');
                    }
                    expect(result.message.length).to.equal(1);
                    expect(result.message[0]).to.have.property('regId');
                    expect(regIds).to.include(result.message[0].regId);
                });
                done();
            })
            .catch(done);
    });

    it('should call the correct method for each registration id (string) and should resolve with results (callback)', (done) => {
        const promises = [];
        regIds.forEach((regId) => {
            promises.push(pn.send(regId, data, (err, results) => {
                expect(err).to.equal(null);
                results.forEach((result) => {
                    if (result.method === '') {
                        expect(result.success).to.equal(1);
                        expect(result.failure).to.equal(0);
                    } else {
                        expect(result.method).to.equal('unknown');
                        expect(result.success).to.equal(0);
                        expect(result.failure).to.equal(1);
                        expect(result.message[0]).to.have.property('error');
                        expect(result.message[0].error).to.be.instanceOf(Error);
                        expect(result.message[0].error.message).to.equal('Unknown registration id');
                    }
                    expect(result.message.length).to.equal(1);
                    expect(result.message[0]).to.have.property('regId');
                    expect(regIds).to.include(result.message[0].regId);
                });
            }));
        });
        Promise.all(promises).then(() => done(), done);
    });

    it('should call the correct method for each registration id (string) and should resolve with results (promise)', (done) => {
        const promises = [];
        regIds.forEach((regId) => {
            promises.push(pn.send(regId, data)
                .then((results) => {
                    results.forEach((result) => {
                        if (result.method === '') {
                            expect(result.success).to.equal(1);
                            expect(result.failure).to.equal(0);
                        } else {
                            expect(result.method).to.equal('unknown');
                            expect(result.success).to.equal(0);
                            expect(result.failure).to.equal(1);
                            expect(result.message[0]).to.have.property('error');
                            expect(result.message[0].error).to.be.instanceOf(Error);
                            expect(result.message[0].error.message).to.equal('Unknown registration id');
                        }
                        expect(result.message.length).to.equal(1);
                        expect(result.message[0]).to.have.property('regId');
                        expect(regIds).to.include(result.message[0].regId);
                    });
                }));
        });
        Promise.all(promises).then(() => done(), done);
    });
});

describe('push-notifications: error while sending push notifications', () => {
    const fErr = new Error('Forced error');
    let pn;
    let sendWith;
    beforeEach(() => {
        pn = new PN();
        sendWith = sinon.stub(PN.prototype, 'sendWith', () => {
            throw fErr;
        });
    });
    afterEach(() => {
        sendWith.restore();
    });

    it('should catch an error occurred during push notifications sending (callback)', (done) => {
        pn.send(regIds, data, (err) => {
            try {
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.equal(fErr.message);
                done();
            } catch (e) {
                done(err || e);
            }
        })
            .catch(() => { }); // This is to avoid UnhandledPromiseRejectionWarning
    });

    it('should catch an error occurred during push notifications sending (promise)', (done) => {
        pn.send(regIds, data)
            .then(() => {
                done('An error should have been thrown and catched by promise .catch method');
            })
            .catch((err) => {
                try {
                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).to.equal(fErr.message);
                    sendWith.restore();
                    done();
                } catch (e) {
                    done(err || e);
                }
            });
    });
});
