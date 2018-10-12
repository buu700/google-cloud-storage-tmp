/*!
 * Copyright 2015 Google Inc. All Rights Reserved.
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
const request = require("request");
/**
 * Create a channel object to interact with a Cloud Storage channel.
 *
 * @see [Object Change Notification]{@link https://cloud.google.com/storage/docs/object-change-notification}
 *
 * @class
 *
 * @param {string} id The ID of the channel.
 * @param {string} resourceId The resource ID of the channel.
 *
 * @example
 * const {Storage} = require('@google-cloud/storage');
 * const storage = new Storage();
 * const channel = storage.channel('id', 'resource-id');
 */
class Channel extends common_1.ServiceObject {
    constructor(storage, id, resourceId) {
        const config = {
            parent: storage,
            baseUrl: '/channels',
            // An ID shouldn't be included in the API requests.
            // RE:
            // https://github.com/GoogleCloudPlatform/google-cloud-node/issues/1145
            id: '',
            methods: {
            // Only need `request`.
            },
            requestModule: request,
        };
        super(config);
        // TODO: remove type cast to any once ServiceObject's type declaration has
        // been fixed. https://github.com/googleapis/nodejs-common/issues/176
        const metadata = this.metadata;
        metadata.id = id;
        metadata.resourceId = resourceId;
    }
    stop(callback) {
        callback = callback || common_1.util.noop;
        this.request({
            method: 'POST',
            uri: '/stop',
            json: this.metadata,
        }, (err, apiResponse) => {
            callback(err, apiResponse);
        });
    }
}
exports.Channel = Channel;
/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisify_1.promisifyAll(Channel);
//# sourceMappingURL=channel.js.map