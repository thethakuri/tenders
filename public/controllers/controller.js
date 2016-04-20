//$scope is the glue between application controller and the view
var tenderApp = angular
    .module('tenderApp', ['angularUtils.directives.dirPagination', 'angular-loading-bar'])
    .controller('FooterCtrl', function($scope){
        $scope.currentYear = new Date().getFullYear();
    })
    .controller('TenderAppCtrl', ['$scope', '$http', function ($scope, $http) {
        
        // to get the data from server
        $http.get('/Active').success(function(response){
        console.log('Got the data from the server');
        $scope.tenderlist = response; 
        //alert($scope.tenderlist.length);
        });
        
        
        //default sort table headers
        $scope.sortTable = {
            sortKey : 'subDate',
            reverse : false
        };        
        
        
        //pagination 
        $scope.pagination = {
            currentPage : 1,
            pageSize : 15,
            perPage : 15,
            recordsPerPage : [15, 25, 40, 50],
            updateRecordsPerPage : function(){
                this.pageSize = this.perPage;
            }
        };
        
        //Views (Active, All, Recent)
        $scope.currentView = "Active"; //default
        $scope.fetch = function(givenView){
            if($scope.currentView != givenView){
                $scope.currentView = givenView;
                $http.get('/' + givenView).then(function(response){
                   $scope.tenderlist = response.data;
                });
            }
        }
        
        //Row color
        $scope.getStatus = function (subDate) {  
        
            var diff = diffDays(subDate); 
            
            if(diff >= 0){
                if (diff > 2 && diff < 7) 
                    return "text-warning"; 
                else if (diff <= 2) 
                    return "text-danger";
                else return;
            }
            else return"text-muted";
            
        }
        
        //Days left
        $scope.daysLeft = function (subDate) {  
            
            var daysRemaining = diffDays(subDate);
            if (daysRemaining < 0) return 'Expired';
            else return daysRemaining;
        }
        
        function diffDays(subDate) {
            //Today
            var now = new Date();
            subDate = new Date(subDate);
            var timeDiff = subDate.getTime() - now.getTime();
            return Math.ceil(timeDiff / (1000 * 3600 * 24)); 
        }
        
    }])
   .config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
        cfpLoadingBarProvider.includeSpinner = false;
    }])
   .filter('multipleFilter', ['filterFilter', function (myFilter) {
    return function (tenderlist, query) {
      if (!query) return tenderlist;

      var terms = query.split(/\s+/);
      var result = tenderlist;
      terms.forEach(function (term) {
        result = myFilter(result,term);
      });

      return result;
    }
  }]);


