/*!
 * Copyright 2014 Google Inc. All Rights Reserved.
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
const compressible = require("compressible");
const concat = require("concat-stream");
const crypto = require("crypto");
const duplexify = require("duplexify");
const extend = require("extend");
const fs = require("fs");
const hashStreamValidation = require('hash-stream-validation');
const is = require("is");
const mime = require("mime");
const once = require("once");
const os = require("os");
const pumpify = require('pumpify');
const resumableUpload = require("gcs-resumable-upload");
const streamEvents = require("stream-events");
const through = require("through2");
const xdgBasedir = require("xdg-basedir");
const zlib = require("zlib");
const url = require("url");
const r = require("request");
const acl_1 = require("./acl");
const util_1 = require("./util");
/**
 * Custom error type for errors related to creating a resumable upload.
 *
 * @private
 */
class ResumableUploadError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'ResumableUploadError';
    }
}
/**
 * Custom error type for errors related to getting signed errors and policies.
 *
 * @private
 */
class SigningError extends Error {
    constructor() {
        super(...arguments);
        this.name = 'SigningError';
    }
}
/**
 * @const {string}
 * @private
 */
const STORAGE_DOWNLOAD_BASE_URL = 'https://storage.googleapis.com';
/**
 * @const {string}
 * @private
 */
const STORAGE_UPLOAD_BASE_URL = 'https://www.googleapis.com/upload/storage/v1/b';
/**
 * @const {RegExp}
 * @private
 */
const GS_URL_REGEXP = /^gs:\/\/([a-z0-9_.-]+)\/(.+)$/;
class RequestError extends Error {
}
/**
 * A File object is created from your {@link Bucket} object using
 * {@link Bucket#file}.
 *
 * @class
 * @param {Bucket} bucket The Bucket instance this file is
 *     attached to.
 * @param {string} name The name of the remote file.
 * @param {object} [options] Configuration options.
 * @param {string} [options.encryptionKey] A custom encryption key.
 * @param {number} [options.generation] Generation to scope the file to.
 * @param {string} [options.kmsKeyName] Cloud KMS Key used to encrypt this
 *     object, if the object is encrypted by such a key. Limited availability;
 *     usable only by enabled projects.
 * @param {string} [options.userProject] The ID of the project which will be
 *     billed for all requests made from File object.
 * @example
 * const {Storage} = require('@google-cloud/storage');
 * const storage = new Storage();
 * const myBucket = storage.bucket('my-bucket');
 *
 * const file = myBucket.file('my-file');
 */
