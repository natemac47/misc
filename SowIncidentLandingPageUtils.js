function include({imports}) { 
    let serviceDeskLandingPageUtilsSNC = imports['sn_sow_inc.SowIncidentLandingPageUtilsSNC']();
    class ServiceDeskLandingPageUtils extends serviceDeskLandingPageUtilsSNC {
        /*
        static getLabelMaps() {
            return "";
        }*/

        static async getVisualizationConfig(helpers, mode) {
            const evamDef = this.getEvamDef();
            const visualizationConfig = [{
                    "id": "incident_assigned",
                    "tableName": "incident",
                    "tableDisplayValue": "Incident",
                    "myWorkQuery": "active=true^assigned_toDYNAMIC90d1921e5f510100a9ad2572f2b477fe",
                    "myTeamQuery": "active=true^assigned_toISNOTEMPTY^assignment_groupDYNAMICd6435e965f510100a9ad2572f2b47744",
                    "listView": mode == "your_work" ? "sow_landing_page_assigned" : "sow_landing_page",
                    "header": mode == 'your_work' ? await helpers.translate("Incidents assigned to you") : await helpers.translate("Incidents assigned to your team"),
                    "groupByField": "state",
                    "evamId": evamDef['incidentEvamDefinitionId'],
                    "updated_on": "^ORDERBYDESCsys_updated_on",
                },
                {
                    "id": "incident_sla",
                    "tableName": "task_sla",
                    "tableDisplayValue": "Task SLA",
                    "myWorkQuery": "task.sys_class_name=incident^task.assigned_toDYNAMIC90d1921e5f510100a9ad2572f2b477fe^task.active=true^sla.type=SLA^ORsla.type=OLA^active=true^time_left<=1970-01-08 00:00:00",
                    "myTeamQuery": "task.sys_class_name=incident^task.assignment_groupDYNAMICd6435e965f510100a9ad2572f2b47744^task.active=true^sla.type=SLA^ORsla.type=OLA^active=true^time_left<=1970-01-08 00:00:00",
                    "listView": 'sow_landing_page',
                    "header": await helpers.translate("Incident SLAs"),
                    "groupByField": "time_left",
                    "evamId": evamDef['incidentSlaEvamDefinitionId'],
                    "updated_on": "^ORDERBYtime_left",
                },
                {
                    "id": "unassigned_incidents",
                    "tableName": "incident",
                    "tableDisplayValue": "Incident",
                    "myWorkQuery": "active=true^assigned_toISEMPTY^assignment_groupDYNAMICd6435e965f510100a9ad2572f2b47744",
                    "myTeamQuery": "active=true^assigned_toISEMPTY^assignment_groupDYNAMICd6435e965f510100a9ad2572f2b47744",
                    "listView": mode == "your_work" ? "sow_landing_page_assigned" : "sow_landing_page",
                    "header": await helpers.translate("Unassigned incidents"),
                    "groupByField": "priority",
                    "evamId": evamDef['incidentEvamDefinitionId'],
                    "updated_on": "^ORDERBYDESCsys_updated_on",
                },
                {
                    "id": "catalog_tasks",
                    "tableName": "sc_task",
                    "tableDisplayValue": "Catalog Task",
                    "myWorkQuery": "active=true^assigned_toDYNAMIC90d1921e5f510100a9ad2572f2b477fe",
                    "myTeamQuery": "active=true^assignment_groupDYNAMICd6435e965f510100a9ad2572f2b47744",
                    "listView": 'sow_landing_page',
                    "header": mode == 'your_work' ? await helpers.translate("Catalog tasks assigned to you") : await helpers.translate("Catalog tasks assigned to your team"),
                    "groupByField": "state",
                    "evamId": evamDef["catalogTaskEvamDefinitionId"],
                    "updated_on": "^ORDERBYDESCsys_updated_on",
                },
                {
                    "id": "requested_items",
                    "tableName": "sc_req_item",
                    "tableDisplayValue": "Requested Item",
                    "myWorkQuery": "active=true^assigned_toDYNAMIC90d1921e5f510100a9ad2572f2b477fe",
                    "myTeamQuery": "active=true^assignment_groupDYNAMICd6435e965f510100a9ad2572f2b47744",
                    "listView": 'sow_landing_page',
                    "header": mode == 'your_work' ? await helpers.translate("Requested items assigned to you") : await helpers.translate("Requested items assigned to your team"),
                    "groupByField": "state",
                    "evamId": evamDef["requestedItemEvamDefinitionId"],
                    "updated_on": "^ORDERBYDESCsys_updated_on",
                }
            ];
            return visualizationConfig;
        }
    }
    return ServiceDeskLandingPageUtils;
}
