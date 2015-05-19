/**
 * Loader local image files from img tags on Amazon S3
 **/

var through = require('through2'),
  gutil = require('gulp-util'),
  extend = require('extend'),
  path = require('path'),
  Promise = require('promise'),
  fs = require('fs'),
  md5 = require('MD5'),
  s3 = require('s3');

const PLUGIN_NAME = 'gulp-s3-replace';
const linksRegExp = /(src|href)="([^\'\"]+)/ig;

function gulpS3Replace(options) {

  options = extend({
    basePath: process.cwd(),
    bucketName: '',
    fileExtensions: ['jpg', 'png', 'gif', 'svg', 'doc', 'pdf', 'js', 'css'],
    s3: {
      maxAsyncS3: 20,
      s3RetryCount: 3,
      s3RetryDelay: 1000,
      multipartUploadThreshold: 20 * 1024 * 1024, // 20971520
      multipartUploadSize: 15 * 1024 * 1024, // 15728640
      s3Options: {
        signatureVersion: 'v3',
        accessKeyId: "",
        secretAccessKey: ""
      }
    }
  }, options || {});

  var s3Client = s3.createClient(options.s3);

  return through.obj(function (file, enc, callback) {

    var self = this;
    var basePath = path.normalize(options.basePath);

    if (basePath[basePath.length - 1] !== '/') {
      basePath = basePath + '/';
    }

    if (file.isNull()) {
      return callback(null, file); // return empty file
    }

    if (file.isStream()) {
      self.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return callback();
    }

    if (file.isBuffer()) {

      var match;
      var promises = [];
      var content = file.contents.toString();

      syncLoop(false, function (loop) {

        var match = linksRegExp.exec(content);

        if (null === match) {
          loop.break(true);
          loop.next();
          return;
        }

        var originalFilePath = match[2];

        if (options.fileExtensions.indexOf(path.extname(originalFilePath).substring(1)) === -1) {
          loop.next();
          return;
        }

        promises.push(createUploadPromise(basePath, options.bucketName, originalFilePath, s3Client));

        loop.next();

      }, function () {

        if (promises.length === 0) {
          callback(null, file);
        }

        Promise.all(promises).then(function (urls) {

          for (var i = 0; i < urls.length; i++) {
            content = content.replace(urls[i].originalUrl, urls[i].publicUrl);
          }

          file.contents = new Buffer(content);

          callback(null, file);
        })

      });
    }
  });
}

function syncLoop(iterations, process, exit) {
  var index = 0,
    done = false,
    shouldExit = false;
  var loop = {
    next: function () {
      if (done) {
        if (shouldExit && exit) {
          return exit();
        }
      }

      if (false === iterations) {
        process(loop);
      } else {
        if (index < iterations) {
          index++;
          process(loop);
        } else {
          done = true;
          if (exit) {
            exit();
          }
        }
      }
    },
    iteration: function () {
      return index - 1;
    },
    break: function (end) {
      done = true;
      shouldExit = end;
    }
  };
  loop.next();
  return loop;
}

function createUploadPromise(basePath, bucketName, destOriginalFilePath, s3Client) {

  return new Promise(function (resolve, reject) {

    var destFilePath = destOriginalFilePath[0] === '/' ? destOriginalFilePath.substring(1) : destOriginalFilePath;
    var filePath = basePath + destFilePath;
    var uploaderParams = {
      localFile: filePath,
      s3Params: {
        Bucket: bucketName,
        Key: destFilePath
      }
    };
    var uploader = s3Client.uploadFile(uploaderParams);
    var publicUrl = s3.getPublicUrlHttp(bucketName, destFilePath);
    var metaDir = basePath + '.meta';

    if (!directoryExists(metaDir)) {
      fs.mkdirSync(metaDir);
    }

    var metaPath = metaDir + '/' + md5(filePath) + '.meta';
    var fileInfo = fs.statSync(filePath);
    var metaInfo = {
      utime: 0
    };

    if(!fileExists(metaPath)) {
      fs.writeFileSync(metaPath, JSON.stringify(metaInfo));
    } else {
      metaInfo = JSON.parse(fs.readFileSync(metaPath));
    }

    if(fileInfo['ctime'].getTime() <= metaInfo.utime) {
      gutil.log(gutil.colors.yellow('[SUCCESS]', destFilePath + " -> " + publicUrl));

      resolve({originalUrl: destOriginalFilePath, publicUrl: publicUrl});
      return;
    }

    metaInfo.utime = fileInfo['ctime'].getTime();

    fs.writeFileSync(metaPath, JSON.stringify(metaInfo));

    uploader.on('error', function (err) {
      self.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Unable to upload:' + err.stack));
      callback()
    });

    uploader.on('end', function () {
      gutil.log(gutil.colors.green('[SUCCESS]', destFilePath + " -> " + publicUrl));
      resolve({originalUrl: destOriginalFilePath, publicUrl: publicUrl});
    });
  });
}

function directoryExists(path) {
  try {
    stats = fs.statSync(path);
    if (stats.isDirectory()) {
      return true;
    }
  }
  catch (e) {
    return false;
  }
}

function fileExists(path) {
  try {
    stats = fs.statSync(path);
    if (stats.isFile()) {
      return true;
    }
  }
  catch (e) {
    return false;
  }
}

module.exports = gulpS3Replace;
