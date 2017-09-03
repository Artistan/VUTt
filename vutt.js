var parseTT = function() {

	var icsFormatter = function() {
		'use strict';

		var SEP = (navigator.appVersion.indexOf('Win') !== -1) ? '\r\n' : '\n';
		var CALSEP = (navigator.appVersion.indexOf('Win') !== -1) ? '\\r\\n' : '\\n';

		var calendarEvents = [];
		var calendarStart = [
			'BEGIN:VCALENDAR',
			'BEGIN:VTIMEZONE',
			'TZID:Europe/Amsterdam',
			'BEGIN:DAYLIGHT',
			'TZOFFSETFROM:+0100',
			'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
			'DTSTART:19810329T020000',
			'TZNAME:GMT+2',
			'TZOFFSETTO:+0200',
			'END:DAYLIGHT',
			'BEGIN:STANDARD',
			'TZOFFSETFROM:+0200',
			'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
			'DTSTART:19961027T030000',
			'TZNAME:GMT+1',
			'TZOFFSETTO:+0100',
			'END:STANDARD',
			'END:VTIMEZONE'
		].join(SEP);
		var calendarEnd = SEP + 'END:VCALENDAR';

		return {
			'events': function() {
				return calendarEvents;
			},

			'calendar': function() {
				return calendarStart + SEP + calendarEvents.join(SEP) + calendarEnd;
			},

			'addEvent': function(args) {
				let [code, date, weeks, begin, end, title, description, type, locations, staff, comment] = args;

				title = title + " (" + type + ")";

				let [day, month, year] = date.split("/");
				day = ('00' + day).substring(day.length);
				month = ('00' + month).substring(month.length);
				year = ('00' + year).substring(year.length);
				date = "20" + year + month + day;

				let [bhour, bmin] = begin.split(":");
				bhour = ('00' + bhour).substring(bhour.length);
				bmin = ('00' + bmin).substring(bmin.length);
				begin = date + "T" + bhour + bmin + "00";

				let [ehour, emin] = end.split(":");
				ehour = ('00' + ehour).substring(ehour.length);
				emin = ('00' + emin).substring(emin.length);
				end = date + "T" + ehour + emin + "00";

				description = [
					code == "" ? "" : "Code: " + code,
					staff == "" ? "" : CALSEP + "Staff: " + staff,
					description == "" ? "" : CALSEP + "Description: " + description,
					comment == "" ? "" : CALSEP + "Comment: " + comment
				].join("");

				let [w1, w2] = weeks.split("-");
				if (isNaN(w2)) {
					weeks = 1;
				} else {
					w1 = parseInt(w1);
					w2 = parseInt(w2);
					w2 = w2 >= w1 ? w2 : w2 + 52;
					weeks = w2 - w1 + 1;
				}

				var calendarEvent = [
					'BEGIN:VEVENT',
					'DTEND;TZID=Europe/Amsterdam:' + end,
					'LOCATION:' + locations,
					'DESCRIPTION:' + description,
					'SUMMARY:' + title,
					'DTSTART;TZID=Europe/Amsterdam:' + begin,
					(weeks == 1 ? "" : 'RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=' + weeks + SEP) + 'END:VEVENT'
				].join(SEP);

				calendarEvents.push(calendarEvent);
				return calendarEvent;
			},
			'download': function(filename) {
				if (calendarEvents.length < 1) {
					return false;
				}

				var calendar = calendarStart + SEP + calendarEvents.join(SEP) + calendarEnd;
				var blob = new Blob([calendar], {
					type: "text/calendar;charset=utf-8;"
				});
				if (window.navigator.msSaveOrOpenBlob) {
					window.navigator.msSaveBlob(blob, filename);
				} else {
					var elem = window.document.createElement('a');
					elem.href = window.URL.createObjectURL(blob);
					elem.download = filename;
					document.body.appendChild(elem);
					elem.click();
					document.body.removeChild(elem);
					window.URL.revokeObjectURL(elem.href);
				}
			}
		}
	}

	var cal = icsFormatter();
	var rows = document.querySelectorAll("table.spreadsheet tr:not(.columnTitles)");
	rows.forEach(
		function(row) {
			var fields = [];
			row.querySelectorAll("td").forEach(function(cell) {
				fields.push(cell.textContent.replace(/\s+/g, " ").trim());
			});
			cal.addEvent(fields);
		}
	);
	if (cal.events().length == 0) {
		if (window.location.hostname != "rooster.vu.nl") {
			alert("VUTt is unable to find the timetable information on the current page, and you don't seem to be on the Rooster website! Note that VUTt only works with VU's Rooster web app.");
		} else {
			alert("Although you seem to be on the Rooster website, VUTt can not find any timetable information on the current page! Either there is no timetable on this page, or you have found a bug. Please try once more and if you can't make it work, file a bug report.");
		}
	} else {
		var calname = document.querySelector("span.header-2-0-1");
		calname = (calname != null) ? calname.textContent.replace(/[^A-Za-z0-9]/g, " ").trim().replace(/\s+/g, "_").toLowerCase() : "";
		if (calname.length > 0) {
			cal.download(calname + ".ics");
		} else {
			cal.download("calendar.ics");
		}
	}
};
