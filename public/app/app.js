/**
 * Created by XoX on 30/03/2016.
 */
'use strict';

angular
    .module('OctopusApp', [
        'ngRoute',
        'ngAnimate',
        'ngTouch',
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
                    .when('/epub/:epubid', {
                        templateUrl: '../view/epubdetails.html',
                        controller: 'EpubController',
                        controllerAs: 'epubCtrl'
                    })
                    .otherwise({
                        redirectTo: '/home'
                    })
            }
        ]
    );
