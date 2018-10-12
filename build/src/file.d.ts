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
/// <reference types="node" />
import { ServiceObject, DecorateRequestOptions, BodyResponseCallback, Metadata, GetConfig } from '@google-cloud/common';
import * as duplexify from 'duplexify';
import { Duplex } from 'stream';
import * as r from 'request';
import * as http from 'http';
import { Storage } from '.';
import { Bucket } from './bucket';
import { Acl } from './acl';
export interface GetSignedUrlConfig {
    action: 'read' | 'write' | 'delete' | 'resumable';
    cname?: string;
    contentMd5?: string;
    contentType?: string;
    expires: number;
    extensionHeaders?: http.OutgoingHttpHeaders;
    promptSaveAs?: string;
    responseDisposition?: string;
    responseType?: string;
}
/**
 * @typedef {array} GetSignedUrlResponse
 * @property {object} 0 The signed URL.
 */
export declare type GetSignedUrlResponse = [string];
/**
 * @callback GetSignedUrlCallback
 * @param {?Error} err Request error, if any.
 * @param {object} url The signed URL.
 */
export interface GetSignedUrlCallback {
    (err: Error | null, url?: string): void;
}
export interface PolicyDocument {
    expiration: string;
    conditions: Array<Array<string | number>>;
}
/**
 * @typedef {array} GetSignedPolicyResponse
 * @property {object} 0 The document policy.
 */
export declare type GetSignedPolicyResponse = [PolicyDocument];
/**
 * @callback GetSignedPolicyCallback
 * @param {?Error} err Request error, if any.
 * @param {object} policy The document policy.
 */
export interface GetSignedPolicyCallback {
    (err: Error | null, policy?: PolicyDocument): void;
}
export interface GetSignedPolicyOptions {
    equals?: string[] | string[][];
    expires: number;
    startsWith?: string[] | string[][];
    acl?: string;
    successRedirect?: string;
    successStatus?: string;
    contentLengthRange?: {
        min?: number;
        max?: number;
    };
}
export interface GetFileMetadataOptions {
    userProject?: string;
}
/**
 * @typedef {array} GetFileMetadataResponse
 * @property {object} 0 The {@link File} metadata.
 * @property {object} 1 The full API response.
 */
export declare type GetFileMetadataResponse = [File, r.Response];
/**
 * @callback GetFileMetadataCallback
 * @param {?Error} err Request error, if any.
 * @param {object} metadata The {@link File} metadata.
 * @param {object} apiResponse The full API response.
 */
export interface GetFileMetadataCallback {
    (err: Error | null, metadata?: Metadata, apiResponse?: r.Response): void;
}
export interface GetFileOptions extends GetConfig {
    userProject?: string;
}
/**
 * @typedef {array} GetFileResponse
 * @property {File} 0 The {@link File}.
 * @property {object} 1 The full API response.
 */
export declare type GetFileResponse = [File, r.Response];
/**
 * @callback GetFileCallback
 * @param {?Error} err Request error, if any.
 * @param {File} file The {@link File}.
 * @param {object} apiResponse The full API response.
 */
export interface GetFileCallback {
    (err: Error | null, file?: File, apiResponse?: r.Response): void;
}
export interface FileExistsOptions {
    userProject?: string;
}
/**
 * @typedef {array} FileExistsResponse
 * @property {boolean} 0 Whether the {@link File} exists.
 */
export declare type FileExistsResponse = [boolean];
/**
 * @callback FileExistsCallback
 * @param {?Error} err Request error, if any.
 * @param {boolean} exists Whether the {@link File} exists.
 */
export interface FileExistsCallback {
    (err: Error | null, exists?: boolean): void;
}
export interface DeleteFileOptions {
    userProject?: string;
}
/**
 * @typedef {array} DeleteFileResponse
 * @property {object} 0 The full API response.
 */
export declare type DeleteFileResponse = [r.Response];
/**
 * @callback DeleteFileCallback
 * @param {?Error} err Request error, if any.
 * @param {object} apiResponse The full API response.
 */
