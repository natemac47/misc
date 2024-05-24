(function WriteBackAction(input) {
    // Check if the scan date is populated, if not, fill it
    // Move the status of the Asset Audit from 'New' to 'In Progress'
    var currentAssetAuditInfo = new global.GlideQuery('sn_hamp_asset_audit')
        .where('sys_id', input.sys_id)
        .selectOne('scan_date', 'location', 'stockroom', 'expected', 'not_expected', 'new', 'not_found', 'type', 'status', 'assigned_to')
        .get();
    var currentScanDate = new GlideDate();

    new global.GlideQuery('sn_hamp_asset_audit')
        .where('sys_id', currentAssetAuditInfo.sys_id)
        .update({
            scan_date: currentScanDate
        });

    currentAssetAuditInfo.scan_date = currentScanDate;

    if (currentAssetAuditInfo.status === 'new') {
        var MAXASSETSALLOWED = 10000;
        var assetGA = new GlideAggregate('alm_asset');
        if (currentAssetAuditInfo.type === 'stockroom') {
            assetGA.addQuery('stockroom', currentAssetAuditInfo.stockroom);
        } else {
            assetGA.addQuery('location', currentAssetAuditInfo.location);
        }
        assetGA.addQuery('model_category', '!=', '218323293743100044e0bfc8bcbe5d61');
        assetGA.addAggregate('COUNT');
        assetGA.query();
        assetGA.next();
        if (assetGA.getAggregate('COUNT') <= MAXASSETSALLOWED) {
            new global.GlideQuery('sn_hamp_asset_audit')
                .where('sys_id', currentAssetAuditInfo.sys_id)
                .update({
                    status: 'in_progress'
                });

            currentAssetAuditInfo.status = 'in_progress';

            var assetGR = new GlideRecord('alm_asset');
            if (currentAssetAuditInfo.type === 'stockroom') {
                assetGR.addQuery('stockroom', currentAssetAuditInfo.stockroom);
            } else {
                assetGR.addQuery('location', currentAssetAuditInfo.location);
            }
            assetGR.addQuery('model_category', '!=', '218323293743100044e0bfc8bcbe5d61');
            assetGR.query();

            while (assetGR.next()) {
                var auditToAssetGR = new GlideRecord('sn_hamp_m2m_audit_asset');
                auditToAssetGR.initialize();
                auditToAssetGR.asset_audit = currentAssetAuditInfo.sys_id;
                auditToAssetGR.asset = assetGR.sys_id;
                auditToAssetGR.audit_status = 'not_found';
                auditToAssetGR.insert();
            }
        } else {
            gs.addErrorMessage(gs.getMessage("Scans of locations with more than {0} assets are not allowed!", MAXASSETSALLOWED));
            return;
        }

        // Processing Asset Tags
    }
    if (input.asset_tags != undefined) {
        for (var index = 0; index < input.asset_tags.length; index += 1) {
            var assetTag = input.asset_tags[index]["Asset Tag"];
            // Only audit assets that haven't been scanned during this audit yet
            var currentAssetCount = new global.GlideQuery('alm_asset')
                .where('asset_tag', assetTag)
                .where('audit_number', currentAssetAuditInfo.sys_id)
                .count();

            if (currentAssetCount === 0) {
                // Update the status to expected if the asset_tag is in sn_hamp_m2m_audit_asset
                var info = new global.GlideQuery('sn_hamp_m2m_audit_asset')
                    .where('asset_audit', currentAssetAuditInfo.sys_id)
                    .where('asset.asset_tag', assetTag)
                    .select('sys_id')
                    .toArray(1);

                if (info && info[0]) {
                    var expectedAsset = new global.GlideQuery('alm_asset')
                        .where('asset_tag', assetTag)
                        .selectOne('sys_id')
                        .get();

                    var expectedAssetDomain = new global.GlideQuery('alm_asset').get(expectedAsset.sys_id, ['sys_domain']);

                    new global.GlideQuery('sn_hamp_m2m_audit_asset')
                        .where('sys_id', info[0].sys_id)
                        .update({
                            'audit_status': 'expected',
                            'sys_domain': expectedAssetDomain._value.sys_domain
                        });

                    new global.GlideQuery('alm_asset')
                        .where('sys_id', expectedAsset.sys_id)
                        .update({
                            audit_number: currentAssetAuditInfo.sys_id,
                            last_audit_date: currentAssetAuditInfo.scan_date,
                            audited_by: currentAssetAuditInfo.assigned_to,
                            audit_type: currentAssetAuditInfo.type,
                            last_audit_state: currentAssetAuditInfo.status
                        });
                } else {

                    // If the update fails the asset we are looking for isn't in sn_hamp_m2m_audit_asset, so insert
                    // in a new record with the following logic for calculating its status:

                    // if an asset with the current asset tag is in alm_asset, its audit status will be 'not expected'
                    // we will update the asset's location to the current location

                    // if  an asset with the current asset tag is not in alm_asset, its audit status will be set to 'new'

                    var assetTagCountGA = new GlideAggregate('alm_asset');
                    assetTagCountGA.addQuery('asset_tag', assetTag);
                    assetTagCountGA.addAggregate('COUNT');
                    assetTagCountGA.query();
                    assetTagCountGA.next();

                    if (assetTagCountGA.getAggregate('COUNT') > 0) {
                        var asset = new global.GlideQuery('alm_asset')
                            .where('asset_tag', assetTag)
                            .selectOne('sys_id')
                            .get();
                        var assetDomain = new global.GlideQuery('alm_asset').get(asset.sys_id, ['sys_domain']);
                        // Update the asset's stockroom OR location based on the type of the audit
                        if (currentAssetAuditInfo.type === 'stockroom') {
                            new global.GlideQuery('alm_asset')
                                .where('sys_id', asset.sys_id)
                                .update({
                                    stockroom: currentAssetAuditInfo.stockroom,
                                    location: currentAssetAuditInfo.location,
                                    audit_number: currentAssetAuditInfo.sys_id,
                                    last_audit_date: currentAssetAuditInfo.scan_date,
                                    audited_by: currentAssetAuditInfo.assigned_to,
                                    audit_type: currentAssetAuditInfo.type,
                                    last_audit_state: currentAssetAuditInfo.status,
                                    install_status: 6
                                });
                        } else {
                            // If the asset is tagged against a stockroom and its stockroom's location doesn't match the location 
                            // of the audit, then clear out its stockroom.
                            var assetStockroomInfo = new global.GlideQuery('alm_asset')
                                .where('sys_id', asset.sys_id)
                                .selectOne('stockroom.location')
                                .ifPresent(
                                    function(assetStockroomInfo) {
                                        if (assetStockroomInfo.stockroom && assetStockroomInfo.stockroom.location !== currentAssetAuditInfo.location) {
                                            new global.GlideQuery('alm_asset')
                                                .where('sys_id', asset.sys_id)
                                                .update({
                                                    stockroom: null
                                                });
                                        }
                                    }
                                );
                            new global.GlideQuery('alm_asset')
                                .where('sys_id', asset.sys_id)
                                .update({
                                    location: currentAssetAuditInfo.location,
                                    audit_number: currentAssetAuditInfo.sys_id,
                                    last_audit_date: currentAssetAuditInfo.scan_date,
                                    audited_by: currentAssetAuditInfo.assigned_to,
                                    audit_type: currentAssetAuditInfo.type,
                                    last_audit_state: currentAssetAuditInfo.status
                                });
                        }
                        new global.GlideQuery('sn_hamp_m2m_audit_asset')
                            .insert({
                                asset_audit: currentAssetAuditInfo.sys_id,
                                asset: asset.sys_id,
                                audit_status: 'not_expected',
                                sys_domain: assetDomain._value.sys_domain
                            });
                    } else {
                        // Set to the special model and model category, Unknown
                        var unknownModel = '3410e2c100a70010fa9b161c34f87377';
                        var unknownModelCategory = '2ffe9a8100a70010fa9b161c34f873cd';
                        var newAsset = new global.GlideQuery('alm_asset')
                            .insert({
                                asset_tag: assetTag,
                                model: unknownModel,
                                model_category: unknownModelCategory,
                                audit_number: currentAssetAuditInfo.sys_id,
                                last_audit_date: currentAssetAuditInfo.scan_date,
                                audited_by: currentAssetAuditInfo.assigned_to,
                                audit_type: currentAssetAuditInfo.type,
                                last_audit_state: currentAssetAuditInfo.status,
                                location: currentAssetAuditInfo.location,
                                stockroom: currentAssetAuditInfo.stockroom
                            })
                            .get();
                        new global.GlideQuery('sn_hamp_m2m_audit_asset')
                            .insert({
                                asset_audit: currentAssetAuditInfo.sys_id,
                                asset: newAsset.sys_id,
                                audit_status: 'new'
                            });
                    }
                }
            }
        }
    }
    // Processing Serial Numbers
    if (input.serial_numbers != undefined) {
        for (var indexSN = 0; indexSN < input.serial_numbers.length; indexSN += 1) {
            var serialNumber = input.serial_numbers[indexSN]["Serial Number"];
            // Only audit assets that haven't been scanned during this audit yet
            var currentAssetCountSN = new global.GlideQuery('alm_asset')
                .where('serial_number', serialNumber)
                .where('audit_number', currentAssetAuditInfo.sys_id)
                .count();

            if (currentAssetCountSN === 0) {
                // Update the status to expected if the serial_number is in sn_hamp_m2m_audit_asset
                var infoSN = new global.GlideQuery('sn_hamp_m2m_audit_asset')
                    .where('asset_audit', currentAssetAuditInfo.sys_id)
                    .where('asset.serial_number', serialNumber)
                    .select('sys_id')
                    .toArray(1);

                if (infoSN && infoSN[0]) {
                    var expectedAssetSN = new global.GlideQuery('alm_asset')
                        .where('serial_number', serialNumber)
                        .selectOne('sys_id')
                        .get();

                    var expectedAssetDomainSN = new global.GlideQuery('alm_asset').get(expectedAssetSN.sys_id, ['sys_domain']);

                    new global.GlideQuery('sn_hamp_m2m_audit_asset')
                        .where('sys_id', infoSN[0].sys_id)
                        .update({
                            'audit_status': 'expected',
                            'sys_domain': expectedAssetDomainSN._value.sys_domain
                        });

                    new global.GlideQuery('alm_asset')
                        .where('sys_id', expectedAssetSN.sys_id)
                        .update({
                            audit_number: currentAssetAuditInfo.sys_id,
                            last_audit_date: currentAssetAuditInfo.scan_date,
                            audited_by: currentAssetAuditInfo.assigned_to,
                            audit_type: currentAssetAuditInfo.type,
                            last_audit_state: currentAssetAuditInfo.status
                        });
                } else {

                    // If the update fails the asset we are looking for isn't in sn_hamp_m2m_audit_asset, so insert
                    // in a new record with the following logic for calculating its status:

                    // if an asset with the current serial number is in alm_asset, its audit status will be 'not expected'
                    // we will update the asset's location to the current location

                    // if  an asset with the current serial number is not in alm_asset, its audit status will be set to 'new'

                    var assetTagCountGASN = new GlideAggregate('alm_asset');
                    assetTagCountGASN.addQuery('serial_number', serialNumber);
                    assetTagCountGASN.addAggregate('COUNT');
                    assetTagCountGASN.query();
                    assetTagCountGASN.next();

                    if (assetTagCountGASN.getAggregate('COUNT') > 0) {
                        var assetSN = new global.GlideQuery('alm_asset')
                            .where('serial_number', serialNumber)
                            .selectOne('sys_id')
                            .get();
                        var assetDomainSN = new global.GlideQuery('alm_asset').get(assetSN.sys_id, ['sys_domain']);
                        // Update the asset's stockroom OR location based on the type of the audit
                        if (currentAssetAuditInfo.type === 'stockroom') {
                            new global.GlideQuery('alm_asset')
                                .where('sys_id', assetSN.sys_id)
                                .update({
                                    stockroom: currentAssetAuditInfo.stockroom,
                                    location: currentAssetAuditInfo.location,
                                    audit_number: currentAssetAuditInfo.sys_id,
                                    last_audit_date: currentAssetAuditInfo.scan_date,
                                    audited_by: currentAssetAuditInfo.assigned_to,
                                    audit_type: currentAssetAuditInfo.type,
                                    last_audit_state: currentAssetAuditInfo.status,
                                    install_status: 6
                                });
                        } else {
                            // If the asset is tagged against a stockroom and its stockroom's location doesn't match the location 
                            // of the audit, then clear out its stockroom.
                            var assetStockroomInfoSN = new global.GlideQuery('alm_asset')
                                .where('sys_id', assetSN.sys_id)
                                .selectOne('stockroom.location')
                                .ifPresent(
                                    function(assetStockroomInfoSN) {
                                        if (assetStockroomInfoSN.stockroom && assetStockroomInfoSN.stockroom.location !== currentAssetAuditInfo.location) {
                                            new global.GlideQuery('alm_asset')
                                                .where('sys_id', assetSN.sys_id)
                                                .update({
                                                    stockroom: null
                                                });
                                        }
                                    }
                                );
                            new global.GlideQuery('alm_asset')
                                .where('sys_id', assetSN.sys_id)
                                .update({
                                    location: currentAssetAuditInfo.location,
                                    audit_number: currentAssetAuditInfo.sys_id,
                                    last_audit_date: currentAssetAuditInfo.scan_date,
                                    audited_by: currentAssetAuditInfo.assigned_to,
                                    audit_type: currentAssetAuditInfo.type,
                                    last_audit_state: currentAssetAuditInfo.status
                                });
                        }
                        new global.GlideQuery('sn_hamp_m2m_audit_asset')
                            .insert({
                                asset_audit: currentAssetAuditInfo.sys_id,
                                asset: assetSN.sys_id,
                                audit_status: 'not_expected',
                                sys_domain: assetDomainSN._value.sys_domain
                            });
                    } else {
                        // Set to the special model and model category, Unknown
                        var unknownModelSN = '3410e2c100a70010fa9b161c34f87377';
                        var unknownModelCategorySN = '2ffe9a8100a70010fa9b161c34f873cd';
                        var newAssetSN = new global.GlideQuery('alm_asset')
                            .insert({
                                serial_number: serialNumber,
                                model: unknownModelSN,
                                model_category: unknownModelCategorySN,
                                audit_number: currentAssetAuditInfo.sys_id,
                                last_audit_date: currentAssetAuditInfo.scan_date,
                                audited_by: currentAssetAuditInfo.assigned_to,
                                audit_type: currentAssetAuditInfo.type,
                                last_audit_state: currentAssetAuditInfo.status,
                                location: currentAssetAuditInfo.location,
                                stockroom: currentAssetAuditInfo.stockroom
                            })
                            .get();
                        new global.GlideQuery('sn_hamp_m2m_audit_asset')
                            .insert({
                                asset_audit: currentAssetAuditInfo.sys_id,
                                asset: newAssetSN.sys_id,
                                audit_status: 'new'
                            });
                    }
                }
            }
        }
    }

    // Just recalculate the four counts at the end so that we avoid bugs in weird scenarios like
    // (a) multiple scans of the same asset tag
    var notFoundCountGA = new GlideAggregate('sn_hamp_m2m_audit_asset');
    notFoundCountGA.addQuery('asset_audit', currentAssetAuditInfo.sys_id);
    notFoundCountGA.addQuery('audit_status', 'not_found');
    notFoundCountGA.addAggregate('COUNT');
    notFoundCountGA.query();
    notFoundCountGA.next();
    var notFoundCount = notFoundCountGA.getAggregate('COUNT');

    var expectedCountGA = new GlideAggregate('sn_hamp_m2m_audit_asset');
    expectedCountGA.addQuery('asset_audit', currentAssetAuditInfo.sys_id);
    expectedCountGA.addQuery('audit_status', 'expected');
    expectedCountGA.addAggregate('COUNT');
    expectedCountGA.query();
    expectedCountGA.next();
    var expectedCount = expectedCountGA.getAggregate('COUNT');

    var notExpectedCountGA = new GlideAggregate('sn_hamp_m2m_audit_asset');
    notExpectedCountGA.addQuery('asset_audit', currentAssetAuditInfo.sys_id);
    notExpectedCountGA.addQuery('audit_status', 'not_expected');
    notExpectedCountGA.addAggregate('COUNT');
    notExpectedCountGA.query();
    notExpectedCountGA.next();
    var notExpectedCount = notExpectedCountGA.getAggregate('COUNT');

    var newCountGA = new GlideAggregate('sn_hamp_m2m_audit_asset');
    newCountGA.addQuery('asset_audit', currentAssetAuditInfo.sys_id);
    newCountGA.addQuery('audit_status', 'new');
    newCountGA.addAggregate('COUNT');
    newCountGA.query();
    newCountGA.next();
    var newCount = newCountGA.getAggregate('COUNT');

    var assetAuditGR = new GlideRecord('sn_hamp_asset_audit');
    assetAuditGR.get(currentAssetAuditInfo.sys_id);
    assetAuditGR.expected = expectedCount;
    assetAuditGR.not_expected = notExpectedCount;
    assetAuditGR.setValue('new', parseInt(newCount));
    assetAuditGR.not_found = notFoundCount;
    assetAuditGR.update();
})(input);
