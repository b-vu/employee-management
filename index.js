const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");
const Manager = require("./lib/Manager");
const Employee = require("./lib/Employee");
const Role = require("./lib/Role");
const Department = require("./lib/Department");

const choices = ["View All Employees", "View Employees By Title", "View Employees By Department", "View Employees By Manager", "Add Employee", "Add Role", "Add Department",
    "Update Employee Role", "Update Employee Manager", "Remove Employee", "Remove Role", "Remove Department", "View Department Budget", "Exit"];

let titles = [];

let departments = [];

const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "employeeDB"
});

connection.connect(err => {
    if (err) throw err;
    console.log("Welcome to the Employee Management System!");
    promptUser();
});

const initialize = () => {
    connection.query("SELECT title FROM role", (err, res) => {
        if(err) throw err;
        
        titles = [];

        for(const title of res){
            titles.push(title.title);
        }
    })

    connection.query("SELECT name FROM department", (err, res) => {
        if(err) throw err;

        departments = [];

        for(const name of res){
            departments.push(name.name);
        }
    })
}

const promptUser = async () => {
    initialize();
    const input = await inquirer.prompt(
        {
            type: "list",
            message: "What would you like to do?",
            name: "choice",
            choices: choices
        }
    );

    switch(input.choice){
        case choices[0]:
        case choices[1]:
        case choices[2]:
        case choices[3]:
            view(input.choice);
            break;

        case choices[4]:
            addEmployee();
            break;

        case choices[5]:
            addRole();
            break;

        case choices[6]:
            addDepartment();
            break;

        case choices[7]:
            updateRole();
            break;

        case choices[8]:
            updateManager();
            break;

        case choices[9]:
            removeEmployee();
            break;

        case choices[10]:
            removeRole();
            break;

        case choices[11]:
            removeDepartment();
            break;

        case choices[12]:
            calculateBudget();
            break;

        case choices[13]:
            connection.end();
    }
}

const view = (choice) => {
    let display;
    if(choice === choices[0]){
        display = "SELECT e.id, e.first_name, e.last_name, title, salary, name AS department, CONCAT(m.first_name, ' ', m.last_name) AS manager FROM employee e INNER JOIN role ON e.role_id = role.id INNER JOIN department ON role.department_id = department.id LEFT JOIN employee m ON e.manager_id = m.id";
    }
    else if(choice === choices[1]){
        display = "SELECT title, first_name, last_name FROM employee INNER JOIN role ON employee.role_id = role.id ORDER BY role.title";
    }
    else if(choice === choices[2]){
        display = "SELECT name AS department, first_name, last_name FROM employee INNER JOIN role ON employee.role_id = role.id INNER JOIN department ON role.department_id = department.id ORDER BY department.name";
    }
    else{
        display = "SELECT CONCAT(m.first_name, ' ', m.last_name) AS manager, CONCAT(e.first_name, ' ', e.last_name) AS employee FROM employee e INNER JOIN employee m ON m.id = e.manager_id ORDER BY m.last_name"
    }

    connection.query(display, (err, res) => {
        if(err) throw err;

        console.table(res)
        promptUser();
    })
}

