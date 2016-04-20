var formValidationApp = angular
    .module('formValidationApp', ['angular-loading-bar'])
    .controller('FooterCtrl', function($scope){
        $scope.currentYear = new Date().getFullYear();
    })
    .config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
        cfpLoadingBarProvider.includeSpinner = false;
    }])
    .controller('FormCtrl', function ($scope) {  

        
    });

/* Directive */    
var compareTo = function() {
    return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel) {

            ngModel.$validators.compareTo = function(modelValue) {
                return modelValue == scope.otherModelValue;
            };

            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };
};

formValidationApp.directive("compareTo", compareTo);