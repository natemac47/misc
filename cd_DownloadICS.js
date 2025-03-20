gs.include("sn_ex_emp_fd.eef_VTimezone");

var cd_DownloadICS = Class.create();

cd_DownloadICS.prototype = {
	initialize: function(request, response, processor) {
		this.processor = processor;
		this.request = request;
		this.response = response;
		this.type = this.request.getParameter("sysparm_type");
		this.spInstanceId = this.request.getParameter("sysparm_sp_instance_id");
		this.dateLogic =  new sn_cd.cd_IcsDateLogic();
		if (this.type === "holiday") {
			this.year = this.request.getParameter("sysparm_year");
			this.calendar = this.request.getParameter("sysparm_calendar");
		} else {
			this.sys_id = this.request.getParameter("sysparm_sys_id");
			if (this.sys_id === "null") {
				this.sys_id = null;
			}
		}
		this.icsString = '';
		this.events = [];
	},

	process: function() {
		this.response.setContentType("text/calendar; charset=UTF-8");
		if (this.type === "holiday") {
			this._downloadHolidayICS(this.year, this.calendar);
			this.response.setHeader("Content-Disposition", "inline; filename=Holidays_" + this.year + ".ics");
			this.processor.writeOutput(this.icsString);
		} else if (this.sys_id == null) {
			this._downloadEventICS();
			this.response.setHeader("Content-Disposition", "inline; filename=All_Upcoming_Events.ics");
			this.processor.writeOutput(this.icsString);
		} else {
			if (this.type === 'company_event') {
				this._downloadCompanyEventICS(this.sys_id);
			} else {
				this._downloadEventICS(this.sys_id);
			}
			if (this.events.length > 0) {
				var eventName = this.events[0].name.replace(/ /g, '_') + ".ics";
				eventName = eventName.replace(/,/, '_');
				this.response.setHeader("Content-Disposition", "inline; filename=" + eventName);
				this.processor.writeOutput(this.icsString);
			}
		}
	},
	
	/**
	* build holiday calendar events
	* @param year String
	* @param calendarId String sys_id of a calendar
	**/
	_downloadHolidayICS: function(year, calendarId) {
		var calendars = cd_ContentDelivery.getPortalContentByScheduleId(calendarId);
		if (!calendars.length) {
			return;
		}

		var firstCalendar = calendars[0];
		var grCalendar = new GlideRecord("cmn_schedule");

		if (!grCalendar.get(firstCalendar.schedule)) {
			return;
		}

		var start = new GlideDateTime();
		var end = new GlideDateTime();
		
		end.setMonthLocalTime(12);
		end.setDayOfMonthLocalTime(31); // end of this year

		if (year !== new GlideDateTime().getYearUTC().toString()) {
			start.addYearsLocalTime(1);
			start.setMonthLocalTime(1);
			start.setDayOfMonthLocalTime(1); // Jan 1st next year
			end.addYearsLocalTime(1); // end of next year
		}
		this._buildHolidayCalendarEvents(grCalendar, start, end);
	},

	_buildHolidayCalendarEvents: function(schedule, start, end) {
		var timeSpans;
		var i;
		var dateTime;
		var calStartEventTime;
		var calEndEventTime;
		var gdtEndTime;

		var timeSpan = new GlideRecord('cmn_schedule_span');
		timeSpan.addQuery('schedule', schedule.sys_id);
		timeSpan.query();
		while (timeSpan.next()) {
			var spanTZ;
	
			// if the time zone is not floating, use span from the associated schedule
			// if the time zone is floating, use the session's time zone
			if (timeSpan.schedule && timeSpan.schedule.time_zone) {
				spanTZ = timeSpan.schedule.time_zone;
			} else {
				spanTZ = gs.getSession().getTimeZoneName();
			}
			var scheduleSpan = new GlideScheduleTimeSpan(timeSpan, spanTZ);
			timeSpans = scheduleSpan.getSpans(new GlideScheduleDateTime(start), new GlideScheduleDateTime(end));
			
			for (i = 0; i < timeSpans.length; i += 1) {
				dateTime = timeSpans[i].getStart().getGlideDateTime();
				calStartEventTime = sn_ex_emp_fd.eef_VTimezone.generateDateTime(dateTime);
				gdtEndTime = new GlideDateTime(dateTime);
				gdtEndTime.addDaysLocalTime(1);
				calEndEventTime = sn_ex_emp_fd.eef_VTimezone.generateDateTime(gdtEndTime);
				this.events.push({
					name: scheduleSpan.getName(),
					calStartTime: calStartEventTime,
					calEndTime: calEndEventTime
				});
			}
		}

		var tzString = sn_ex_emp_fd.eef_VTimezone.generateVTimezone(calStartEventTime, calEndEventTime);
		this.icsString = "BEGIN:VCALENDAR\n" +
			"VERSION:2.0\n" +
			"CALSCALE:GREGORIAN\n";
		this.icsString += tzString;
		this._createEventDownload();
		this.icsString += "END:VCALENDAR";
	},

	_downloadEventICS: function(eventContentId) {
		var contentArray;
		var startDateTime;
		var calStartTime;
		var calEndTime;
		var endDateTime;
		var title;
		var i;
		var cleanEventText;
		var cleanEventTextRich;
		var regex;

		if (eventContentId) {
			contentArray = cd_ContentDelivery.getPortalContentById(eventContentId);
		} else {
			contentArray = cd_ContentDelivery.getContentForWidgetInstance(this.spInstanceId);
		}

		regex = /(<([^>]+)>)/ig;

		for (i = 0; i < contentArray.length; i += 1) {

			startDateTime = new GlideDateTime(contentArray[i].event_start);
			calStartTime = sn_ex_emp_fd.eef_VTimezone.generateDateTime(startDateTime);
			endDateTime = new GlideDateTime(contentArray[i].event_end);
			calEndTime = sn_ex_emp_fd.eef_VTimezone.generateDateTime(endDateTime);
			title = contentArray[i].title;

			// if there is rich text, use that as event details
			if (contentArray[i].rich_text) {
				cleanEventText = contentArray[i].rich_text.replace(regex, "\\n");
				cleanEventText = cleanEventText.replace(/&nbsp;/g, '');
				cleanEventText = cleanEventText.replace(/(?:\r\n|\r|\n)/g, '');
				
				cleanEventTextRich = contentArray[i].rich_text.replace(/&nbsp;/g, '');
				cleanEventTextRich = cleanEventTextRich.replace(/(?:\r\n|\r|\n)/g, '');
			}

			this.events.push({
				calStartTime: calStartTime,
				calEndTime: calEndTime,
				name: title,
				sysID: contentArray[i].sys_id,
				event_details: cleanEventText,
				event_details_rich: cleanEventTextRich
			});
		}

		var tzString = sn_ex_emp_fd.eef_VTimezone.generateVTimezone(calStartTime, calEndTime);
		this.icsString = "BEGIN:VCALENDAR\r\n" +
			"PRODID:-//Service-now.com//Outlook 11.0 MIMEDIR//EN\r\n" +
			"VERSION:2.0\r\n" +
			"CALSCALE:GREGORIAN\r\n";
		this.icsString += tzString;
		this._createEventDownload();
		this.icsString += "END:VCALENDAR";
	},

	_downloadCompanyEventICS: function(articleId) {
		var article = new sn_cd.cd_News().getArticleDetail(articleId);
		var startDateTime = new GlideDateTime(article.event.start_date);
		var calStartTime = sn_ex_emp_fd.eef_VTimezone.generateDateTime(startDateTime);
		var endDateTime = new GlideDateTime(article.event.end_date);
		var calEndTime = sn_ex_emp_fd.eef_VTimezone.generateDateTime(endDateTime);
		var cleanDetails;
		var cleanDetailsRich;
		if (article.rich_content_html) {
			cleanDetails = article.rich_content_html.replace(/(<([^>]+)>)/ig, '\\n').replace(/&nbsp;/g, '').replace(/(?:\r\n|\r|\n)/g, '');
			cleanDetailsRich = article.rich_content_html.replace(/&nbsp;/g, '').replace(/(?:\r\n|\r|\n)/g, '');
		}

		this.events.push({
			calStartTime: calStartTime,
			calEndTime: calEndTime,
			name: article.title,
			sysID: article.sys_id,
			event_details: cleanDetails,
			event_details_rich: cleanDetailsRich,
		});

		var tzString = sn_ex_emp_fd.eef_VTimezone.generateVTimezone(calStartTime, calEndTime);
		this.icsString = "BEGIN:VCALENDAR\r\n" +
			"PRODID:-//Service-now.com//Outlook 11.0 MIMEDIR//EN\r\n" +
			"VERSION:2.0\r\n" +
			"CALSCALE:GREGORIAN\r\n";
		this.icsString += tzString;
		this._createEventDownload();
		this.icsString += "END:VCALENDAR";
	},

	_createEventDownload: function() {
		var event;
		var i;
		
		var nowDateTime = new GlideDateTime();
		var dateTimeStamp = sn_ex_emp_fd.eef_VTimezone.generateDateTime(nowDateTime);
		var MAX_LENGTH = 70;

for (i = 0; i < this.events.length; i += 1) {
    var event_details = this.events[i].event_details ? this._wordWrap("DESCRIPTION:" + this.events[i].event_details, MAX_LENGTH) : "DESCRIPTION:";
    var event_details_rich = this.events[i].event_details_rich ? this._wordWrap("X-ALT-DESC;FMTTYPE=text/html:" + this.events[i].event_details_rich, MAX_LENGTH) + "\r\n" : "";
    if (event_details_rich) {
        event_details = this._wordWrap("DESCRIPTION:" + this.events[i].event_details_rich, MAX_LENGTH);
    }
    event =
        "BEGIN:VEVENT\r\n" +
        "SUMMARY:" + this.events[i].name + "\n" +
        "DTSTART:" + this.events[i].calStartTime + "\r\n" +
        "DTEND:" + this.events[i].calEndTime + "\r\n" +
        "DTSTAMP:" + dateTimeStamp + "\r\n" +
        "UID:" + gs.generateGUID() + "\r\n" + // Generate a unique UID
        event_details + "\r\n" +
        event_details_rich +
        "STATUS:CONFIRMED\n" +
        "SEQUENCE:3\n" +
        "BEGIN:VALARM\n" +
        "TRIGGER:-PT10M\n" +
        "DESCRIPTION:Pickup Reminder\n" +
        "ACTION:DISPLAY\n" +
        "END:VALARM\n" +
        "END:VEVENT\n";

    this.icsString += event;
}

	},

	_wordWrap: function(text, wrap) {
		var str = text;
		for (var i = 0; i + wrap < str.length; i += wrap) {
			str = str.substring(0, i + wrap).concat("\r\n\t", str.substring(i + wrap, str.length));
		}
		return str;
	},

	type: 'cd_DownloadICS'
};
