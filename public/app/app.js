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
        'ui.bootstrap',
        'EpubControllers'
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
                    .otherwise({
                        redirectTo: '/home'
                    })
            }
        ]
    )
    .directive('octopusError', function () {

        return {
            restrict: 'E',
            scope: {
                error : '=error'
            },
            templateUrl: '../views/error.html'
        }
    })
    .directive('octopusLoading', function () {

        return {
            restrict: 'E',
            scope: {
                load: '='
            },
            templateUrl: '../views/loading.html'
        }
    });
