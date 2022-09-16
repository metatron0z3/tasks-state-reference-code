'use strict';

angular.module('webClientApp')
.config(function($httpProvider) {
    //Enable cross domain calls
    $httpProvider.defaults.useXDomain = true;
})
.config(function(embedlyServiceProvider){
  embedlyServiceProvider.setKey('9265b8402dca469f91249085a360b55b');
})
.config(
  [
    'markedProvider',
    'WEB_SERVER_URL',
    function (
      markedProvider,
      WEB_SERVER_URL
    ) {

      markedProvider.setOptions({
        gfm: true,
        tables: true,
        breaks: false,
        pedantic: false,
        sanitize: true,
        smartLists: true,
        smartypants: false,
        highlight: function (code, lang) {
          if (lang) {
            return hljs.highlight(lang, code, true).value;
          } else {
            return hljs.highlightAuto(code).value;
          }
        }
      });

      markedProvider.setRenderer({
        link: function(href, title, text) {
          var target = href.indexOf(WEB_SERVER_URL) === -1 ? ' target="_blank"' : '';
          var title = title ? ' title="' + title + '"' : '';
          return '<a href="' + href + '"' + title + target + '>' + text + '</a>';
        }
      });

    }
  ]
)
.constant('WEB_SERVER_URL', 'https://troop.work')
.constant('API_SERVER_URL', 'https://api.troop.work:3644')
.constant('UPLOAD_SERVER_URL', 'https://asset.troop.work:3643')
.constant('NOTIFICATION_SERVER_URL', 'https://api.troop.work:3647')
.constant('ALGOLIA_SEARCH_KEY', '') // you can leave this field empty
.constant('ALGOLIA_SEARCH_APP_ID', '') // you can leave this field empty
.constant('API_KEY', 'FwJrYfeD')
.constant('API_USER', 'apps@troop.work')
.constant('API_USER_NUT', 'mAkeL0gin')
.constant('ENV', 'prod')

.constant('TROOP_ICON_URL', 'https://troop-prod-main.s3.amazonaws.com/user11/-KHunVSBsu3wCsjXpV62_original_new_troop_icon.png')
.constant('TROOP_VIDEO_1_URL', 'https://troop-prod-main.s3.amazonaws.com/undefined/-KOI_-Vy7e0L6Ivno65z_original_Card.mp4')
.constant('TROOP_VIDEO_2_URL', 'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4iZxebfoLGHHt6ie_original_-K9ol1IyyndOMddr_mla_original_SAAS_Video_3.mp4')
.constant('TROOP_CLIPBOARD', 'https://troop-prod-main.s3.amazonaws.com/user15/-KIUbI_K9RidwtEKc54e_original_clipboard.png')

.constant('DEFAULT_AVATAR_ICON_URL', 'https://troop-staging.s3.amazonaws.com/b7d8a6d3-084d-4e64-8892-51063cc597f7/-K8uGZUyJ_HIQOFLcX19_large_default-avatar.png')

.constant('DEFAULT_STARTER_BOARD_ID', '-KBshqNu0I7wj9LGLzad')

.constant('LOG_LEVEL', 'error') //possible values:  off, error, warn, info, log, debug, all

.constant('DEMO_TROOP_ID', '-KGzKR9AOVIwWY-nnND')
.constant('HELP_TROOP_ID', '-KGzXslk_r_hXlBLXdRB')
.constant('HELP_TROOP_BOARD_ID', '-KOGh9ozC_7pq3qZSpB7')

