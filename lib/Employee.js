const Manager = require("./Manager");

class Employee extends Manager{
    constructor(first_name, last_name, role_id, manager_id){
        super(first_name, last_name, role_id);
        this.manager_id = manager_id;
    }
}

module.exports = Employee;