export interface DeleteFileCallback {
    (err: Error | null, apiResponse?: r.Response): void;
}
export declare type PredefinedAcl = 'authenticatedRead' | 'bucketOwnerFullControl' | 'bucketOwnerRead' | 'private' | 'projectPrivate' | 'publicRead';
export interface CreateResumableUploadOptions {
    metadata?: Metadata;
    origin?: string;
    offset?: number;
    predefinedAcl?: PredefinedAcl;
    private?: boolean;
    public?: boolean;
    uri?: string;
    userProject?: string;
}
/**
 * @typedef {array} CreateResumableUploadResponse
 * @property {string} 0 The resumable upload's unique session URI.
 */
export declare type CreateResumableUploadResponse = [string];
/**
 * @callback CreateResumableUploadCallback
 * @param {?Error} err Request error, if any.
 * @param {string} uri The resumable upload's unique session URI.
 */
export interface CreateResumableUploadCallback {
    (err: Error | null, uri?: string): void;
}
/**
 * Options passed to the File constructor.
 * @param {string} [encryptionKey] A custom encryption key.
 * @param {number} [generation] Generation to scope the file to.
 * @param {string} [kmsKeyName] Cloud KMS Key used to encrypt this
 *     object, if the object is encrypted by such a key. Limited availability;
 *     usable only by enabled projects.
 * @param {string} [userProject] The ID of the project which will be
 *     billed for all requests made from File object.
 */
export interface FileOptions {
    encryptionKey?: string | Buffer;
    generation?: number | string;
    kmsKeyName?: string;
    userProject?: string;
}
/**
 * @param {object} CopyOptions Configuration options. See an
 *     [Object
 * resource](https://cloud.google.com/storage/docs/json_api/v1/objects#resource).
 * @param {string} [destinationKmsKeyName] Resource name of the Cloud
 *     KMS key, of the form
 *     `projects/my-project/locations/location/keyRings/my-kr/cryptoKeys/my-key`,
 *     that will be used to encrypt the object. Overwrites the object metadata's
 *     `kms_key_name` value, if any.
 * @param {string} [keepAcl] Retain the ACL for the new file.
 * @param {string} [predefinedAcl] Set the ACL for the new file.
 * @param {string} [token] A previously-returned `rewriteToken` from an
 *     unfinished rewrite request.
 * @param {string} [userProject] The ID of the project which will be
 *     billed for the request.
 */
export interface CopyOptions {
    destinationKmsKeyName?: string;
    keepAcl?: string;
    predefinedAcl?: string;
    token?: string;
    userProject?: string;
}
/**
 * @typedef {array} DownloadResponse
 * @property [0] The contents of a File.
 */
export declare type DownloadResponse = [Buffer];
/**
 * @callback DownloadCallback
 * @param err Request error, if any.
 * @param contents The contents of a File.
 */
