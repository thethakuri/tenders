var formValidationApp = angular
    
    .module('formValidationApp', ['ngSanitize', 'ngToast'])

    .config(['ngToastProvider', function(ngToast) {
        ngToast.configure({
          
          horizontalPosition: 'center'
          
        });
    }])

    .controller('PeekCtrl', function($scope){
        // $scope.$watch(
        //     'loggedIn',
        //     function(newValue){
        //         if(newValue){

        //         }
        //     }
        // );
    })
    
    .controller('FooterCtrl', function($scope){
        $scope.currentYear = new Date().getFullYear();
    })

    .controller('FormCtrl', ['$scope', '$window', 'ngToast', function ($scope, $window, ngToast) {  
        
        $scope.$watch(
            'message',
            function(newValue){
                if(newValue && $scope.alert !== 'info'){
                    ngToast.create({
                        className : $scope.alert,
                        content : newValue,
                        timeout : 6000,
                        dismissButton : true
                    });
                }   
            }
        )

        $scope.goBack = function(){
            $window.history.back();
        }

            
        
    }]);

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