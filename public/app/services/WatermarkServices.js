/**
 * Created by XoX on 03/04/2016.
 */
"use strict";

angular
    .module('WatermarkServices', [
        //Add dependencies here
    ])
    .factory('Watermarker', [ '$http',

        function ($http) {

            var watermarker = {};

            watermarker.embedWatermark = function (epubID, watermarks, successCallback, errorCallback) {

                $http({
                    method: 'POST',
                    url: '/epub/' + epubID + '/watermark',
                    data: {
                        watermarks: watermarks
                    }
                }).then(successCallback, errorCallback);
            };

            return watermarker;
        }
    ]);

var Watermark = function () {

    this.cssWatermarks = null;
    this.imageWatermarks = null;
    this.xhtmlWatermarks = null;
};

Watermark.prototype.setCssWatermarks = function (cssWatermarks) {

    this.cssWatermarks = [];
    for(var i = 0; i < cssWatermarks.length; ++i) {
        if (angular.isDefined(cssWatermarks[i].watermark) && cssWatermarks[i].watermark !== null) {

            this.cssWatermarks.push(cssWatermarks[i]);
        }
    }
};

Watermark.prototype.setImageWatermarks = function (imageIDs, watermark) {

    if (watermark !== '' && watermark !== null) {
        this.imageWatermarks = {
            ids: imageIDs,
            watermark: watermark
        };
    }
    else {
        this.imageWatermarks = undefined;
    }
};

Watermark.prototype.setXhtmlWatermarks = function (xhtmlIDs, watermark) {

    if (watermark !== '' && watermark !== null) {
        this.xhtmlWatermarks =  {
            ids : xhtmlIDs,
            watermark : watermark
        };
    }
    else {
        this.xhtmlWatermarks = undefined;
    }
};
