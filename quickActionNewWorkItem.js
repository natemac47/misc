var success = false;
var message = 'Work item creation failed';
var queueSysId = params[0];

try {
    // Create a new AWA work item record
    var workItem = new GlideRecord('awa_work_item');
    workItem.initialize();

    // Set necessary fields for the work item
    workItem.document_id = record.getUniqueValue();  // Assuming the current record is the interaction
    workItem.document_table = 'interaction';  // Assuming the interaction table
    workItem.queue = '2affba111bc91690e32e11f72a4bcb23';  // Queue Sys ID passed as parameter
    workItem.state = 'pending_accept';  // Set state to new for an active work item
    workItem.active = true;

    // Insert the new work item
    var workItemSysId = workItem.insert();
    if (workItemSysId) {
        success = true;
        var queue = new GlideRecord('awa_queue');
        if (queue.get(queueSysId)) {
            message = gs.getMessage('Work item created and sent to {0}', queue.getValue('name'));
        } else {
            message = 'Work item created, but queue not found';
        }
    }
} catch (e) {
    message = e.toString();
}

answer = {
    success: success,
    message: message,
    dispatchAction: {
        type: 'CHAT_INPUT#WORKITEM_CREATED',
        payload: message
    }
};
