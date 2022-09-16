'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:tpTroopMember
 * @description
 * # tpTroopMember
 */
angular.module('webClientApp')
  .directive('tpTroopMember', [
    'Ref',
    '$templateRequest',
    '$sce',
    '$compile',
    'TroopLogger',
    function (
      Ref,
      $templateRequest,
      $sce,
      $compile,
      TroopLogger
    ) {

      var logConfig = {
        slug: 'directive: tpTroopmember - ',
        path: [ 'directives', 'troop', 'tpTroopMember.js']
      };

      var defaultTemplate = '<img src="/images/default-avatar.png">';

      return {
        //scope: {
        //  tpTroopMember: '='
        //},
        link: function(scope, element, attrs) {

          element.addClass('fetching');

          if (attrs.tpTroopMember) {

            if (attrs.tpTroopMemberNameInTitle) {

              Trooplogger.debug(logConfig, 'attrs.tpTroopMemberNameInTitle: ', attrs.tpTroopMemberNameInTitle);

              Ref.child('members')
                .child(attrs.tpTroopMemberTroopId)
                .child(attrs.tpTroopMember)
                .once('value', function(snap) {

                  if (snap.exists()) {

                    var troopMember = snap.val();
                    element.attr('title', $.trim(troopMember.name));

                  }

                });
            }

            if (attrs.tpTroopMemberUserName === 'true') {

              TroopLogger.debug(logConfig, 'attrs.tpTroopMemberUserName is true: ', attrs.tpTroopMemberUserName);

              Ref.child('members')
                .child(attrs.tpTroopMemberTroopId)
                .child(attrs.tpTroopMember)
                .once('value', function(snap) {

                  if (snap.exists()) {

                    var troopMember = snap.val();
                    element.html($.trim(troopMember.name));

                  }

                });
            }
            else if (attrs.tpTroopMemberAvatarAssetSize) {

              TroopLogger.debug(logConfig, 'attrs.tpTroopMemberAvatarAssetSize is: ', attrs.tpTroopMemberAvatarAssetSize);


              element.html('<svg class="icon image-icon"><use xlink:href="#image-icon"/></svg>');

              Ref.child('members')
                .child(attrs.tpTroopMemberTroopId)
                .child(attrs.tpTroopMember)
                .once('value', function(snap) {

                  if (snap.exists()) {

                    var troopMember = snap.val();

                    if (troopMember.avatarAssetId) {

                      Ref.child('assets')
                        .child(attrs.tpTroopMemberTroopId)
                        .child(troopMember.avatarAssetId)
                        .once('value', function(snap) {

                          if (snap.exists()) {

                            var asset = snap.val();
                            var url = asset[attrs.tpTroopMemberAvatarAssetSize];
                            var template = defaultTemplate;

                            if (
                              ( ! url )
                              && ( ! _.isEmpty(asset.metaData) )
                            ) {
                              url = asset.metaData[attrs.tpTroopMemberAvatarAssetSize];
                            }

                            if (url) {
                              template = '<img src="' + url + '">';
                            }

                            element.html(template);
                          }
                          else {
                            element.html(defaultTemplate);
                          }

                          element.removeClass('fetching');

                        });
                    }
                    else {
                      element.html(defaultTemplate);
                      element.removeClass('fetching');
                    }

                  }
                  else {
                    element.html(defaultTemplate);
                    element.removeClass('fetching');
                  }
                });
              }
              else { // grab troop member name
                Ref.child('members')
                  .child(attrs.tpTroopMemberTroopId)
                  .child(attrs.tpTroopMember)
                  .once('value', function(snap) {

                    if (snap.exists()) {
                      var troopMember = snap.val();
                      var html = '@' + troopMember.memberName;
                      element.html(html);

                      element.removeClass('fetching');
                    }
                  });
              }
            }
            else {
              element.html(defaultTemplate);
              element.removeClass('fetching');
            }
        }
      }
    }
  ]);
