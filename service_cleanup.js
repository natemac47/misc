// Function to load sys_ids from the CSV file into an array or similar structure
// Assume we have the sys_ids loaded into an array named validSysIds

var validSysIds = [
    "29428b4e87488e1061dfc91e0ebb355a",
    "b9428b4e87488e1061dfc91e0ebb3560",
    "bd428b4e87488e1061dfc91e0ebb3562",
    "71428b4e87488e1061dfc91e0ebb3564",
    "b5428b4e87488e1061dfc91e0ebb3566"
    // Add the rest of the sys_ids from the CSV file
];

// Query the cmdb_ci_service table for records, grouping by the name field to find duplicates
var agg = new GlideAggregate('cmdb_ci_service');
agg.addAggregate('COUNT', 'name');
agg.addHaving('COUNT', 'name', '>', 1);
agg.query();

var duplicateNames = [];

while (agg.next()) {
    duplicateNames.push(agg.name.toString());
}

// For each duplicate name, check if the record's sys_id is in the validSysIds list and delete if so
duplicateNames.forEach(function(name) {
    var gr = new GlideRecord('cmdb_ci_service');
    gr.addQuery('name', name);
    gr.query();

    while (gr.next()) {
        if (validSysIds.indexOf(gr.sys_id.toString()) !== -1) {
            // Record is a duplicate and its sys_id is in the list
            gr.deleteRecord(); // Delete this record
        }
    }
});
