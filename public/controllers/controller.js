//$scope is the glue between application controller and the view
var tenderApp = angular
    .module('tenderApp', ['angularUtils.directives.dirPagination', 'angular-loading-bar', 'ui.router', 'angularjs-datetime-picker', 'ngSanitize', 'MassAutoComplete', 'ngToast', 'puElasticInput'])
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

            .state('about', {
                url : '/about',
                templateUrl : 'partials/about.ejs',
                controller : 'AboutCtrl'
            })
            
            .state('addlisting', {
                url : '/addlisting',
                templateUrl : 'partials/addlisting.ejs',
                controller : 'AddlistingCtrl',
                params : {
                    'mode' : 'add' // {add, edit}
                }
                
            })

            .state('competitors', {
                url : '/competitors',
                templateUrl : 'partials/competitors.ejs',
                controller : 'CompetitorsCtrl',
                params : {
                    'uncollapse' : null // show competitor's info when directly linked
                }
                
            })

            .state('tags', {
                url : '/tags',
                templateUrl : 'partials/tags.ejs',
                controller : 'TagsCtrl'
                
            })

            .state('settings', {
                url : '/settings',
                templateUrl : 'partials/settings.ejs',
                controller : 'SettingsCtrl'
                
            })

            //dummy state used for browser back button functionality only
            .state('home.detail', { 
                url : ':id'
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
            templateUrl: 'partials/navbar.ejs',
            controller: 'NavCtrl'
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
    .directive('myBlur', function() { //execute on element blur
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
    .directive('setFocus', function(){ // used in addlisting for psudo tag textarea simulation
        return function (scope, element, attributes){

            inputEl = angular.element(element[0].querySelector('#tagText'));
            element.bind('click', function() {
                /* Act on the event */
                inputEl.focus();
                element.css({
                    boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(102, 175, 233, 0.6)',
                    borderColor: '#66afe9'
                });
            });
            inputEl.bind('blur', function() {
                /* Act on the event */
                element.css({
                    outline: 'none',
                    boxShadow : 'inset 0 1px 1px rgba(0,0,0,.075)',
                    border: '1px solid #cccccc'
                    
                });
            });
        }
    })
    .directive('compareTo', function() {
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
        };// compare two input fields if they match (eg. passwords)
    })
    .factory('userDataFactory', function() { //holds comprehensive information about user's tenders
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
    .factory('userTenders', function() { //holds user's watching tender's information
        
        function createUserTenderObj(){
            return {
                tags : {
                            list : [],
                            count : 0
                },
                participated : {
                            list : [],
                            count : 0
                },
                watching : {
                            list : [],
                            count : 0
                },
                myListings : {
                            list : [],
                            count : 0
                }
            };
        }

        var userTenderObj = createUserTenderObj();

        return {
            get : function () {
                return userTenderObj;
            },
            set : function (userData) {

                userTenderObj = createUserTenderObj();

                angular.forEach(userData.tenders, function(tender){

                    angular.forEach(tender.userTags, function(userTag){
                        if(userTenderObj.tags.list.indexOf(userTag)==-1){//check if tag already exists for user
                            userTenderObj.tags.list.push(userTag);
                            userTenderObj.tags.count++ ; 
                        } 
                    });
                    
                    if(tender.participationInfo.quotation) {
                        userTenderObj.participated.list.push(tender);  
                        userTenderObj.participated.count++;
                    } 

                });

                userTenderObj.watching.list = userData.tenders;
                userTenderObj.watching.count = userData.tenders.length;

                userTenderObj.myListings.list = userData.myListings;
                userTenderObj.myListings.count = userData.myListings.length;

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
    .factory('myTenderList', function(){ //user current tenders list eg.active, watching
        var tenderList = [];
        var currentView = ''; //eg. Active, Watchlist

        return {
            get : function () {
                return tenderList;
            },
            set : function (tenderArray){
                tenderList = tenderArray;
            },
            getView : function () {
                return currentView;
            },
            setView : function (view){
                currentView = view;
            } 
        }
    })
    .factory('tenderFactory', function(){ //return tender instance for tenderView
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
        function postData(url, data){
            var request = $http({
                method : 'post',
                url : url,
                data : data
            });
            return (request.then(handleSuccess, handleError));
        }
        function deleteData(url, data){
            var request = $http({
                method : 'delete',
                url : url,
                data : data,
                headers : {"Content-Type": "application/json;charset=utf-8"} //hack to put json data in req.body
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
            putData : putData,
            postData : postData,
            deleteData : deleteData
        })
    })
    .service('userTenderData', function () { // check if currently viewing tender is in user's list
        
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
    .controller('topController', ['$scope', '$location', '$state', 'httpService', 'userDataFactory', 'userTenders', 'myTenderList', 'ngToast', function ($scope, $location, $state, httpService, userDataFactory, userTenders, myTenderList, ngToast) {  
        $location.path('/');

        //Declare session user
        //$scope.user;

        // Password reset toast
        $scope.$watch(
            'message',
            function(newValue){
                if(newValue&&newValue!=='false'){
                    ngToast.create({
                        className : 'success',
                        content : newValue,
                        timeout : 6000,
                        dismissButton : true
                    });
                }   
            }
        )
        
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

                    userTenders.set(userData); //update user's watchlist with new data

                    $scope.myTender = function(){
                        return userTenders.get();
                    }
                }
            }
        );

        // Navbar links
        $scope.setView = function(view){
            myTenderList.setView(view);
            $state.go('home', {'#' : 'postings'});
        }

    }])
    .controller('NavCtrl', ['$scope', 'userDataFactory', function($scope, userDataFactory) {
        $scope.user = JSON.parse($scope.user);

        $scope.$watch(
            function(){
                return userDataFactory.get();
            },
            function(newValue){
                $scope.userData = newValue;
            }
        )

        $scope.userData = userDataFactory.get();

    }])
    .controller('FooterCtrl', function($scope) {
        $scope.currentYear = new Date().getFullYear();
    })

    .controller('TenderDetailCtrl', ['$scope', 'tenderFactory', '$state', 'userSearchField', 'daysDifference', 'tenderText', 'userDataFactory', 'httpService', 'userTenderData', 'validDate', 'userCompetitorInfo', '$filter', 'ngToast', 'myTenderList', '$location', function ($scope, tenderFactory, $state, userSearchField, daysDifference, tenderText, userDataFactory, httpService, userTenderData, validDate, userCompetitorInfo, $filter, ngToast, myTenderList, $location) {  
        
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

                    $scope.isMyListing = false;
                    if ($scope.tenderDetail.owner){
                        if($scope.tenderDetail.owner === $scope.user._id)
                            $scope.isMyListing = true;
                    }

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
        
        $scope.saveCompForm = function(){

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

                httpService.putData('/Create/User/Competitor', data).then(function (userData) {
                    
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
                'item' : $scope.tenderDetail.item,
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

                    if (myTenderList.getView() === "Participated") {
                        var tenderList = myTenderList.get();
                        var unWatchIndex = tenderList.map(function(tender) {return tender._id}).indexOf($scope.tenderDetail._id);
                        tenderList.splice(unWatchIndex, 1);
                        myTenderList.set(tenderList);   
                    };
                }
            })      
        }

        // Watch listing
        $scope.watchTender = function(){
            
            var url = '/Update/User/TenderData';
            var data = {
                '_id' : $scope.tenderDetail._id
            }

            httpService.putData(url, data).then(function (userData) {  
                
                ngToast.create({
                    content : 'This listing has been added to your watching list',
                    timeout : 6000,
                    dismissButton : true
                });
                userDataFactory.set(userData);

                $scope.hasTenderInfo = true;
            });
        }

        // Unwatch listing
        $scope.deleteAllTenderInfo = function(){

            bootbox.confirm("Remove from watchlist ? <br>(<em>All your data including tags, notes and participation information for this listing will be permanently deleted</em>)", function(result){
                if (result){
                    var url = '/Delete/User/TenderData';
                    var data = {
                        _id : $scope.tenderDetail._id
                    }

                    httpService.putData(url, data).then(function (userData) {  
                        
                        ngToast.create({
                            className : 'danger',
                            content : 'This listing has been removed from your watching list',
                            timeout : 6000,
                            dismissButton : true
                        });

                        // Update watching tender list factory (used for table view )
                        if (myTenderList.getView() === "Watchlist" || myTenderList.getView() === "Participated") {
                            var tenderList = myTenderList.get();
                            var unWatchIndex = tenderList.map(function(tender) {return tender._id}).indexOf($scope.tenderDetail._id);
                            tenderList.splice(unWatchIndex, 1);
                            myTenderList.set(tenderList);   
                        };
                        

                        // update user data
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

        // Edit user created listing
        $scope.editListing = function(){
            $state.go('addlisting', { 'mode' : 'edit' });
            ngToast.dismiss();

        }

        // Delete user created listing and remove all corresponding data if available
        $scope.deleteListing = function(){

            bootbox.confirm("Delete this listing ? <br>(<em>All your data including tags, notes and participation information for this listing will be permanently deleted</em>)", function(result){
                if (result){
                    var data = {
                        _id : $scope.tenderDetail._id
                    }
                    httpService.deleteData('/Delete/User/Tender', data).then(function (userData){
                        ngToast.create({
                            className : 'danger',
                            content : 'Listing <strong>' + $scope.tenderDetail.item + '</strong> and all your corresponding data deleted from the system',
                            timeout : 6000,
                            dismissButton : true
                        });
                        // update user data
                        userDataFactory.set(userData);
                    });

                    // if ($scope.hasTenderInfo) { // if tender info for this listing is available
                    //     httpService.putData('/Delete/User/TenderData', data).then(function (userData) {  
                    //         ngToast.create({
                    //             className : 'success',
                    //             content : 'Your watchlist has been updated',
                    //             timeout : 6000,
                    //             dismissButton : true
                    //         });
                    //         // update user data
                    //         userDataFactory.set(userData);
                    //     });   
                    // }

                    // remove this listing from current tender list
                    var tenderList = myTenderList.get();
                    var unWatchIndex = tenderList.map(function(tender) {return tender._id}).indexOf(data._id);
                    tenderList.splice(unWatchIndex, 1);
                    myTenderList.set(tenderList);   

                    $state.go('^', {reload : true});
                    $location.path('/').replace();
                    //history.back();

                }
            }) 
        }

        $scope.viewCompInfo = function(competitorId){
            $state.go('competitors', { 'uncollapse' : competitorId});
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

    .controller('AddlistingCtrl', ['$scope', '$state', '$window', 'validDate', 'httpService', 'ngToast', 'userDataFactory', 'tenderFactory', '$stateParams', '$filter', function ($scope, $state, $window, validDate, httpService, ngToast, userDataFactory, tenderFactory, $stateParams, $filter){

        $scope.mode = $stateParams.mode;

        /* Form Validation */
        $scope.checkDate = function (dateString){
            return validDate.check(dateString);
        }
        $scope.dateConsistent = function(pubDate, subDate){
            
            if(validDate.check(pubDate)&&validDate.check(subDate)) return pubDate <= subDate;
            return true;
        };
        $scope.dateInvalid = function (pubDate, subDate){
            
            if(validDate.check(pubDate)&&validDate.check(subDate)&&pubDate<=subDate) return false;
            return true;
        }

        $scope.listingType = "Tender";


        /*** Tag Input **/
        $scope.userTags = [];
        //Watch for changes in tag input especially after rectifying duplicate error
        $scope.$watch( //addlistingctrl
            "tagText",
            function(newValue){
                if($scope.alertTag) $scope.alertTag = false;
        });
        
        $scope.addTag = function () {  //addlistingctrl
            var newTag = $scope.tagText.toLowerCase();
            if(newTag.length){
                if($scope.userTags.indexOf(newTag) !== -1 ){
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
      
        $scope.deleteTag = function (event, tag) { //addlistingctrl
            event.preventDefault(); // since our anchor is inside a button
            event.stopPropagation(); // prevent event from bubbling up
            var key = $scope.userTags.indexOf(tag);
            if($scope.userTags.length && key !== -1){
                $scope.userTags.splice(key, 1);
            }
        }

        var tenderDetail;
        if($stateParams.mode === 'edit'){
            tenderDetail = tenderFactory.get();

            $scope.tenderCaller = tenderDetail.caller;
            $scope.tenderTitle = tenderDetail.item;
            $scope.pubDate = $filter('date')(tenderDetail.pubDate, 'yyyy-MM-dd');
            $scope.subDate = $filter('date')(tenderDetail.subDate, 'yyyy-MM-dd');
            $scope.pubDaily = tenderDetail.pubDaily;
            $scope.listingType = tenderDetail.remarks;
            $scope.userTags = tenderDetail.category;
        }

        $scope.goBack = function(){
            history.back();
        }

        $scope.editListing = function(){
            var url = '/Edit/User/Tender';
            var data = {
                '_id' : tenderDetail._id,
                'owner' : $scope.user._id,
                'caller' : $scope.tenderCaller,
                'item' : $scope.tenderTitle,
                'pubDate'  : $scope.pubDate,
                'subDate' : $scope.subDate,
                'pubDaily' : $scope.pubDaily,
                'remarks' : $scope.listingType,
                'category' : $scope.userTags
            };

            httpService.putData(url, data).then(function (response) {  

                ngToast.create({
                    content : 'Listing for <strong>' + $scope.tenderTitle + '</strong> successfully updated',
                    timeout : 6000,
                    dismissButton : true
                });

                $scope.resetForm();

                // go to new listing detailed view
                tenderFactory.set(data);

                // If there are no user data for this listing, response is null 
                if(response) userDataFactory.set(response);

                $state.transitionTo('home.detail', {id: data._id});
                $window.scrollTo(0, 0);

            });
        }

        $scope.addListing = function(){

            var url = '/Create/User/Tender';
            var data = {
                'owner' : $scope.user._id,
                'caller' : $scope.tenderCaller,
                'item' : $scope.tenderTitle,
                'pubDate'  : $scope.pubDate,
                'subDate' : $scope.subDate,
                'pubDaily' : $scope.pubDaily,
                'remarks' : $scope.listingType,
                'category' : $scope.userTags
            };

            httpService.putData(url, data).then(function (response) {  

                // update user data
                return httpService.putData('/Update/User/Listings', response).then(function (userData){

                    userDataFactory.set(userData);

                    ngToast.create({
                        content : 'Listing for <strong>' + $scope.tenderTitle + '</strong> successfully created',
                        timeout : 6000,
                        dismissButton : true
                    });

                    $scope.resetForm();

                    // go to new listing detailed view
                    tenderFactory.set(response);
                    $state.transitionTo('home.detail', {id: response._id});
                    $window.scrollTo(0, 0);

                })

            });
        }

        $scope.resetForm = function(){

            $scope.tenderCaller = null;
            $scope.tenderTitle = null;
            $scope.pubDate = null;
            $scope.subDate = null;
            $scope.pubDaily = null;
            $scope.listingType = "Tender";
            $scope.userTags = [];

            $scope.addlistingForm.$setPristine();
            $scope.addlistingForm.tenderTitle.$setPristine();
        }
        
    }])

    .controller('CompetitorsCtrl', ['$scope', '$state', '$window', 'userDataFactory', 'tenderFactory', 'httpService', 'ngToast', '$stateParams', '$timeout', function ($scope, $state, $window, userDataFactory, tenderFactory, httpService, ngToast, $stateParams, $timeout) {

        


        // Get user data
        $scope.userData = userDataFactory.get();
        var competitorBiddingList = compParticipationInfoList();
        var existingCompetitors = getCompetitors();

        // Watch for changes in user data
        $scope.$watchCollection(
            function(){
                return userDataFactory.get();
            },
            function(newValue){
                $scope.userData = newValue;
                existingCompetitors = getCompetitors();
                // competitorBiddingList = compParticipationInfoList();
            }
        )

        $scope.toggleMore = false; //toggle competitor's panel accordion

        // function to return array of competitors object with their bidding information
        function compParticipationInfoList(){
            var compBidList = [];

            angular.forEach($scope.userData.tenders, function(tender){
                tender.participationInfo.competitorsBid.map(function(o){

                    var competitor = {};
                    competitor.tenderList = []
                    competitor._id = o._id;

                    var newTender = {};
                    newTender._id = tender._id;
                    newTender.item = tender.item; 

                    competitor.tenderList.push(newTender);

                    var compIdList = compBidList.map(function(ob){return ob._id});
                    var compIndex = compIdList.indexOf(o._id);

                    if(compIndex !== -1){ // if competitor already exists in the list just push new tender info
                        compBidList[compIndex].tenderList.push(newTender);
                    }
                    else {
                        compBidList.push(competitor);
                    }

                });
                
            })
            return compBidList;
        }
        
        

        //get competitor's bidding information
        $scope.getCompBid = function(compId){
            $scope.compHasBiddingInfo = false;
            var compFound = false;
            var compBidList = [];
            angular.forEach(competitorBiddingList, function(value, key){
                if (!compFound){ //hack to break the loop
                    if(angular.equals(value._id, compId)){
                        compBidList = value.tenderList;
                        $scope.compHasBiddingInfo = true;
                        compFound = true;
                    }
                }
            });
            return compBidList;
        }
        
        //get competitor's bidding information
        // $scope.getCompBid = function(compId){
        //     $scope.compHasBiddingInfo = false;
        //     var compBidList = [];
        //     angular.forEach($scope.userData.tenders, function(tender){
        //         angular.forEach(tender.participationInfo.competitorsBid, function(compBid){
                    
        //             if(compBid._id === compId){
                        
        //                 compBidList.push(tender.item);
        //                 $scope.compHasBiddingInfo = true;
        //             }
        //         })
        //     })
        //     //console.log(JSON.stringify(compBidList));
        //     return compBidList;
        // }

        // load tender detail
        $scope.loadTender = function (tenderId) {
            httpService.getData('/Tender/'+tenderId).then(function(tender){
                tenderFactory.set(tender);
                $state.go('home.detail', {id: tender._id});
                $window.scrollTo(0, 0);
            })
        }

        // List of Existing Competitors
        function getCompetitors(){
            return $scope.userData.competitors.map(function(o){
                return o.name.toLowerCase().trim();
            })
        }
        
        $scope.nameValid = true;
        $scope.checkCompName = function(newName){
            var currentCompIndex = existingCompetitors.indexOf($scope.currentCompetitor);
            var newCompIndex = existingCompetitors.indexOf(newName.toLowerCase().trim());
            if(newCompIndex !== currentCompIndex && newCompIndex!== -1){
                $scope.nameValid = false;
                return;
            }
            $scope.nameValid = true;
        }

        //Add Edit Competitor
        $scope.competitor = {};
    
        $scope.populateCompInfoForm = function (competitor){

            $scope.editCompInfoForm = true;
            $scope.currentCompetitor = competitor.name.toLowerCase().trim(); //used for checkCompName()

            $scope.competitor._id = competitor._id;
            $scope.competitor.name = competitor.name;
            $scope.competitor.address = competitor.address;
            $scope.competitor.phone = competitor.phone;
            $scope.competitor.person = competitor.contactPerson;
            
        }
        $scope.resetCompInfoForm = function(){

            $scope.competitor = {};
            $scope.compInfoForm.$setPristine();
            $scope.editCompInfoForm = false;
        }

        $scope.deleteCompetitor = function(competitor){
            var data = {
                _id : competitor._id,
                name : competitor.name
            }

            bootbox.confirm({
                size : 'small',
                message : 'Remove competitor <strong>'+ data.name +'</strong> ?',
                callback :  function(result){
                                if(result){
                                    
                                    httpService.deleteData('/Delete/User/Competitor', data).then(function (userData) {
                                            
                                        ngToast.create({
                                            className : 'danger',
                                            content : 'Competitor <strong>' + data.name + '</strong> deleted',
                                            timeout : 6000,
                                            dismissButton : true
                                        });

                                        userDataFactory.set(userData);
                                    });

                                }
                            }
            })        
  
        }

        $scope.addCompetitor = function () {
            var data = {
                name : $scope.competitor.name,
                address : $scope.competitor.address,
                contactPerson : $scope.competitor.person,
                phone : $scope.competitor.phone
            }
            httpService.putData('/Create/User/Competitor', data).then(function (userData) {
                    
                ngToast.create({
                    className : 'info',
                    content : 'New competitor <strong>' + data.name + '</strong> created',
                    timeout : 6000,
                    dismissButton : true
                });

                $scope.resetCompInfoForm();

                userDataFactory.set(userData);
                angular.element(document.querySelector('#competitorInfoForm')).modal('hide'); //hide modal
            });
        }

        $scope.updateCompInfo = function(){
            var data = {
                _id : $scope.competitor._id,
                name : $scope.competitor.name,
                address : $scope.competitor.address,
                contactPerson : $scope.competitor.person,
                phone : $scope.competitor.phone
            }
            httpService.putData('/Update/User/Competitor', data).then(function (userData) {
                    
                ngToast.create({
                    className : 'info',
                    content : 'Information for competitor <strong>' + data.name + '</strong> updated',
                    timeout : 6000,
                    dismissButton : true
                });

                $scope.resetCompInfoForm();

                userDataFactory.set(userData);
                angular.element(document.querySelector('#competitorInfoForm')).modal('hide'); //hide modal
            });
        }

        $scope.collap = $stateParams.uncollapse; // direct competitor view link - uncollapse 
        

    }])

    .controller('TagsCtrl', ['$scope', 'tenderFactory', 'userDataFactory', 'httpService', '$state', '$window', function($scope, tenderFactory, userDataFactory, httpService, $state, $window){

        var userTenderList = userDataFactory.get().tenders;

        $scope.tagLinkList = tagLinkList(); // initialize

        $scope.setTagList = function(tenderList){
            $scope.tagTenderList = tenderList;
        }

        $scope.loadTender = function (tenderId) {
            httpService.getData('/Tender/'+tenderId).then(function(tender){
                tenderFactory.set(tender);
                $state.go('home.detail', {id: tender._id});
                $window.scrollTo(0, 0);
            })
        }

        // list all listings those are tagged by user
        $scope.allTaggedTenders = getTaggedTenders();
        function getTaggedTenders (){
            var taggedTenders = [];
            angular.forEach(userTenderList, function(userTender){
                if(userTender.userTags.length) {
                    var tender = {
                        _id : userTender._id,
                        item : userTender.item 
                    };
                    taggedTenders.push(tender)
                }
            });
            return taggedTenders;
        }

        //function to get array of tags with their corresponding listings
        function tagLinkList(){
            var tagList = [];
            
            angular.forEach(userTenderList, function(userTender){

                var tender = {};
                tender.item = userTender.item;
                tender._id = userTender._id;

                angular.forEach(userTender.userTags, function(userTag){

                    var tag = {
                        name : '',
                        tendersList : []
                    };

                    var tagIndex = tagList.map(function(o){return o.name}).indexOf(userTag);

                    if( tagIndex !== -1) {
                        tagList[tagIndex].tendersList.push(tender);
                    }
                    else {
                        tag.name = userTag;
                        tag.tendersList.push(tender);
                        tagList.push(tag);
                    }
                })
            })
            return tagList;
        }


    }])

    .controller('SettingsCtrl', ['$scope', '$state', 'userDataFactory', 'httpService', 'ngToast', function ($scope, $state, userDataFactory, httpService, ngToast){

        // Get user data
        $scope.userData = userDataFactory.get();

        // Watch for changes in user data
        $scope.$watchCollection(
            function(){
                return userDataFactory.get();
            },
            function(newValue){
                $scope.userData = newValue;
            }
        )

        // Pre-fill profile form
        $scope.userName = $scope.userData.name;
        $scope.userPosition = $scope.userData.position;
        $scope.userCompany = $scope.userData.company;
        $scope.userAddress = $scope.userData.address;
        $scope.userPhone = $scope.userData.phone;


        // Update profile
        $scope.updateProfile = function(){
            var data = {
                name : $scope.userName ? $scope.userName : null,
                position : $scope.userPosition ? $scope.userPosition : null,
                company : $scope.userCompany ? $scope.userCompany : null,
                address : $scope.userAddress ? $scope.userAddress : null,
                phone : $scope.userPhone ? $scope.userPhone : null
            }

            httpService.putData('/Update/User/Profile', data).then(function (userData) {
                    
                    ngToast.create({
                        className : 'success',
                        content : 'Your profile is updated successfully',
                        timeout : 6000,
                        dismissButton : true
                    });
                    
                    userDataFactory.set(userData);
                    $scope.profileForm.$setPristine();

                });

        }

        $scope.showPassForm = false;

        $scope.validPassword = true;
        $scope.$watch(
            'oldPassword',
            function(newValue){
                if(!$scope.validPassword) $scope.validPassword = true;
            }
        )
        //Password Change
        $scope.changePassword = function(){
            var data = {
                oldPassword : $scope.oldPassword,
                newPassword : $scope.newPassword
            };

            httpService.postData('/Change/User/Password', data).then(function(message){
                ngToast.create({
                        className : message.result,
                        content : message.text,
                        timeout : 6000,
                        dismissButton : true
                });
                if(message.result === 'success'){
                    $scope.oldPassword = null;
                    $scope.newPassword = null;
                    $scope.confirmPassword = null;
                    $scope.passwordResetForm.$setPristine();
                }
                else $scope.validPassword = false;
                    
            })
        }


    }])

    .controller('TenderAppCtrl', ['$scope', 'httpService', 'tenderFactory', '$state', 'userSearchField', 'daysDifference', 'tenderText', '$window', 'userDataFactory', 'userTenders', 'myTenderList', '$location', 'ngToast', function($scope, httpService, tenderFactory, $state, userSearchField, daysDifference, tenderText, $window, userDataFactory, userTenders, myTenderList, $location, ngToast) {
        
        
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

        $scope.$watchCollection(
            function(){
                return myTenderList.get();
            },
            function(newValue){
                $scope.tenderlist = newValue;
            }
        )

        // Table view top title and drop down title
        $scope.getTitle = function(viewName){
            var title = {};
            switch (viewName) {
                case 'Active' : 
                    title.foo = 'Active postings';
                    title.bar = 'Active';
                    break;
                case 'Recent' :
                    title.foo = 'Recent postings';
                    title.bar = 'Recent';
                    break;
                case 'Participated' :
                    title.foo = 'Participated postings';
                    title.bar = 'Participated';
                    break;
                case 'Watchlist' :
                    title.foo = 'My Watchlist';
                    title.bar = 'Watchlist';
                    break;
                case 'myListings' :
                    title.foo = 'My Listings';
                    title.bar = 'My Listings';
                    break;
                case 'All' :
                    title.foo = 'All postings';
                    title.bar = 'All';
                    break;
            }
            return title;
        }

        // Default view
        if(!myTenderList.getView()){
            myTenderList.setView("Active");
        }

        //Watch for changing views
        $scope.$watchCollection(function () {
            return myTenderList.getView();
        } , function(newView) {
            $scope.fetch(newView);
        });
        
        // called from $watch changing Views
        $scope.fetch = function(givenView) {
            if ($scope.currentView != givenView) {
                $scope.loadingData = true;
                $scope.currentView = givenView;
                $scope.removedListings = [];


                if(givenView === "Watchlist") {
                    var userData = userTenders.get();
                    var watchlistId = [];

                    angular.forEach(userData.watching.list, function(watchingTender){
                        watchlistId.push(watchingTender._id);
                        //var detailTender = $filter('filter')($scope.tenderlist, {_id : watchingTender._id}, true);
                    });

                    httpService.putData('/Watchlist', watchlistId).then(function(tenders){
                        
                        //if some of the tenders eg. created by users, are deleted
                        if(watchlistId.length !== tenders.length){
                            tendersId = tenders.map(function(o){return o._id});
                            
                            angular.forEach(userData.watching.list, function(watchingTender){
                                if(tendersId.indexOf(watchingTender._id) === -1) {
                                  $scope.removedListings.push(watchingTender);
                                } 
                            });
                        }


                        myTenderList.set(tenders);
                        //$scope.tenderlist = tenders;
                        $scope.loadingData = false;

                    })

                }
                else if(givenView === "Participated") {
                    var userData = userTenders.get();
                    var partListId = [];

                    angular.forEach(userData.participated.list, function(partTender){
                        partListId.push(partTender._id);
                    });
                    httpService.putData('/Participated', partListId).then(function(tenders){

                        //if some of the tenders eg. created by users, are deleted and IS NOT CAUGHT YET!
                        if(partListId.length !== tenders.length && !$scope.removedListings.length){
                            tendersId = tenders.map(function(o){return o._id});
                            
                            angular.forEach(userData.participated.list, function(participatedTender){
                                if(tendersId.indexOf(participatedTender._id) === -1) {
                                  $scope.removedListings.push(participatedTender);
                                } 
                            });
                        }

                        myTenderList.set(tenders);
                        //$scope.tenderlist = tenders;
                        $scope.loadingData = false;
                    })

                }
                else if(givenView === "myListings") {
                    var userData = userTenders.get();
                    var myListsId = [];

                    angular.forEach(userData.myListings.list, function(myListId){
                        myListsId.push(myListId);
                    });
                    httpService.putData('/myListings', myListsId).then(function(myLists){
                        myTenderList.set(myLists);
                        $scope.loadingData = false;
                    })


                }
                else {
                    httpService.getData('/'+ givenView).then(function(tenders) {
                        myTenderList.set(tenders);
                        //$scope.tenderlist = tenders;
                        $scope.loadingData = false;
                    });
                }


            }
        };

        //$location.hash(''); //used for anchor to work
      

        // Remove broken listings
        $scope.removeDeadList = function() {
            var url = '/Delete/User/MultipleTenderData';
            var data = {
                _id : $scope.removedListings.map(function(o){return o._id})
            }

            httpService.putData(url, data).then(function (userData) {  
                
                ngToast.create({
                    className : 'success',
                    content : 'Broken listing(s) issue has been resolved',
                    timeout : 6000,
                    dismissButton : true
                });
                
                // update user data
                userDataFactory.set(userData);

                // clear the list / sentinnel 
                $scope.removedListings = [];
                
            });
        }

        
        
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


