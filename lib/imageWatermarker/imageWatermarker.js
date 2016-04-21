/**
 * Created by XoX on 17/04/2016.
 */
'use strict';

const ChildProcess = require('child_process');
const Path = require('path');

const watermarkerPath = Path.join(__dirname,'/bin/ImageWatermarker.exe');

const ImageWatermarker = function (workingDir) {

    this.workingDir = workingDir || require('os').tmpdir();
};

ImageWatermarker.prototype.embedWatermark = function (imagesPath, watermarkPath, alpha, callback) {

    const config = {
        method: 'watermark',
        images: imagesPath,
        watermark: watermarkPath,
        alpha: alpha || 40
    };

    const configJSON = JSON.stringify(config);

    const watermarker = this.execWatermarker(callback);

    watermarker.stdin.write(configJSON + require('os').EOL);
};

ImageWatermarker.prototype.extractWatermark = function (imagesPath, width, height, callback) {

    const config = {
        method: 'extract',
        images: imagesPath,
        width: width,
        height: height
    };

    const configJSON = JSON.stringify(config);

    const watermarker = this.execWatermarker((err, result) => {

        if (err) {
            callback(err);
        }
        else {
            result.watermarks = result.watermarks.map((elem) => {

                return Path.join(this.workingDir, elem);
            }, this);
            callback(err, result);
        }
    });

    watermarker.stdin.write(configJSON + require('os').EOL);
};

ImageWatermarker.prototype.execWatermarker = function (callback) {

    return ChildProcess.exec(watermarkerPath,
        {
            cwd: this.workingDir
        },
        (err, stdout, stderr) => {

            if (err) {
                const error = JSON.parse(stderr.toString()).error;
                callback(new Error(error.message), null);
            }
            else {
                const result = JSON.parse(stdout.toString());
                callback(null, result);
            }
        }
    );
};

/*ChildProcess.exec(__dirname + '/opencv/ConsoleApplication1.exe im',
 {
 cwd: __dirname + '/opencv/'
 },
 (err, stdout, stderr) => {

 console.log(err);
 console.log(stdout);
 console.log(stderr);
 }
 );*/

module.exports = ImageWatermarker;
