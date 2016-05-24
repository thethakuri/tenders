//$scope is the glue between application controller and the view
var tenderApp = angular
    .module('tenderApp', ['angularUtils.directives.dirPagination', 'angular-loading-bar', 'ui.router', 'angularjs-datetime-picker', 'ngSanitize', 'MassAutoComplete', 'ngToast'])
    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {  
        $urlRouterProvider.otherwise('/');
        
        $stateProvider    
            .state('home', {
                url : '/',
                views : {
                    '' : {
                        templateUrl : 'partials/default.ejs',
                        controller : 'DefaultCtrl'          
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
    .config(['ngToastProvider', function(ngToast) {
        ngToast.configure({
          
          horizontalPosition: 'center'
          
        });
    }])
    .directive('navBar', function() {
        return {
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
    .directive('myBlur', function() {
        return {
            restrict : 'A',
            link : function(scope, element, attributes){
                element.bind('blur', function(){
                    scope.$apply(attributes.myBlur);
                });
            }
        };
    })
    .directive('initializeTooltip', function() {
        return {
            restrict: 'A',
            link: function(scope, element) {
                element.tooltip({
                    trigger : 'hover'
                });
            }
        }
    })
    .directive('preventBackspace', function(){ // prevent pressing backspace key from navigating to previous page 
        var rx = /INPUT|SELECT|TEXTAREA/i;

        return {
            restrict : 'A',
            link : function(scope, element, attributes) {
                element.bind('keydown', function (e){

                    if(e.which == 8 ){ //keycode for Backspace
                        
                        if(!rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly ){
                            e.preventDefault();
                            element.modal('hide');
                            
                        }
                    }
                })
            }
        }
    })
    .directive('preventDoubleclick', function ($timeout) {
    var delay = 500;   // min milliseconds between clicks

        return {
            restrict: 'A',
            priority: -1,   // cause out postLink function to execute before native `ngClick`'s
                            // ensuring that we can stop the propagation of the 'click' event
                            // before it reaches `ngClick`'s listener
            link: function (scope, elem) {
                var disabled = false;

                function onClick(evt) {
                    if (disabled) {
                        evt.preventDefault();
                        evt.stopImmediatePropagation();
                    } else {
                        disabled = true;
                        $timeout(function () { disabled = false; }, delay, false);
                    }
                }

                scope.$on('$destroy', function () { elem.off('click', onClick); });
                elem.on('click', onClick);
            }
        };
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
    .factory('userDataFactory', function(){
        var userDataObj = {};
        return {
            get : function () {  
                return userDataObj;
            },
            set : function (newUserObj) {
                userDataObj = newUserObj;
            }
        }
    })
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
    .service('validDate', function(){
        var date_regex = /^20[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
        this.check = function(dateString){
            return date_regex.test(dateString);  
        }
    })
    .service('httpService', function ($http, $q) {  
        function getData(url){
            var request = $http({
                method : 'get',
                url : url
            });
            return (request.then(handleSuccess, handleError));
        }
        function putData(url, data){
            var request = $http({
                method : 'put',
                url : url,
                data : data
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
            getData : getData,
            putData : putData
        })
    })
    .service('userTenderData', function () { 
        
        this.get = function (tenderId, tenderArrays){
                
                //console.log('TenderId %s', tenderId);
                var result = null;
                var foundTender = false; //hack to break out of forEach
                angular.forEach(tenderArrays, function(tender){
                    if(!foundTender){
                        if(angular.equals(tenderId, tender._id)){
                            //console.log('Match: Tender id %s', tender._id);
                            result = tender;
                            foundTender = true;
                        }
                    }   
                });
                return result;
        }
    })
    .service('userCompetitorInfo', function(){
        this.get = function (competitorID, competitorArray){
            var result;
            angular.forEach(competitorArray, function(competitor){
                if(angular.equals(competitorID, competitor._id)){
                    result = competitor;
                }
            });
            return result;
        }
    })
    .service('toast', function(){
        "use strict";

        var elem,
            hideHandler,
            that = {};

        that.init = function(options) {
            elem = $(options.selector);
        };

        that.show = function(text) {
            clearTimeout(hideHandler);

            elem.find("span").html(text);
            elem.delay(200).fadeIn().delay(4000).fadeOut();
        };

        return that;
    })
    .controller('topController', ['$scope', '$location', 'httpService', 'userDataFactory', function ($scope, $location, httpService, userDataFactory) {  
        $location.path('/');
        
        // User Tender Data
        loadUserData('/User');
        //Load User data
        function loadUserData(url) {
            httpService.getData(url).then(function (userData) {
                userDataFactory.set(userData);
            })
        };

        // update watchlist, paticipated and tags count badges on navbar
        $scope.$watch(
            function(){
                return userDataFactory.get();
            },
            function(userData){
                if(!angular.equals({}, userData)){
                    $scope.myTenderCount = function(){
                        var tags = 0;
                        var partCount = 0;
                        angular.forEach(userData.tenders, function(tender){
                            tags += tender.userTags.length;
                            if(tender.participationInfo.quotation) partCount++;
                        })
                        return {
                            watching : userData.tenders.length,
                            tags : tags,
                            participated : partCount
                        }
                    }
                }
            }
        );

        
    }])
    .controller('FooterCtrl', function($scope) {
        $scope.currentYear = new Date().getFullYear();
    })
    .controller('TenderDetailCtrl', ['$scope', 'tenderFactory', '$state', 'userSearchField', 'daysDifference', 'tenderText', 'userDataFactory', 'httpService', 'userTenderData', 'validDate', 'userCompetitorInfo', '$filter', 'ngToast', function ($scope, tenderFactory, $state, userSearchField, daysDifference, tenderText, userDataFactory, httpService, userTenderData, validDate, userCompetitorInfo, $filter, ngToast) {  
        
        $scope.$state = $state;
        
        //$scope.userData = userDataFactory.get();
        //$scope.tenderDetail = tenderFactory.get();
        
        //$scope.tagInput = false;
        //$scope.alertTag = false;
        
        /* Form save events */
        //$scope.enableSave = false;
        // $scope.$watch("userTags.length", function(newValue){
        //     if(newValue){
        //         $scope.enableSave = true;
        //     }
        // })
        // $scope.$watch("notify", function(newValue, oldValue){
        //     if(newValue != oldValue){
        //         $scope.enableSave = true;
        //     }
        // })
        
        //Watch for changes in tag input especially after rectifying duplicate error
        $scope.$watch(
            "tagText",
            function(newValue){
                if($scope.alertTag) $scope.alertTag = false;
        });
        
        $scope.addTag = function () {  
            $scope.enableSave = true;
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
            $scope.enableSave = true;
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
                
                if(newValue === 'home.detail'){

                    $scope.deleteAllPart = false; // delete all paticipation information
                    $scope.bidInfoForm = false; //Keep bid information form from displaying afer switching views
                    $scope.enableSave = false;
                    $scope.tagText = null;
                    $scope.tagInput = false;
                    $scope.alertTag = false;
                    $scope.hasTenderInfo = false; //does user has information for this tender previously saved
                    $scope.hasPartInfo = false; //does the current listing has user's participation information

                    //Initialize bid participation form elements
                    $scope.competitor = {};
                    $scope.editCompFormInfo = {}; // update competitor's information

                    //clean up user bid information form
                    $scope.resetBidPartForm();
                    $scope.resetCompForm();
                    
                    $scope.toggleMore = false; //toggle competitor's panel accordion 
                    
                    // Get data
                    $scope.userData = userDataFactory.get();
                    $scope.tenderDetail = tenderFactory.get();

                    $scope.competitorsList = $scope.userData.competitors; //get the list of pre defined competitors
                    
                    var tender = userTenderData.get($scope.tenderDetail._id, $scope.userData.tenders);
                    // If corresponding tender data info is found
                    if(tender){
                        $scope.hasTenderInfo = true;
                        populateUserTenderInfo(tender);
                    }
                    else{
                        // reset values
                        resetTagsNotesNotification();
                    }
                }
                
                angular.element(document.querySelector('.modal')).modal('hide'); //hide modal
                angular.element(document.querySelector('#competitors')).modal('hide'); //hide modal
            }   
        );

        function resetTagsNotesNotification(){
            $scope.notes = 'Type your notes here !'
            $scope.userTags = [];

            $scope.notify = false;
            $scope.notifyOptions["oneday"] = true;
            $scope.notifyOptions["threedays"] = false;
            $scope.notifyOptions["fivedays"] = false;
            $scope.notifyOptions["sevendays"] = false;
        }
        
        // populate using existing user's tender information
        function populateUserTenderInfo(tender){
            $scope.notes = tender.notes;
            $scope.userTags = angular.copy(tender.userTags); //pass by value or else modifies source as well
            $scope.notify = tender.preferences.notify;
            $scope.notifyOptions = angular.copy(tender.preferences.notifyFrequency);

            if(tender.hasOwnProperty('participationInfo')) {
                
                if(tender.participationInfo.hasOwnProperty('quotation')){
                    $scope.hasPartInfo = true;
                    $scope.partInfo = tender.participationInfo;
                    if($scope.partInfo.competitorsBid.length){
                        $scope.competitorsBid = angular.copy($scope.partInfo.competitorsBid);
                    }
                }
                else $scope.hasPartInfo = false;
            }
        }
        
        // Dropdown suggest 
        function suggestCompetitor(term){
            var q = term.toLowerCase().trim(), results = [];

            for (var i = 0; i < $scope.competitorsList.length; i++) {
                var compList = $scope.competitorsList[i];
                if (compList.name.toLowerCase().indexOf(q) !== -1)
                
                    results.push({ label: compList.name, value: compList.name, obj: compList});

            }
            return results;
        };
        $scope.autocomplete_options = {
            suggest : suggestCompetitor,
            on_select : function(selected){
                $scope.selectCompetitor = selected.obj;
                $scope.populateComp(); 
            }
        };

        // Watch for changes in competitor's name input
        $scope.updateComp = function(){
            if($scope.selectCompetitor){
                $scope.selectCompetitor = undefined;
                $scope.populateComp();
            }           
        }
        // If competitor already exists and user doesn't select, coerse
        $scope.forceSelectComp = function (term){
            if(term){
                var q = term.toLowerCase().trim();
                for (var i = 0; i < $scope.competitorsList.length; i++) {
                    var compList = $scope.competitorsList[i];
                    if (compList.name.toLowerCase().indexOf(q) !== -1){
                        $scope.selectCompetitor = compList;
                        $scope.populateComp();
                        break;
                    }
                }
            }
        }

        // Populate competitor's information using suggest or reset 
        $scope.populateComp = function(){
            if($scope.selectCompetitor){
                $scope.competitor.name = $scope.selectCompetitor.name;
                $scope.competitor.address = $scope.selectCompetitor.address;
                $scope.competitor.person = $scope.selectCompetitor.contactPerson;
                $scope.competitor.phone = $scope.selectCompetitor.phone;
                   
            }
            else{
                $scope.competitor.address = null;
                $scope.competitor.person = null;
                $scope.competitor.phone = null;
            }
        }

        // Check to see if competitor bidding information already exists for the listing
        $scope.compExists = function(compName){
            var exists = false;

            $scope.competitorsBid.forEach(function(competitor){
                if(compName === competitor.name) exists = true;
            })

            return exists;
        }


        // Competitor's bid form action
        
        $scope.saveCompForm = function(url){

            if($scope.editCompFormInfo.disable){ //We just want to update competitor's bid information
                var index = $scope.editCompFormInfo.index;
                $scope.competitorsBid[index].quotation = $scope.competitor.quotation;
                $scope.competitorsBid[index].currency = $scope.competitor.currency;
                $scope.competitorsBid[index].vat = $scope.competitor.vat;
                $scope.competitorsBid[index].security = $scope.competitor.bgAmount ? $scope.competitor.bgAmount : undefined;
                $scope.competitorsBid[index].validity = $scope.competitor.bgValidity ? $scope.competitor.bgValidity : undefined;
                $scope.competitorsBid[index].issuer = $scope.competitor.bankName ? $scope.competitor.bankName : undefined;
                $scope.competitorsBid[index].manufacturer = $scope.competitor.manufacturer ? $scope.competitor.manufacturer : undefined;
                $scope.competitorsBid[index].remarks = $scope.competitor.remarks ? $scope.competitor.remarks : undefined;

                $scope.resetCompForm();
            }

            else if($scope.selectCompetitor){
                addCompetitorBid($scope.selectCompetitor._id);
            }

            else { //if new competitor's information is provided insert it into database first
                    var data = {
                    'name' : $scope.competitor.name
                    , 'address' : $scope.competitor.address ? $scope.competitor.address : undefined
                    , 'contactPerson' : $scope.competitor.person ? $scope.competitor.person : undefined
                    , 'phone' : $scope.competitor.phone ? $scope.competitor.phone : undefined
                };

                httpService.putData('/Update/User/Competitor', data).then(function (userData) {
                    
                    ngToast.create({
                        className : 'info',
                        content : 'New competitor <strong>' + data.name + '</strong> is created',
                        timeout : 6000,
                        dismissButton : true
                    });
                    addCompetitorBid(userData.competitors[userData.competitors.length-1]._id);
                    userDataFactory.set(userData);

                });
            }
            angular.element(document.querySelector('#competitors')).modal('hide'); //hide modal

            function addCompetitorBid(competitorID){
                $scope.competitorsBid.push({
                    '_id' : competitorID
                    , 'name' : $scope.competitor.name
                    , 'quotation' : $scope.competitor.quotation
                    , 'currency' : $scope.competitor.currency
                    , 'vat' : $scope.competitor.vat
                    , 'security' : $scope.competitor.bgAmount ? $scope.competitor.bgAmount : undefined
                    , 'validity' : $scope.competitor.bgValidity ? $scope.competitor.bgValidity : undefined
                    , 'issuer' : $scope.competitor.bankName ? $scope.competitor.bankName : undefined
                    , 'manufacturer' : $scope.competitor.manufacturer ? $scope.competitor.manufacturer : undefined
                    , 'remarks' : $scope.competitor.remarks ? $scope.competitor.remarks : undefined
                });
                $scope.resetCompForm(); //need to wait for http call to return before resetting
            }
        };

        

        // Main SAVE action of the tenderview page
        $scope.saveUserForm = function(){
            //alert(JSON.stringify($scope.notifyOptions));
            var url = '/Update/User/TenderData';
            var data = {
                '_id' : $scope.tenderDetail._id,
                'preferences' : {
                    'notify' : $scope.notify,
                    'notifyFrequency' : $scope.notifyOptions
                },
                'userTags' : $scope.userTags,
                'notes'  : $scope.notes,
            };

            if($scope.bidInfoForm){
                data.participationInfo = {
                    'quotation' : $scope.quotation
                    , 'currency' : $scope.userCurrency
                    , 'vat' : $scope.vat
                    , 'security' : $scope.bgAmount ? $scope.bgAmount : undefined
                    , 'validity' : $scope.bgValidity ? $scope.bgValidity : undefined
                    , 'issuer' : $scope.bankName ? $scope.bankName : undefined
                    , 'manufacturer' : $scope.manufacturer ? $scope.manufacturer : undefined
                    , 'remarks' : $scope.remarks ? $scope.remarks : undefined
                    , 'competitorsBid' : $scope.competitorsBid.length ? $scope.competitorsBid : []
                };
            }
            else if($scope.hasPartInfo){
                data.participationInfo = angular.copy($scope.partInfo);
            }
            else if($scope.deleteAllPart){
                data.participationInfo = {};
            }

            
            // if($scope.competitorsBid){
            //     console.log('Competitor: ' + JSON.stringify($scope.competitorsBid));
            //     data.$scope.competitorsBid.push($scope.competitorsBid);
            //     $scope.competitorsBid = undefined;
            // }
            
            httpService.putData(url, data).then(function (userData) {  
                
                ngToast.create({
                    content : 'Your information for this listing has been updated',
                    timeout : 6000,
                    dismissButton : true
                });
                userDataFactory.set(userData);

                $scope.hasTenderInfo = true;
                $scope.enableSave = false;
                $scope.resetBidPartForm();
                populateUserTenderInfo(data);
            });
        };

        // Populate user's bid information form with previous data 
        $scope.populateBidInfo = function(){
            $scope.userCurrency = $scope.partInfo.currency;
            $scope.quotation = $scope.partInfo.quotation;
            $scope.vat = $scope.partInfo.vat;
            $scope.bgAmount = $scope.partInfo.security;
            $scope.bgValidity = $filter('date')($scope.partInfo.validity, 'yyyy-MM-dd');
            $scope.bankName = $scope.partInfo.issuer;
            $scope.manufacturer = $scope.partInfo.manufacturer;
            $scope.remarks = $scope.partInfo.remarks;
        }

        //Reset bid information form
        $scope.resetBidPartForm = function(){
            
            $scope.userCurrency =  'NRs';
            $scope.quotation =  null;
            $scope.vat =  true;
            $scope.bgAmount =  null;
            $scope.bgValidity =  null;
            $scope.bankName =  null;
            $scope.manufacturer =  null;
            $scope.remarks =  null;

            if($scope.hasPartInfo){
                if($scope.partInfo.competitorsBid.length){
                    $scope.competitorsBid = angular.copy($scope.partInfo.competitorsBid);
                }
            }
            else $scope.competitorsBid = []; // holds competitor's bid for current listing

            $scope.userBidPartForm.$setPristine();
            $scope.userBidPartForm.quotation.$setPristine();
            
        };

        //Reset competitor's form
        $scope.resetCompForm = function(){

            $scope.editCompFormInfo.disable = false;
            $scope.selectCompetitor = undefined;
            
            $scope.competitor.name = null;
            $scope.competitor.address = null;
            $scope.competitor.person = null;
            $scope.competitor.phone = null;

            $scope.competitor.quotation = null;
            $scope.competitor.currency = 'NRs'; //ng-init is not working when ng-model is object notation
            $scope.competitor.vat = true;
            $scope.competitor.bgAmount = null;
            $scope.competitor.bgValidity = null;
            $scope.competitor.bankName = null;
            $scope.competitor.manufacturer = null;
            $scope.competitor.remarks = null;

            $scope.compBidPartForm.$setPristine();
            $scope.compBidPartForm.compQuotation.$setPristine();
            $scope.compBidPartForm.compName.$setPristine();
        }


        // Edit competitor's bidding information
        $scope.editCompForm = function(index){
            var competitor = $scope.competitorsBid[index];
            var competitorInfo = userCompetitorInfo.get(competitor._id, $scope.competitorsList);
            $scope.editCompFormInfo.disable = true;
            $scope.editCompFormInfo.index = index;
            
            $scope.competitor.name = competitorInfo.name;
            $scope.competitor.address = competitorInfo.address;
            $scope.competitor.person = competitorInfo.contactPerson;
            $scope.competitor.phone = competitorInfo.phone;

            $scope.competitor.quotation = competitor.quotation;
            $scope.competitor.currency = competitor.currency;
            $scope.competitor.vat = competitor.vat;
            $scope.competitor.bgAmount = competitor.security;
            $scope.competitor.bgValidity = $filter('date')(competitor.validity, 'yyyy-MM-dd');
            $scope.competitor.bankName = competitor.issuer;
            $scope.competitor.manufacturer = competitor.manufacturer;
            $scope.competitor.remarks = competitor.remarks;
        }
        
        // Watch for changes in information and update respectively
        $scope.$watchCollection( 
            function () {  
                return tenderFactory.get();
            },
            function(newValue){
                $scope.tenderDetail = newValue;
        });
        $scope.$watchCollection(
            function(){
                return userDataFactory.get();
            },
            function(newValue){
                $scope.userData = newValue;
                $scope.competitorsList = $scope.userData.competitors; //update competitors list
            }
        );


        /* Functions */
        $scope.disableCompSave = function(isName, isQuote){

            if(isName && isQuote){
                if($scope.competitor.bgValidity){
                    return !validDate.check($scope.competitor.bgValidity);
                }
                if($scope.selectCompetitor){
                    return $scope.compExists($scope.selectCompetitor.name); //check if competitor already exists
                }
                return false;
            }
            return true;
        }

        $scope.disableSave = function(isQuote){
            if ($scope.enableSave || $scope.bidInfoForm){
                if ($scope.bidInfoForm&&!isQuote) {
                    return true;
                }
                if($scope.bidInfoForm&&isQuote&&$scope.bgValidity){
                    return !validDate.check($scope.bgValidity);
                }
                return false;
            };
            return true;
        }

        //Delete all information for participation
        $scope.deleteAllPartInfo = function(){

            bootbox.confirm("Delete your participation information for this listing ? <br>(<em>This cannot be undone</em>)", function(result){
                if(result){
                    $scope.hasPartInfo=false;
                    $scope.deleteAllPart=true;
                    $scope.saveUserForm();
                }
            })      
        }

        // Unwatch listing
        $scope.deleteAllTenderInfo = function(){

            bootbox.confirm("Remove from watchlist ? <br>(<em>All your information for this listing will be permanently deleted</em>)", function(result){
                if (result){
                    var url = '/Delete/User/TenderData';
                    var data = {
                        _id : $scope.tenderDetail._id
                    }

                    httpService.putData(url, data).then(function (userData) {  
                        
                        ngToast.create({
                            className : 'danger',
                            content : 'Listing removed from your watchlist',
                            timeout : 6000,
                            dismissButton : true
                        });

                        userDataFactory.set(userData);
                        resetTagsNotesNotification();
                        
                        $scope.hasTenderInfo = false;
                        $scope.hasPartInfo = false;
                        $scope.enableSave = false;

                        $scope.resetBidPartForm();
                        
                    });
                }
            })          
        }

        $scope.checkDate = function (dateString){
            return validDate.check(dateString);
        }

        $scope.goBack = function () {  
            if ($scope.enableSave || $scope.bidInfoForm) {
                bootbox.confirm({
                    size : 'small',
                    message : 'Discard changes ?',
                    callback :  function(result){
                                    if(result) $state.go('home');
                                }
                })           
            }
            else $state.go('home');
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
        
        // notification option dropdown list validity check
        $scope.notifyOptionsValid = function (subDate, notifyDate) {
            return daysDifference.diffDays(subDate) > notifyDate;
        }
        
        $scope.bidPart = function(subDate){
            if($scope.isExpired(subDate)) $scope.bidInfoForm = true;
            return;
        }

        // Remove an item with given index from array 
        $scope.removeFromArray = function(index, array){

            bootbox.confirm({
                size : 'small',
                message : 'Delete from the list ?',
                callback : function(result){
                                if(result) {
                                    $scope.$apply(function (){
                                        array.splice(index, 1);
                                    });
                                }
                            }
            })  
        }
      
    }])
    .controller('DefaultCtrl', function($scope, $state){
        $scope.$state = $state;
    })
    .controller('TenderAppCtrl', ['$scope', 'httpService', 'tenderFactory', '$state', 'userSearchField', 'daysDifference', 'tenderText', '$window', 'userDataFactory', function($scope, httpService, tenderFactory, $state, userSearchField, daysDifference, tenderText, $window, userDataFactory) {
        
        
        
        $scope.$state = $state;
        $scope.loadingData = true;
        
        //userSearch field
        $scope.$watchCollection(
            function () {  
                return userSearchField.searchTerm.get();
            }
            ,
            function (newValue) {  
                $scope.userSearch = newValue;
            }
        );
        
        $scope.clearSearch = function(){
            $scope.userSearch = '';
            userSearchField.searchTerm.set('');
        }
        
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
            $window.scrollTo(0, 0);
        }
        
        //Decalre session user
        $scope.user;
        
        
        // Default view
        loadTenderData('/Active');
        //Load Tender data
        function loadTenderData(url) {
            $scope.loadingData = true;
            httpService.getData(url).then(function (tenders) {  
                 $scope.tenderlist = tenders;
                 $scope.loadingData = false;
            })
        };
        
        
        
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
                httpService.getData('/'+ givenView).then(function(tenders) {
                    $scope.tenderlist = tenders;
                    $scope.loadingData = false;
                });
            }
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


