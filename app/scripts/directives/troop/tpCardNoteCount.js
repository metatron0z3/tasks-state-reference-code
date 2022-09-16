/* global _ */
/* jshint strict: true */
/* jshint -W014 */

(function () {
'use strict';

angular
  .module('webClientApp')
  .directive('tpCardNoteCount', tpCardNoteCount);

function tpCardNoteCount() {
  var directive = {
      restrict: 'A',
      scope: {
        notes: '=tpCardNoteCount',
        append: '=tpCardNoteCountAppend',
        limit: '=tpCardNoteLimit'
      },
      controller: tpCardNoteCountController,
      controllerAs: 'vm',
      bindToController: true
  };

  return directive;
}

tpCardNoteCountController.$inject = [
  '$scope',
  '$element',
  'TroopLogger'
];

function tpCardNoteCountController(
  $scope,
  $element,
  TroopLogger
) {

  var logConfig = {
    slug: 'directive: milticard note counter - ',
    path: [ 'directive', 'troop', 'tpCardNoteCount.js' ]
  };


  /*jshint validthis:true */
  var vm = this;

  $scope.$watch('vm.notes', function() {
    TroopLogger.debug(logConfig, 'notes', vm.notes);
    var count = vm.notes ? _.size(vm.notes)-vm.limit : 0;
    TroopLogger.debug(logConfig, 'note count',count);

    switch(count){
      case 0:
        $element.attr('data-count', 'Add Note');
        /////////
        TroopLogger.debug(logConfig, 'data-count', 'Add Note');
        break;

      case 1:
        vm.text =
        $element.attr( 'data-count', 'View ' + count + ' more ' + (vm.append.single || 'Note') );
        //$element.attr( 'data-count', count + ' ' + (vm.append.single || 'Note') );
        /////////
        TroopLogger.debug(logConfig, 'data-count', count + ' ' + (vm.append.single || 'Note'));
        break;

      default:
        $element.attr( 'data-count', 'View ' + count + ' more ' + (vm.append.plural || 'Notes') );
        //$element.attr( 'data-count', count + ' ' + (vm.append.plural || 'Notes') );
        /////////
        TroopLogger.debug(logConfig, 'data-count', count + ' ' + (vm.append.plural || 'Notes'));
        break;
    }
  });
}


})(); // end of file