export declare type DownloadCallback = (err: RequestError | null, contents: Buffer) => void;
export interface DownloadOptions extends CreateReadStreamOptions {
    destination?: string;
}
export interface CreateReadStreamOptions {
    /**
     * The ID of the project which will be billed for the request.
     */
    userProject?: string;
    /**
     * By default, data integrity is validated with a
     * CRC32c checksum. You may use MD5 if preferred, but that hash is not
     * supported for composite objects. An error will be raised if MD5 is
     * specified but is not available. You may also choose to skip validation
     * completely, however this is **not recommended**.
     */
    validation?: 'md5' | 'crc32c' | false | true;
    /**
     * A byte offset to begin the file's download
     * from. Default is 0. NOTE: Byte ranges are inclusive; that is,
     * `options.start = 0` and `options.end = 999` represent the first 1000
     * bytes in a file or object. NOTE: when specifying a byte range, data
     * integrity is not available.
     */
    start?: number;
    /**
     * A byte offset to stop reading the file at.
     * NOTE: Byte ranges are inclusive; that is, `options.start = 0` and
     * `options.end = 999` represent the first 1000 bytes in a file or object.
     * NOTE: when specifying a byte range, data integrity is not available.
     */
    end?: number;
}
declare class RequestError extends Error {
    code?: string;
    errors?: Error[];
}
export interface FileCallback {
    (err: Error | null, file?: File | null, apiResponse?: r.Response): void;
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
declare class File extends ServiceObject {
    /**
     * Cloud Storage uses access control lists (ACLs) to manage object and
     * bucket access. ACLs are the mechanism you use to share objects with other
     * users and allow other users to access your buckets and objects.
     *
     * An ACL consists of one or more entries, where each entry grants permissions
     * to an entity. Permissions define the actions that can be performed against
     * an object or bucket (for example, `READ` or `WRITE`); the entity defines
     * who the permission applies to (for example, a specific user or group of
     * users).
     *
     * The `acl` object on a File instance provides methods to get you a list of
     * the ACLs defined on your bucket, as well as set, update, and delete them.
     *
     * @see [About Access Control lists]{@link http://goo.gl/6qBBPO}
     *
     * @name File#acl
     * @mixes Acl
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     * //-
     * // Make a file publicly readable.
     * //-
     * const options = {
     *   entity: 'allUsers',
     *   role: storage.acl.READER_ROLE
     * };
     *
     * file.acl.add(options, function(err, aclObject) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.acl.add(options).then(function(data) {
     *   const aclObject = data[0];
     *   const apiResponse = data[1];
     * });
     */
    acl: Acl;
    bucket: Bucket;
    storage: Storage;
    kmsKeyName?: string;
    userProject?: string;
    name: string;
    generation?: number;
    requestQueryObject?: {
        generation: number;
    };
    private encryptionKey?;
    private encryptionKeyBase64?;
    private encryptionKeyHash?;
    private encryptionKeyInterceptor?;
    constructor(bucket: Bucket, name: string, options?: FileOptions);
    /**
     * @typedef {array} CopyResponse
     * @property {File} 0 The copied {@link File}.
     * @property {object} 1 The full API response.
     */
    /**
     * @callback CopyCallback
     * @param {?Error} err Request error, if any.
     * @param {File} copiedFile The copied {@link File}.
     * @param {object} apiResponse The full API response.
     */
    /**
     * Copy this file to another file. By default, this will copy the file to the
     * same bucket, but you can choose to copy it to another Bucket by providing
     * a Bucket or File object or a URL starting with "gs://".
     *
     * @see [Objects: rewrite API Documentation]{@link https://cloud.google.com/storage/docs/json_api/v1/objects/rewrite}
     *
     * @throws {Error} If the destination file is not provided.
     *
     * @param {string|Bucket|File} destination Destination file.
     * @param {object} [options] Configuration options. See an
     *     [Object
     * resource](https://cloud.google.com/storage/docs/json_api/v1/objects#resource).
     * @param {string} [options.destinationKmsKeyName] Resource name of the Cloud
     *     KMS key, of the form
     *     `projects/my-project/locations/location/keyRings/my-kr/cryptoKeys/my-key`,
     *     that will be used to encrypt the object. Overwrites the object
     * metadata's `kms_key_name` value, if any.
     * @param {string} [options.keepAcl] Retain the ACL for the new file.
     * @param {string} [options.predefinedAcl] Set the ACL for the new file.
     * @param {string} [options.token] A previously-returned `rewriteToken` from an
     *     unfinished rewrite request.
     * @param {string} [options.userProject] The ID of the project which will be
     *     billed for the request.
     * @param {CopyCallback} [callback] Callback function.
     * @returns {Promise<CopyResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     *
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
     * // If you pass in a string for the destination, the file is copied to its
     * // current bucket, under the new name provided.
     * //-
     * file.copy('my-image-copy.png', function(err, copiedFile, apiResponse) {
     *   // `my-bucket` now contains:
     *   // - "my-image.png"
     *   // - "my-image-copy.png"
     *
     *   // `copiedFile` is an instance of a File object that refers to your new
     *   // file.
     * });
     *
     * //-
     * // If you pass in a string starting with "gs://" for the destination, the
     * // file is copied to the other bucket and under the new name provided.
     * //-
     * const newLocation = 'gs://another-bucket/my-image-copy.png';
     * file.copy(newLocation, function(err, copiedFile, apiResponse) {
     *   // `my-bucket` still contains:
     *   // - "my-image.png"
     *   //
     *   // `another-bucket` now contains:
     *   // - "my-image-copy.png"
     *
     *   // `copiedFile` is an instance of a File object that refers to your new
     *   // file.
     * });
     *
     * //-
     * // If you pass in a Bucket object, the file will be copied to that bucket
     * // using the same name.
     * //-
     * const anotherBucket = storage.bucket('another-bucket');
     * file.copy(anotherBucket, function(err, copiedFile, apiResponse) {
     *   // `my-bucket` still contains:
     *   // - "my-image.png"
     *   //
     *   // `another-bucket` now contains:
     *   // - "my-image.png"
     *
     *   // `copiedFile` is an instance of a File object that refers to your new
     *   // file.
     * });
     *
     * //-
     * // If you pass in a File object, you have complete control over the new
     * // bucket and filename.
     * //-
     * const anotherFile = anotherBucket.file('my-awesome-image.png');
     * file.copy(anotherFile, function(err, copiedFile, apiResponse) {
     *   // `my-bucket` still contains:
     *   // - "my-image.png"
     *   //
     *   // `another-bucket` now contains:
     *   // - "my-awesome-image.png"
     *
     *   // Note:
     *   // The `copiedFile` parameter is equal to `anotherFile`.
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.copy(newLocation).then(function(data) {
     *   const newFile = data[0];
     *   const apiResponse = data[1];
     * });
     *
     * @example <caption>include:samples/files.js</caption>
     * region_tag:storage_copy_file
     * Another example:
     */
    copy(destination: string | Bucket | File, callback: FileCallback): void;
    copy(destination: string | Bucket | File, options: CopyOptions, callback: FileCallback): void;
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
    createReadStream(options?: CreateReadStreamOptions): Duplex;
    /**
     * Create a unique resumable upload session URI. This is the first step when
     * performing a resumable upload.
     *
     * See the [Resumable upload
     * guide](https://cloud.google.com/storage/docs/json_api/v1/how-tos/resumable-upload)
     * for more on how the entire process works.
     *
     * <h4>Note</h4>
     *
     * If you are just looking to perform a resumable upload without worrying
     * about any of the details, see {@link File#createWriteStream}. Resumable
     * uploads are performed by default.
     *
     * @see [Resumable upload guide]{@link https://cloud.google.com/storage/docs/json_api/v1/how-tos/resumable-upload}
     *
     * @param {object} [options] Configuration options.
     * @param {object} [options.metadata] Metadata to set on the file.
     * @param {string} [options.origin] Origin header to set for the upload.
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
     * @param {string} [options.userProject] The ID of the project which will be
     *     billed for the request.
     * @param {CreateResumableUploadCallback} [callback] Callback function.
     * @returns {Promise<CreateResumableUploadResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     * file.createResumableUpload(function(err, uri) {
     *   if (!err) {
     *     // `uri` can be used to PUT data to.
     *   }
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.createResumableUpload().then(function(data) {
     *   const uri = data[0];
     * });
     */
    createResumableUpload(options?: CreateResumableUploadOptions): Promise<CreateResumableUploadResponse>;
    createResumableUpload(options: CreateResumableUploadOptions, callback: CreateResumableUploadCallback): void;
    createResumableUpload(callback: CreateResumableUploadCallback): void;
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
    createWriteStream(options?: any): Duplex;
    /**
     * Delete the file.
     *
     * @see [Objects: delete API Documentation]{@link https://cloud.google.com/storage/docs/json_api/v1/objects/delete}
     *
     * @param {object} [options] Configuration options.
     * @param {string} [options.userProject] The ID of the project which will be
     *     billed for the request.
     * @param {DeleteFileCallback} [callback] Callback function.
     * @returns {Promise<DeleteFileResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     * file.delete(function(err, apiResponse) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.delete().then(function(data) {
     *   const apiResponse = data[0];
     * });
     *
     * @example <caption>include:samples/files.js</caption>
     * region_tag:storage_delete_file
     * Another example:
     */
    delete(options?: DeleteFileOptions): Promise<DeleteFileResponse>;
    delete(options: DeleteFileOptions, callback: DeleteFileCallback): void;
    delete(callback: DeleteFileCallback): void;
    /**
     * Convenience method to download a file into memory or to a local
     * destination.
     *
     * @param {object} [options] Configuration options. The arguments match those
     *     passed to {@link File#createReadStream}.
     * @param {string} [options.destination] Local file path to write the file's
     *     contents to.
     * @param {string} [options.userProject] The ID of the project which will be
     *     billed for the request.
     * @param {DownloadCallback} [callback] Callback function.
     * @returns {Promise<DownloadResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     *
     * //-
     * // Download a file into memory. The contents will be available as the
     * second
     * // argument in the demonstration below, `contents`.
     * //-
     * file.download(function(err, contents) {});
     *
     * //-
     * // Download a file to a local destination.
     * //-
     * file.download({
     *   destination: '/Users/me/Desktop/file-backup.txt'
     * }, function(err) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.download().then(function(data) {
     *   const contents = data[0];
     * });
     *
     * @example <caption>include:samples/files.js</caption>
     * region_tag:storage_download_file
     * Another example:
     *
     * @example <caption>include:samples/encryption.js</caption>
     * region_tag:storage_download_encrypted_file
     * Example of downloading an encrypted file:
     *
     * @example <caption>include:samples/requesterPays.js</caption>
     * region_tag:storage_download_file_requester_pays
     * Example of downloading a file where the requester pays:
     */
    download(options?: DownloadOptions): Promise<DownloadResponse>;
    download(options: DownloadOptions, callback: DownloadCallback): void;
    download(callback: DownloadCallback): void;
    /**
     * Check if the file exists.
     *
     * @param {options} [options] Configuration options.
     * @param {string} [options.userProject] The ID of the project which will be
     *     billed for the request.
     * @param {FileExistsCallback} [callback] Callback function.
     * @returns {Promise<FileExistsResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     *
     * file.exists(function(err, exists) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.exists().then(function(data) {
     *   const exists = data[0];
     * });
     */
    exists(options?: FileExistsOptions): Promise<FileExistsResponse>;
    exists(options: FileExistsOptions, callback: FileExistsCallback): void;
    exists(callback: FileExistsCallback): void;
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
    setEncryptionKey(encryptionKey: string | Buffer): this;
    /**
     * Get a file object and its metadata if it exists.
     *
     * @param {options} [options] Configuration options.
     * @param {string} [options.userProject] The ID of the project which will be
     *     billed for the request.
     * @param {GetFileCallback} [callback] Callback function.
     * @returns {Promise<GetFileResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     *
     * file.get(function(err, file, apiResponse) {
     *   // file.metadata` has been populated.
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.get().then(function(data) {
     *   const file = data[0];
     *   const apiResponse = data[1];
     * });
     */
    get(options?: GetFileOptions): Promise<GetFileResponse>;
    get(options: GetFileOptions, callback: GetFileCallback): void;
    get(callback: GetFileCallback): void;
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
    getExpirationDate(callback?: any): void;
    /**
     * @typedef {array} GetFileMetadataResponse
     * @property {object} 0 The {@link File} metadata.
     * @property {object} 1 The full API response.
     */
    /**
     * @callback GetFileMetadataCallback
     * @param {?Error} err Request error, if any.
     * @param {object} metadata The {@link File} metadata.
     * @param {object} apiResponse The full API response.
     */
    /**
     * Get the file's metadata.
     *
     * @see [Objects: get API Documentation]{@link https://cloud.google.com/storage/docs/json_api/v1/objects/get}
     *
     * @param {object} [options] Configuration options.
     * @param {string} [options.userProject] The ID of the project which will be
     *     billed for the request.
     * @param {GetFileMetadataCallback} [callback] Callback function.
     * @returns {Promise<GetFileMetadataResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     *
     * file.getMetadata(function(err, metadata, apiResponse) {});
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.getMetadata().then(function(data) {
     *   const metadata = data[0];
     *   const apiResponse = data[1];
     * });
     *
     * @example <caption>include:samples/files.js</caption>
     * region_tag:storage_get_metadata
     * Another example:
     */
    getMetadata(options?: GetFileMetadataOptions): Promise<GetFileMetadataResponse>;
    getMetadata(options: GetFileMetadataOptions, callback: GetFileMetadataCallback): void;
    getMetadata(callback: GetFileMetadataCallback): void;
    /**
     * @typedef {array} GetSignedPolicyResponse
     * @property {object} 0 The document policy.
     */
    /**
     * @callback GetSignedPolicyCallback
     * @param {?Error} err Request error, if any.
     * @param {object} policy The document policy.
     */
    /**
     * Get a signed policy document to allow a user to upload data with a POST
     * request.
     *
     * In Google Cloud Platform environments, such as Cloud Functions and App
     * Engine, you usually don't provide a `keyFilename` or `credentials` during
     * instantiation. In those environments, we call the
     * [signBlob
     * API](https://cloud.google.com/iam/reference/rest/v1/projects.serviceAccounts/signBlob#authorization-scopes)
     * to create a signed policy. That API requires either the
     * `https://www.googleapis.com/auth/iam` or
     * `https://www.googleapis.com/auth/cloud-platform` scope, so be sure they are
     * enabled.
     *
     * @see [Policy Document Reference]{@link https://cloud.google.com/storage/docs/xml-api/post-object#policydocument}
     *
     * @throws {Error} If an expiration timestamp from the past is given.
     * @throws {Error} If options.equals has an array with less or more than two
     *     members.
     * @throws {Error} If options.startsWith has an array with less or more than two
     *     members.
     *
     * @param {object} options Configuration options.
     * @param {array|array[]} [options.equals] Array of request parameters and
     *     their expected value (e.g. [['$<field>', '<value>']]). Values are
     *     translated into equality constraints in the conditions field of the
     *     policy document (e.g. ['eq', '$<field>', '<value>']). If only one
     *     equality condition is to be specified, options.equals can be a one-
     *     dimensional array (e.g. ['$<field>', '<value>']).
     * @param {*} options.expires - A timestamp when this policy will expire. Any
     *     value given is passed to `new Date()`.
     * @param {array|array[]} [options.startsWith] Array of request parameters and
     *     their expected prefixes (e.g. [['$<field>', '<value>']). Values are
     *     translated into starts-with constraints in the conditions field of the
     *     policy document (e.g. ['starts-with', '$<field>', '<value>']). If only
     *     one prefix condition is to be specified, options.startsWith can be a
     * one- dimensional array (e.g. ['$<field>', '<value>']).
     * @param {string} [options.acl] ACL for the object from possibly predefined
     *     ACLs.
     * @param {string} [options.successRedirect] The URL to which the user client
     *     is redirected if the upload is successful.
     * @param {string} [options.successStatus] - The status of the Google Storage
     *     response if the upload is successful (must be string).
     * @param {object} [options.contentLengthRange]
     * @param {number} [options.contentLengthRange.min] Minimum value for the
     *     request's content length.
     * @param {number} [options.contentLengthRange.max] Maximum value for the
     *     request's content length.
     * @param {GetSignedPolicyCallback} [callback] Callback function.
     * @returns {Promise<GetSignedPolicyResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     * const options = {
     *   equals: ['$Content-Type', 'image/jpeg'],
     *   expires: '10-25-2022',
     *   contentLengthRange: {
     *     min: 0,
     *     max: 1024
     *   }
     * };
     *
     * file.getSignedPolicy(options, function(err, policy) {
     *   // policy.string: the policy document in plain text.
     *   // policy.base64: the policy document in base64.
     *   // policy.signature: the policy signature in base64.
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.getSignedPolicy(options).then(function(data) {
     *   const policy = data[0];
     * });
     */
    getSignedPolicy(options: GetSignedPolicyOptions): Promise<GetSignedPolicyResponse>;
    getSignedPolicy(options: GetSignedPolicyOptions, callback: GetSignedPolicyCallback): void;
    getSignedPolicy(callback: GetSignedPolicyCallback): void;
    /**
     * Get a signed URL to allow limited time access to the file.
     *
     * In Google Cloud Platform environments, such as Cloud Functions and App
     * Engine, you usually don't provide a `keyFilename` or `credentials` during
     * instantiation. In those environments, we call the
     * [signBlob
     * API](https://cloud.google.com/iam/reference/rest/v1/projects.serviceAccounts/signBlob#authorization-scopes)
     * to create a signed URL. That API requires either the
     * `https://www.googleapis.com/auth/iam` or
     * `https://www.googleapis.com/auth/cloud-platform` scope, so be sure they are
     * enabled.
     *
     * @see [Signed URLs Reference]{@link https://cloud.google.com/storage/docs/access-control/signed-urls}
     *
     * @throws {Error} if an expiration timestamp from the past is given.
     *
     * @param {object} config Configuration object.
     * @param {string} config.action "read" (HTTP: GET), "write" (HTTP: PUT), or
     *     "delete" (HTTP: DELETE), "resumable" (HTTP: POST).
     * @param {string} [config.cname] The cname for this bucket, i.e.,
     *     "https://cdn.example.com".
     * @param {string} [config.contentMd5] The MD5 digest value in base64. If you
     *     provide this, the client must provide this HTTP header with this same
     *     value in its request.
     * @param {string} [config.contentType] If you provide this value, the client
     *     must provide this HTTP header set to the same value.
     * @param {*} config.expires A timestamp when this link will expire. Any value
     *     given is passed to `new Date()`.
     * @param {object} [config.extensionHeaders] If these headers are used, the
     *     server will check to make sure that the client provides matching
     * values. See [Canonical extension
     * headers](https://cloud.google.com/storage/docs/access-control/signed-urls#about-canonical-extension-headers)
     *     for the requirements of this feature, most notably:
     *       - The header name must be prefixed with `x-goog-`
     *       - The header name must be all lowercase
     * @param {string} [config.promptSaveAs] The filename to prompt the user to
     *     save the file as when the signed url is accessed. This is ignored if
     *     `config.responseDisposition` is set.
     * @param {string} [config.responseDisposition] The
     *     [response-content-disposition parameter](http://goo.gl/yMWxQV) of the
     *     signed url.
     * @param {string} [config.responseType] The response-content-type parameter
     *     of the signed url.
     * @param {GetSignedUrlCallback} [callback] Callback function.
     * @returns {Promise<GetSignedUrlResponse>}
     *
     * @example
     * const {Storage} = require('@google-cloud/storage');
     * const storage = new Storage();
     * const myBucket = storage.bucket('my-bucket');
     *
     * const file = myBucket.file('my-file');
     *
     * //-
     * // Generate a URL that allows temporary access to download your file.
     * //-
     * const request = require('request');
     *
     * const config = {
     *   action: 'read',
     *   expires: '03-17-2025'
     * };
     *
     * file.getSignedUrl(config, function(err, url) {
     *   if (err) {
     *     console.error(err);
     *     return;
     *   }
     *
     *   // The file is now available to read from this URL.
     *   request(url, function(err, resp) {
     *     // resp.statusCode = 200
     *   });
     * });
     *
     * //-
     * // Generate a URL to allow write permissions. This means anyone with this
     * URL
     * // can send a POST request with new data that will overwrite the file.
     * //-
     * file.getSignedUrl({
     *   action: 'write',
     *   expires: '03-17-2025'
     * }, function(err, url) {
     *   if (err) {
     *     console.error(err);
     *     return;
     *   }
     *
     *   // The file is now available to be written to.
     *   const writeStream = request.put(url);
     *   writeStream.end('New data');
     *
     *   writeStream.on('complete', function(resp) {
     *     // Confirm the new content was saved.
     *     file.download(function(err, fileContents) {
     *       console.log('Contents:', fileContents.toString());
     *       // Contents: New data
     *     });
     *   });
     * });
     *
     * //-
     * // If the callback is omitted, we'll return a Promise.
     * //-
     * file.getSignedUrl(config).then(function(data) {
     *   const url = data[0];
     * });
     *
     * @example <caption>include:samples/files.js</caption>
     * region_tag:storage_generate_signed_url
     * Another example:
     */
    getSignedUrl(cfg: GetSignedUrlConfig): Promise<GetSignedPolicyResponse>;
    getSignedUrl(cfg: GetSignedUrlConfig, callback: GetSignedUrlCallback): void;
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
    makePrivate(options: any, callback: any): void;
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
    makePublic(callback: any): void;
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
    move(destination: any, options: any, callback: any): void;
    /**
     * Makes request and applies userProject query parameter if necessary.
     *
     * @private
     *
     * @param {object} reqOpts - The request options.
     * @param {function} callback - The callback function.
     */
    request(reqOpts: DecorateRequestOptions): Promise<r.Response>;
    request(reqOpts: DecorateRequestOptions, callback: BodyResponseCallback): void;
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
    rotateEncryptionKey(options: any, callback: any): void;
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
    save(data: any, options?: any, callback?: any): void;
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
    setMetadata(metadata: any, options?: any, callback?: any): void;
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
    setStorageClass(storageClass: any, options: any, callback?: any): void;
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
    setUserProject(userProject: string): void;
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
    startResumableUpload_(dup: duplexify.Duplexify, options: CreateResumableUploadOptions): void;
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
    startSimpleUpload_(dup: duplexify.Duplexify, options?: CreateResumableUploadOptions): void;
}
/**
 * Reference to the {@link File} class.
 * @name module:@google-cloud/storage.File
 * @see File
 */
export { File };
