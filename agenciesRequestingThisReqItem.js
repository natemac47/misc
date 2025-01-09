//Scheduled Job to show what departments are requesting this catalog item.

(function executeScheduledJob() {
    var ninetyDaysAgo = new GlideDateTime();
    ninetyDaysAgo.addDaysUTC(-90);

    var catalogItemDepartmentsMap = {};

    var reqItemGR = new GlideRecord('sc_req_item');
    reqItemGR.addQuery('sys_created_on', '>=', ninetyDaysAgo);
    reqItemGR.query();

    while (reqItemGR.next()) {
        var catItemSysId = reqItemGR.getValue('cat_item');
        var deptSysId = reqItemGR.opened_by.department.toString();
        if (catItemSysId && deptSysId) {
            if (!catalogItemDepartmentsMap[catItemSysId]) {
                catalogItemDepartmentsMap[catItemSysId] = [];
            }
            if (catalogItemDepartmentsMap[catItemSysId].indexOf(deptSysId) === -1) {
                catalogItemDepartmentsMap[catItemSysId].push(deptSysId);
            }
        }
    }

    for (var catItemId in catalogItemDepartmentsMap) {
        var departmentArray = catalogItemDepartmentsMap[catItemId];
        if (departmentArray && departmentArray.length > 0) {
            var catItemGR = new GlideRecord('sc_cat_item');
            if (catItemGR.get(catItemId)) {
                catItemGR.u_agencies_requesting = '';
                catItemGR.update();
                catItemGR.u_agencies_requesting = departmentArray.join(',');
                catItemGR.update();
            }
        }
    }
})();
