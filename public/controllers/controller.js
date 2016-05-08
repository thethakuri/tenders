//$scope is the glue between application controller and the view
var tenderApp = angular
    .module('tenderApp', ['angularUtils.directives.dirPagination', 'angular-loading-bar', 'ui.router', 'angularjs-datetime-picker'])
    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {  
        $urlRouterProvider.otherwise('/');
        
        $stateProvider    
            .state('home', {
                url : '/',
                views : {
                    '' : {
                        templateUrl : 'partials/default.ejs',
                        controller : 'TenderAppCtrl'                
                    },
                    'defaultView@home' : {
                        templateUrl : 'partials/table.ejs',
                        controller : 'TenderAppCtrl'
                    },
                    'detailView@home' : {
                        templateUrl : 'templates/viewtender.ejs',
                        controller : 'TenderDetailCtrl'
                    }
                }
            })
            //dummy state used for browser back button functionality only
            .state('home.detail', { 
                url : ':id'
            })
            
            .state('about', {
                url : '/about',
                templateUrl : 'partials/about.ejs',
                controller : 'AboutCtrl'
            })
            
            .state('account', {
                
            })
            .state('account.participated', {
                
            })
            .state('account.watchlist', {
                
            })
            .state('account.addlisting', {
                
            })
            .state('account.settings', {
                
            });   
    }])
    /*
    .config(function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl : 'partials/default.ejs',
                controller : 'TenderAppCtrl'
            })
            .when('/:id' , {
                templateUrl : 'templates/viewtender.ejs',
                controller : 'TenderAppCtrl'
            })
            .otherwise({
                redirectTo : '/'
            });
            //$locationProvider.html5Mode(true);
    })
    */
    .directive('navBar', function() {
        return {
            controller: 'TenderAppCtrl',
            templateUrl: 'partials/navbar.ejs'
        }
    })
    // Add  offset to clear button dynamically
    .directive('searchClear', ['userSearchField', function(userSearchField) {
        return {
            restrict: 'A',
            link: function(scope, element) {
                scope.$watchCollection(
                    function() {
                        return angular.element(element.parent()[0].querySelector('#searchViewButton')).prop('offsetWidth');
                    },
                    function(newValue) {
                        //newValue is set to 0 when show hide home view
                        var offsetValue = (newValue === 0 ? userSearchField.fieldWidth.get() : newValue+25);
                        element.css('right', offsetValue + 'px');
                    }
                );
            }
        }
    }])
    .directive('initializeTooltip', function() {
        return {
            restrict: 'A',
            link: function(scope, element) {
                element.tooltip();
            }
        }
    })
    .directive('multipleSelect', function(){
        var options = [];
        return {
            restrict : 'A',
            link : function (scope, element, attributes) {  
                var targetElement = angular.element(element[0].querySelectorAll('a'));
                targetElement.on('click', function(event){
                    var target = $(this),
                    val = target.attr('data-value'),
                    inp = target.find('input'),
                    idx;
                if(( idx = options.indexOf(val)) > -1){
                    options.splice(idx, 1);
                    setTimeout( function() { inp.prop( 'checked', false ) }, 0); //wait for all events to finish to avoid conflict between <a> and <checkbox>
                } else {
                    options.push(val);
                    setTimeout( function() { inp.prop( 'checked', true ) }, 0);
                }
                target.blur();
                return false;
                })  
            }
        }
    })
    .directive('userTagInput', function(){
        return{
            restrict: 'A',
            link: function (scope, element, attributes) {  
                element.bind('keydown', function (e) {  
                    if(e.which == 9){ //keycode for TAB
                        e.preventDefault();
                    }
                });
                element.bind('keyup', function (e) {  
                    var key = e.which;
                    if(key == 9 || key == 13){ //keycode for TAB , ENTER
                        e.preventDefault();
                        scope.$apply(attributes.newTag);
                    }
                });
            }
        }
    })
    // Set input focus on ng-show
    .directive('showFocus', function($timeout) {
        return function(scope, element, attrs) {
            scope.$watch(attrs.showFocus, 
            function (newValue) { 
                $timeout(function() {
                    newValue && element.focus();
                });
            });
        };    
    })
    // .directive('modalScroll', function(){ // fixes body shift to right when modal is on with {overflow-y : scroll} by default
    //     return{
    //         restrict: 'EA',
    //         link: function(scope, element, attributes){
    //             $(element).on('show.bs.modal', function(){
    //                 angular.element(document).find("html").css("overflow", "hidden");
    //                 angular.element(document).find("body").css("marginRight", "15px");
                    
                    
    //             });
    //             $(element).on('hidden.bs.modal', function () {  
    //                 angular.element(document).find("html").css("overflowY", "scroll");
    //                 angular.element(document).find("body").css("marginRight", "0");
    //             }); 
    //         }   
    //     }
    // })
    .factory('userSearchField', function () {  
        
        var searchField = {
            searchTerm : '',
            fieldWidth : 0
        };
        
        return {
            searchTerm : {
                get : function(){
                    return searchField.searchTerm;
                },
                set : function(newTerm){
                    searchField.searchTerm = newTerm;
                }
            },
            fieldWidth : {
                get : function (){
                    return searchField.fieldWidth;
                },
                set : function (newWidth) {  
                    searchField.fieldWidth = newWidth;
                }
            }
        };
        
        // var searchTerm = '';
        // return {
        //     get : function () {  
        //         return searchTerm;
        //     },
        //     set : function (newTerm) {  
        //         searchTerm = newTerm;
        //     }
        // } 
    })
    .factory('tenderFactory', function(){
        var tenderInstance = {};
       
        return {
            get : function () {
                return tenderInstance;
              },
            set : function (newTender) {  
                tenderInstance = newTender;
            }
        }
    })
    .factory('daysDifference', function(){
        function diffDays(subDate) {  
            var now = new Date();//Today
            now.setHours(0,0,0,0);
            subDate = new Date(subDate);
            var timeDiff = subDate.getTime() - now.getTime();
            return Math.round(timeDiff / (1000 * 3600 * 24));
        }
        return ({
            diffDays : diffDays
        })
    })
    .factory('tenderText', ['daysDifference', function (daysDifference) {  
      function getStatus(subDate){
        var diff = daysDifference.diffDays(subDate);
        if (diff >= 0) {
            if (diff > 2 && diff < 7)
                return "text-warning";
            else if (diff <= 2)
                return "text-danger";
            else return;
        }
        else return "text-muted";
      }
      return ({
          getStatus : getStatus
      }) 
    }])
    .service('tenderService', function ($http, $q) {  
        function getTenderView(url){
            var request = $http({
                method : 'get',
                url : url
            });
            return (request.then(handleSuccess, handleError));
        }
        
        function handleError(response) {  
            if(!angular.isObject(response.data) || !response.data.message){
                return ($q.reject("An unkown error occured."));
            }
            return ($q.reject(response.data.message));
        }
        function handleSuccess(response) {
            return (response.data);
        }
        
        return({
            getTenderView : getTenderView
        })
    })
    .controller('topController', function ($location) {  
        $location.path('/');
    })
    .controller('FooterCtrl', function($scope) {
        $scope.currentYear = new Date().getFullYear();
    })
    .controller('TenderDetailCtrl', ['$scope', 'tenderFactory', '$state', 'userSearchField', 'daysDifference', 'tenderText', function ($scope, tenderFactory, $state, userSearchField, daysDifference, tenderText) {  
        $scope.$state = $state;
        $scope.tenderDetail = tenderFactory.get();
        
        $scope.dateNow = '07-12-2013';
        
        $scope.tagInput = false;
        $scope.userTags = [];
        $scope.alertTag = false;
        
        //Watch for changes in tag input especially after rectifying duplicate error
        $scope.$watch(
            "tagText",
            function(newValue){
                if($scope.alertTag) $scope.alertTag = false;
        });
        
        $scope.addTag = function () {  
            var newTag = $scope.tagText.toLowerCase();
            if(newTag.length){
                if($scope.userTags.indexOf(newTag) !== -1 || $scope.tenderDetail.category.indexOf(newTag) !== -1){
                    $scope.alertTag = true;
                    return;  
                }
                else{
                    $scope.alertTag = false;
                    $scope.userTags.push(newTag);
                    $scope.tagText = '';
                }
            }  
        }
        $scope.checkTag = function(tag) {
            return $scope.tenderDetail.category.indexOf(tag) === -1;
        }
        $scope.deleteTag = function (event, tag) {
            event.preventDefault(); // since our anchor is inside a button
            event.stopPropagation(); // prevent event from bubbling up
            var key = $scope.userTags.indexOf(tag);
            if($scope.userTags.length && key !== -1){
                $scope.userTags.splice(key, 1);
            }
        }
        
        /***************WATCH FOR CHANGE OF VIEWS************/
        /*eg. page back button is hit*/
        $scope.$watchCollection(
            function () {  
                return $state.current.name;
            },
            function(newValue){
                $scope.bidInfo = false; //Keep bid information form from displaying afer switching views 
                //reset tag values
                $scope.userTags = [];
                $scope.tagText = '';
                $scope.tagInput = false;
                
                angular.element(document.querySelector('.modal')).modal('hide'); //hide modal
            }   
        );
        
        $scope.$watch( 
            function () {  
                return tenderFactory.get();
            },
            function(newValue){
                $scope.tenderDetail = newValue;
        });

        $scope.goBack = function () {  
            $state.go('home');
        }
        $scope.searchTag = function (searchTerm) {  
            userSearchField.searchTerm.set(searchTerm);
        }
        
        $scope.remainingDays = function (subDate) {  
            var diffDays = daysDifference.diffDays(subDate);
            if(diffDays > 0) return diffDays + (diffDays === 1 ? ' day':' days') + ' remaining';
            else return diffDays === 0 ? 'Expiring today' : 'Expired'; 
        }
        $scope.getStatus = function(subDate){
            return tenderText.getStatus(subDate)
        };
        
        $scope.isExpired = function (subDate) {  
            return daysDifference.diffDays(subDate) <= 0;
        };
        
        $scope.bidPart = function(subDate){
            if($scope.isExpired(subDate)) $scope.bidInfo = true;
            return;
        }
        
      
    }])
    .controller('TenderAppCtrl', ['$scope', 'tenderService', 'tenderFactory', '$state', 'userSearchField', 'daysDifference', 'tenderText', function($scope, tenderService, tenderFactory, $state, userSearchField, daysDifference, tenderText) {
        
        $scope.$state = $state;
        $scope.loadingData = true;
        //userSearch field
        $scope.$watch(
            function () {  
                return userSearchField.searchTerm.get();
            }
            ,
            function (newValue) {  
                $scope.userSearch = newValue;
            }
        );
        
        /***************WATCH FOR CHANGE OF VIEWS FROM TenderAppCtrl************/
        /*eg. page back button is hit*/
        $scope.$watchCollection(
            function () {  
                return $state.current.name;
            },
            function(newValue){    
                // retain searchBar offsetwidth while show hide views
                // user for search clear icon positioning
                if(newValue==='home.detail'){
                    var offsetW = angular.element(document.querySelector('#searchViewButton')).prop('offsetWidth');
                    userSearchField.fieldWidth.set(offsetW + 25);
                }
            }   
        );
        
        
        $scope.loadTender = function (tender) {
            tenderFactory.set(tender);
            $state.transitionTo('home.detail', {id: tender._id}, {notify: false});
        }
        
        //Decalre session user
        $scope.user;
        
        // Default view
        loadTenderData('/Active');
        
        //default sort table headers
        $scope.sortTable = {
            sortKey: 'subDate',
            reverse: false
        };

        //pagination 
        $scope.pagination = {
            currentPage: 1,
            pageSize: 15,
            perPage: 15,
            recordsPerPage: [15, 25, 40, 50],
            updateRecordsPerPage: function() {
                this.pageSize = this.perPage;
            }
        };

        //Views (Active, All, Recent)
        $scope.currentView = "Active"; //default
        $scope.fetch = function(givenView) {
            if ($scope.currentView != givenView) {
                $scope.loadingData = true;
                $scope.currentView = givenView;
                tenderService.getTenderView('/'+ givenView).then(function(tenders) {
                    $scope.tenderlist = tenders;
                    $scope.loadingData = false;
                });
            }
        };
        
         //Load Tender data
        function loadTenderData(url) {
            $scope.loadingData = true;
            tenderService.getTenderView(url).then(function (tenders) {  
                 $scope.tenderlist = tenders;
                 $scope.loadingData = false;
            })
        };
        
        //Row color
        $scope.getStatus = function(subDate){
            return tenderText.getStatus(subDate)
        };

        //Days left
        $scope.daysLeft = function(subDate) {
            var daysRemaining = daysDifference.diffDays(subDate);
            if (daysRemaining < 0) return 'Expired';
            else return daysRemaining;
        };

        $scope.getMinimum = function(a, b) {
            return Math.min(a, b);
        };
        
    }])
    .config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
        cfpLoadingBarProvider.includeSpinner = false;
    }])
    .filter('multipleFilter', ['filterFilter', function(myFilter) {
        return function(tenderlist, query) {
            if (!query) return tenderlist;

            var terms = query.split(/\s+/);
            var result = tenderlist;
            terms.forEach(function(term) {
                result = myFilter(result, term);
            });

            return result;
        }
    }]);