const addEmployee = async () => {
    const input = await inquirer.prompt([
        {
            type: "input",
            message: "Please enter their first name:",
            name: "first_name"
        },
        {
            type: "input",
            message: "Please enter their last name:",
            name: "last_name"
        },
        {
            type: "list",
            message: "What is their job title?",
            name: "title",
            choices: titles
        }
    ])


    if(input.title === titles[2] || input.title === titles[4] || input.title === titles[6] || input.title === titles[7]){
        const managers = [];
        const managersObj = {};
        const query = "SELECT id, first_name, last_name FROM employee WHERE role_id = 1 OR role_id = 2 OR role_id = 4 OR role_id = 6 ORDER BY first_name";

        connection.query(query, (err, res) => {
            if(err) throw err;
            for(const manager of res){
                const name = manager.first_name + " " + manager.last_name;
                managers.push(name)
                managersObj[name] = manager.id;
            }

            inquirer.prompt(
                {
                    type: "list",
                    message: "Who is their manager?",
                    name: "manager",
                    choices: managers
                }
            ).then(res =>{
                const employee = new Employee(input.first_name, input.last_name, titles.indexOf(input.title) + 1, managersObj[res.manager.toString()]);
                connection.query("INSERT INTO employee SET ?", employee, (err, res) => {
                    if(err) throw err;

                    console.log(res.affectedRows + " employee added!\n");
                    promptUser();
                })
            })
        })
    }

    else{
        const manager = new Manager(input.first_name, input.last_name, titles.indexOf(input.title) + 1);

        connection.query("INSERT INTO employee SET ?", manager, (err, res) => {
            if(err) throw err;

            console.log(res.affectedRows + " employee added!\n");
            promptUser();
        })
    }
}

const addRole = async () => {
    const input = await inquirer.prompt([
        {
            type: "input",
            message: "What is the title of the role?",
            name: "title"
        },
        {
            type: "input",
            message: "What is the salary of the role?",
            name: "salary",
            validate: function(val){
                if(isNaN(val)){
                    return "Please enter a valid number";
                }
                else if(val < 30000){
                    return "Please enter a higher salary";
                }
                else{
                    return true;
                }
            }
        },
        {
            type: "list",
            message: "What department is the role under?",
            name: "department",
            choices: departments
        }
    ])

    const role = new Role(input.title, input.salary, departments.indexOf(input.department) + 1);

    connection.query("INSERT INTO role SET ?", role, (err, res) => {
        if(err) throw err;

        console.log(res.affectedRows + " role added!\n");
        promptUser();
    })
}

const addDepartment = async () => {
    const input = await inquirer.prompt([
        {
            type: "input",
            message: "What is the name of the department?",
            name: "name"
        }
    ])

    const department = new Department(input.name);
    
    connection.query("INSERT INTO department SET ?", department, (err, res) => {
        if(err) throw err;

        console.log(res.affectedRows + " department added!\n");
        promptUser();
    })
}

const updateRole = () => {
    const employees = [];

    connection.query("SELECT first_name, last_name FROM employee", (err, res) => {
        if(err) throw err;

        for(const employee of res){
            const name = employee.first_name + " " + employee.last_name;
            employees.push(name);
        }

        inquirer.prompt(
            {
                type: "list",
                message: "Which employee's role do you want to update?",
                name: "employee",
                choices: employees
            }
        ).then(res => {
            const nameArray = res.employee.split(" ");
            const name = res.employee;
            const query = "SELECT title FROM employee INNER JOIN role ON employee.role_id = role.id AND ?";
            
            connection.query(query, {first_name: nameArray[0]}, (err,res) => {
                if(err) throw err;

                inquirer.prompt(
                    {
                        type: "list",
                        message: `${name}'s current role is ${res[0].title}. What is their updated role?`,
                        name: "new_role",
                        choices: titles
                    }
                ).then(res => {
                    const query = "UPDATE employee SET ? WHERE ?"
                    connection.query(query, [{role_id: titles.indexOf(res.new_role) + 1}, {first_name: nameArray[0]}]);

                    inquirer.prompt(
                        {
                            type: "list",
                            message: `${name}'s role has been updated to ${res.new_role}. Because they might be in a new department, do you want to update their manager?`,
                            name: "update_manager",
                            choices: ["Yes", "No"]
                        }
                    ).then(res => {
                        if(res.update_manager === "Yes"){
                            updateManager();
                        }
                        else{
                            promptUser();
                        }
                    })
                })
            })
        })
    })
}

