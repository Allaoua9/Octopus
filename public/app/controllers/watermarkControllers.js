/**
 * Created by XoX on 03/04/2016.
 */

'use strict';


angular
    .module('WatermarkControllers', [
        'EpubServices',
        'WatermarkServices',
        'OctopusSelect',
        'QRCode'
    ])
    .controller('WatermarkController',  ['$routeParams', '$location', 'Epub', 'Watermarker',

        function ($routeParams, $location, epub, watermarker) {


            var vm = this;
            /* Get epub ID from the route path params*/
            vm.epubID = $routeParams.epubID;
            /* Meta data about the epub document*/
            vm.metadata = null;
            /* Variable to keep trace of errors and displaying them */
            vm.error = null;
            /* Variable used to display loading */
            vm.load = {
                loading: true,
                showProgress: false,
                message: 'Fetching epub files metadata...',
                showMessage: true
            };
            /* the watermark model */
            vm.watermarks = new Watermark();

            /* Model to store the user selection and input*/
            vm.selectedCss = null;
            vm.selectedImages = [];
            vm.selectedXhtml = [];
            vm.imageWatermark = null;
            vm.xhtmlWatermark = null;

            /*Form validation*/
            vm.requireWatermark = function () {

                if (vm.metadata !== null) {
                    var imageWatermarkPresent = (vm.imageWatermark !== null) && (vm.imageWatermark.length !== 0);

                    var xhtmlWatermarkPresent = (vm.xhtmlWatermark !== null) && (vm.xhtmlWatermark.length !== 0);

                    var cssWatermarkPresent = false;

                    var cssFile;
                    for (var i = 0; i < vm.metadata.cssFiles.length; ++i) {
                        cssFile = vm.metadata.cssFiles[i];
                        if (angular.isDefined(cssFile.watermark) && cssFile.watermark.length !== 0) {
                            cssWatermarkPresent = true;
                            break;
                        }
                    }

                    return !imageWatermarkPresent && !xhtmlWatermarkPresent && !cssWatermarkPresent;
                }
                else {
                    return true;
                }
            };
            /*********************************************/

            vm.embedWatermark = function () {

                vm.load.message = 'Watermarking the epub file...';
                vm.load.loading = true;
                /* Constructing watermark object */
                var cssWatermarks = vm.metadata.cssFiles.map(function (obj) {

                    return {
                        id: obj.id,
                        watermark: obj.watermark
                    }
                });
                var imageIDs = vm.selectedImages.map(function (obj) {

                    return obj.id;
                });
                var xhtmlIDs = vm.selectedXhtml.map(function (obj) {

                    return obj.id;
                });

                vm.watermarks.setCssWatermarks(cssWatermarks);
                vm.watermarks.setImageWatermarks(imageIDs, vm.imageWatermark);
                vm.watermarks.setXhtmlWatermarks(xhtmlIDs, vm.xhtmlWatermark);

                watermarker.embedWatermark(vm.epubID, vm.watermarks,

                    function (response) {
                        $location.path('/epub/' + response.data.id + '/downloadandpreview');
                    },
                    function (response) {
                        vm.load.loading = false;
                        vm.error = response.data;
                    }
                );
            };


            /* Initialising the scope */
            epub.getFilesMetaData(vm.epubID,
                function (response) {
                    /* When metadata are fetched successfully from the server */
                    vm.load.loading = false;
                    /* Storing the metadata in case it is needed later*/
                    vm.metadata = response.metadata;
                },
                function (response) {

                    /* Display error when the request for metadata fail */
                    vm.load.loading = false;
                    vm.error = response.data;
                }
            );
        }]
    );