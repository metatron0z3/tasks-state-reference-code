'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:StyleGuideCtrl
 * @description
 * # StyleGuideCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'StyleGuideCtrl',
    [
      '$scope',
      '$localStorage',
      function (
        $scope,
        $localStorage
      ) {

        var that = this;

        $scope.$storage = $localStorage;

        $scope.buttons = {
          colors: ['blue', 'grey'],
          sizes: ['small', 'default', 'large'],
          types: ['round']
        };

        $scope.colors = [
          /* blacks */
          'black-primary',
          'black-secondary',
          'black-secondary-40',
          'black-secondary-60',
          'black-secondary-65',
          'black-tertiary',
          'black-quaternary',
          'black-quinary',
          'black-senary',

          /* whites */
          'white-primary',
          'white-secondary',
          'white-tertiary',

          /* grays */
          'gray-primary',
          'gray-secondary',
          'gray-tertiary',
          'gray-quaternary',
          'gray-quinary',
          'gray-senary',
          'gray-septenary',
          'gray-octonary',
          'gray-nonary',
          'gray-denary',

          'light-gray-primary',
          'light-gray-secondary',
          'light-gray-tertiary',
          'light-gray-quaternary',
          'light-gray-quinary',
          'light-gray-senary',

          /* blues */
          'blue-primary',
          'blue-secondary',
          'blue-tertiary',
          'blue-quaternary',
          'blue-quinary',
          'blue-septenary',

          /* blue grays */
          'blue-gray-primary',
          'blue-gray-secondary',
          'blue-gray-tertiary',

          /* blue greens */
          'blue-green-primary',

          /* greens */
          'green-primary',

          /* reds */
          'red-primary',
          'red-secondary',

          /* oranges */
          'orange-primary'
        ];

        $scope.icons = [
          'account',
          'arrow',
          'arrow-end',
          'arrow-reverse',
          'arrow-down',
          'bell',
          'bold',
          'bordered-star',
          'chat',
          'chat-multiple',
          'check',
          'checkbox',
          'curved-arrow',
          'circle',
          'circle-close',
          'circle-plus',
          'clipboard',
          'close',
          'contact',
          'dashed-circle',
          'data',
          'deal',
          'deck',
          'document',
          'dotdotdot',
          'envelope-stars',
          'facebook',
          'file-icon',
          'file-pdf',
          'file-archive',
          'file-audio',
          'file-code',
          'file-default',
          'file-photoshop',
          'file-presentation',
          'file-sketch',
          'file-spreadsheet',
          'file-text-document',
          'file-unknown',
          'file-video',
          'fingerprint',
          'folder',
          'font',
          'form',
          'gear',
          'github',
          'google-plus',
          'graph',
          'grid',
          'hash',
          'handle',
          'headphones',
          'h1',
          'h2',
          'h3',
          'image-icon',
          'indent',
          'italic',
          'link',
          'list',
          'loading',
          'magnifying-glass',
          'map-pin',
          'microphone',
          'mobile-device',
          'nav-icon-card',
          'nav-icon-grid',
          'nav-icon-list',
          'nav-icon-web',
          'ol',
          'outdent',
          'paper-airplane',
          'paper-clip',
          'pencil',
          'person',
          'person-circle',
          'photo',
          'plus',
          'quote',
          'spinner',
          'stack',
          'star',
          'table',
          'trash',
          'troop-chat',
          'troop-logo',
          'troop-logo-color',
          'twitter',
          'ul',
          'upload',
          'video'
        ]


        $scope.labels = {};
        $scope.forms = {
          exampleModalForm: {},
          exampleForm: {}
        };

        this.refreshLabels = function() {
          $scope.labels = {
            'exampleModalForm.textInput': ! $scope.forms.exampleModalForm.textInput,
            'exampleModalForm.textarea': ! $scope.forms.exampleModalForm.textarea,

            'exampleForm.textInput': ! $scope.forms.exampleForm.textInput,
            'exampleForm.minicolors': ! $scope.forms.exampleForm.minicolors,
            'exampleForm.textarea': ! $scope.forms.exampleForm.textarea,


          };
        };

        $scope.hideLabel = function(labelName) {
          $scope.labels[labelName] = false;
        };
        $scope.showLabel = function(labelName) {
          $scope.labels[labelName] = true;
        };


        this.refreshLabels();
      }
    ]
  );
