'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:AssetsModalCtrl
 * @description
 * # AssetsModalCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
		.controller(
		'AssetsModalCtrl',
		[
      '$scope',
      '$localStorage',
      '$timeout',
      '$http',
      'Me',
      'AssetFactory',
			'FileFactory',
      'close',
      function AssetsModalCtrl(
        $scope,
        $localStorage,
        $timeout,
        $http,
        Me,
        AssetFactory,
				FileFactory,
        close
      ) {
        var that = this;

        that.assetKeys = [];

        $scope.showModal = true;
        $scope.prevAssetKey = 'blah';
        $scope.nextAssetKey = 'blah';
				$scope.firstAssetKey = 'blah';
				$scope.lastAssetKey = 'blah';

        this.setData = function(data) {
          $scope.card = data.card;
					$scope.troopId = data.troopId;
					$scope.createdBy = ($scope.card.createdByMemberId === Me.troopMember.$id);
					$scope.isDocumentFileType = data.isDocumentFileType;


					var assets = [];
					var order = 1;
					_.each($scope.card.assets, function(asset, assetId) {
						if (asset === true) {
							asset = {
								assetId: assetId,
								order: order
							};

							order += 1;
						}
						else {
							asset = {
								assetId: assetId,
								order: asset
							};
						}

						assets.push(asset);

					});

					that.assetKeys = _.pluck(_.sortBy(assets, 'order').reverse(), 'assetId');
          $scope.navToAsset(data.assetId);

        };

				$scope.checkDownload = function() {
					var canIDownload = false;

					var boardRead = false;
					var boardPermission = 'admin'
					var createdBy = true;

					if (
						Me.currentBoard
						&& Me.troopMember
						&& Me.troopMember.boards
						&& Me.troopMember.boards[Me.currentBoard.$id]
					) {
						boardRead = Me.currentBoard.readOnly;
						boardPermission = Me.troopMember.boards[Me.currentBoard.$id].permission;
						createdBy = ($scope.card.createdByMemberId === Me.troopMember.$id);
					}

					if (
						boardRead === false
						|| (
							boardPermission === 'admin'
							|| createdBy
						)
					) {
						canIDownload = true;
					}

					return canIDownload;
				}

        $scope.navToAsset = function(assetId) {

					if (assetId) {
						$scope.assetId = assetId;
	          that.currentIndex = that.assetKeys.indexOf(assetId);
	          $scope.prevAssetKey = that.currentIndex === 0 ? '' : that.assetKeys[that.currentIndex - 1];
	          $scope.nextAssetKey = that.currentIndex === that.assetKeys.length ? '' : that.assetKeys[that.currentIndex + 1];
						$scope.firstAssetKey = that.assetKeys ? that.assetKeys[0] : '';
						$scope.lastAssetKey = that.assetKeys ? that.assetKeys[that.assetKeys.length-1] : '';

					}

        };

				$scope.$on('onLeftArrow', function(event) {
					if ( that.arrowKeyDebounce ) {
						$timeout.cancel(that.arrowKeyDebounce);
					}

					that.arrowKeyDebounce = $timeout(function() {

						if ($scope.prevAssetKey && $scope.prevAssetKey !== $scope.assetId ) {
							$scope.navToAsset($scope.prevAssetKey);
						}
						that.arrowKeyDebounce = null;
					}, 50 );
				});
				$scope.$on('onUpArrow', function(event) {


					if ( that.arrowKeyDebounce ) {
						$timeout.cancel(that.arrowKeyDebounce);
					}

					that.arrowKeyDebounce = $timeout(function() {

						if ($scope.firstAssetKey && $scope.firstAssetKey !== $scope.assetId) {
							$scope.navToAsset($scope.firstAssetKey);
						}
						that.arrowKeyDebounce = null;

					}, 50 );
				});
				$scope.$on('onRightArrow', function(event) {


					if ( that.arrowKeyDebounce ) {
						$timeout.cancel(that.arrowKeyDebounce);
					}

					that.arrowKeyDebounce = $timeout(function() {

						if ($scope.nextAssetKey && $scope.nextAssetKey !== $scope.assetId) {
							$scope.navToAsset($scope.nextAssetKey);
						}
						that.arrowKeyDebounce = null;

					}, 50 );
				});
				$scope.$on('onDownArrow', function(event) {


					if ( that.arrowKeyDebounce ) {
						$timeout.cancel(that.arrowKeyDebounce);
					}

					that.arrowKeyDebounce = $timeout(function() {

						if ($scope.lastAssetKey && $scope.lastAssetKey !== $scope.assetId) {
							$scope.navToAsset($scope.lastAssetKey);
						}
						that.arrowKeyDebounce = null;
					}, 50 );
				});

				$scope.$on('onEscapeKey', function(event) {
					$scope.close();
				})

        $scope.close = function() {
          $scope.showModal = false;

          $timeout(close, 800);

        };
			}
		]);