const updateManager = () => {
    const employees = [];

    connection.query("SELECT first_name, last_name FROM employee", (err, res) => {
        if(err) throw err;

        for(const employee of res){
            const name = employee.first_name + " " + employee.last_name;
            employees.push(name);
        }
        
        inquirer.prompt(
            {
                type: "list",
                message: "Which employee's manager do you want to update?",
                name: "employee",
                choices: employees
            }
        ).then(res => {
            const name = res.employee;
            const employeeArray = name.split(" ");

            connection.query("SELECT first_name, last_name FROM employee" ,(err, res) => {
                if(err) throw err;

                employees.push("No manager");

                inquirer.prompt(
                    {
                        type: "list",
                        message: `Who is ${name}'s new manager?`,
                        name: "new_manager",
                        choices: employees
                    }
                ).then(res => {
                    if(res.new_manager === "No manager"){
                        connection.query("UPDATE employee SET manager_id = NULL WHERE ?", {first_name: employeeArray[0]}, (err, res) => {
                            if(err) throw err;

                            console.log(`${name} now has no manager.`);
                            return promptUser();
                        })
                    }

                    const nameArray = res.new_manager.split(" ");
                    const query = "UPDATE employee SET ? WHERE ?";

                    connection.query("SELECT id, first_name, last_name FROM employee WHERE ?", {first_name: nameArray[0]}, (err, res) => {
                        if(err) throw err;

                        const manager = res[0].first_name + " " + res[0].last_name;

                        connection.query(query, [{manager_id: res[0].id}, {first_name: employeeArray[0]}], (err, res) => {
                            if(err) throw err;

                            console.log(`${name}'s manager has been updated to ${manager}.`);
                            promptUser();
                        })
                    })
                })
            })
        })
    })
}

const removeEmployee = () => {
    const employees = [];

    connection.query("SELECT first_name, last_name FROM employee", (err, res) => {
        if(err) throw err;

        for(const employee of res){
            const name = employee.first_name + " " + employee.last_name;
            employees.push(name);
        }
        
        inquirer.prompt(
            {
                type: "list",
                message: "Which employee do you want to remove?",
                name: "employee",
                choices: employees
            }
        ).then(res => {
            const name = res.employee;
            const nameArray = res.employee.split(" ");
            
            connection.query("DELETE FROM employee WHERE ?", {first_name: nameArray[0]}, (err, res) => {
                if(err) throw err;

                console.log(`${name} has been removed from the system.`);
                promptUser();
            })
        })
    })
}

const removeRole = async () => {
    const input = await inquirer.prompt(
        {
            type: "list",
            message: "Which role do you want to remove?",
            name: "remove",
            choices: titles
        }
    );

    const query = "DELETE FROM role WHERE ?";

    connection.query(query, {title: input.remove}, (err, res) => {
        if(err) throw err;

        console.log("Successfully removed role.");
        connection.query(`ALTER TABLE department AUTO_INCREMENT = ${departments.length}`)
        promptUser();
    })
}

const removeDepartment = async () => {
    const input = await inquirer.prompt(
        {
            type: "list",
            message: "Which department do you want to remove?",
            name: "remove",
            choices: departments
        }
    );

    const query = "DELETE FROM department WHERE ?";

    connection.query(query, {name: input.remove}, (err, res) => {
        if(err) throw err;

        console.log("Successfully removed department.");

        connection.query(`ALTER TABLE department AUTO_INCREMENT = ${departments.length}`)
        promptUser();
    })
}

const calculateBudget = async () => {
    const input = await inquirer.prompt(
        {
            type: "list",
            message: "Which department's utilized budget do you want to view?",
            name: "budget",
            choices: departments
        }
    );

    const query = "SELECT first_name, last_name, title, salary FROM employee INNER JOIN role ON employee.role_id = role.id INNER JOIN department ON role.department_id = department.id WHERE ?";
    const department = input.budget;

    connection.query(query, {name: department}, (err, res) => {
        if(err) throw err;
        let total = 0;

        for(const budget of res){
            total += budget.salary;
        }

        console.table(res);
        console.log(`Total Utilized Budget for ${department}: ${total}\n`);
        promptUser();
    })
}