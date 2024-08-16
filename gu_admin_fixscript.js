// Get all active users from the sys_user table
var users = new GlideRecord('sys_user');
users.addQuery('active', true);
users.query();

while (users.next()) {
    var hasAdminRole = false;

    // Check if the current user has the 'admin' role by looking in the sys_user_has_role table
    var userRoles = new GlideRecord('sys_user_has_role');
    userRoles.addQuery('user', users.sys_id);
    userRoles.query();

    while (userRoles.next()) {
        // If we find the 'admin' role for this user, set the flag and stop checking further
        if (userRoles.role.name == 'admin') {
            hasAdminRole = true;
            break;
        }
    }

    // If the user doesn't have the 'admin' role, deactivate their account
    if (!hasAdminRole) {
        users.active = false;
        users.update();
    }
}
