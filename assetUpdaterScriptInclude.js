var AssetUpdateHelper = Class.create();
AssetUpdateHelper.prototype = {
    initialize: function() {},

    updateAsset: function(assetSysId, variables) {
        var assetGR = new GlideRecord('alm_asset');
        if (assetGR.get(assetSysId)) {
            assetGR.asset_function = variables.new_asset_function;
            assetGR.assigned_to = variables.new_assigned_to;
            assetGR.owned_by = variables.new_owned_by;
            assetGR.location = variables.new_location_asset;
            assetGR.department = variables.new_department_asset;
            assetGR.company = variables.new_company;
            assetGR.u_device_contain_pci = variables.new_pci;
            assetGR.u_device_contain_phi = variables.new_phi;
            assetGR.u_device_contain_pii = variables.new_pii;
            assetGR.u_clinical_workstation_business_workstation = variables.new_clinical_workstation_business_workstation;
            assetGR.u_epic_downtime_workstation = variables.new_epic_downtime_workstation;
            assetGR.install_status = variables.new_state;
            assetGR.substatus = variables.new_substate;
            assetGR.stockroom = variables.new_stockroom;
            assetGR.reserved_for = variables.new_reserved_for;
            assetGR.support_group = variables.new_support_group;
            //assetGR.setWorkflow(false);
            assetGR.update();
        }
    },

    type: 'AssetUpdateHelper'
};
