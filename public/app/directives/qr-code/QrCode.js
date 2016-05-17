/**
 * Created by XoX on 05/04/2016.
 */
'use strict';

angular
    .module('QRCode', [ ])
    .factory('QRCode', [
        /* Service for getting QrCode image */
        function () {

            var qrcode = {};

            qrcode.getQrCode = function (data, width, height) {

                data = data || '';
                width = width || 100;
                height = height ||100;
                if (data !== '') {
                    return encodeURI('https://api.qrserver.com/v1/create-qr-code/?data=' + data.toString()
                        + '&size=' + width.toString() + 'x' + height.toString() + '&ecc=L') ;
                }
                else {
                    return 'NoData';
                }
            };

            return qrcode;
        }
    ])
    .directive('qrCode', [ '$timeout', 'QRCode',

        function ($timeout, qrcode) {

            return {
                restrict: 'E',
                scope: {
                    qrCodeData: '=',
                    refreshTime: '='
                },
                controller: function ($scope) {

                    var vm = this;

                    vm.qrCodeUrl = '';
                    vm.qrCodePromise = null;

                    vm.getQrCode = function () {

                        if (vm.qrCodePromise != null) {
                            $timeout.cancel(vm.qrCodePromise);
                        }
                        vm.qrCodePromise = $timeout(function() {
                            vm.qrCodeUrl = qrcode.getQrCode($scope.qrCodeData, 100, 100);
                        }, $scope.refreshTime || 1000);

                        vm.qrCodePromise.then(
                            function () {
                                vm.qrCodePromise = null;
                            },
                            function () {
                                vm.qrCodePromise = null;
                            }
                        );
                    };

                    vm.getQrCode();

                    $scope.$watch('qrCodeData', function (newValue, oldValue) {

                        if (angular.isDefined(newValue) && newValue !== null && oldValue !== newValue) {
                            vm.getQrCode();
                        }
                    });


                    return vm;
                },
                controllerAs: 'qrCodeCtrl',
                templateUrl: 'app/directives/qr-code/template/qr-code.html'
            }
        }
    ]);