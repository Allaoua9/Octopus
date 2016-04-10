/**
 * Created by XoX on 10/04/2016.
 */
'use strict';

angular
    .module('DownloadAndPreview', [
        'EpubServices'
    ])
    .controller('DownloadController', [ '$routeParams', 'Epub',

        function ($routeParams, epub) {

            var vm = this;
            vm.epubID = $routeParams.epubID;
            vm.load = {
                loading: true,
                message: 'Parsing Epub...',
                showMessage: true,
                showProgress: false
            };
            vm.error = null;

            var initEpub = function (response) {

                vm.load = false;
                vm.epub = response;
            };
            var handleError = function (response) {

                vm.load.loading = false;
                vm.error = response.data;
            };
            epub.getEpubMetaData(vm.epubID, initEpub, handleError);
    }]);
