/*!
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@google-cloud/common");
const promisify_1 = require("@google-cloud/promisify");
const is = require("is");
const request = require("request");
/**
 * A Notification object is created from your {@link Bucket} object using
 * {@link Bucket#notification}. Use it to interact with Cloud Pub/Sub
 * notifications.
 *
 * @see [Cloud Pub/Sub Notifications for Google Cloud Storage]{@link https://cloud.google.com/storage/docs/pubsub-notifications}
 *
 * @class
 * @hideconstructor
 *
 * @param {Bucket} bucket The bucket instance this notification is attached to.
 * @param {string} id The ID of the notification.
 *
 * @example
 * const {Storage} = require('@google-cloud/storage');
 * const storage = new Storage();
 * const myBucket = storage.bucket('my-bucket');
 *
 * const notification = myBucket.notification('1');
 */
class Notification extends common_1.ServiceObject {
    constructor(bucket, id) {
        const methods = {
            /**
             * Creates a notification subscription for the bucket.
             *
             * @see [Notifications: insert]{@link https://cloud.google.com/storage/docs/json_api/v1/notifications/insert}
             *
             * @param {Topic|string} topic The Cloud PubSub topic to which this
             *     subscription publishes. If the project ID is omitted, the current
             *     project ID will be used.
             *
             *     Acceptable formats are:
             *     - `projects/grape-spaceship-123/topics/my-topic`
             *
             *     - `my-topic`
             * @param {CreateNotificationRequest} [options] Metadata to set for
             *     the notification.
             * @param {CreateNotificationCallback} [callback] Callback function.
             * @returns {Promise<CreateNotificationResponse>}
             * @throws {Error} If a valid topic is not provided.
             *
             * @example
             * const {Storage} = require('@google-cloud/storage');
             * const storage = new Storage();
             * const myBucket = storage.bucket('my-bucket');
             * const notification = myBucket.notification('1');
             *
             * notification.create(function(err, notification, apiResponse) {
             *   if (!err) {
             *     // The notification was created successfully.
             *   }
             * });
             *
             * //-
             * // If the callback is omitted, we'll return a Promise.
             * //-
             * notification.create().then(function(data) {
             *   const notification = data[0];
             *   const apiResponse = data[1];
             * });
             */
            create: true,
            /**
             * @typedef {array} NotificationExistsResponse
             * @property {boolean} 0 Whether the notification exists or not.
             */
            /**
             * @callback NotificationExistsCallback
             * @param {?Error} err Request error, if any.
             * @param {boolean} exists Whether the notification exists or not.
             */
            /**
             * Check if the notification exists.
             *
             * @param {NotificationExistsCallback} [callback] Callback function.
             * @returns {Promise<NotificationExistsResponse>}
             *
             * @example
             * const {Storage} = require('@google-cloud/storage');
             * const storage = new Storage();
             * const myBucket = storage.bucket('my-bucket');
             * const notification = myBucket.notification('1');
             *
             * notification.exists(function(err, exists) {});
             *
             * //-
             * // If the callback is omitted, we'll return a Promise.
             * //-
             * notification.exists().then(function(data) {
             *   const exists = data[0];
             * });
             */
            exists: true,
        };
        super({
            parent: bucket,
            baseUrl: '/notificationConfigs',
            id: id.toString(),
            createMethod: bucket.createNotification.bind(bucket),
            methods,
            requestModule: request,
        });
    }
    delete(optionsOrCallback, callback) {
        const options = typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
        callback =
            typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
        this.request({
            method: 'DELETE',
            uri: '',
            qs: options,
        }, callback || common_1.util.noop);
    }
    get(optionsOrCallback, callback) {
        const options = typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
        callback =
            typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
        const autoCreate = options.autoCreate;
        delete options.autoCreate;
        const onCreate = (err, notification, apiResponse) => {
            if (err) {
                if (err.code === 409) {
                    this.get(options, callback);
                    return;
                }
                callback(err, null, apiResponse);
                return;
            }
            callback(null, notification, apiResponse);
        };
        this.getMetadata(options, (err, metadata) => {
            if (err) {
                if (err.code === 404 && autoCreate) {
                    const args = [];
                    if (!is.empty(options)) {
                        args.push(options);
                    }
                    args.push(onCreate);
                    this.create.apply(this, args);
                    return;
                }
                callback(err, null, metadata);
                return;
            }
            callback(null, this, metadata);
        });
    }
    getMetadata(optionsOrCallback, callback) {
        const options = typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
        callback =
            typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
        this.request({
            uri: '',
            qs: options,
        }, (err, resp) => {
            if (err) {
                callback(err, null, resp);
                return;
            }
            this.metadata = resp;
            callback(null, this.metadata, resp);
        });
    }
}
exports.Notification = Notification;
/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisify_1.promisifyAll(Notification);
//# sourceMappingURL=notification.js.map