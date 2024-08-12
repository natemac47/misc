    var grHardware = new GlideRecord('alm_hardware');
    grHardware.addEncodedQuery('model.ref_cmdb_hardware_product_model.normalized_device_type=18b672cddbabf70424cd68461b9619a3^ORmodel.ref_cmdb_hardware_product_model.normalized_device_type=dcb672cddbabf70424cd68461b9619a2');
    grHardware.query();

    while (grHardware.next()) {
        var usefulLifeMonths = grHardware.model.ref_cmdb_hardware_product_model.useful_life;

        if (usefulLifeMonths) {
            var newRetirementDate = calculateNewRetirementDate(parseInt(usefulLifeMonths), grHardware.sys_created_on);
            grHardware.setValue('retirement_date', newRetirementDate);
            grHardware.update();
        }
    }

    function calculateNewRetirementDate(monthsToAdd, createdOnDate) {
        var retirementDate = new GlideDateTime(createdOnDate);
        retirementDate.addMonths(parseInt(monthsToAdd));
        return retirementDate;
    }
