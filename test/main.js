'use strict';

var s3ReplacePlugin = require('../');
var fs = require('fs');
var should = require('should');
var File = require('vinyl');
var assert = require("assert");

require('mocha');

if (!process.env.S3_BUCKET || !process.env.S3_KEY || !process.env.S3_SECRET) {
  console.log("S3_BUCKET, S3_KEY, and S3_SECRET env vars needed to run tests");
  process.exit(1);
}

describe('gulp-s3-replace', function () {

  describe('s3ReplacePlugin()', function () {

    it('should replace', function (done) {

      var file = new File({
        path: 'test/fixtures/links.html',
        cwd: 'test/',
        base: 'test/fixtures',
        contents: fs.readFileSync('test/fixtures/links.html')
      });

      var stream = s3ReplacePlugin({
        basePath: './test/fixtures/',
        bucketName: process.env.S3_BUCKET,
        s3: {
          s3Options: {
            accessKeyId: process.env.S3_KEY,
            secretAccessKey: process.env.S3_SECRET
          }
        }
      });
      stream.on('data', function (newFile) {

        should.exist(newFile);
        should.exist(newFile.contents);

        done();
      });

      stream.write(file);
      stream.end();

    });

  });

});