.constant('ANIMAL_AVATARS', [
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4iedU-hFldqNfPkl_original_-KBfeHWiJX_cmsLhfgxp_original_Donkey.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4ief3zge8syWY408_original_-KBfeHWnpYlyAAqzcJW__original_Fox.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4ielz9Atwz2B-Qqa_original_-KBfeHWof2yMu-PNPr7H_original_Pig.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4ieqo-Iy4-eYVvTT_original_-KBfeHWvp8w9d_45f2oP_original_Bear.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4ietRW_10uKFVlBx_original_-KBfeHWwoPfhEViTJGhv_original_Lion.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4iew76YM8Xcvp8YN_original_-KBfeHX-0rR1nFLNFcf5_original_Deer.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4ieyKffs6DSG_CY0_original_-KBfeHX1B69wmzUx_LQG_original_Giraffe.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4if0dzKGnTYSAkba_original_-KBfeHX6ut5iLK8fXY3M_original_Horse.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4if18ZdZl7OMSnqO_original_-KBfeHX8Iy7rz8JF6XfQ_original_Racoon.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4if7jnGreyylQ_O__original_-KBfeHXASJC8Zx4Ymyjx_original_Cow.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4ifAYaZ96vmr-C6T_original_-KBfeHXCE4XoQtjzXoq3_original_Bunny.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4ifCKen43uuaHXt-_original_-KBfeHXDj1sM6PHSSnDA_original_Tiger.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4ifDeDMG0qtjdt3w_original_-KBfeHXErodhBMQcRgtt_original_Wolverine.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4ifFmnP6zUSd-cB9_original_-KBfeHXJQKs6VNGDPXIB_original_Panda.png',
  'https://troop-prod-main.s3.amazonaws.com/user12/-KHh4ifGQop8sGPQEEFj_original_-KBfeHXPcK0WBbuaVxZc_original_Cat.png'
])
.constant('DEFAULT_VIEW_SETTINGS', {
  card: {
    visible: true,
    imageSize: 'thumbnail', // ’thumbnail’, ‘medium’, ‘panoramic’, ‘large’, ‘macro’
    showHeader: true
  },
  tag: {
    visible: true,
    showImage: true
  },
  chat: {
    visible: true
  },
  grid:{
    visible: true,
    showTitle: true
  },
  list: {
    visible: true,
    showImage: true,
    // showTitle: true,
    showAuthor: true,
    showDate: true,
    showTags: false
  },
  calendar: {
    visible: true
  },
  document: {
    visible: true
  }
})
.constant('REGEX', {
  url: /^((?:http|ftp)s?:\/\/)?(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?(?:\/?|[\/?]\S+)$/i,
  urlFindReplace: /(?![^<]*>|[^<>]*<\/)((http:|https:)\/\/[a-zA-Z0-9&#=.\/\-?_]+\s{1})/gi,
  emailFileReplace: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/gi
})
.constant('MIME_TYPES', {
  '_default': 'application/octet-stream',
  'a'      : 'application/octet-stream',
  'ai'     : 'application/postscript',
  'aif'    : 'audio/x-aiff',
  'aifc'   : 'audio/x-aiff',
  'aiff'   : 'audio/x-aiff',
  'au'     : 'audio/basic',
  'avi'    : 'video/x-msvideo',
  'bat'    : 'text/plain',
  'bin'    : 'application/octet-stream',
  'bmp'    : 'image/x-ms-bmp',
  'c'      : 'text/plain',
  'cbr'    : 'application/x-cdisplay',
  'cdf'    : 'application/x-cdf',
  'csh'    : 'application/x-csh',
  'css'    : 'text/css',
  'dll'    : 'application/octet-stream',
  'doc'    : 'application/msword',
  'docx'   : 'application/msword',
  'dot'    : 'application/msword',
  'dvi'    : 'application/x-dvi',
  'eml'    : 'message/rfc822',
  'eps'    : 'application/postscript',
  'epub'   : 'application/epub+zip',
  'etx'    : 'text/x-setext',
  'exe'    : 'application/octet-stream',
  'gif'    : 'image/gif',
  'gtar'   : 'application/x-gtar',
  'h'      : 'text/plain',
  'hdf'    : 'application/x-hdf',
  'htm'    : 'text/html',
  'html'   : 'text/html',
  'jpe'    : 'image/jpeg',
  'jpeg'   : 'image/jpeg',
  'jpg'    : 'image/jpeg',
  'js'     : 'application/x-javascript',
  'key'    : 'application/x-iwork-keynote-sffkey',
  'keynote': 'application/x-iwork-keynote-sffkey',
  'ksh'    : 'text/plain',
  'latex'  : 'application/x-latex',
  'm1v'    : 'video/mpeg',
  'man'    : 'application/x-troff-man',
  'me'     : 'application/x-troff-me',
  'mht'    : 'message/rfc822',
  'mhtml'  : 'message/rfc822',
  'mif'    : 'application/x-mif',
  'mov'    : 'video/quicktime',
  'movie'  : 'video/x-sgi-movie',
  'mp2'    : 'audio/mpeg',
  'mp3'    : 'audio/mpeg',
  'mp4'    : 'video/mp4',
  'mpa'    : 'video/mpeg',
  'mpe'    : 'video/mpeg',
  'mpeg'   : 'video/mpeg',
  'mpg'    : 'video/mpeg',
  'ms'     : 'application/x-troff-ms',
  'nc'     : 'application/x-netcdf',
  'numbers': 'application/x-iwork-numbers-sffnumbers',
  'nws'    : 'message/rfc822',
  'o'      : 'application/octet-stream',
  'obj'    : 'application/octet-stream',
  'oda'    : 'application/oda',
  'pages'  : 'application/x-iwork-pages-sffpages',
  'pbm'    : 'image/x-portable-bitmap',
  'pdf'    : 'application/pdf',
  'pfx'    : 'application/x-pkcs12',
  'pgm'    : 'image/x-portable-graymap',
  'png'    : 'image/png',
  'pnm'    : 'image/x-portable-anymap',
  'pot'    : 'application/vnd.ms-powerpoint',
  'ppa'    : 'application/vnd.ms-powerpoint',
  'ppm'    : 'image/x-portable-pixmap',
  'pps'    : 'application/vnd.ms-powerpoint',
  'ppt'    : 'application/vnd.ms-powerpoint',
  'pptx'   : 'application/vnd.ms-powerpoint',
  'ps'     : 'application/postscript',
  'pwz'    : 'application/vnd.ms-powerpoint',
  'py'     : 'text/x-python',
  'pyc'    : 'application/x-python-code',
  'pyo'    : 'application/x-python-code',
  'qt'     : 'video/quicktime',
  'ra'     : 'audio/x-pn-realaudio',
  'ram'    : 'application/x-pn-realaudio',
  'ras'    : 'image/x-cmu-raster',
  'rdf'    : 'application/xml',
  'rgb'    : 'image/x-rgb',
  'roff'   : 'application/x-troff',
  'rtx'    : 'text/richtext',
  'sgm'    : 'text/x-sgml',
  'sgml'   : 'text/x-sgml',
  'sh'     : 'application/x-sh',
  'shar'   : 'application/x-shar',
  'snd'    : 'audio/basic',
  'so'     : 'application/octet-stream',
  'src'    : 'application/x-wais-source',
  'swf'    : 'application/x-shockwave-flash',
  't'      : 'application/x-troff',
  'tar'    : 'application/x-tar',
  'tcl'    : 'application/x-tcl',
  'tex'    : 'application/x-tex',
  'texi'   : 'application/x-texinfo',
  'texinfo': 'application/x-texinfo',
  'tif'    : 'image/tiff',
  'tiff'   : 'image/tiff',
  'tr'     : 'application/x-troff',
  'tsv'    : 'text/tab-separated-values',
  'txt'    : 'text/plain',
  'ustar'  : 'application/x-ustar',
  'vcf'    : 'text/x-vcard',
  'wav'    : 'audio/x-wav',
  'wiz'    : 'application/msword',
  'wsdl'   : 'application/xml',
  'xbm'    : 'image/x-xbitmap',
  'xlb'    : 'application/vnd.ms-excel',
  'xls'    : 'application/vnd.ms-excel',
  'xlsx'   : 'application/vnd.ms-excel',
  'xml'    : 'text/xml',
  'xpdl'   : 'application/xml',
  'xpm'    : 'image/x-xpixmap',
  'xsl'    : 'application/xml',
  'xwd'    : 'image/x-xwindowdump',
  'zip'    : 'application/zip'
})
.constant('IMAGE_TYPES', [
  'image/gif',
  'image/jpeg',
  'image/png'
])
.constant('COUNTRY_PHONE_CODES', [
  {
     "name":"United States",
     "dial_code":"+1",
     "code":"US"
  },
  {
     "name":"Israel",
     "dial_code":"+972",
     "code":"IL"
  },
  {
     "name":"Afghanistan",
     "dial_code":"+93",
     "code":"AF"
  },
  {
     "name":"Albania",
     "dial_code":"+355",
     "code":"AL"
  },
  {
     "name":"Algeria",
     "dial_code":"+213",
     "code":"DZ"
  },
  {
     "name":"AmericanSamoa",
     "dial_code":"+1 684",
     "code":"AS"
  },
  {
     "name":"Andorra",
     "dial_code":"+376",
     "code":"AD"
  },
  {
     "name":"Angola",
     "dial_code":"+244",
     "code":"AO"
  },
  {
     "name":"Anguilla",
     "dial_code":"+1 264",
     "code":"AI"
  },
  {
     "name":"Antigua and Barbuda",
     "dial_code":"+1268",
     "code":"AG"
  },
  {
     "name":"Argentina",
     "dial_code":"+54",
     "code":"AR"
  },
  {
     "name":"Armenia",
     "dial_code":"+374",
     "code":"AM"
  },
  {
     "name":"Aruba",
     "dial_code":"+297",
     "code":"AW"
  },
  {
     "name":"Australia",
     "dial_code":"+61",
     "code":"AU"
  },
  {
     "name":"Austria",
     "dial_code":"+43",
     "code":"AT"
  },
  {
     "name":"Azerbaijan",
     "dial_code":"+994",
     "code":"AZ"
  },
  {
     "name":"Bahamas",
     "dial_code":"+1 242",
     "code":"BS"
  },
  {
     "name":"Bahrain",
     "dial_code":"+973",
     "code":"BH"
  },
  {
     "name":"Bangladesh",
     "dial_code":"+880",
     "code":"BD"
  },
  {
     "name":"Barbados",
     "dial_code":"+1 246",
     "code":"BB"
  },
  {
     "name":"Belarus",
     "dial_code":"+375",
     "code":"BY"
  },
  {
     "name":"Belgium",
     "dial_code":"+32",
     "code":"BE"
  },
  {
     "name":"Belize",
     "dial_code":"+501",
     "code":"BZ"
  },
  {
     "name":"Benin",
     "dial_code":"+229",
     "code":"BJ"
  },
  {
     "name":"Bermuda",
     "dial_code":"+1 441",
     "code":"BM"
  },
  {
     "name":"Bhutan",
     "dial_code":"+975",
     "code":"BT"
  },
  {
     "name":"Bosnia and Herzegovina",
     "dial_code":"+387",
     "code":"BA"
  },
  {
     "name":"Botswana",
     "dial_code":"+267",
     "code":"BW"
  },
  {
     "name":"Brazil",
     "dial_code":"+55",
     "code":"BR"
  },
  {
     "name":"British Indian Ocean Territory",
     "dial_code":"+246",
     "code":"IO"
  },
  {
     "name":"Bulgaria",
     "dial_code":"+359",
     "code":"BG"
  },
  {
     "name":"Burkina Faso",
     "dial_code":"+226",
     "code":"BF"
  },
  {
     "name":"Burundi",
     "dial_code":"+257",
     "code":"BI"
  },
  {
     "name":"Cambodia",
     "dial_code":"+855",
     "code":"KH"
  },
  {
     "name":"Cameroon",
     "dial_code":"+237",
     "code":"CM"
  },
  {
     "name":"Canada",
     "dial_code":"+1",
     "code":"CA"
  },
  {
     "name":"Cape Verde",
     "dial_code":"+238",
     "code":"CV"
  },
  {
     "name":"Cayman Islands",
     "dial_code":"+ 345",
     "code":"KY"
  },
  {
     "name":"Central African Republic",
     "dial_code":"+236",
     "code":"CF"
  },
  {
     "name":"Chad",
     "dial_code":"+235",
     "code":"TD"
  },
  {
     "name":"Chile",
     "dial_code":"+56",
     "code":"CL"
  },
  {
     "name":"China",
     "dial_code":"+86",
     "code":"CN"
  },
  {
     "name":"Christmas Island",
     "dial_code":"+61",
     "code":"CX"
  },
  {
     "name":"Colombia",
     "dial_code":"+57",
     "code":"CO"
  },
  {
     "name":"Comoros",
     "dial_code":"+269",
     "code":"KM"
  },
  {
     "name":"Congo",
     "dial_code":"+242",
     "code":"CG"
  },
  {
     "name":"Cook Islands",
     "dial_code":"+682",
     "code":"CK"
  },
  {
     "name":"Costa Rica",
     "dial_code":"+506",
     "code":"CR"
  },
  {
     "name":"Croatia",
     "dial_code":"+385",
     "code":"HR"
  },
  {
     "name":"Cuba",
     "dial_code":"+53",
     "code":"CU"
  },
  {
     "name":"Cyprus",
     "dial_code":"+537",
     "code":"CY"
  },
  {
     "name":"Czech Republic",
     "dial_code":"+420",
     "code":"CZ"
  },
  {
     "name":"Denmark",
     "dial_code":"+45",
     "code":"DK"
  },
  {
     "name":"Djibouti",
     "dial_code":"+253",
     "code":"DJ"
  },
  {
     "name":"Dominica",
     "dial_code":"+1 767",
     "code":"DM"
  },
  {
     "name":"Dominican Republic",
     "dial_code":"+1 849",
     "code":"DO"
  },
  {
     "name":"Ecuador",
     "dial_code":"+593",
     "code":"EC"
  },
  {
     "name":"Egypt",
     "dial_code":"+20",
     "code":"EG"
  },
  {
     "name":"El Salvador",
     "dial_code":"+503",
     "code":"SV"
  },
  {
     "name":"Equatorial Guinea",
     "dial_code":"+240",
     "code":"GQ"
  },
  {
     "name":"Eritrea",
     "dial_code":"+291",
     "code":"ER"
  },
  {
     "name":"Estonia",
     "dial_code":"+372",
     "code":"EE"
  },
  {
     "name":"Ethiopia",
     "dial_code":"+251",
     "code":"ET"
  },
  {
     "name":"Faroe Islands",
     "dial_code":"+298",
     "code":"FO"
  },
  {
     "name":"Fiji",
     "dial_code":"+679",
     "code":"FJ"
  },
  {
     "name":"Finland",
     "dial_code":"+358",
     "code":"FI"
  },
  {
     "name":"France",
     "dial_code":"+33",
     "code":"FR"
  },
  {
     "name":"French Guiana",
     "dial_code":"+594",
     "code":"GF"
  },
  {
     "name":"French Polynesia",
     "dial_code":"+689",
     "code":"PF"
  },
  {
     "name":"Gabon",
     "dial_code":"+241",
     "code":"GA"
  },
  {
     "name":"Gambia",
     "dial_code":"+220",
     "code":"GM"
  },
  {
     "name":"Georgia",
     "dial_code":"+995",
     "code":"GE"
  },
  {
     "name":"Germany",
     "dial_code":"+49",
     "code":"DE"
  },
  {
     "name":"Ghana",
     "dial_code":"+233",
     "code":"GH"
  },
  {
     "name":"Gibraltar",
     "dial_code":"+350",
     "code":"GI"
  },
  {
     "name":"Greece",
     "dial_code":"+30",
     "code":"GR"
  },
  {
     "name":"Greenland",
     "dial_code":"+299",
     "code":"GL"
  },
  {
     "name":"Grenada",
     "dial_code":"+1 473",
     "code":"GD"
  },
  {
     "name":"Guadeloupe",
     "dial_code":"+590",
     "code":"GP"
  },
  {
     "name":"Guam",
     "dial_code":"+1 671",
     "code":"GU"
  },
  {
     "name":"Guatemala",
     "dial_code":"+502",
     "code":"GT"
  },
  {
     "name":"Guinea",
     "dial_code":"+224",
     "code":"GN"
  },
  {
     "name":"Guinea-Bissau",
     "dial_code":"+245",
     "code":"GW"
  },
  {
     "name":"Guyana",
     "dial_code":"+595",
     "code":"GY"
  },
  {
     "name":"Haiti",
     "dial_code":"+509",
     "code":"HT"
  },
  {
     "name":"Honduras",
     "dial_code":"+504",
     "code":"HN"
  },
  {
     "name":"Hungary",
     "dial_code":"+36",
     "code":"HU"
  },
  {
     "name":"Iceland",
     "dial_code":"+354",
     "code":"IS"
  },
  {
     "name":"India",
     "dial_code":"+91",
     "code":"IN"
  },
  {
     "name":"Indonesia",
     "dial_code":"+62",
     "code":"ID"
  },
  {
     "name":"Iraq",
     "dial_code":"+964",
     "code":"IQ"
  },
  {
     "name":"Ireland",
     "dial_code":"+353",
     "code":"IE"
  },
  {
     "name":"Israel",
     "dial_code":"+972",
     "code":"IL"
  },
  {
     "name":"Italy",
     "dial_code":"+39",
     "code":"IT"
  },
  {
     "name":"Jamaica",
     "dial_code":"+1 876",
     "code":"JM"
  },
  {
     "name":"Japan",
     "dial_code":"+81",
     "code":"JP"
  },
  {
     "name":"Jordan",
     "dial_code":"+962",
     "code":"JO"
  },
  {
     "name":"Kazakhstan",
     "dial_code":"+7 7",
     "code":"KZ"
  },
  {
     "name":"Kenya",
     "dial_code":"+254",
     "code":"KE"
  },
  {
     "name":"Kiribati",
     "dial_code":"+686",
     "code":"KI"
  },
  {
     "name":"Kuwait",
     "dial_code":"+965",
     "code":"KW"
  },
  {
     "name":"Kyrgyzstan",
     "dial_code":"+996",
     "code":"KG"
  },
  {
     "name":"Latvia",
     "dial_code":"+371",
     "code":"LV"
  },
  {
     "name":"Lebanon",
     "dial_code":"+961",
     "code":"LB"
  },
  {
     "name":"Lesotho",
     "dial_code":"+266",
     "code":"LS"
  },
  {
     "name":"Liberia",
     "dial_code":"+231",
     "code":"LR"
  },
  {
     "name":"Liechtenstein",
     "dial_code":"+423",
     "code":"LI"
  },
  {
     "name":"Lithuania",
     "dial_code":"+370",
     "code":"LT"
  },
  {
     "name":"Luxembourg",
     "dial_code":"+352",
     "code":"LU"
  },
  {
     "name":"Madagascar",
     "dial_code":"+261",
     "code":"MG"
  },
  {
     "name":"Malawi",
     "dial_code":"+265",
     "code":"MW"
  },
  {
     "name":"Malaysia",
     "dial_code":"+60",
     "code":"MY"
  },
  {
     "name":"Maldives",
     "dial_code":"+960",
     "code":"MV"
  },
  {
     "name":"Mali",
     "dial_code":"+223",
     "code":"ML"
  },
  {
     "name":"Malta",
     "dial_code":"+356",
     "code":"MT"
  },
  {
     "name":"Marshall Islands",
     "dial_code":"+692",
     "code":"MH"
  },
  {
     "name":"Martinique",
     "dial_code":"+596",
     "code":"MQ"
  },
  {
     "name":"Mauritania",
     "dial_code":"+222",
     "code":"MR"
  },
  {
     "name":"Mauritius",
     "dial_code":"+230",
     "code":"MU"
  },
  {
     "name":"Mayotte",
     "dial_code":"+262",
     "code":"YT"
  },
  {
     "name":"Mexico",
     "dial_code":"+52",
     "code":"MX"
  },
  {
     "name":"Monaco",
     "dial_code":"+377",
     "code":"MC"
  },
  {
     "name":"Mongolia",
     "dial_code":"+976",
     "code":"MN"
  },
  {
     "name":"Montenegro",
     "dial_code":"+382",
     "code":"ME"
  },
  {
     "name":"Montserrat",
     "dial_code":"+1664",
     "code":"MS"
  },
  {
     "name":"Morocco",
     "dial_code":"+212",
     "code":"MA"
  },
  {
     "name":"Myanmar",
     "dial_code":"+95",
     "code":"MM"
  },
  {
     "name":"Namibia",
     "dial_code":"+264",
     "code":"NA"
  },
  {
     "name":"Nauru",
     "dial_code":"+674",
     "code":"NR"
  },
  {
     "name":"Nepal",
     "dial_code":"+977",
     "code":"NP"
  },
  {
     "name":"Netherlands",
     "dial_code":"+31",
     "code":"NL"
  },
  {
     "name":"Netherlands Antilles",
     "dial_code":"+599",
     "code":"AN"
  },
  {
     "name":"New Caledonia",
     "dial_code":"+687",
     "code":"NC"
  },
  {
     "name":"New Zealand",
     "dial_code":"+64",
     "code":"NZ"
  },
  {
     "name":"Nicaragua",
     "dial_code":"+505",
     "code":"NI"
  },
  {
     "name":"Niger",
     "dial_code":"+227",
     "code":"NE"
  },
  {
     "name":"Nigeria",
     "dial_code":"+234",
     "code":"NG"
  },
  {
     "name":"Niue",
     "dial_code":"+683",
     "code":"NU"
  },
  {
     "name":"Norfolk Island",
     "dial_code":"+672",
     "code":"NF"
  },
  {
     "name":"Northern Mariana Islands",
     "dial_code":"+1 670",
     "code":"MP"
  },
  {
     "name":"Norway",
     "dial_code":"+47",
     "code":"NO"
  },
  {
     "name":"Oman",
     "dial_code":"+968",
     "code":"OM"
  },
  {
     "name":"Pakistan",
     "dial_code":"+92",
     "code":"PK"
  },
  {
     "name":"Palau",
     "dial_code":"+680",
     "code":"PW"
  },
  {
     "name":"Panama",
     "dial_code":"+507",
     "code":"PA"
  },
  {
     "name":"Papua New Guinea",
     "dial_code":"+675",
     "code":"PG"
  },
  {
     "name":"Paraguay",
     "dial_code":"+595",
     "code":"PY"
  },
  {
     "name":"Peru",
     "dial_code":"+51",
     "code":"PE"
  },
  {
     "name":"Philippines",
     "dial_code":"+63",
     "code":"PH"
  },
  {
     "name":"Poland",
     "dial_code":"+48",
     "code":"PL"
  },
  {
     "name":"Portugal",
     "dial_code":"+351",
     "code":"PT"
  },
  {
     "name":"Puerto Rico",
     "dial_code":"+1 939",
     "code":"PR"
  },
  {
     "name":"Qatar",
     "dial_code":"+974",
     "code":"QA"
  },
  {
     "name":"Romania",
     "dial_code":"+40",
     "code":"RO"
  },
  {
     "name":"Rwanda",
     "dial_code":"+250",
     "code":"RW"
  },
  {
     "name":"Samoa",
     "dial_code":"+685",
     "code":"WS"
  },
  {
     "name":"San Marino",
     "dial_code":"+378",
     "code":"SM"
  },
  {
     "name":"Saudi Arabia",
     "dial_code":"+966",
     "code":"SA"
  },
  {
     "name":"Senegal",
     "dial_code":"+221",
     "code":"SN"
  },
  {
     "name":"Serbia",
     "dial_code":"+381",
     "code":"RS"
  },
  {
     "name":"Seychelles",
     "dial_code":"+248",
     "code":"SC"
  },
  {
     "name":"Sierra Leone",
     "dial_code":"+232",
     "code":"SL"
  },
  {
     "name":"Singapore",
     "dial_code":"+65",
     "code":"SG"
  },
  {
     "name":"Slovakia",
     "dial_code":"+421",
     "code":"SK"
  },
  {
     "name":"Slovenia",
     "dial_code":"+386",
     "code":"SI"
  },
  {
     "name":"Solomon Islands",
     "dial_code":"+677",
     "code":"SB"
  },
  {
     "name":"South Africa",
     "dial_code":"+27",
     "code":"ZA"
  },
  {
     "name":"South Georgia and the South Sandwich Islands",
     "dial_code":"+500",
     "code":"GS"
  },
  {
     "name":"Spain",
     "dial_code":"+34",
     "code":"ES"
  },
  {
     "name":"Sri Lanka",
     "dial_code":"+94",
     "code":"LK"
  },
  {
     "name":"Sudan",
     "dial_code":"+249",
     "code":"SD"
  },
  {
     "name":"Suriname",
     "dial_code":"+597",
     "code":"SR"
  },
  {
     "name":"Swaziland",
     "dial_code":"+268",
     "code":"SZ"
  },
  {
     "name":"Sweden",
     "dial_code":"+46",
     "code":"SE"
  },
  {
     "name":"Switzerland",
     "dial_code":"+41",
     "code":"CH"
  },
  {
     "name":"Tajikistan",
     "dial_code":"+992",
     "code":"TJ"
  },
  {
     "name":"Thailand",
     "dial_code":"+66",
     "code":"TH"
  },
  {
     "name":"Togo",
     "dial_code":"+228",
     "code":"TG"
  },
  {
     "name":"Tokelau",
     "dial_code":"+690",
     "code":"TK"
  },
  {
     "name":"Tonga",
     "dial_code":"+676",
     "code":"TO"
  },
  {
     "name":"Trinidad and Tobago",
     "dial_code":"+1 868",
     "code":"TT"
  },
  {
     "name":"Tunisia",
     "dial_code":"+216",
     "code":"TN"
  },
  {
     "name":"Turkey",
     "dial_code":"+90",
     "code":"TR"
  },
  {
     "name":"Turkmenistan",
     "dial_code":"+993",
     "code":"TM"
  },
  {
     "name":"Turks and Caicos Islands",
     "dial_code":"+1 649",
     "code":"TC"
  },
  {
     "name":"Tuvalu",
     "dial_code":"+688",
     "code":"TV"
  },
  {
     "name":"Uganda",
     "dial_code":"+256",
     "code":"UG"
  },
  {
     "name":"Ukraine",
     "dial_code":"+380",
     "code":"UA"
  },
  {
     "name":"United Arab Emirates",
     "dial_code":"+971",
     "code":"AE"
  },
  {
     "name":"United Kingdom",
     "dial_code":"+44",
     "code":"GB"
  },
  {
     "name":"Uruguay",
     "dial_code":"+598",
     "code":"UY"
  },
  {
     "name":"Uzbekistan",
     "dial_code":"+998",
     "code":"UZ"
  },
  {
     "name":"Vanuatu",
     "dial_code":"+678",
     "code":"VU"
  },
  {
     "name":"Wallis and Futuna",
     "dial_code":"+681",
     "code":"WF"
  },
  {
     "name":"Yemen",
     "dial_code":"+967",
     "code":"YE"
  },
  {
     "name":"Zambia",
     "dial_code":"+260",
     "code":"ZM"
  },
  {
     "name":"Zimbabwe",
     "dial_code":"+263",
     "code":"ZW"
  },
  {
     "name":"land Islands",
     "dial_code":"",
     "code":"AX"
  },
  {
     "name":"Antarctica",
     "dial_code":null,
     "code":"AQ"
  },
  {
     "name":"Bolivia, Plurinational State of",
     "dial_code":"+591",
     "code":"BO"
  },
  {
     "name":"Brunei Darussalam",
     "dial_code":"+673",
     "code":"BN"
  },
  {
     "name":"Cocos (Keeling) Islands",
     "dial_code":"+61",
     "code":"CC"
  },
  {
     "name":"Congo, The Democratic Republic of the",
     "dial_code":"+243",
     "code":"CD"
  },
  {
     "name":"Cote d'Ivoire",
     "dial_code":"+225",
     "code":"CI"
  },
  {
     "name":"Falkland Islands (Malvinas)",
     "dial_code":"+500",
     "code":"FK"
  },
  {
     "name":"Guernsey",
     "dial_code":"+44",
     "code":"GG"
  },
  {
     "name":"Holy See (Vatican City State)",
     "dial_code":"+379",
     "code":"VA"
  },
  {
     "name":"Hong Kong",
     "dial_code":"+852",
     "code":"HK"
  },
  {
     "name":"Iran, Islamic Republic of",
     "dial_code":"+98",
     "code":"IR"
  },
  {
     "name":"Isle of Man",
     "dial_code":"+44",
     "code":"IM"
  },
  {
     "name":"Jersey",
     "dial_code":"+44",
     "code":"JE"
  },
  {
     "name":"Korea, Democratic People's Republic of",
     "dial_code":"+850",
     "code":"KP"
  },
  {
     "name":"Korea, Republic of",
     "dial_code":"+82",
     "code":"KR"
  },
  {
     "name":"Lao People's Democratic Republic",
     "dial_code":"+856",
     "code":"LA"
  },
  {
     "name":"Libyan Arab Jamahiriya",
     "dial_code":"+218",
     "code":"LY"
  },
  {
     "name":"Macao",
     "dial_code":"+853",
     "code":"MO"
  },
  {
     "name":"Macedonia, The Former Yugoslav Republic of",
     "dial_code":"+389",
     "code":"MK"
  },
  {
     "name":"Micronesia, Federated States of",
     "dial_code":"+691",
     "code":"FM"
  },
  {
     "name":"Moldova, Republic of",
     "dial_code":"+373",
     "code":"MD"
  },
  {
     "name":"Mozambique",
     "dial_code":"+258",
     "code":"MZ"
  },
  {
     "name":"Palestinian Territory, Occupied",
     "dial_code":"+970",
     "code":"PS"
  },
  {
     "name":"Pitcairn",
     "dial_code":"+872",
     "code":"PN"
  },
  {
     "name":"Réunion",
     "dial_code":"+262",
     "code":"RE"
  },
  {
     "name":"Russia",
     "dial_code":"+7",
     "code":"RU"
  },
  {
     "name":"Saint Barthélemy",
     "dial_code":"+590",
     "code":"BL"
  },
  {
     "name":"Saint Helena, Ascension and Tristan Da Cunha",
     "dial_code":"+290",
     "code":"SH"
  },
  {
     "name":"Saint Kitts and Nevis",
     "dial_code":"+1 869",
     "code":"KN"
  },
  {
     "name":"Saint Lucia",
     "dial_code":"+1 758",
     "code":"LC"
  },
  {
     "name":"Saint Martin",
     "dial_code":"+590",
     "code":"MF"
  },
  {
     "name":"Saint Pierre and Miquelon",
     "dial_code":"+508",
     "code":"PM"
  },
  {
     "name":"Saint Vincent and the Grenadines",
     "dial_code":"+1 784",
     "code":"VC"
  },
  {
     "name":"Sao Tome and Principe",
     "dial_code":"+239",
     "code":"ST"
  },
  {
     "name":"Somalia",
     "dial_code":"+252",
     "code":"SO"
  },
  {
     "name":"Svalbard and Jan Mayen",
     "dial_code":"+47",
     "code":"SJ"
  },
  {
     "name":"Syrian Arab Republic",
     "dial_code":"+963",
     "code":"SY"
  },
  {
     "name":"Taiwan, Province of China",
     "dial_code":"+886",
     "code":"TW"
  },
  {
     "name":"Tanzania, United Republic of",
     "dial_code":"+255",
     "code":"TZ"
  },
  {
     "name":"Timor-Leste",
     "dial_code":"+670",
     "code":"TL"
  },
  {
     "name":"Venezuela, Bolivarian Republic of",
     "dial_code":"+58",
     "code":"VE"
  },
  {
     "name":"Viet Nam",
     "dial_code":"+84",
     "code":"VN"
  },
  {
     "name":"Virgin Islands, British",
     "dial_code":"+1 284",
     "code":"VG"
  },
  {
     "name":"Virgin Islands, U.S.",
     "dial_code":"+1 340",
     "code":"VI"
  }
])
.run([
  '$rootScope',
  'ENV',
  function($rootScope, ENV) {
    $rootScope.env = ENV;
  }
]);
