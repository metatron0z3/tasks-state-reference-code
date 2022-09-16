/* global Clipboard, Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */
'use strict';

/**
 * @ngdoc service
 * @name webClientApp.TroopLogger
 * @description
 * # TroopLogger
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'TroopLogger',
    [
      '$localStorage',
      'agLogger',
      'LOG_LEVEL',
      function(
        $localStorage,
        agLogger,
        LOG_LEVEL
      ) {

        if ( ! $localStorage.hasOwnProperty('loggerSettings') ) {

          $localStorage.loggerSettings = {
            level: LOG_LEVEL,
            core: {
              'routes.js': {
                checked: false
              },
              'auth.js': {
                checked: false
              }
            },
            controllers: {
              core: {
                'Home.js': {
                  checked: false
                },
                'HomeHeader.js': {
                  checked: false
                },
                'Invite.js': {
                  checked: false
                },
                'Auth.js': {
                  checked: false
                },
                'Login.js': {
                  checked: false
                },
                'PasswordReset.js': {
                  checked: false
                },
                'SignUp.js': {
                  checked: false
                }
              },
              dashboard: {
                core: {
                  'Dashboard.js': {
                    checked: false
                  },
                  'Header.js': {
                    checked: false
                  },
                  'LeftSidebar.js': {
                    checked: false
                  },
                  'NotificationSidebar.js': {
                    checked: false
                  },
                  'TroopSidebar.js': {
                    checked: false
                  }
                },
                board: {
                  'Chat.js': {
                    checked: false
                  },
                  'DetailCard.js': {
                    checked: false
                  },
                  'Header.js': {
                    checked: false
                  },
                  'List.js': {
                    checked: false
                  },
                  'Grid.js': {
                    checked: false
                  },
                  'Table.js': {
                    checked: false
                  },
                  'MultiCard.js': {
                    checked: false
                  },
                  'RightSidebar.js': {
                    checked: false
                  },
                  'SearchCards.js': {
                    checked: false
                  },
                  'SearchChats.js': {
                    checked: false
                  }
                },
                boards: {
                  'Header.js': {
                    checked: false
                  },
                  'MyBoards.js': {
                    checked: false
                  },
                  'TeamBoards.js': {
                    checked: false
                  }
                },
                troopMember: {
                  'Chat.js': {
                    checked: false
                  },
                  'Header.js': {
                    checked: false
                  },
                  'ProfileSidebar.js': {
                    checked: false
                  }
                },
                troopMembers: {
                  'Header.js': {
                    checked: false
                  },
                  'List.js': {
                    checked: false
                  }
                }
              },
              modal: {
                'AccountSettings.js': {
                  checked: false
                },
                'Assets.js': {
                  checked: false
                },
                'Board.js': {
                  checked: false
                },
                'BoardImport.js': {
                  checked: false
                },
                'BoardInvite.js': {
                  checked: false
                },
                'Card.js': {
                  checked: false
                },
                'CardViewSettings.js': {
                  checked: false
                },
                'Confirm.js': {
                  checked: false
                },
                'Delete.js': {
                  checked: false
                },
                'InviteAccept.js': {
                  checked: false
                },
                'Message.js': {
                  checked: false
                },
                'Multimedia.js': {
                  checked: false
                },
                'PublicTroopJoin.js': {
                  checked: false
                },
                'PublicTroopShare.js': {
                  checked: false
                },
                'LinkAccounts.js': {
                  checked: false
                },
                'TableViewSettings.js': {
                  checked: false
                },
                'Troop.js': {
                  checked: false
                },
                'TroopInvite.js': {
                  checked: false
                },
                'TroopMemberChat.js': {
                  checked: false
                },
                'TroopMemberProfile.js': {
                  checked: false
                }
              }
            },
            directives: {
              troop: {
                'tpAsset.js': {
                  checked: false
                },
                'tpCardDescription.js': {
                  checked: false
                },
                'tpCardNoteCount.js': {
                  checked: false
                },
                'tpCardNote.js': {
                  checked: false
                },
                'tpCardTags.js': {
                  checked: false
                },
                'tpChatEntry.js': {
                  checked: false
                },
                'tpCheckbox.js': {
                  checked: false
                },
                'tpDataPump.js': {
                  checked: false
                },
                'tpLoadingSpinner.js': {
                  checked: false
                },
                'tpMultimediaPlayer.js': {
                  checked: false
                },
                'tpNotification.js': {
                  checked: false
                },
                'tpObserver.js': {
                  checked: false
                },
                'tpOtherFileType.js': {
                  checked: false
                },
                'tpTroop.js': {
                  checked: false
                },
                'tpTroopMember.js': {
                  checked: false
                },
                'tpTroopMemberProfile.js': {
                  checked: false
                }
              },
              core: {
                'ngBlurOnEnter.js': {
                  checked: false
                },
                'ngCharacterEnforcer.js': {
                  checked: false
                },
                'ngClearStyle.js': {
                  checked: false
                },
                'ngEnterKey.js': {
                  checked: false
                },
                'ngEscKey.js': {
                  checked: false
                },
                'ngFocus.js': {
                  checked: false
                },
                'ngHasOverflow.js': {
                  checked: false
                },
                'ngHideAuth.js': {
                  checked: false
                },
                'ngKeyBind.js': {
                  checked: false
                },
                'ngMouseEnter.js': {
                  checked: false
                },
                'ngMouseLeave.js': {
                  checked: false
                },
                'ngSetFocus.js': {
                  checked: false
                },
                'ngShowAuth.js': {
                  checked: false
                }
              }
            },
            services: {
              'AssetFactory.js': {
                checked: false
              },
              'AssetFirebaseObject.js': {
                checked: false
              },
              'BoardFactory.js': {
                checked: false
              },
              'BoardListFactory.js': {
                checked: false
              },
              'CardFactory.js': {
                checked: false
              },
              'CardListFactory.js': {
                checked: false
              },
              'ChatEntryFactory.js': {
                checked: false
              },
              'ChatFactory.js': {
                checked: false
              },
              'FileFactory.js': {
                checked: false
              },
              'Fingerprint.js': {
                checked: false
              },
              'InviteFactory.js': {
                checked: false
              },
              'JSZip.js': {
                checked: false
              },
              'Me.js': {
                checked: false
              },
              'Nav.js': {
                checked: false
              },
              'NotificationFactory.js': {
                checked: false
              },
              'NotificationFirebaseArray.js': {
                checked: false
              },
              'Ocrad.js': {
                checked: false
              },
              'SearchFactory.js': {
                checked: false
              },
              'SecurityFactory.js': {
                checked: false
              },
              'TroopApi.js': {
                checked: false
              },
              'TrooperFactory.js': {
                checked: false
              },
              'TroopFactory.js': {
                checked: false
              },
              'TroopFirebaseObject.js': {
                checked: false
              },
              'TroopMemberFactory.js': {
                checked: false
              },
              'UAParser.js': {
                checked: false
              }
            }
          };
        }

        if('level' in $localStorage.loggerSettings){
          agLogger.setLogLevel($localStorage.loggerSettings.level);
        }

        return {
          error: loggerError,
          warn: loggerWarn,
          info: loggerInfo,
          debug: loggerDebug,
          log: loggerLog
        };

        function canRecord(logConfig) {

          var count = logConfig.path.length;
          var path = logConfig.path;
          var can = $localStorage.loggerSettings.hasOwnProperty(path[0]);

          if ( ! can ) {

            return false;
          }

          if (
            can
            && count > 1
            && ( ! $localStorage.loggerSettings[path[0]].hasOwnProperty(path[1]) )
          ) {

            can = false;
          }

          if (
            can
            && count === 2
            && $localStorage.loggerSettings[path[0]][path[1]].checked
          ) {

            return true;
          }

          if (
            can
            && count > 2
            && ( ! $localStorage.loggerSettings[path[0]][path[1]].hasOwnProperty(path[2]) )
          ) {

            can = false;
          }

          if (
            can
            && count === 3
            && $localStorage.loggerSettings[path[0]][path[1]][path[2]].checked
          ) {

            return true;
          }

          if (
            can
            && count > 3
            && ( ! $localStorage.loggerSettings[path[0]][path[1]][path[2]].hasOwnProperty(path[3]) )
          ) {

            can = false;
          }

          if (
            can
            && count === 4
            && $localStorage.loggerSettings[path[0]][path[1]][path[2]][path[3]].checked
          ) {

            return true;
          }

          return false;

        }


        function loggerError(logConfig) {
          if ( canRecord(logConfig) ) {

            var args = [].splice.call(arguments, 0);
            args[0] = logConfig.slug;
            agLogger.error.apply(null, args);
          }
        }

        function loggerWarn(logConfig) {
          if ( canRecord(logConfig) ) {

            var args = [].splice.call(arguments, 0);
            args[0] = logConfig.slug;
            agLogger.warn.apply(null, args);
          }
        }

        function loggerInfo(logConfig) {
          if ( canRecord(logConfig) ) {

            var args = [].splice.call(arguments, 0);
            args[0] = logConfig.slug;
            agLogger.info.apply(null, args);
          }

        }

        function loggerDebug(logConfig) {

          if ( canRecord(logConfig) ) {

            var args = [].splice.call(arguments, 0);
            args[0] = logConfig.slug;
            agLogger.debug.apply(null, args);
          }

        }

        function loggerLog(logConfig) {
          if ( canRecord(logConfig) ) {

            var args = [].splice.call(arguments, 0);
            args[0] = logConfig.slug;
            agLogger.log.apply(null, args);
          }
        }
      }
    ]
  );
