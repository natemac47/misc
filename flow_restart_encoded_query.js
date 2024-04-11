(function() { 

var grScReqItem = new GlideRecord('sc_req_item');
//CHANGE LINE BELOW WITH ENCODED QUERY
grScReqItem.addEncodedQuery("order_guide.sys_id=3613ae87879b395461dfc91e0ebb3573^u_hr_approved=approved^request.sys_id=781690e24755c21054d74194116d432e^number!=RITM0011720^ORnumber=NULL");// provide a Query
grScReqItem.orderBy('sys_created_on');
grScReqItem.query();
while (grScReqItem.next()) {
try {
	
	var flow = grScReqItem.cat_item.flow_designer_flow;
	var flowName = flow.sys_scope.scope + "." + flow.internal_name;
    var inputs = {};
    inputs['request_item'] = grScReqItem; // GlideRecord of table: sc_req_item
    inputs['table_name'] = 'sc_req_item';

    var contextId = sn_fd.FlowAPI.startFlow(flowName, inputs);	
	
  } catch (ex) {
    var message = ex.getMessage();
    gs.error(message);  
  }
}
})();
