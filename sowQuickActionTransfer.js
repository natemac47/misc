var success = false;
var message = 'Work item transfer to Command Center failed';
var queueSysId = '2affba111bc91690e32e11f72a4bcb23';  // Command Center queue sys_id
var groupSysId = 'fafb8b43dbe35a4071413bc0cf96196b';  // WUIT-SI-NOC-OPS-CommandCenter group sys_id

try {
    // Ensure the record exists and has a valid unique value
    if (!record || !record.getUniqueValue()) {
        throw new Error("No valid record to process.");
    }

    // Query for agents in the awa_agent_presence_capacity table with the necessary conditions
    var agentPresence = new GlideRecord('awa_agent_presence_capacity');
    agentPresence.addQuery('aca_available', true);
    agentPresence.addQuery('ap_current_presence_state', '0b10223c57a313005baaaa65ef94f970'); // Available
    agentPresence.addQuery('ac_channel', '1972a2c81b305a50e32e11f72a4bcb5b'); // Transfer Group
    agentPresence.addJoinQuery('sys_user_grmember', 'ac_user', 'user').addCondition('group', groupSysId);
    agentPresence.query();

    if (agentPresence.hasNext()) {
        while (agentPresence.next()) {
            // Create a new work item for each agent in the group
            var newWorkItem = new GlideRecord('awa_work_item');
            newWorkItem.initialize();

            // Set necessary fields for the work item
            newWorkItem.document_id = record.getUniqueValue();
            newWorkItem.document_table = record.getTableName();
            newWorkItem.assignment_group = groupSysId;
            newWorkItem.assigned_to = agentPresence.ac_user;
            newWorkItem.state = 'pending_accept';  
            newWorkItem.active = true;
            newWorkItem.queue = queueSysId;  
            newWorkItem.u_created_by_script = true;

            // Insert the new work item for the agent
            newWorkItem.insert();
        }
        success = true;
        message = 'Work items created for all available agents in the Command Center group.';
    } else {
        message = 'No available agents found in the Command Center group.';
    }
    
} catch (e) {
    message = e.toString();
}

answer = {
    success: success,
    message: message,
    dispatchAction: {
        type: 'CHAT_INPUT#TRANSFERRED',
        payload: message
    }
};
