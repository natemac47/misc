function cdCalendarController($scope, $timeout, cdAnalytics) {
    var c = this;
    $scope.cdAnalytics = cdAnalytics;
    c.showSelection = false;
    $scope.selectedCalendar = 0;
    $scope.selectedYear = 0;
    $scope.selectedRegion = null; 
    $scope.isFirstLoad = true;
    $scope.trackedImpressions = {};

    $scope.originalThisYearItems = [];
    $scope.originalNextYearItems = [];

    $scope.loadData = function(callback) {
        $scope.data.action = "loadData";
        $scope.server.update().then(function() {
            if ($scope.isFirstLoad) {
                $scope.originalThisYearItems = angular.copy($scope.data.thisYearItems);
                $scope.originalNextYearItems = angular.copy($scope.data.nextYearItems);
                $scope.isFirstLoad = false;
            }
            // Apply region filter if a saved region exists
            $scope.initRegionSelection();

            if (callback) callback();
        });
    };

$scope.filterByRegion = function(regionSysId) {
    // Save the selected region ID in local storage
    localStorage.setItem('selectedRegion', regionSysId);

    if (!regionSysId) {
        // Show all holidays if "All Regions" is selected
        $scope.data.thisYearItems = angular.copy($scope.originalThisYearItems);
        $scope.data.nextYearItems = angular.copy($scope.originalNextYearItems);
        return;
    }

    const selectedRegionObj = $scope.data.regions.find(r => r.sys_id === regionSysId);
    if (!selectedRegionObj) {
        console.warn("Region not found:", regionSysId);
        return;
    }

    const selectedRegionNameNormalized = selectedRegionObj.normalized_region;

    $scope.data.thisYearItems = $scope.originalThisYearItems.filter(event => {
        return event.region.trim().toLowerCase() === selectedRegionNameNormalized;
    });

    $scope.data.nextYearItems = $scope.originalNextYearItems.filter(event => {
        return event.region.trim().toLowerCase() === selectedRegionNameNormalized;
    });
};


    $scope.initRegionSelection = function() {
        const savedRegion = localStorage.getItem('selectedRegion');
        if (savedRegion) {
            $scope.selectedRegion = savedRegion;
            $scope.filterByRegion(savedRegion);
        }
    };

    $scope.handleKeyBoardEvent = function(event) {
        if (event.keyCode === 32 || event.keyCode == 13) {
            event.preventDefault();
            $timeout(function() {
                event.target.click();
            }, 0);
        }
    };

    function sort(array, key) {
        array.sort(function(a, b) {
            return a[key] - b[key];
        });
    }

    // Load data and ensure the region is applied on widget load
    $scope.loadData();
}
