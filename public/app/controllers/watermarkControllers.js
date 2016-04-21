/**
 * Created by XoX on 03/04/2016.
 */

'use strict';


angular
    .module('WatermarkControllers', [
        'rzModule',
        'EpubServices',
        'WatermarkServices',
        'OctopusSelect',
        'QRCode'
    ])
    .controller('WatermarkController',  ['$scope', '$routeParams', '$location', 'Epub', 'Watermarker',

        function ($scope, $routeParams, $location, epub, watermarker) {


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

            vm.options = {
                alpha: 40,
                compress: true
            };

            vm.slider = {
                options: {
                    showSelectionBar: true,
                    floor: 20,
                    ceil: 100
                }
            };

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

                watermarker.embedWatermark(vm.epubID, vm.watermarks, vm.options,

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
                    /* Notifying scrollable of content change*/
                    $scope.$broadcast('content.changed');
                    $scope.$broadcast('content.reload');
                },
                function (response) {

                    /* Display error when the request for metadata fail */
                    vm.load.loading = false;
                    vm.error = response.data;
                }
            );
        }]
    )
    .controller('WatermarkExtractionController', [ '$routeParams', '$scope', 'Epub', 'Watermarker',

        function ($routeParams, $scope, epub, watermaker) {

            var vm = this;
            vm.epubID = $routeParams.epubID;
            vm.error = null;
            vm.load = {
                loading: true,
                showProgress: false,
                message: 'Fetching epub files metadata...',
                showMessage: true
            };

            vm.watermark = null;

            vm.selectedCss = [ ];
            vm.selectedImages = [ ];
            vm.selectedXhtml = [ ];

            /* Form Validation */
            //TODO Must refactor this by encapsulating it into a directive.
            $scope.$watchGroup(
                [
                    angular.bind(vm, function() {

                        return vm.selectedCss.length;
                    }),
                    angular.bind(vm, function() {

                        return vm.selectedImages.length;
                    }),
                    angular.bind(vm, function () {

                        return vm.selectedXhtml.length
                    })
                ],

                function (newValues) {

                    if (newValues[0] === 0 && newValues[1] === 0 && newValues[2] === 0 ) {
                        vm.extractForm.$setValidity('selection', false);
                    }
                    else {
                        vm.extractForm.$setValidity('selection', true);
                    }
                }
            );

            vm.extractWatermark = function () {

                var filesIDs = {
                    cssIDs: vm.selectedCss.map(function (obj) {
                        return obj.id
                    }),
                    imagesIDs: vm.selectedImages.map(function (obj) {
                        return obj.id
                    }),
                    xhtmlIDs: vm.selectedXhtml.map(function (obj) {
                        return obj.id
                    })
                };

                vm.load.message = 'Extracting watermark...';
                vm.load.loading = true;

                watermaker.extractWatermark(vm.epubID, filesIDs,
                    function (response) {

                        vm.load.loading = false;
                        vm.watermark = response.data;
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

            vm.getPanelClass = function (error) {

                if (error) {
                    return 'panel-danger';
                }
                else {
                    return '';
                }
            };
        }
    ]);