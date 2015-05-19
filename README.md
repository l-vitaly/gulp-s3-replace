# gulp-s3-replace 

> Upload files to Amazon S3 of the img tag and replaces the url for gulp 3.

## Features

* Uploads the file to Amazon S3 src attribute of the IMG tag and its replacement

## Usage

First, install `gulp-s3-replace` as a development dependency:

```
npm install gulp-s3-replace --save-dev
```

Then, add it to your `gulpfile.js`:

```
var s3Replace = require('gulp-s3-replace');

gulp.task('s3replace', function(){
  gulp.src(['./views/*.html'])
    .pipe(s3Replace({
      basePath: './',
      bucketName: 's3 bucket name',
      fileExtensions: ['jpg', 'pdf'],
      s3: {
        s3Options: {
          accessKeyId: 'your s3 key',
          secretAccessKey: 'your s3 secret'
        }
      }
    }))
    .pipe(gulp.dest('build/views'));
});
```

## Api

Uploads the file to Amazon S3 src attribute of the IMG tag and its replacement

s3Replace(options)

### gulp-replace options

An optional third argument, `options`, can be passed.

#### options
Type: `Object`

##### options.basePath
Type: `string`  
Default: `process.cwd()`

Base path for files.

##### options.bucketName
Type: `string`  
Default: `empty`

The bucket that the files will be uploaded to.

##### options.fileExtensions
Type: `array`  
Default: `['jpg', 'png', 'gif', 'svg', 'doc', 'pdf', 'js', 'css']`

File extensions to be uploaded.

##### options.s3.multipartUploadThreshold
Type: `integer`  
Default: `20971520`

If a file is this many bytes or greater, it will be uploaded via a multipart request. Minimum is 5MB. Maximum is 5GB.

##### options.s3.multipartUploadThreshold
Type: `integer`  
Default: `15728640`

When uploading via multipart, this is the part size. The minimum size is 5MB. The maximum size is 5GB. Note that S3 has a maximum of 10000 parts for a multipart upload, so if this value is too small, it will be ignored in favor of the minimum necessary value required to upload the file.

##### options.s3.maxAsyncS3
Type: `integer`  
Default: `20`

Maximum number of simultaneous requests this client will ever have open to S3.

##### options.s3.s3RetryCount
Type: `integer`  
Default: `3`

How many times to try an S3 operation before giving up.

##### options.s3.s3RetryDelay
Type: `integer`  
Default: `1000`

How many milliseconds to wait before retrying an S3 operation.

##### options.s3.s3Options.accessKeyId
Type: `string`  
Default: `empty`

Your Amazon S3 key.

##### options.s3.s3Options.secretAccessKey
Type: `string`  
Default: `empty`

Your Amazon S3 secret key.

More s3Options options see:[http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property)

## Testing

```
S3_KEY=<valid_s3_key> S3_SECRET=<valid_s3_secret> S3_BUCKET=<valid_s3_bucket> npm test
```

The test timeout is set to 40 seconds because Internet connectivity waries wildly.

