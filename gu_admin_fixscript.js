var users = new GlideRecord('sys_user');
users.addQuery('active', true);
users.query();

while (users.next()) {
    var hasAdminRole = false;
    var userRoles = new GlideRecord('sys_user_has_role');
    userRoles.addQuery('user', users.sys_id);
    userRoles.query();

    while (userRoles.next()) {
        if (userRoles.role.name == 'admin') {
            hasAdminRole = true;
            break;
        }
    }

    if (!hasAdminRole) {
        users.active = false;
        users.update();
    }
}
