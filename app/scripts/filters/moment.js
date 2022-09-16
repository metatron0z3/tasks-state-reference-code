'use strict';

angular.module('webClientApp')
  .filter(
    'moment',
    [
      function() {
        var that = this;

        this.dateDiff = function(value) {
          var momentDate = moment(value);
          var now = moment();
          var minutesDiff = now.diff(momentDate, 'minutes', true);
          var hoursDiff = now.diff(momentDate, 'hours', true);
          var daysDiff = now.diff(momentDate, 'days', true);
          var weeksDiff = now.diff(momentDate, 'weeks', true);
          var monthsDiff = now.diff(momentDate, 'months', true);
          var yearsDiff = now.diff(momentDate, 'years', true);

          return {
            momentDate: momentDate,
            now: now,
            minutesDiff: minutesDiff,
            hoursDiff: hoursDiff,
            daysDiff: daysDiff,
            isWithinAMinute: 0 <= minutesDiff && minutesDiff <= 1,
            isWithinAHour: 0 <= hoursDiff && hoursDiff <= 1,
            isWithinADay: 0 <= daysDiff && daysDiff <= 1,
            isWithinAWeek: 0 <= weeksDiff && weeksDiff <= 1,
            isWithinAMonth: 0 <= monthsDiff && monthsDiff <= 1,
            isWithinAYear: 0 <= yearsDiff && yearsDiff <= 1,
            isMoreThanAYear: yearsDiff > 1
          };
        };

        return function(timestamp, format) {

          var formattedTime = '';

          if ( ! format ) {
            var diff = that.dateDiff(timestamp);

            var format = 'MMM DD, YYYY';
            if (diff.isWithinADay) {
              format = 'h:mm a';
            }
            else if (diff.isWithinAWeek) {
              format = 'ddd';
            }
            else  if (diff.isWithinAYear) {
              format = 'MMM DD';
            }

            formattedTime = moment(timestamp).format(format);
          }
          else if ( format === 'extended-format' ) {
            var diff = that.dateDiff(timestamp);

            var currEntryDayOfYear = moment(timestamp).format('DDD');
            var today = moment(Date.now()).format('DDD');

            if ( today === currEntryDayOfYear ) {
              formattedTime = 'Today, ' + moment(timestamp).format('h:mm a');
            }
            else {
              formattedTime = moment(timestamp).format('ddd, MMM DD');
            }

          }
          else if ( format === 'note-format' ) {
            var diff = that.dateDiff(timestamp);

            var currEntryDayOfYear = moment(timestamp).format('DDD');
            var today = moment(Date.now()).format('DDD');
            var yesterday = moment(Date.now()).subtract(1, 'day').format('DDD');


            if ( today === currEntryDayOfYear ) {
              formattedTime = 'Today at ' + moment(timestamp).format('h:mma');
            }
            else if (yesterday === currEntryDayOfYear ) {
              formattedTime = 'Yesterday at ' + moment(timestamp).format('h:mma');
            }
            else {
              formattedTime = moment(timestamp).format('MMMM DD') + ' at ' + moment(timestamp).format('h:mma') ;
            }
          }
          else {
            formattedTime = moment(timestamp).format(format);
          }

          return formattedTime;
        };
      }
    ]
  );
