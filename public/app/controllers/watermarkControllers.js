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
    .controller('WatermarkController',  ['$routeParams', 'Epub', 'Watermarker',

        function ($routeParams, epub, watermarker) {

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
            vm.watermarks = {};
            /* Model to store the selection of the user*/
            vm.selectedCss = null;
            vm.selectedImages = [];
            vm.selectedXhtml = [];


            /* Initialising the scope */
            epub.getFilesMetaData(vm.epubID,
                function (response) {
                    /* When metadata are fetched successfully from the server */
                    vm.load.loading = false;
                    /* Storing the metadata in case it is needed later*/
                    vm.metadata = response.metadata;

                    /* Initialising the watermarks model */
                    vm.watermarks.cssWatermarks = response.metadata.cssFiles.map(function (obj) {

                        return {
                            id: obj.id,
                            watermark: null
                        };
                    });

                    vm.watermarks.imageWatermark = {
                        fileIDs : response.metadata.imageFiles.map(function (obj) {
                            return obj.id;
                        }),
                        watermark: ''
                    };

                    vm.watermarks.xhtmlWatermark = {
                        fileIDs: response.metadata.xhtmlFiles.map(function (obj) {
                            return obj.id;
                        }),
                        watermark: ''
                    };
                },
                function (response) {

                    /* Display error when the request for metadata fail */
                    vm.load.loading = false;
                    vm.error = response.data;
                }
            );
        }]
    );
