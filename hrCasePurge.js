var gr = new GlideRecord('sn_hr_core_case');
gr.query();
while (gr.next()) {
    gr.deleteRecord();
}
