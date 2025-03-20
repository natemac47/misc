//Updated for MHI calendars. Corresponding script include separate 

function eventCalendarLink (scope, elem, attr) {
	elem.keydown(function (e) {
		var target = $(e.target);
		if ((target.is('li') && target.parent().is('.controller')) || (target.is('a') && target.parent().is('.popup-body')))
		{
			var $focused = $(document.activeElement);
			switch (e.keyCode) {
				case 27:
					document.getElementById('anchor').click();
					document.getElementById("anchor").focus();
					break;
				case 35:
					$focused.parent().find(':last-child').focus();
					e.preventDefault();
					break;
				case 36:
					$focused.parent().find(':first-child').focus();
					e.preventDefault();
					break;
				case 37:
				case 38:
					if ($focused.prev().length)
						$focused.prev().focus();
					else
						$focused.parent().find(':last-child').focus();
					e.preventDefault();
					break;
				case 39:
				case 40:
					if ($focused.next().length)
						$focused.next().focus();
					else
						$focused.parent().find(':first-child').focus();
					e.preventDefault();
					break;
				case 13:
					// For IE
					if ($focused && !!document.documentMode && !/a/i.test($focused[0].tagName))
						$focused.click();
					break;
				case 9:
					if(target.is('a') && target.parent().is('.popup-body'))
						document.getElementById('anchor').click();
					break;
			}
		}
	});

scope.showTabContent = function ($event, $index) {
    $event.preventDefault();
    scope.activeTab = scope.data[$index === 0 ? 'thisYear' : 'nextYear']; // Set the active tab to the correct year.
    scope.selectedYear = $index;
};


scope.downloadEventSchedule = function () {
    if (!scope.data.isContentPreview) {
        scope.cdAnalytics.trackEvent('Calendar Download', scope.data.allYearItems);
    }

    const calendarId = scope.data.calSysId;
    const selectedYear = scope.selectedYear === 0 ? scope.data.thisYear : scope.data.nextYear;

    // Select events for the chosen year
    const eventsForYear = scope.selectedYear === 0 ? scope.data.thisYearItems : scope.data.nextYearItems;

    // Object to track unique event names
    const uniqueEventNames = {};
    const formattedEvents = eventsForYear.reduce((accumulator, event) => {
        const eventName = event.name.trim();

        // Check if the event name has already been processed
        if (!uniqueEventNames[eventName]) {
            uniqueEventNames[eventName] = true;

            // Generate a unique UID for each event
            const uid = eventName.replace(/\s+/g, '') + "-" + new Date().getTime() + "@yourdomain.com";

            accumulator.push({
                summary: eventName,
                dtstart: event.date.replace(/-/g, '') + "T000000",
                dtend: event.date.replace(/-/g, '') + "T235900",
                timezone: "US/Eastern",
                uid: uid,
                description: "Holiday"
            });
        }
        return accumulator;
    }, []);

    var eventDownloadRequest = new XMLHttpRequest();
    var processorUrl = "/sn_cd_downloadICS.do?sysparm_type=holiday&sysparm_year=" + selectedYear + "&sysparm_calendar=" + calendarId;

    eventDownloadRequest.open("POST", processorUrl, true);
    eventDownloadRequest.setRequestHeader("Content-type", "application/json");
    eventDownloadRequest.setRequestHeader("X-userToken", window.g_ck);
    eventDownloadRequest.responseType = "blob";

    eventDownloadRequest.onload = function(event) {
        const disposition = event.currentTarget.getResponseHeader('Content-Disposition');
        const fileNameMatch = disposition && disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        const fileName = fileNameMatch ? fileNameMatch[1].replace(/['"]/g, '') : `Holidays_${selectedYear}.ics`;

        const fileElement = document.createElement("a");
        fileElement.href = window.URL.createObjectURL(event.currentTarget.response);
        fileElement.download = fileName;
        document.body.appendChild(fileElement);
        fileElement.click();
        document.body.removeChild(fileElement);
    };

    // Send properly formatted events array
    eventDownloadRequest.send(JSON.stringify({ events: formattedEvents }));
};




}
