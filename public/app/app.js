/**
 * Created by XoX on 30/03/2016.
 */
'use strict';

angular
    .module('OctopusApp', [
        'ngRoute',
        'ngAnimate',
        'ngTouch',
        'ngSanitize',
        'ngMessages',
        'ui.bootstrap',
        'ngScrollable',
        'OctopusError',
        'OctopusLoading',
        'EpubControllers',
        'WatermarkControllers',
        'DownloadAndPreview'
    ])
    .config( [ '$routeProvider',

            function ($routeProvider) {
                $routeProvider
                    .when('/home', {
                        templateUrl: '../views/home.html'
                    })
                    .when('/upload', {
                        templateUrl: '../views/uploadepub.html',
                        controller: 'EpubUploadController',
                        controllerAs: 'epubUpload'
                    })
                    .when('/epub/:epubID', {
                        templateUrl: '../views/epub.html',
                        controller: 'EpubController',
                        controllerAs: 'epubCtrl'
                    })
                    .when('/watermark/:epubID', {
                        templateUrl: '../views/watermark.html',
                        controller: 'WatermarkController',
                        controllerAs: 'watermarkCtrl'
                    })
                    .when('/epub/:epubID/downloadandpreview', {
                        templateUrl: '../views/downloadandpreview.html',
                        controller: 'DownloadController',
                        controllerAs: 'downloadCtrl'
                    })
                    .otherwise({
                        redirectTo: '/home'
                    })
            }
        ]
    );
