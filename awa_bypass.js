//v2. Now works with prechat queue and won't send to all logged in agents regardless of channel/queue/assignment group

(function executeRule(current, previous /*null when async*/) {

    if (!current.isNewRecord()) {
        return;
    }

    // Get the queue from the current record
    var queueId = current.getValue('queue');

    // Lookup the awa_eligibility_pool record for the queue
    var eligibilityPool = new GlideRecord('awa_eligibility_pool');
    eligibilityPool.addQuery('queue', queueId);
    eligibilityPool.setLimit(1);
    eligibilityPool.query();

    if (!eligibilityPool.next()) {
        return; // No matching eligibility pool found for the queue
    }

    // Get the groups from the list collector field
    var groups = eligibilityPool.getValue('groups');
    if (!groups) {
        return; // No groups defined in the eligibility pool
    }

    // Split the groups into an array
    var groupList = groups.split(',');

    var agentPresenceCapacity = new GlideRecord('awa_agent_presence_capacity');
    agentPresenceCapacity.addQuery('aca_service_channel', '27f675e3739713004a905ee515f6a7c3');
    agentPresenceCapacity.addQuery('ap_current_presence_state', '0b10223c57a313005baaaa65ef94f970');
    agentPresenceCapacity.query();

    var processedAgents = {};

    while (agentPresenceCapacity.next()) {
        var agentId = agentPresenceCapacity.getValue('ap_agent');

        if (processedAgents[agentId]) {
            continue;
        }

        // Check if the agent is a member of one of the groups
        var agentInGroup = false;
        var agentGroups = new GlideRecord('sys_user_grmember');
        agentGroups.addQuery('user', agentId);
        agentGroups.addQuery('group', 'IN', groupList);
        agentGroups.setLimit(1);
        agentGroups.query();

        if (agentGroups.hasNext()) {
            agentInGroup = true;
        }

        if (!agentInGroup) {
            continue; // Skip agents not in the required groups
        }

        var existingWorkItem = new GlideRecord('awa_work_item');
        existingWorkItem.addQuery('document_id', current.document_id);
        existingWorkItem.addQuery('assigned_to', agentId);
        existingWorkItem.setLimit(1);
        existingWorkItem.query();

        if (existingWorkItem.hasNext()) {
            continue;
        }

        var newWorkItem = new GlideRecord('awa_work_item');
        newWorkItem.initialize();

        newWorkItem.setWorkflow(false); // Prevent workflows and business rules from triggering

        newWorkItem.setValue('state', 'pending_accept');
        newWorkItem.setValue('document_table', current.document_table);
        newWorkItem.setValue('document_id', current.document_id);
        newWorkItem.setValue('queue', current.queue);
        newWorkItem.setValue('state_changed_on', current.state_changed_on);
        newWorkItem.setValue('offered_on', current.offered_on);
        newWorkItem.setValue('assigned_to', agentId);

        newWorkItem.insert();

        processedAgents[agentId] = true;
    }

})(current, previous);
