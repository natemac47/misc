//before insert BR on awa_work_item_table
//v1. in the process of fixing duplicate send to first agent
//confirmed functionality with prechat survey

(function executeRule(current, previous /*null when async*/) {

    if (!current.isNewRecord()) {
        return;
    }

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
