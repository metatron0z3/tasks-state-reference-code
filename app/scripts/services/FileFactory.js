'use strict';

/**
 * @ngdoc service
 * @name webClientApp.FileFactory
 * @description
 * # FileFactory
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'FileFactory',
    [
      'IMAGE_TYPES',
      function(
        IMAGE_TYPES
      ) {

        var docFileTypes = [
          'file-pdf',
          'file-text-document',
          'file-spreadsheet',
          'file-presentation'
        ];
        var fileTypes = [
          'file-pdf',
          'file-text-document',
          'file-spreadsheet',
          'file-presentation',
          'file-video',
          'file-archive',
          'file-unknown'
        ];

        return {
          docFileTypes: docFileTypes,
          fileTypes: fileTypes,
          isOtherFileType: isOtherFileType,
          isImageFileType: isImageFileType,
          isGifFileType: isGifFileType,
          isDocumentFileType: isDocumentFileType,
          fileTypeClass: fileTypeClass,
          formatBytes: formatBytes
        };


        function isOtherFileType(mimeType) {
          return ( ! mimeType ) || IMAGE_TYPES.indexOf(mimeType) === -1;
        }

        function isImageFileType(mimeType) {
          return mimeType && IMAGE_TYPES.indexOf(mimeType) !== -1;
        }

        function isGifFileType(mimeType) {
          return mimeType === 'image/gif';
        }

        function isDocumentFileType(mimeType) {

          var fileType = fileTypeClass(mimeType);

          return docFileTypes.indexOf(fileType) !== -1;
        }

        function fileTypeClass(mimeType) {

          if ( ! mimeType ) {
            return 'file-unknown';
          }

          var classes = '';

          switch (mimeType) {
            case 'image/x-ms-bmp':
            case 'image/gif':
            case 'image/jpeg':
            case 'image/png':
              classes = 'file-image';
              break;

            case 'image/vnd.adobe.photoshop':
              classes = 'file-photoshop';
              break;

            case 'application/pdf':
              classes = 'file-pdf';
              break;

            case 'text/css':
            case 'text/html':
            case 'text/xml':
              classes = 'file-code';
              break;

            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/vnd.oasis.opendocument.text':
            case 'application/msword':
            case 'text/plain':
            case 'text/richtext':
            case 'text/rtf':
              classes = 'file-text-document';
              break;

            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.oasis.opendocument.spreadsheet':
            case 'text/csv':
            case 'application/vnd.ms-excel':
            case 'application/x-iwork-numbers-sffnumbers':
              classes = 'file-spreadsheet';
              break;

            case 'application/vnd.ms-powerpoint':
            case 'application/vnd.oasis.opendocument.presentation':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            case 'application/x-iwork-keynote-sffkey':
              classes = 'file-presentation';
              break;

            case 'video/x-flv':
            case 'video/mp4':
            case 'video/quicktime':
            case 'video/x-sgi-movie':
            case 'video/x-msvideo':
            case 'video/mpeg':
              classes = 'file-video';
              break;

            case 'audio/mp3':
              classes = 'file-audio';
              break;

            case 'application/zip':
            case 'application/x-zip':
              classes = 'file-archive';
              break;

            default:
              classes = 'file-unknown';
              break;
          }

          return classes;
        }

        function formatBytes(bytes, decimals) {

          var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
          if (!bytes || bytes === 0) {
            return 'n/a';
          }
          var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
          if (i === 0) {
            return bytes + ' ' + sizes[i];
          }
          var size =  (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
          return size;
        }
      }
    ]
  );