class File extends common_1.ServiceObject {
    constructor(bucket, name, options = {}) {
        name = name.replace(/^\/+/, '');
        super({
            parent: bucket,
            baseUrl: '/o',
            id: encodeURIComponent(name),
            requestModule: r,
        });
        this.bucket = bucket;
        // tslint:disable-next-line:no-any
        this.storage = bucket.parent;
        this.kmsKeyName = options.kmsKeyName;
        this.userProject = options.userProject || bucket.userProject;
        this.name = name;
        if (options.generation != null) {
            let generation;
            if (typeof options.generation === 'string') {
                generation = Number(options.generation);
            }
            else {
                generation = options.generation;
            }
            if (!isNaN(generation)) {
                this.generation = generation;
                this.requestQueryObject = {
                    generation: this.generation,
                };
            }
        }
        if (options.encryptionKey) {
            this.setEncryptionKey(options.encryptionKey);
        }
        this.acl = new acl_1.Acl({
            request: this.request.bind(this),
            pathPrefix: '/acl',
        });
    }
    copy(destination, optionsOrCallback, callback) {
        const noDestinationError = new Error('Destination file should have a name.');
        if (!destination) {
            throw noDestinationError;
        }
        let options = {};
        if (typeof optionsOrCallback === 'function') {
            callback = optionsOrCallback;
        }
        else if (optionsOrCallback) {
            options = optionsOrCallback;
        }
        options = extend(true, {}, options);
        callback = callback || common_1.util.noop;
        let destBucket;
        let destName;
        let newFile;
        if (typeof destination === 'string') {
            const parsedDestination = GS_URL_REGEXP.exec(destination);
            if (parsedDestination !== null && parsedDestination.length === 3) {
                destBucket = this.storage.bucket(parsedDestination[1]);
                destName = parsedDestination[2];
            }
            else {
                destBucket = this.bucket;
                destName = destination;
            }
        }
        else if (destination.constructor && destination.constructor.name === 'Bucket') {
            destBucket = destination;
            destName = this.name;
        }
        else if (destination instanceof File) {
            destBucket = destination.bucket;
            destName = destination.name;
            newFile = destination;
        }
        else {
            throw noDestinationError;
        }
        const query = {};
        if (is.defined(this.generation)) {
            query.sourceGeneration = this.generation;
        }
        if (is.defined(options.token)) {
            query.rewriteToken = options.token;
        }
        if (is.defined(options.userProject)) {
            query.userProject = options.userProject;
            delete options.userProject;
        }
        newFile = newFile || destBucket.file(destName);
        const headers = {};
        if (is.defined(this.encryptionKey)) {
            headers['x-goog-copy-source-encryption-algorithm'] = 'AES256';
            headers['x-goog-copy-source-encryption-key'] = this.encryptionKeyBase64;
            headers['x-goog-copy-source-encryption-key-sha256'] =
                this.encryptionKeyHash;
        }
        if (is.defined(newFile.encryptionKey)) {
            this.setEncryptionKey(newFile.encryptionKey);
        }
        else if (is.defined(options.destinationKmsKeyName)) {
            query.destinationKmsKeyName = options.destinationKmsKeyName;
            delete options.destinationKmsKeyName;
        }
        else if (is.defined(newFile.kmsKeyName)) {
            query.destinationKmsKeyName = newFile.kmsKeyName;
        }
        if (query.destinationKmsKeyName) {
            this.kmsKeyName = query.destinationKmsKeyName;
            const keyIndex = this.interceptors.indexOf(this.encryptionKeyInterceptor);
            if (keyIndex > -1) {
                this.interceptors.splice(keyIndex, 1);
            }
        }
        this.request({
            method: 'POST',
            uri: `/rewriteTo/b/${destBucket.name}/o/${encodeURIComponent(newFile.name)}`,
            qs: query,
            json: options,
            headers,
        }, (err, resp) => {
            if (err) {
                callback(err, null, resp);
                return;
            }
            if (resp.rewriteToken) {
                const options = {
                    token: resp.rewriteToken,
                };
                if (query.userProject) {
                    options.userProject = query.userProject;
                }
                if (query.destinationKmsKeyName) {
                    options.destinationKmsKeyName = query.destinationKmsKeyName;
                }
                this.copy(newFile, options, callback);
                return;
            }
            callback(null, newFile, resp);
        });
    }
    /**
     * Create a readable stream to read the contents of the remote file. It can be
     * piped to a writable stream or listened to for 'data' events to read a
     * file's contents.
     *
     * In the unlikely event there is a mismatch between what you downloaded and
     * the version in your Bucket, your error handler will receive an error with
     * code "CONTENT_DOWNLOAD_MISMATCH". If you receive this error, the best
     * recourse is to try downloading the file again.
     *
     * For faster crc32c computation, you must manually install
     * [`fast-crc32c`](http://www.gitnpm.com/fast-crc32c):
     *
     *     $ npm install --save fast-crc32c
     *
     * NOTE: Readable streams will emit the `end` event when the file is fully
     * downloaded.
     *
     * @param {object} [options] Configuration options.
     * @param {string} [options.userProject] The ID of the project which will be
     *     billed for the request.
     * @param {string|boolean} [options.validation] Possible values: `"md5"`,
     *     `"crc32c"`, or `false`. By default, data integrity is validated with a
     *     CRC32c checksum. You may use MD5 if preferred, but that hash is not
     *     supported for composite objects. An error will be raised if MD5 is
     *     specified but is not available. You may also choose to skip validation
     *     completely, however this is **not recommended**.
     * @param {number} [options.start] A byte offset to begin the file's download
     *     from. Default is 0. NOTE: Byte ranges are inclusive; that is,
     *     `options.start = 0` and `options.end = 999` represent the first 1000
     *     bytes in a file or object. NOTE: when specifying a byte range, data
     *     integrity is not available.
     * @param {number} [options.end] A byte offset to stop reading the file at.
     *     NOTE: Byte ranges are inclusive; that is, `options.start = 0` and
     *     `options.end = 999` represent the first 1000 bytes in a file or object.
     *     NOTE: when specifying a byte range, data integrity is not available.
     * @returns {ReadableStream}
     *
     * @example
     * //-
     * // <h4>Downloading a File</h4>
     * //
     * // The example below demonstrates how we can reference a remote file, then
     * // pipe its contents to a local file. This is effectively creating a local
     * // backup of your remote data.
     * //-
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const bucket = storage.bucket('my-bucket');
     *
     * const fs = require('fs');
     * const remoteFile = bucket.file('image.png');
     * const localFilename = '/Users/stephen/Photos/image.png';
     *
     * remoteFile.createReadStream()
     *   .on('error', function(err) {})
     *   .on('response', function(response) {
     *     // Server connected and responded with the specified status and
     * headers.
     *    })
     *   .on('end', function() {
     *     // The file is fully downloaded.
     *   })
     *   .pipe(fs.createWriteStream(localFilename));
     *
     * //-
     * // To limit the downloaded data to only a byte range, pass an options
     * object.
     * //-
     * const logFile = myBucket.file('access_log');
     * logFile.createReadStream({
     *     start: 10000,
     *     end: 20000
     *   })
     *   .on('error', function(err) {})
     *   .pipe(fs.createWriteStream('/Users/stephen/logfile.txt'));
     *
     * //-
     * // To read a tail byte range, specify only `options.end` as a negative
     * // number.
     * //-
     * const logFile = myBucket.file('access_log');
     * logFile.createReadStream({
     *     end: -100
     *   })
     *   .on('error', function(err) {})
     *   .pipe(fs.createWriteStream('/Users/stephen/logfile.txt'));
     */
    createReadStream(options = {}) {
        const rangeRequest = is.number(options.start) || is.number(options.end);
        const tailRequest = options.end < 0;
        // tslint:disable-next-line:no-any
        let validateStream; // Created later, if necessary.
        const throughStream = streamEvents(through());
        let crc32c = true;
        let md5 = false;
        let refreshedMetadata = false;
        if (is.string(options.validation)) {
            // tslint:disable-next-line:no-any
            options.validation =
                options.validation.toLowerCase();
            crc32c = options.validation === 'crc32c';
            md5 = options.validation === 'md5';
        }
        else if (options.validation === false) {
            crc32c = false;
        }
        if (rangeRequest) {
            if (is.string(options.validation) || options.validation === true) {
                throw new Error('Cannot use validation with file ranges (start/end).');
            }
            // Range requests can't receive data integrity checks.
            crc32c = false;
            md5 = false;
        }
        // Authenticate the request, then pipe the remote API request to the stream
        // returned to the user.
        const makeRequest = () => {
            const query = {
                alt: 'media',
            };
            if (this.generation) {
                query.generation = this.generation;
            }
            if (options.userProject) {
                query.userProject = options.userProject;
            }
            const headers = {
                'Accept-Encoding': 'gzip',
            };
            if (rangeRequest) {
                const start = is.number(options.start) ? options.start : '0';
                const end = is.number(options.end) ? options.end : '';
                headers.Range = `bytes=${tailRequest ? end : `${start}-${end}`}`;
            }
            const reqOpts = {
                forever: false,
                uri: '',
                headers,
                qs: query,
            };
            this.requestStream(reqOpts)
                .on('error', err => {
                throughStream.destroy(err);
            })
                .on('response', res => {
                throughStream.emit('response', res);
                // tslint:disable-next-line:no-any
                common_1.util.handleResp(null, res, null, onResponse);
            })
                .resume();
            // We listen to the response event from the request stream so that we
            // can...
            //
            //   1) Intercept any data from going to the user if an error occurred.
            //   2) Calculate the hashes from the http.IncomingMessage response
            //   stream,
            //      which will return the bytes from the source without decompressing
            //      gzip'd content. We then send it through decompressed, if
            //      applicable, to the user.
            const onResponse = (err, body, rawResponseStream) => {
                if (err) {
                    // Get error message from the body.
                    rawResponseStream.pipe(concat(body => {
                        err.message = body.toString();
                        throughStream.destroy(err);
                    }));
                    return;
                }
                const headers = rawResponseStream.toJSON().headers;
                const isCompressed = headers['content-encoding'] === 'gzip';
                const shouldRunValidation = !rangeRequest && (crc32c || md5);
                const throughStreams = [];
                if (shouldRunValidation) {
                    validateStream = hashStreamValidation({ crc32c, md5 });
                    throughStreams.push(validateStream);
                }
                if (isCompressed) {
                    throughStreams.push(zlib.createGunzip());
                }
                if (throughStreams.length === 1) {
                    rawResponseStream =
                        // tslint:disable-next-line:no-any
                        rawResponseStream.pipe(throughStreams[0]);
                }
                else if (throughStreams.length > 1) {
                    rawResponseStream =
                        rawResponseStream.pipe(pumpify.obj(throughStreams));
                }
                rawResponseStream.on('end', onComplete).pipe(throughStream, {
                    end: false
                });
            };
            // This is hooked to the `complete` event from the request stream. This is
            // our chance to validate the data and let the user know if anything went
            // wrong.
            const onComplete = (err) => {
                if (err) {
                    throughStream.destroy(err);
                    return;
                }
                if (rangeRequest) {
                    throughStream.end();
                    return;
                }
                if (!refreshedMetadata) {
                    refreshedMetadata = true;
                    this.getMetadata({ userProject: options.userProject }, onComplete);
                    return;
                }
                const hashes = {
                    crc32c: this.metadata.crc32c,
                    md5: this.metadata.md5Hash,
                };
                // If we're doing validation, assume the worst-- a data integrity
                // mismatch. If not, these tests won't be performed, and we can assume
                // the best.
                let failed = crc32c || md5;
                if (crc32c && hashes.crc32c) {
                    // We must remove the first four bytes from the returned checksum.
                    // http://stackoverflow.com/questions/25096737/
                    //   base64-encoding-of-crc32c-long-value
                    failed = !validateStream.test('crc32c', hashes.crc32c.substr(4));
                }
                if (md5 && hashes.md5) {
                    failed = !validateStream.test('md5', hashes.md5);
                }
                if (md5 && !hashes.md5) {
                    const hashError = new RequestError([
                        'MD5 verification was specified, but is not available for the',
                        'requested object. MD5 is not available for composite objects.',
                    ].join(' '));
                    hashError.code = 'MD5_NOT_AVAILABLE';
                    throughStream.destroy(hashError);
                }
                else if (failed) {
                    const mismatchError = new RequestError([
                        'The downloaded data did not match the data from the server.',
                        'To be sure the content is the same, you should download the',
                        'file again.',
                    ].join(' '));
                    mismatchError.code = 'CONTENT_DOWNLOAD_MISMATCH';
                    throughStream.destroy(mismatchError);
                }
                else {
                    throughStream.end();
                }
            };
        };
        throughStream.on('reading', makeRequest);
        return throughStream;
    }
    createResumableUpload(optionsOrCallback, callback) {
        const options = typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
        callback =
            typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
        resumableUpload.createURI({
            authClient: this.storage.authClient,
            bucket: this.bucket.name,
            file: this.name,
            generation: this.generation,
            key: this.encryptionKey,
            kmsKeyName: this.kmsKeyName,
            metadata: options.metadata,
            offset: options.offset,
            origin: options.origin,
            predefinedAcl: options.predefinedAcl,
            private: options.private,
            public: options.public,
            userProject: options.userProject,
        }, callback);
    }
    /**
     * Create a writable stream to overwrite the contents of the file in your
     * bucket.
     *
     * A File object can also be used to create files for the first time.
     *
     * Resumable uploads are automatically enabled and must be shut off explicitly
     * by setting `options.resumable` to `false`.
     *
     * Resumable uploads require write access to the $HOME directory. Through
     * [`config-store`](http://www.gitnpm.com/configstore), some metadata is
     * stored. By default, if the directory is not writable, we will fall back to
     * a simple upload. However, if you explicitly request a resumable upload, and
     * we cannot write to the config directory, we will return a
     * `ResumableUploadError`.
     *
     * <p class="notice">
     *   There is some overhead when using a resumable upload that can cause
     *   noticeable performance degradation while uploading a series of small
     * files. When uploading files less than 10MB, it is recommended that the
     * resumable feature is disabled.
     * </p>
     *
     * For faster crc32c computation, you must manually install
     * [`fast-crc32c`](http://www.gitnpm.com/fast-crc32c):
     *
     *     $ npm install --save fast-crc32c
     *
     * NOTE: Writable streams will emit the `finish` event when the file is fully
     * uploaded.
     *
     * @see [Upload Options (Simple or Resumable)]{@link https://cloud.google.com/storage/docs/json_api/v1/how-tos/upload}
     * @see [Objects: insert API Documentation]{@link https://cloud.google.com/storage/docs/json_api/v1/objects/insert}
     *
     * @param {object} [options] Configuration options.
     * @param {string} [options.contentType] Alias for
     *     `options.metadata.contentType`. If set to `auto`, the file name is used
     *     to determine the contentType.
     * @param {string|boolean} [options.gzip] If true, automatically gzip the file.
     *     If set to `auto`, the contentType is used to determine if the file
     * should be gzipped. This will set `options.metadata.contentEncoding` to
     * `gzip` if necessary.
     * @param {object} [options.metadata] See the examples below or
     *     [Objects: insert request
     * body](https://cloud.google.com/storage/docs/json_api/v1/objects/insert#request_properties_JSON)
     *     for more details.
     * @param {string} [options.offset] The starting byte of the upload stream, for
     *     resuming an interrupted upload. Defaults to 0.
     * @param {string} [options.predefinedAcl] Apply a predefined set of access
     *     controls to this object.
     *
     *     Acceptable values are:
     *     - **`authenticatedRead`** - Object owner gets `OWNER` access, and
     *       `allAuthenticatedUsers` get `READER` access.
     *
     *     - **`bucketOwnerFullControl`** - Object owner gets `OWNER` access, and
     *       project team owners get `OWNER` access.
     *
     *     - **`bucketOwnerRead`** - Object owner gets `OWNER` access, and project
     *       team owners get `READER` access.
     *
     *     - **`private`** - Object owner gets `OWNER` access.
     *
     *     - **`projectPrivate`** - Object owner gets `OWNER` access, and project
     *       team members get access according to their roles.
     *
     *     - **`publicRead`** - Object owner gets `OWNER` access, and `allUsers`
     * get `READER` access.
     * @param {boolean} [options.private] Make the uploaded file private. (Alias for
     *     `options.predefinedAcl = 'private'`)
     * @param {boolean} [options.public] Make the uploaded file public. (Alias for
     *     `options.predefinedAcl = 'publicRead'`)
     * @param {boolean} [options.resumable] Force a resumable upload. NOTE: When
     *     working with streams, the file format and size is unknown until it's
     *     completely consumed. Because of this, it's best for you to be explicit
     *     for what makes sense given your input.
     * @param {string} [options.uri] The URI for an already-created resumable
     *     upload. See {@link File#createResumableUpload}.
     * @param {string} [options.userProject] The ID of the project which will be
     *     billed for the request.
     * @param {string|boolean} [options.validation] Possible values: `"md5"`,
     *     `"crc32c"`, or `false`. By default, data integrity is validated with a
     *     CRC32c checksum. You may use MD5 if preferred, but that hash is not
     *     supported for composite objects. An error will be raised if MD5 is
     *     specified but is not available. You may also choose to skip validation
     *     completely, however this is **not recommended**.
     * @returns {WritableStream}
     *
     * @example
     * const fs = require('fs');
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     *
     * //-
     * // <h4>Uploading a File</h4>
     * //
     * // Now, consider a case where we want to upload a file to your bucket. You
     * // have the option of using {@link Bucket#upload}, but that is just
     * // a convenience method which will do the following.
     * //-
     * fs.createReadStream('/Users/stephen/Photos/birthday-at-the-zoo/panda.jpg')
     *   .pipe(file.createWriteStream())
     *   .on('error', function(err) {})
     *   .on('finish', function() {
     *     // The file upload is complete.
     *   });
     *
     * //-
     * // <h4>Uploading a File with gzip compression</h4>
     * //-
     * fs.createReadStream('/Users/stephen/site/index.html')
     *   .pipe(file.createWriteStream({ gzip: true }))
     *   .on('error', function(err) {})
     *   .on('finish', function() {
     *     // The file upload is complete.
     *   });
     *
     * //-
     * // Downloading the file with `createReadStream` will automatically decode
     * the
     * // file.
     * //-
     *
     * //-
     * // <h4>Uploading a File with Metadata</h4>
     * //
     * // One last case you may run into is when you want to upload a file to your
     * // bucket and set its metadata at the same time. Like above, you can use
     * // {@link Bucket#upload} to do this, which is just a wrapper around
     * // the following.
     * //-
     * fs.createReadStream('/Users/stephen/Photos/birthday-at-the-zoo/panda.jpg')
     *   .pipe(file.createWriteStream({
     *     metadata: {
     *       contentType: 'image/jpeg',
     *       metadata: {
     *         custom: 'metadata'
     *       }
     *     }
     *   }))
     *   .on('error', function(err) {})
     *   .on('finish', function() {
     *     // The file upload is complete.
     *   });
     */
    // tslint:disable-next-line:no-any
    createWriteStream(options = {}) {
        options = extend({ metadata: {} }, options);
        if (options.contentType) {
            options.metadata.contentType = options.contentType;
            if (options.metadata.contentType === 'auto') {
                options.metadata.contentType = mime.getType(this.name);
            }
        }
        let gzip = options.gzip;
        if (gzip === 'auto') {
            gzip = compressible(options.metadata.contentType);
        }
        if (gzip) {
            options.metadata.contentEncoding = 'gzip';
        }
        let crc32c = true;
        let md5 = false;
        if (is.string(options.validation)) {
            options.validation = options.validation.toLowerCase();
            crc32c = options.validation === 'crc32c';
            md5 = options.validation === 'md5';
        }
        else if (options.validation === false) {
            crc32c = false;
        }
        // Collect data as it comes in to store in a hash. This is compared to the
        // checksum value on the returned metadata from the API.
        const validateStream = hashStreamValidation({
            crc32c,
            md5,
        });
        const fileWriteStream = duplexify();
        const stream = streamEvents(pumpify([
            gzip ? zlib.createGzip() : through(),
            validateStream,
            fileWriteStream,
        ]));
        // Wait until we've received data to determine what upload technique to use.
        stream.on('writing', () => {
            if (options.resumable === false) {
                this.startSimpleUpload_(fileWriteStream, options);
                return;
            }
            // Same as configstore:
            // https://github.com/yeoman/configstore/blob/f09f067e50e6a636cfc648a6fc36a522062bd49d/index.js#L11
            const configDir = xdgBasedir.config || os.tmpdir();
            fs.access(configDir, fs.constants.W_OK, err => {
                if (err) {
                    if (options.resumable) {
                        const error = new ResumableUploadError([
                            'A resumable upload could not be performed. The directory,',
                            `${configDir}, is not writable. You may try another upload,`,
                            'this time setting `options.resumable` to `false`.',
                        ].join(' '));
                        stream.destroy(error);
                        return;
                    }
                    // User didn't care, resumable or not. Fall back to simple upload.
                    this.startSimpleUpload_(fileWriteStream, options);
                    return;
                }
                this.startResumableUpload_(fileWriteStream, options);
            });
        });
        fileWriteStream.on('response', stream.emit.bind(stream, 'response'));
        // This is to preserve the `finish` event. We wait until the request stream
        // emits "complete", as that is when we do validation of the data. After
        // that is successful, we can allow the stream to naturally finish.
        //
        // Reference for tracking when we can use a non-hack solution:
        // https://github.com/nodejs/node/pull/2314
        fileWriteStream.on('prefinish', () => {
            stream.cork();
        });
        // Compare our hashed version vs the completed upload's version.
        fileWriteStream.on('complete', () => {
            const metadata = this.metadata;
            // If we're doing validation, assume the worst-- a data integrity
            // mismatch. If not, these tests won't be performed, and we can assume the
            // best.
            let failed = crc32c || md5;
            if (crc32c && metadata.crc32c) {
                // We must remove the first four bytes from the returned checksum.
                // http://stackoverflow.com/questions/25096737/
                //   base64-encoding-of-crc32c-long-value
                failed = !validateStream.test('crc32c', metadata.crc32c.substr(4));
            }
            if (md5 && metadata.md5Hash) {
                failed = !validateStream.test('md5', metadata.md5Hash);
            }
            if (failed) {
                this.delete(err => {
                    let code;
                    let message;
                    if (err) {
                        code = 'FILE_NO_UPLOAD_DELETE';
                        message = [
                            'The uploaded data did not match the data from the server. As a',
                            'precaution, we attempted to delete the file, but it was not',
                            'successful. To be sure the content is the same, you should try',
                            'removing the file manually, then uploading the file again.',
                            '\n\nThe delete attempt failed with this message:',
                            '\n\n  ' + err.message,
                        ].join(' ');
                    }
                    else if (md5 && !metadata.md5Hash) {
                        code = 'MD5_NOT_AVAILABLE';
                        message = [
                            'MD5 verification was specified, but is not available for the',
                            'requested object. MD5 is not available for composite objects.',
                        ].join(' ');
                    }
                    else {
                        code = 'FILE_NO_UPLOAD';
                        message = [
                            'The uploaded data did not match the data from the server. As a',
                            'precaution, the file has been deleted. To be sure the content',
                            'is the same, you should try uploading the file again.',
                        ].join(' ');
                    }
                    const error = new RequestError(message);
                    error.code = code;
                    error.errors = [err];
                    fileWriteStream.destroy(error);
                });
                return;
            }
            stream.uncork();
        });
        return stream;
    }
    delete(optionsOrCallback, callback) {
        let options = typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
        options = extend({}, this.requestQueryObject, options);
        callback =
            typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
        this.parent.delete.call(this, options, callback);
    }
    download(optionsOrCallback, callback) {
        let options;
        if (is.fn(optionsOrCallback)) {
            callback = optionsOrCallback;
            options = {};
        }
        else {
            options = optionsOrCallback;
        }
        callback = once(callback);
        const destination = options.destination;
        delete options.destination;
        const fileStream = this.createReadStream(options);
        if (destination) {
            fileStream.on('error', callback)
                .pipe(fs.createWriteStream(destination))
                .on('error', callback)
                .on('finish', callback);
        }
        else {
            fileStream.on('error', callback).pipe(concat(callback.bind(null, null)));
        }
    }
    exists(optionsOrCallback, callback) {
        const options = typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
        callback =
            typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
        this.parent.exists.call(this, options, callback);
    }
    /**
     * The Storage API allows you to use a custom key for server-side encryption.
     *
     * @see [Customer-supplied Encryption Keys]{@link https://cloud.google.com/storage/docs/encryption#customer-supplied}
     *
     * @param {string|buffer} encryptionKey An AES-256 encryption key.
     * @returns {File}
     *
     * @example
     * const crypto = require('crypto');
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const encryptionKey = crypto.randomBytes(32);
     *
     * const fileWithCustomEncryption = myBucket.file('my-file');
     * fileWithCustomEncryption.setEncryptionKey(encryptionKey);
     *
     * const fileWithoutCustomEncryption = myBucket.file('my-file');
     *
     * fileWithCustomEncryption.save('data', function(err) {
     *   // Try to download with the File object that hasn't had
     *   // `setEncryptionKey()` called:
     *   fileWithoutCustomEncryption.download(function(err) {
     *     // We will receive an error:
     *     //   err.message === 'Bad Request'
     *
     *     // Try again with the File object we called `setEncryptionKey()` on:
     *     fileWithCustomEncryption.download(function(err, contents) {
     *       // contents.toString() === 'data'
     *     });
     *   });
     * });
     *
     * @example <caption>include:samples/encryption.js</caption>
     * region_tag:storage_upload_encrypted_file
     * Example of uploading an encrypted file:
     *
     * @example <caption>include:samples/encryption.js</caption>
     * region_tag:storage_download_encrypted_file
     * Example of downloading an encrypted file:
     */
    setEncryptionKey(encryptionKey) {
        this.encryptionKey = encryptionKey;
        this.encryptionKeyBase64 =
            Buffer.from(encryptionKey).toString('base64');
        this.encryptionKeyHash =
            crypto
                .createHash('sha256')
                // tslint:disable-next-line:no-any
                .update(this.encryptionKeyBase64, 'base64')
                .digest('base64');
        this.encryptionKeyInterceptor = {
            request: reqOpts => {
                reqOpts.headers = reqOpts.headers || {};
                reqOpts.headers['x-goog-encryption-algorithm'] = 'AES256';
                reqOpts.headers['x-goog-encryption-key'] = this.encryptionKeyBase64;
                reqOpts.headers['x-goog-encryption-key-sha256'] =
                    this.encryptionKeyHash;
                return reqOpts;
            },
        };
        this.interceptors.push(this.encryptionKeyInterceptor);
        return this;
    }
    get(optionsOrCallback, callback) {
        const options = typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
        callback =
            typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
        this.parent.get.call(this, options, callback);
    }
    /**
     * @typedef {array} GetExpirationDateResponse
     * @property {date} 0 A Date object representing the earliest time this file's
     *     retention policy will expire.
     */
    /**
     * @callback GetExpirationDateCallback
     * @param {?Error} err Request error, if any.
     * @param {date} expirationDate A Date object representing the earliest time
     *     this file's retention policy will expire.
     */
    /**
     * If this bucket has a retention policy defined, use this method to get a
     * Date object representing the earliest time this file will expire.
     *
     * @param {GetExpirationDateCallback} [callback] Callback function.
     * @returns {Promise<GetExpirationDateResponse>}
     *
     * @example
     * const storage = require('@google-cloud/storage')();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     *
     * file.getExpirationDate(function(err, expirationDate) {
     *   // expirationDate is a Date object.
     * });
     */
    getExpirationDate(callback) {
        this.getMetadata((err, metadata, apiResponse) => {
            if (err) {
                callback(err, null, apiResponse);
                return;
            }
            if (!metadata.retentionExpirationTime) {
                const error = new Error('An expiration time is not available.');
                callback(error, null, apiResponse);
                return;
            }
            callback(null, new Date(metadata.retentionExpirationTime), apiResponse);
        });
    }
    getMetadata(optionsOrCallback, callback) {
        let options = typeof optionsOrCallback === 'object' ? optionsOrCallback : {};
        callback =
            typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
        options = extend({}, this.requestQueryObject, options);
        this.parent.getMetadata.call(this, options, callback);
    }
    getSignedPolicy(optionsOrCallback, cb) {
        const args = util_1.normalize(optionsOrCallback, cb);
        let options = args.options;
        const callback = args.callback;
        const expires = new Date(options.expires);
        if (expires.valueOf() < Date.now()) {
            throw new Error('An expiration date cannot be in the past.');
        }
        options = extend({}, options);
        const conditions = [
            ['eq', '$key', this.name],
            {
                bucket: this.bucket.name,
            },
        ];
        if (is.array(options.equals)) {
            if (!is.array(options.equals[0])) {
                options.equals = [options.equals];
            }
            options.equals.forEach(condition => {
                if (!is.array(condition) || condition.length !== 2) {
                    throw new Error('Equals condition must be an array of 2 elements.');
                }
                conditions.push(['eq', condition[0], condition[1]]);
            });
        }
        if (is.array(options.startsWith)) {
            if (!is.array(options.startsWith[0])) {
                options.startsWith = [options.startsWith];
            }
            options.startsWith.forEach(condition => {
                if (!is.array(condition) || condition.length !== 2) {
                    throw new Error('StartsWith condition must be an array of 2 elements.');
                }
                conditions.push(['starts-with', condition[0], condition[1]]);
            });
        }
        if (options.acl) {
            conditions.push({
                acl: options.acl,
            });
        }
        if (options.successRedirect) {
            conditions.push({
                success_action_redirect: options.successRedirect,
            });
        }
        if (options.successStatus) {
            conditions.push({
                success_action_status: options.successStatus,
            });
        }
        if (options.contentLengthRange) {
            const min = options.contentLengthRange.min;
            const max = options.contentLengthRange.max;
            if (!is.number(min) || !is.number(max)) {
                throw new Error('ContentLengthRange must have numeric min & max fields.');
            }
            conditions.push(['content-length-range', min, max]);
        }
        const policy = {
            expiration: expires.toISOString(),
            conditions,
        };
        const policyString = JSON.stringify(policy);
        const policyBase64 = Buffer.from(policyString).toString('base64');
        this.storage.authClient.sign(policyBase64)
            .then(signature => {
            callback(null, {
                string: policyString,
                base64: policyBase64,
                signature,
            });
        }, err => {
            callback(new SigningError(err.message));
        });
    }
    getSignedUrl(cfg, callback) {
        const expiresInMSeconds = new Date(cfg.expires).valueOf();
        if (expiresInMSeconds < Date.now()) {
            throw new Error('An expiration date cannot be in the past.');
        }
        const expiresInSeconds = Math.round(expiresInMSeconds / 1000); // The API expects seconds.
        const config = extend({}, cfg);
        config.action = {
            read: 'GET',
            write: 'PUT',
            delete: 'DELETE',
            resumable: 'POST',
        }[config.action];
        const name = encodeURIComponent(this.name);
        config.resource = '/' + this.bucket.name + '/' + name;
        let extensionHeadersString = '';
        if (config.action === 'POST') {
            config.extensionHeaders = extend({}, config.extensionHeaders, {
                'x-goog-resumable': 'start',
            });
        }
        if (config.extensionHeaders) {
            for (const headerName of Object.keys(config.extensionHeaders)) {
                extensionHeadersString +=
                    `${headerName}:${config.extensionHeaders[headerName]}\n`;
            }
        }
        const blobToSign = [
            config.action,
            config.contentMd5 || '',
            config.contentType || '',
            expiresInSeconds,
            extensionHeadersString + config.resource,
        ].join('\n');
        const authClient = this.storage.authClient;
        authClient.sign(blobToSign)
            .then(signature => {
            authClient.getCredentials().then(credentials => {
                const query = {
                    GoogleAccessId: credentials.client_email,
                    Expires: expiresInSeconds,
                    Signature: signature,
                };
                if (is.string(config.responseType)) {
                    query['response-content-type'] = config.responseType;
                }
                if (is.string(config.promptSaveAs)) {
                    query['response-content-disposition'] =
                        'attachment; filename="' + config.promptSaveAs + '"';
                }
                if (is.string(config.responseDisposition)) {
                    query['response-content-disposition'] =
                        config.responseDisposition;
                }
                if (this.generation) {
                    query.generation = this.generation;
                }
                const parsedHost = url.parse(config.cname || STORAGE_DOWNLOAD_BASE_URL);
                const signedUrl = url.format({
                    protocol: parsedHost.protocol,
                    hostname: parsedHost.hostname,
                    pathname: config.cname ? name : this.bucket.name + '/' + name,
                    query,
                });
                callback(null, signedUrl);
            });
        })
            .catch(err => {
            callback(new SigningError(err.message));
        });
    }
    /**
     * @typedef {array} MakeFilePrivateResponse
     * @property {object} 0 The full API response.
     */
    /**
     * @callback MakeFilePrivateCallback
     * @param {?Error} err Request error, if any.
     * @param {object} apiResponse The full API response.
     */
    /**
     * Make a file private to the project and remove all other permissions.
     * Set `options.strict` to true to make the file private to only the owner.
     *
     * @see [Objects: patch API Documentation]{@link https://cloud.google.com/storage/docs/json_api/v1/objects/patch}
     *
     * @param {object} [options] Configuration options.
     * @param {boolean} [options.strict] If true, set the file to be private to
     *     only the owner user. Otherwise, it will be private to the project.
     * @param {string} [options.userProject] The ID of the project which will be
     *     billed for the request.
     * @param {MakeFilePrivateCallback} [callback] Callback function.
     * @returns {Promise<MakeFilePrivateResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     *
     * //-
     * // Set the file private so only project maintainers can see and modify it.
     * //-
     * file.makePrivate(function(err) {});
     *
     * //-
     * // Set the file private so only the owner can see and modify it.
     * //-
     * file.makePrivate({ strict: true }, function(err) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.makePrivate().then(function(data) {
     *   const apiResponse = data[0];
     * });
     */
    makePrivate(options, callback) {
        if (is.fn(options)) {
            callback = options;
            options = {};
        }
        const query = {
            predefinedAcl: options.strict ? 'private' : 'projectPrivate',
        };
        if (options.userProject) {
            query.userProject = options.userProject;
        }
        this.setMetadata({
            // You aren't allowed to set both predefinedAcl & acl properties on a
            // file, so acl must explicitly be nullified, destroying all previous
            // acls on the file.
            acl: null,
        }, query, callback);
    }
    /**
     * @typedef {array} MakeFilePublicResponse
     * @property {object} 0 The full API response.
     */
    /**
     * @callback MakeFilePublicCallback
     * @param {?Error} err Request error, if any.
     * @param {object} apiResponse The full API response.
     */
    /**
     * Set a file to be publicly readable and maintain all previous permissions.
     *
     * @see [ObjectAccessControls: insert API Documentation]{@link https://cloud.google.com/storage/docs/json_api/v1/objectAccessControls/insert}
     *
     * @param {MakeFilePublicCallback} [callback] Callback function.
     * @returns {Promise<MakeFilePublicResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     *
     * file.makePublic(function(err, apiResponse) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.makePublic().then(function(data) {
     *   const apiResponse = data[0];
     * });
     *
     * @example <caption>include:samples/files.js</caption>
     * region_tag:storage_make_public
     * Another example:
     */
    makePublic(callback) {
        callback = callback || common_1.util.noop;
        // tslint:disable-next-line:no-any
        this.acl
            .add({
            entity: 'allUsers',
            role: 'READER',
        }, (err, resp) => {
            callback(err, resp);
        });
    }
    /**
     * @typedef {array} MoveResponse
     * @property {File} 0 The destination File.
     * @property {object} 1 The full API response.
     */
    /**
     * @callback MoveCallback
     * @param {?Error} err Request error, if any.
     * @param {File} destinationFile The destination File.
     * @param {object} apiResponse The full API response.
     */
    /**
     * Move this file to another location. By default, this will rename the file
     * and keep it in the same bucket, but you can choose to move it to another
     * Bucket by providing a Bucket or File object or a URL beginning with
     * "gs://".
     *
     * **Warning**:
     * There is currently no atomic `move` method in the Cloud Storage API,
     * so this method is a composition of {@link File#copy} (to the new
     * location) and {@link File#delete} (from the old location). While
     * unlikely, it is possible that an error returned to your callback could be
     * triggered from either one of these API calls failing, which could leave a
     * duplicate file lingering.
     *
     * @see [Objects: copy API Documentation]{@link https://cloud.google.com/storage/docs/json_api/v1/objects/copy}
     *
     * @throws {Error} If the destination file is not provided.
     *
     * @param {string|Bucket|File} destination Destination file.
     * @param {object} [options] Configuration options. See an
     *     [Object
     * resource](https://cloud.google.com/storage/docs/json_api/v1/objects#resource).
     * @param {string} [options.userProject] The ID of the project which will be
     *     billed for the request.
     * @param {MoveCallback} [callback] Callback function.
     * @returns {Promise<MoveResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * //-
     * // You can pass in a variety of types for the destination.
     * //
     * // For all of the below examples, assume we are working with the following
     * // Bucket and File objects.
     * //-
     * const bucket = storage.bucket('my-bucket');
     * const file = bucket.file('my-image.png');
     *
     * //-
     * // If you pass in a string for the destination, the file is moved to its
     * // current bucket, under the new name provided.
     * //-
     * file.move('my-image-new.png', function(err, destinationFile, apiResponse) {
     *   // `my-bucket` no longer contains:
     *   // - "my-image.png"
     *   // but contains instead:
     *   // - "my-image-new.png"
     *
     *   // `destinationFile` is an instance of a File object that refers to your
     *   // new file.
     * });
     *
     * //-
     * // If you pass in a string starting with "gs://" for the destination, the
     * // file is copied to the other bucket and under the new name provided.
     * //-
     * const newLocation = 'gs://another-bucket/my-image-new.png';
     * file.move(newLocation, function(err, destinationFile, apiResponse) {
     *   // `my-bucket` no longer contains:
     *   // - "my-image.png"
     *   //
     *   // `another-bucket` now contains:
     *   // - "my-image-new.png"
     *
     *   // `destinationFile` is an instance of a File object that refers to your
     *   // new file.
     * });
     *
     * //-
     * // If you pass in a Bucket object, the file will be moved to that bucket
     * // using the same name.
     * //-
     * const anotherBucket = gcs.bucket('another-bucket');
     *
     * file.move(anotherBucket, function(err, destinationFile, apiResponse) {
     *   // `my-bucket` no longer contains:
     *   // - "my-image.png"
     *   //
     *   // `another-bucket` now contains:
     *   // - "my-image.png"
     *
     *   // `destinationFile` is an instance of a File object that refers to your
     *   // new file.
     * });
     *
     * //-
     * // If you pass in a File object, you have complete control over the new
     * // bucket and filename.
     * //-
     * const anotherFile = anotherBucket.file('my-awesome-image.png');
     *
     * file.move(anotherFile, function(err, destinationFile, apiResponse) {
     *   // `my-bucket` no longer contains:
     *   // - "my-image.png"
     *   //
     *   // `another-bucket` now contains:
     *   // - "my-awesome-image.png"
     *
     *   // Note:
     *   // The `destinationFile` parameter is equal to `anotherFile`.
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.move('my-image-new.png').then(function(data) {
     *   const destinationFile = data[0];
     *   const apiResponse = data[1];
     * });
     *
     * @example <caption>include:samples/files.js</caption>
     * region_tag:storage_move_file
     * Another example:
     */
    move(destination, options, callback) {
        if (is.fn(options)) {
            callback = options;
            options = {};
        }
        callback = callback || common_1.util.noop;
        this.copy(destination, options, (err, destinationFile, apiResponse) => {
            if (err) {
                callback(err, null, apiResponse);
                return;
            }
            this.delete(options, (err, apiResponse) => {
                callback(err, destinationFile, apiResponse);
            });
        });
    }
    request(reqOpts, callback) {
        if (this.userProject && (!reqOpts.qs || !reqOpts.qs.userProject)) {
            reqOpts.qs = extend(reqOpts.qs, { userProject: this.userProject });
        }
        return super.request(reqOpts, callback);
    }
    /**
     * This method allows you to update the encryption key associated with this
     * file.
     *
     * @see [Customer-supplied Encryption Keys]{@link https://cloud.google.com/storage/docs/encryption#customer-supplied}
     *
     * @param {string|buffer|object} options If a string or Buffer is provided, it
     *     is interpreted as an AES-256, customer-supplied encryption key. If
     * you'd like to use a Cloud KMS key name, you must specify an options object
     * with the property name: `kmsKeyName`.
     * @param {string|buffer} [options.encryptionKey] An AES-256 encryption key.
     * @param {string} [options.kmsKeyName] A Cloud KMS key name.
     * @returns {File}
     *
     * @example <caption>include:samples/encryption.js</caption>
     * region_tag:storage_rotate_encryption_key
     * Example of rotating the encryption key for this file:
     */
    rotateEncryptionKey(options, callback) {
        if (!is.object(options)) {
            options = {
                encryptionKey: options,
            };
        }
        const newFile = this.bucket.file(this.id, options);
        this.copy(newFile, callback);
    }
    /**
     * @callback SaveCallback
     * @param {?Error} err Request error, if any.
     */
    /**
     * Write arbitrary data to a file.
     *
     * *This is a convenience method which wraps {@link File#createWriteStream}.*
     *
     * Resumable uploads are automatically enabled and must be shut off explicitly
     * by setting `options.resumable` to `false`.
     *
     * <p class="notice">
     *   There is some overhead when using a resumable upload that can cause
     *   noticeable performance degradation while uploading a series of small
     * files. When uploading files less than 10MB, it is recommended that the
     * resumable feature is disabled.
     * </p>
     *
     * @param {*} data The data to write to a file.
     * @param {object} [options] See {@link File#createWriteStream}'s `options`
     *     parameter.
     * @param {SaveCallback} [callback] Callback function.
     * @returns {Promise}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     * const contents = 'This is the contents of the file.';
     *
     * file.save(contents, function(err) {
     *   if (!err) {
     *     // File written successfully.
     *   }
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.save(contents).then(function() {});
     */
    save(data, options, callback) {
        if (is.fn(options)) {
            callback = options;
            options = {};
        }
        this.createWriteStream(options)
            .on('error', callback)
            .on('finish', callback)
            .end(data);
    }
    /**
     * @typedef {array} SetFileMetadataResponse
     * @property {object} 0 The full API response.
     */
    /**
     * @callback SetFileMetadataCallback
     * @param {?Error} err Request error, if any.
     * @param {object} apiResponse The full API response.
     */
    /**
     * Merge the given metadata with the current remote file's metadata. This
     * will set metadata if it was previously unset or update previously set
     * metadata. To unset previously set metadata, set its value to null.
     *
     * You can set custom key/value pairs in the metadata key of the given
     * object, however the other properties outside of this object must adhere
     * to the [official API documentation](https://goo.gl/BOnnCK).
     *
     * See the examples below for more information.
     *
     * @see [Objects: patch API Documentation]{@link https://cloud.google.com/storage/docs/json_api/v1/objects/patch}
     *
     * @param {object} [metadata] The metadata you wish to update.
     * @param {object} [options] Configuration options.
     * @param {string} [options.userProject] The ID of the project which will be
     *     billed for the request.
     * @param {SetFileMetadataCallback} [callback] Callback function.
     * @returns {Promise<SetFileMetadataResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     *
     * const metadata = {
     *   contentType: 'application/x-font-ttf',
     *   metadata: {
     *     my: 'custom',
     *     properties: 'go here'
     *   }
     * };
     *
     * file.setMetadata(metadata, function(err, apiResponse) {});
     *
     * // Assuming current metadata = { hello: 'world', unsetMe: 'will do' }
     * file.setMetadata({
     *   metadata: {
     *     abc: '123', // will be set.
     *     unsetMe: null, // will be unset (deleted).
     *     hello: 'goodbye' // will be updated from 'hello' to 'goodbye'.
     *   }
     * }, function(err, apiResponse) {
     *   // metadata should now be { abc: '123', hello: 'goodbye' }
     * });
     *
     * //-
     * // Set a temporary hold on this file from its bucket's retention period
     * // configuration.
     * //
     * file.setMetadata({
     *   temporaryHold: true
     * }, function(err, apiResponse) {});
     *
     * //-
     * // Alternatively, you may set a temporary hold. This will follow the same
     * // behavior as an event-based hold, with the exception that the bucket's
     * // retention policy will not renew for this file from the time the hold is
     * // released.
     * //-
     * file.setMetadata({
     *   eventBasedHold: true
     * }, function(err, apiResponse) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.setMetadata(metadata).then(function(data) {
     *   const apiResponse = data[0];
     * });
     */
    setMetadata(metadata, options, callback) {
        if (is.fn(options)) {
            callback = options;
            options = {};
        }
        options = extend({}, this.requestQueryObject, options);
        // tslint:disable-next-line:no-any
        this.parent.setMetadata.call(this, metadata, options, callback);
    }
    /**
     * @typedef {array} SetStorageClassResponse
     * @property {object} 0 The full API response.
     */
    /**
     * @callback SetStorageClassCallback
     * @param {?Error} err Request error, if any.
     * @param {object} apiResponse The full API response.
     */
    /**
     * Set the storage class for this file.
     *
     * @see [Per-Object Storage Class]{@link https://cloud.google.com/storage/docs/per-object-storage-class}
     * @see [Storage Classes]{@link https://cloud.google.com/storage/docs/storage-classes}
     *
     * @param {string} storageClass The new storage class. (`multi_regional`,
     *     `regional`, `nearline`, `coldline`)
     * @param {object} [options] Configuration options.
     * @param {string} [options.userProject] The ID of the project which will be
     *     billed for the request.
     * @param {SetStorageClassCallback} [callback] Callback function.
     * @returns {Promise<SetStorageClassResponse>}
     *
     * @example
     * file.setStorageClass('regional', function(err, apiResponse) {
     *   if (err) {
     *     // Error handling omitted.
     *   }
     *
     *   // The storage class was updated successfully.
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.setStorageClass('regional').then(function() {});
     */
    setStorageClass(storageClass, options, callback) {
        if (is.fn(options)) {
            callback = options;
            options = {};
        }
        options = extend(true, {}, options);
        // In case we get input like `storageClass`, convert to `storage_class`.
        options.storageClass = storageClass.replace(/-/g, '_')
            .replace(/([a-z])([A-Z])/g, (_, low, up) => {
            return low + '_' + up;
        })
            .toUpperCase();
        this.copy(this, options, (err, file, apiResponse) => {
            if (err) {
                callback(err, apiResponse);
                return;
            }
            this.metadata = file.metadata;
            callback(null, apiResponse);
        });
    }
    /**
     * Set a user project to be billed for all requests made from this File
     * object.
     *
     * @param {string} userProject The user project.
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const bucket = storage.bucket('albums');
     * const file = bucket.file('my-file');
     *
     * file.setUserProject('grape-spaceship-123');
     */
    setUserProject(userProject) {
        this.userProject = userProject;
    }
    /**
     * This creates a gcs-resumable-upload upload stream.
     *
     * @see [gcs-resumable-upload]{@link https://github.com/stephenplusplus/gcs-resumable-upload}
     *
     * @param {Duplexify} stream - Duplexify stream of data to pipe to the file.
     * @param {object=} options - Configuration object.
     *
     * @private
     */
    startResumableUpload_(dup, options) {
        options = extend({
            metadata: {},
        }, options);
        const uploadStream = resumableUpload.upload({
            authClient: this.storage.authClient,
            bucket: this.bucket.name,
            file: this.name,
            generation: this.generation,
            key: this.encryptionKey,
            kmsKeyName: this.kmsKeyName,
            metadata: options.metadata,
            offset: options.offset,
            predefinedAcl: options.predefinedAcl,
            private: options.private,
            public: options.public,
            uri: options.uri,
            userProject: options.userProject,
        });
        uploadStream
            .on('response', resp => {
            dup.emit('response', resp);
        })
            .on('metadata', metadata => {
            this.metadata = metadata;
        })
            .on('finish', () => {
            dup.emit('complete');
        });
        dup.setWritable(uploadStream);
    }
    /**
     * Takes a readable stream and pipes it to a remote file. Unlike
     * `startResumableUpload_`, which uses the resumable upload technique, this
     * method uses a simple upload (all or nothing).
     *
     * @param {Duplexify} dup - Duplexify stream of data to pipe to the file.
     * @param {object=} options - Configuration object.
     *
     * @private
     */
    startSimpleUpload_(dup, options) {
        options = extend({
            metadata: {},
        }, options);
        const reqOpts = {
            qs: {
                name: this.name,
            },
            uri: `${STORAGE_UPLOAD_BASE_URL}/${this.bucket.name}/o`,
        };
        if (is.defined(this.generation)) {
            reqOpts.qs.ifGenerationMatch = this.generation;
        }
        if (is.defined(this.kmsKeyName)) {
            reqOpts.qs.kmsKeyName = this.kmsKeyName;
        }
        if (options.userProject) {
            reqOpts.qs.userProject = options.userProject;
        }
        if (options.predefinedAcl) {
            reqOpts.qs.predefinedAcl = options.predefinedAcl;
        }
        else if (options.private) {
            reqOpts.qs.predefinedAcl = 'private';
        }
        else if (options.public) {
            reqOpts.qs.predefinedAcl = 'publicRead';
        }
        common_1.util.makeWritableStream(dup, {
            makeAuthenticatedRequest: reqOpts => {
                this.request(reqOpts, (err, body, resp) => {
                    if (err) {
                        dup.destroy(err);
                        return;
                    }
                    this.metadata = body;
                    dup.emit('response', resp);
                    dup.emit('complete');
                });
            },
            metadata: options.metadata,
            request: reqOpts,
            requestModule: r,
        });
    }
}
exports.File = File;
/*! Developer Documentation
 *
 * All async methods (except for streams) will return a Promise in the event
 * that a callback is omitted.
 */
promisify_1.promisifyAll(File, {
    exclude: ['request', 'setEncryptionKey'],
});
//# sourceMappingURL=file.js.map