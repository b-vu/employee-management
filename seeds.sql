INSERT INTO employee(first_name, last_name, role_id, manager_id)
VALUES("Brian", "Vu", 3, 6), ("Ashley", "Williams", 5, 7), ("Thane", "Krios", 7, 8), ("Jeff", "Moreau", 8, 5);

INSERT INTO employee(first_name, last_name, role_id)
VALUES("Mordin", "Solus", 1), ("Garrus", "Vakarian", 2), ("Miranda", "Lawson", 4), ("Liara", "T'Soni", 6);


INSERT INTO role(title, salary, department_id)
VALUES("Manager", 200000, 1), ("Lead Engineer", 180000, 2), ("Software Engineer", 150000, 2), ("Sales Lead", 170000, 3),
("Salesperson", 140000, 3), ("Legal Team Lead", 190000, 4), ("Lawyer", 160000, 4), ("Accountant", 130000, 5);


INSERT INTO department(name)
VALUES("Administration"), ("Engineering"), ("Sales"), ("Legal"), ("Finance");