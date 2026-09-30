require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const db = require("./server/db");

const app = express();

const PORT = 3000;


// =========================
// Middleware
// =========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// =========================
// Session
// =========================

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);


// =========================
// Serve Frontend
// =========================

app.use(express.static(path.join(__dirname, "client")));
app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
});

// =========================
// Home Page
// =========================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "client", "index.html")
    );

});


// =========================
// API Test
// =========================

app.get("/api/test", (req, res) => {

    res.json({
        message: "SmartSpend API is working!",
        status: "success"
    });

});


// =========================
// Database Test
// =========================

app.get("/api/db-test", (req, res) => {

    db.query("SELECT 1", (err, result) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                status: "error",
                message: "Database connection failed"
            });

        }

        res.json({
            status: "success",
            message: "Database connected successfully!"
        });

    });

});


// =========================
// User Registration
// =========================

app.post("/api/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;


        // Check required fields
        if (!name || !email || !password) {

            return res.status(400).json({
                status: "error",
                message: "All fields are required."
            });

        }


        // Check existing email
        db.query(
            "SELECT id FROM users WHERE email = ?",
            [email],
            async (err, results) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        status: "error",
                        message: "Database error."
                    });

                }


                if (results.length > 0) {

                    return res.status(400).json({
                        status: "error",
                        message: "Email is already registered."
                    });

                }


                // Hash password
                const hashedPassword =
                    await bcrypt.hash(password, 10);


                // Insert user
                db.query(
                    `INSERT INTO users
                    (name, email, password)
                    VALUES (?, ?, ?)`,
                    [
                        name,
                        email,
                        hashedPassword
                    ],
                    (err, result) => {

                        if (err) {

                            console.error(err);

                            return res.status(500).json({
                                status: "error",
                                message: "Could not create account."
                            });

                        }


                        res.status(201).json({
                            status: "success",
                            message: "Account created successfully!"
                        });

                    }
                );

            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            status: "error",
            message: "Something went wrong."
        });

    }

});


// =========================
// User Login
// =========================

app.post("/api/login", (req, res) => {

    const {
        email,
        password
    } = req.body;


    // Check required fields
    if (!email || !password) {

        return res.status(400).json({
            status: "error",
            message: "Email and password are required."
        });

    }


    // Find user
    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Database error."
                });

            }


            // User not found
            if (results.length === 0) {

                return res.status(401).json({
                    status: "error",
                    message: "Invalid email or password."
                });

            }


            const user = results[0];


            // Check password
            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );


            if (!passwordMatch) {

                return res.status(401).json({
                    status: "error",
                    message: "Invalid email or password."
                });

            }


            // Create session
            req.session.userId = user.id;
            req.session.userName = user.name;
            req.session.userEmail = user.email;


            res.json({
                status: "success",
                message: "Login successful!",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });

        }
       );

});


// =========================
// Logout
// =========================

app.post("/api/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {
            return res.status(500).json({
                status: "error",
                message: "Could not logout."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            status: "success",
            message: "Logged out successfully."
        });

    });

});


// =========================
// Get Current User
// =========================

app.get("/api/me", (req, res) => {

    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    db.query(
       "SELECT id, name, email, created_at FROM users WHERE id = ?",
        [req.session.userId],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Database error."
                });

            }

            if (results.length === 0) {

                return res.status(404).json({
                    status: "error",
                    message: "User not found."
                });

            }

            res.json({
                status: "success",
                user: results[0]
            });

        }
    );

});
// ===============================
// Update Profile
// ===============================

app.put("/api/profile", (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });
    }

    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            status: "error",
            message: "Name and email are required."
        });
    }

    const checkQuery =
        "SELECT id FROM users WHERE email = ? AND id != ?";

    db.query(
        checkQuery,
        [email, req.session.userId],
        (checkErr, checkResults) => {

            if (checkErr) {
                console.error(checkErr);

                return res.status(500).json({
                    status: "error",
                    message: "Database error."
                });
            }

            if (checkResults.length > 0) {
                return res.status(400).json({
                    status: "error",
                    message: "Email is already in use."
                });
            }

            const updateQuery =
                "UPDATE users SET name = ?, email = ? WHERE id = ?";

            db.query(
                updateQuery,
                [name, email, req.session.userId],
                (updateErr) => {

                    if (updateErr) {
                        console.error(updateErr);

                        return res.status(500).json({
                            status: "error",
                            message: "Could not update profile."
                        });
                    }

                    req.session.userName = name;
                    req.session.userEmail = email;

                    res.json({
                        status: "success",
                        message: "Profile updated successfully."
                    });

                }
            );

        }
    );

});

// ===============================
// Change Password
// ===============================

app.put("/api/change-password", async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            status: "error",
            message: "Both passwords are required."
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            status: "error",
            message: "New password must be at least 6 characters."
        });
    }

    const query = "SELECT password FROM users WHERE id = ?";

    db.query(
        query,
        [req.session.userId],
        async (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Database error."
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "User not found."
                });
            }

            const passwordMatch = await bcrypt.compare(
                currentPassword,
                results[0].password
            );

            if (!passwordMatch) {
                return res.status(400).json({
                    status: "error",
                    message: "Current password is incorrect."
                });
            }

            const hashedPassword = await bcrypt.hash(
                newPassword,
                10
            );

            const updateQuery =
                "UPDATE users SET password = ? WHERE id = ?";

            db.query(
                updateQuery,
                [hashedPassword, req.session.userId],
                (updateErr) => {

                    if (updateErr) {
                        console.error(updateErr);

                        return res.status(500).json({
                            status: "error",
                            message: "Could not change password."
                        });
                    }

                    res.json({
                        status: "success",
                        message: "Password changed successfully."
                    });

                }
            );

        }
    );

});

// =========================
// Get Dashboard Summary
// =========================

app.get("/api/dashboard-summary", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const userId = req.session.userId;

    const query = `
        SELECT
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalIncome,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense
        FROM transactions
        WHERE user_id = ?
    `;

    db.query(query, [userId], (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                status: "error",
                message: "Database error."
            });

        }

        const totalIncome = Number(results[0].totalIncome);
        const totalExpense = Number(results[0].totalExpense);
        const balance = totalIncome - totalExpense;

        res.json({
            status: "success",
            totalIncome: totalIncome,
            totalExpense: totalExpense,
            balance: balance
        });

    });

});
// =========================
// Add Transaction
// =========================

app.post("/api/transactions", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const {
        type,
        title,
        category_id,
        amount,
        payment_method,
        description,
        transaction_date
    } = req.body;

    // Validate required fields
    if (
        !type ||
        !title ||
        !category_id ||
        !amount ||
        !payment_method ||
        !transaction_date
    ) {

        return res.status(400).json({
            status: "error",
            message: "Please fill in all required fields."
        });

    }

    const query = `
        INSERT INTO transactions
        (
            user_id,
            category_id,
            type,
            title,
            amount,
            payment_method,
            description,
            transaction_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            req.session.userId,
            category_id,
            type,
            title,
            amount,
            payment_method,
            description || null,
            transaction_date
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not add transaction."
                });

            }

            res.status(201).json({
                status: "success",
                message: "Transaction added successfully!",
                transactionId: result.insertId
            });

        }
    );

});


// ===============================
// DELETE TRANSACTION
// ===============================

app.delete("/api/transactions/:id", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const transactionId = req.params.id;

    const query = `
        DELETE FROM transactions
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        query,
        [transactionId, req.session.userId],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not delete transaction."
                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    status: "error",
                    message: "Transaction not found."
                });

            }

            res.json({
                status: "success",
                message: "Transaction deleted successfully."
            });

        }
    );

});

// ===============================
// Get One Transaction
// ===============================

app.get("/api/transactions/:id", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });
    }

    const transactionId = req.params.id;

    const query = `
        SELECT
            t.id,
            t.type,
            t.title,
            t.category_id,
            t.amount,
            t.payment_method,
            t.description,
            t.transaction_date
        FROM transactions t
        WHERE t.id = ?
        AND t.user_id = ?
    `;

    db.query(
        query,
        [transactionId, req.session.userId],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    status: "error",
                    message: "Could not load transaction."
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "Transaction not found."
                });
            }

            res.json({
                status: "success",
                transaction: results[0]
            });
        }
    );
});
// ===============================
// EDIT TRANSACTION
// ===============================

app.put("/api/transactions/:id", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const transactionId = req.params.id;

    const {
        type,
        title,
        category_id,
        amount,
        payment_method,
        description,
        transaction_date
    } = req.body;

    // Validate required fields
    if (
        !type ||
        !title ||
        !category_id ||
        !amount ||
        !payment_method ||
        !transaction_date
    ) {

        return res.status(400).json({
            status: "error",
            message: "Please fill in all required fields."
        });

    }

    const query = `
        UPDATE transactions
        SET
            type = ?,
            title = ?,
            category_id = ?,
            amount = ?,
            payment_method = ?,
            description = ?,
            transaction_date = ?
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        query,
        [
            type,
            title,
            category_id,
            amount,
            payment_method,
            description || null,
            transaction_date,
            transactionId,
            req.session.userId
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not update transaction."
                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    status: "error",
                    message: "Transaction not found."
                });

            }

            res.json({
                status: "success",
                message: "Transaction updated successfully!"
            });

        }
    );

});


// =========================
// Get Categories
// =========================

app.get("/api/categories", (req, res) => {

    const { type } = req.query;

    if (!type) {

        return res.status(400).json({
            status: "error",
            message: "Category type is required."
        });

    }

    db.query(
        "SELECT id, name FROM categories WHERE type = ? ORDER BY name",
        [type],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not load categories."
                });

            }

            res.json({
                status: "success",
                categories: results
            });

        }
    );

});
// =========================
// Get Categories
// =========================

app.get("/api/categories", (req, res) => {

    const { type } = req.query;

    if (!type) {

        return res.status(400).json({
            status: "error",
            message: "Category type is required."
        });

    }

    db.query(
        "SELECT id, name FROM categories WHERE type = ? ORDER BY name",
        [type],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not load categories."
                });

            }

            res.json({
                status: "success",
                categories: results
            });

        }
    );

});
// =========================
// Get Recent Transactions
// =========================

app.get("/api/recent-transactions", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const query = `
        SELECT
            t.id,
            t.type,
            t.title,
            t.amount,
            t.payment_method,
            t.transaction_date,
            c.name AS category_name
        FROM transactions t
        LEFT JOIN categories c
            ON t.category_id = c.id
        WHERE t.user_id = ?
        ORDER BY t.transaction_date DESC, t.id DESC
        LIMIT 5
    `;

    db.query(
        query,
        [req.session.userId],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not load transactions."
                });

            }

            res.json({
                status: "success",
                transactions: results
            });

        }
    );

});
// =========================
// Get All Transactions
// =========================

app.get("/api/transactions", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const query = `
        SELECT
            t.id,
            t.type,
            t.title,
            t.amount,
            t.payment_method,
            t.description,
            t.transaction_date,
            c.name AS category_name
        FROM transactions t
        LEFT JOIN categories c
            ON t.category_id = c.id
        WHERE t.user_id = ?
        ORDER BY t.transaction_date DESC, t.id DESC
    `;

    db.query(
        query,
        [req.session.userId],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not load transactions."
                });

            }

            res.json({
                status: "success",
                transactions: results
            });

        }
    );

});

// =========================
// Set Monthly Budget
// =========================

app.post("/api/budget", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {

        return res.status(400).json({
            status: "error",
            message: "Please enter a valid budget amount."
        });

    }

    const now = new Date();

    const year = now.getFullYear();
    const monthNumber = now.getMonth() + 1;

    const query = `
        SELECT id
        FROM budgets
        WHERE user_id = ?
        AND month = ?
        AND month_number = ?
        AND category_id IS NULL
        LIMIT 1
    `;

    db.query(
        query,
        [req.session.userId, year, monthNumber],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Database error."
                });

            }

            // Update existing budget
            if (results.length > 0) {

                db.query(
                    `UPDATE budgets
                     SET amount = ?
                     WHERE id = ?`,
                    [amount, results[0].id],
                    (err) => {

                        if (err) {

                            console.error(err);

                            return res.status(500).json({
                                status: "error",
                                message: "Could not update budget."
                            });

                        }

                        return res.json({
                            status: "success",
                            message: "Monthly budget updated successfully!"
                        });

                    }
                );

            } else {

                // Create new budget
                db.query(
                    `INSERT INTO budgets
                    (user_id, category_id, amount, month, month_number)
                    VALUES (?, NULL, ?, ?, ?)`,
                    [
                        req.session.userId,
                        amount,
                        year,
                        monthNumber
                    ],
                    (err) => {

                        if (err) {

                            console.error(err);

                            return res.status(500).json({
                                status: "error",
                                message: "Could not create budget."
                            });

                        }

                        return res.status(201).json({
                            status: "success",
                            message: "Monthly budget created successfully!"
                        });

                    }
                );

            }

        }
    );

});
// =========================
// Get Monthly Budget Summary
// =========================

app.get("/api/monthly-budget", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const userId = req.session.userId;

    const now = new Date();

    const year = now.getFullYear();
    const monthNumber = now.getMonth() + 1;


    // Get monthly budget
    const budgetQuery = `
        SELECT amount
        FROM budgets
        WHERE user_id = ?
        AND month = ?
        AND month_number = ?
        AND category_id IS NULL
        LIMIT 1
    `;


    db.query(
        budgetQuery,
        [userId, year, monthNumber],
        (err, budgetResults) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not load budget."
                });

            }


            const budget =
                budgetResults.length > 0
                    ? Number(budgetResults[0].amount)
                    : 0;


            // Get this month's expenses
            const expenseQuery = `
                SELECT
                    COALESCE(SUM(amount), 0) AS spent
                FROM transactions
                WHERE user_id = ?
                AND type = 'expense'
                AND YEAR(transaction_date) = ?
                AND MONTH(transaction_date) = ?
            `;


            db.query(
                expenseQuery,
                [userId, year, monthNumber],
                (err, expenseResults) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            status: "error",
                            message: "Could not load expenses."
                        });

                    }


                    const spent =
                        Number(expenseResults[0].spent);


                    const remaining =
                        budget - spent;


                    const percentage =
                        budget > 0
                            ? Math.round((spent / budget) * 100)
                            : 0;


                    res.json({
                        status: "success",
                        budget: budget,
                        spent: spent,
                        remaining: remaining,
                        percentage: percentage,
                        year: year,
                        month: monthNumber
                    });

                }
            );

        }
    );

});
// =========================
// Create Savings Goal
// =========================

app.post("/api/savings-goals", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const {
        name,
        target_amount,
        saved_amount,
        deadline
    } = req.body;


    // Validate required fields
    if (!name || !target_amount) {

        return res.status(400).json({
            status: "error",
            message: "Goal name and target amount are required."
        });

    }


    if (Number(target_amount) <= 0) {

        return res.status(400).json({
            status: "error",
            message: "Target amount must be greater than 0."
        });

    }


    if (Number(saved_amount || 0) < 0) {

        return res.status(400).json({
            status: "error",
            message: "Saved amount cannot be negative."
        });

    }


    if (Number(saved_amount || 0) > Number(target_amount)) {

        return res.status(400).json({
            status: "error",
            message: "Saved amount cannot be greater than the target."
        });

    }


    const query = `
        INSERT INTO savings_goals
        (
            user_id,
            name,
            target_amount,
            saved_amount,
            deadline
        )
        VALUES (?, ?, ?, ?, ?)
    `;


    db.query(
        query,
        [
            req.session.userId,
            name,
            target_amount,
            saved_amount || 0,
            deadline || null
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not create savings goal."
                });

            }


            res.status(201).json({
                status: "success",
                message: "Savings goal created successfully!",
                goalId: result.insertId
            });

        }
    );

});

// =========================
// Get Savings Goals
// =========================

app.get("/api/savings-goals", (req, res) => {

    // Check login
    if (!req.session.userId) {
        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });
    }

    const query = `
        SELECT
            id,
            name,
            target_amount,
            saved_amount,
            deadline
        FROM savings_goals
        WHERE user_id = ?
        ORDER BY id DESC
    `;

    db.query(
        query,
        [req.session.userId],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not load savings goals."
                });
            }

            res.json({
                status: "success",

                // Keep "goal" so the existing
                // Savings Overview continues working
                goal: results.length > 0
                    ? results[0]
                    : null,

                // New: all savings goals
                goals: results
            });

        }
    );

});


// =========================
// Add Savings Amount
// =========================

app.put("/api/savings-goals/add", (req, res) => {
console.log("🔥 NEW ADD SAVINGS ROUTE CALLED");

    if (!req.session.userId) {
        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });
    }

    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
        return res.status(400).json({
            status: "error",
            message: "Savings amount must be greater than 0."
        });
    }

    const findGoalQuery = `
        SELECT id, target_amount, saved_amount
        FROM savings_goals
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 1
    `;

    db.query(
        findGoalQuery,
        [req.session.userId],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not find savings goal."
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "No savings goal found."
                });
            }

            const goal = results[0];

            const newSavedAmount =
                Number(goal.saved_amount) + amount;

            if (newSavedAmount > Number(goal.target_amount)) {
                return res.status(400).json({
                    status: "error",
                    message: "Savings amount cannot exceed the target."
                });
            }

            const updateQuery = `
                UPDATE savings_goals
                SET saved_amount = ?
                WHERE id = ?
                AND user_id = ?
            `;

            db.query(
                updateQuery,
                [
                    newSavedAmount,
                    goal.id,
                    req.session.userId
                ],
                (updateErr) => {

                    if (updateErr) {
                        console.error(updateErr);

                        return res.status(500).json({
                            status: "error",
                            message: "Could not add savings."
                        });
                    }

                    res.json({
                        status: "success",
                        message: "Savings added successfully!",
                        saved_amount: newSavedAmount
                    });

                }
            );

        }
    );

});

 

// =========================
// Add Bill
// =========================

app.post("/api/bills", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const {
        title,
        amount,
        category_id,
        due_date,
        repeat_type,
        description
    } = req.body;


    // Validate required fields
    if (!title || !amount || !due_date) {

        return res.status(400).json({
            status: "error",
            message: "Bill title, amount and due date are required."
        });

    }


    if (Number(amount) <= 0) {

        return res.status(400).json({
            status: "error",
            message: "Amount must be greater than 0."
        });

    }


    const query = `
        INSERT INTO payments
        (
            user_id,
            title,
            amount,
            category_id,
            due_date,
            repeat_type,
            status,
            description
        )
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `;


    db.query(
        query,
        [
            req.session.userId,
            title,
            amount,
            category_id || null,
            due_date,
            repeat_type || "none",
            description || null
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not add bill."
                });

            }


            res.status(201).json({
                status: "success",
                message: "Bill added successfully!",
                billId: result.insertId
            });

        }
    );

});
// =========================
// Get Bills
// =========================

app.get("/api/bills", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const query = `
        SELECT
            p.id,
            p.title,
            p.amount,
            p.due_date,
            p.repeat_type,
            p.status,
            p.description,
            c.name AS category_name
        FROM payments p
        LEFT JOIN categories c
            ON p.category_id = c.id
        WHERE p.user_id = ?
        ORDER BY p.due_date ASC, p.id DESC
    `;

    db.query(
        query,
        [req.session.userId],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not load bills."
                });

            }

            res.json({
                status: "success",
                bills: results
            });

        }
    );

});

// =========================
// Get Bills Due Soon
// =========================

app.get("/api/bills/due-soon", (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });
    }

    const query = `
        SELECT
            p.id,
            p.title,
            p.amount,
            p.due_date,
            p.status,
            DATEDIFF(p.due_date, CURDATE()) AS days_left
        FROM payments p
        WHERE p.user_id = ?
        AND p.status = 'pending'
        AND DATEDIFF(p.due_date, CURDATE()) <= 3
        ORDER BY p.due_date ASC
    `;

    db.query(
        query,
        [req.session.userId],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not load due bills."
                });
            }

            res.json({
                status: "success",
                bills: results
            });

        }
    );

});

// =========================
// Mark Bill as Paid
// =========================

app.put("/api/bills/:id/pay", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const billId = req.params.id;

    const query = `
        UPDATE payments
        SET status = 'paid'
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        query,
        [billId, req.session.userId],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not update bill."
                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    status: "error",
                    message: "Bill not found."
                });

            }

            res.json({
                status: "success",
                message: "Bill marked as paid!"
            });

        }
    );

});

// =========================
// Delete Bill
// =========================

app.delete("/api/bills/:id", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const billId = req.params.id;

    const query = `
        DELETE FROM payments
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        query,
        [billId, req.session.userId],
        (err, result) => {

            if (err) {

                console.error(
                    "Delete bill error:",
                    err
                );

                return res.status(500).json({
                    status: "error",
                    message: "Could not delete bill."
                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    status: "error",
                    message: "Bill not found."
                });

            }

            res.json({
                status: "success",
                message: "Bill deleted successfully!"
            });

        }
    );

});

// =========================
// Get Analytics Data
// =========================

app.get("/api/analytics", (req, res) => {

    // Check login
    if (!req.session.userId) {

        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });

    }

    const userId = req.session.userId;
console.log("ANALYTICS ROUTE: NEW VERSION");
    // Get total income and expense
    const summaryQuery = `
        SELECT
            COALESCE(
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END),
                0
            ) AS totalIncome,

            COALESCE(
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END),
                0
            ) AS totalExpense

        FROM transactions
        WHERE user_id = ?
    `;

    db.query(
        summaryQuery,
        [userId],
        (err, summaryResults) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not load analytics summary."
                });

            }

            const totalIncome =
                Number(summaryResults[0].totalIncome);

            const totalExpense =
                Number(summaryResults[0].totalExpense);

            const balance =
                totalIncome - totalExpense;


            // Get expenses by category
            const categoryQuery = `
                SELECT
                    c.name AS category,
                    SUM(t.amount) AS amount

                FROM transactions t

                JOIN categories c
                    ON t.category_id = c.id

                WHERE t.user_id = ?
                AND t.type = 'expense'

                GROUP BY c.id, c.name

                ORDER BY amount DESC
            `;

            db.query(
                categoryQuery,
                [userId],
                (err, categoryResults) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            status: "error",
                            message: "Could not load category analytics."
                        });

                    }

                   const weeklyQuery = `
    SELECT
        DATE_FORMAT(transaction_date, '%Y-%m-%d') AS expense_date,
        SUM(amount) AS amount
    FROM transactions
    WHERE user_id = ?
      AND type = 'expense'
      AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY transaction_date
    ORDER BY transaction_date ASC
`;

db.query(weeklyQuery, [userId], (weeklyErr, weeklyResults) => {

    if (weeklyErr) {
        console.error(weeklyErr);

        return res.status(500).json({
            status: "error",
            message: "Could not load weekly expenses."
        });
    }

    const monthlyQuery = `
        SELECT
            MONTH(transaction_date) AS month_number,
            SUM(amount) AS amount
        FROM transactions
        WHERE user_id = ?
          AND type = 'expense'
          AND YEAR(transaction_date) = YEAR(CURDATE())
        GROUP BY MONTH(transaction_date)
        ORDER BY MONTH(transaction_date) ASC
    `;

   db.query(monthlyQuery, [userId], (monthlyErr, monthlyResults) => {

    if (monthlyErr) {
        console.error(monthlyErr);

        return res.status(500).json({
            status: "error",
            message: "Could not load monthly expenses."
        });
    }


    // ===============================
    // Spending Trend
    // ===============================

    const trendQuery = `
        SELECT
            COALESCE(
                SUM(
                    CASE
                        WHEN YEAR(transaction_date) = YEAR(CURDATE())
                        AND MONTH(transaction_date) = MONTH(CURDATE())
                        THEN amount
                        ELSE 0
                    END
                ),
                0
            ) AS currentMonthExpense,

            COALESCE(
                SUM(
                    CASE
                        WHEN YEAR(transaction_date) = YEAR(
                            DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
                        )
                        AND MONTH(transaction_date) = MONTH(
                            DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
                        )
                        THEN amount
                        ELSE 0
                    END
                ),
                0
            ) AS previousMonthExpense

        FROM transactions

        WHERE user_id = ?
        AND type = 'expense'
    `;


    db.query(
        trendQuery,
        [userId],
        (trendErr, trendResults) => {

            if (trendErr) {
                console.error(trendErr);

                return res.status(500).json({
                    status: "error",
                    message: "Could not load spending trend."
                });
            }


            const currentMonthExpense =
                Number(trendResults[0].currentMonthExpense);

            const previousMonthExpense =
                Number(trendResults[0].previousMonthExpense);


            let spendingTrend = 0;


            if (previousMonthExpense > 0) {

                spendingTrend =
                    Math.round(
                        (
                            (
                                currentMonthExpense -
                                previousMonthExpense
                            ) /
                            previousMonthExpense
                        ) * 100
                    );

            }


            // ===============================
            // Totals by Payment Method
            // ===============================

            const paymentMethodQuery = `
                SELECT
                    type,
                    LOWER(payment_method) AS method,
                    SUM(amount) AS total
                FROM transactions
                WHERE user_id = ?
                GROUP BY type, LOWER(payment_method)
                ORDER BY total DESC
            `;

            db.query(
                paymentMethodQuery,
                [userId],
                (paymentErr, paymentResults) => {

                    if (paymentErr) {
                        console.error(paymentErr);

                        return res.status(500).json({
                            status: "error",
                            message: "Could not load payment method analytics."
                        });
                    }

                    const toMethodTotals = type =>
                        paymentResults
                            .filter(row => row.type === type)
                            .map(row => ({
                                method: row.method,
                                total: Number(row.total)
                            }));


                    res.json({
                        status: "success",

                        totalIncome,
                        totalExpense,
                        balance,

                        categories: categoryResults,

                        weeklyExpenses: weeklyResults,

                        monthlyExpenses: monthlyResults,

                        spendingTrend: spendingTrend,

                        currentMonthExpense: currentMonthExpense,

                        previousMonthExpense: previousMonthExpense,

                        expenseByPaymentMethod: toMethodTotals("expense"),

                        incomeByPaymentMethod: toMethodTotals("income")
                    });

                }
            );

        }

    );

});

});
                }
            );

        }
    );

});
// ===============================
// Reports API
// ===============================

app.get("/api/reports", (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });
    }

    const userId = req.session.userId;

    const month = req.query.month;

    if (!month) {
        return res.status(400).json({
            status: "error",
            message: "Month is required."
        });
    }

    const startDate = `${month}-01`;

    const [year, monthNumber] = month.split("-");

    const endDate = new Date(
        Number(year),
        Number(monthNumber),
        0
    );

    const endDateString =
        `${year}-${String(monthNumber).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;


    const summaryQuery = `
        SELECT
            COALESCE(
                SUM(
                    CASE
                        WHEN type = 'income' THEN amount
                        ELSE 0
                    END
                ), 0
            ) AS totalIncome,

            COALESCE(
                SUM(
                    CASE
                        WHEN type = 'expense' THEN amount
                        ELSE 0
                    END
                ), 0
            ) AS totalExpense

        FROM transactions

        WHERE user_id = ?
        AND transaction_date BETWEEN ? AND ?
    `;


    const categoryQuery = `
        SELECT
            c.name AS category,
            COALESCE(SUM(t.amount), 0) AS amount

        FROM transactions t

        JOIN categories c
            ON t.category_id = c.id

        WHERE t.user_id = ?
        AND t.type = 'expense'
        AND t.transaction_date BETWEEN ? AND ?

        GROUP BY c.id, c.name

        ORDER BY amount DESC
    `;


    const transactionQuery = `
        SELECT
            t.id,
            t.title,
            t.amount,
            t.type,
            t.transaction_date,
            c.name AS category_name

        FROM transactions t

        JOIN categories c
            ON t.category_id = c.id

        WHERE t.user_id = ?
        AND t.transaction_date BETWEEN ? AND ?

        ORDER BY t.transaction_date DESC, t.id DESC
    `;


    db.query(
        summaryQuery,
        [userId, startDate, endDateString],
        (summaryError, summaryResults) => {

            if (summaryError) {
                console.error(summaryError);

                return res.status(500).json({
                    status: "error",
                    message: "Database error."
                });
            }


            db.query(
                categoryQuery,
                [userId, startDate, endDateString],
                (categoryError, categoryResults) => {

                    if (categoryError) {
                        console.error(categoryError);

                        return res.status(500).json({
                            status: "error",
                            message: "Database error."
                        });
                    }


                    db.query(
                        transactionQuery,
                        [userId, startDate, endDateString],
                        (transactionError, transactionResults) => {

                            if (transactionError) {
                                console.error(transactionError);

                                return res.status(500).json({
                                    status: "error",
                                    message: "Database error."
                                });
                            }


                            const totalIncome =
                                Number(summaryResults[0].totalIncome);

                            const totalExpense =
                                Number(summaryResults[0].totalExpense);

                            const balance =
                                totalIncome - totalExpense;


                            res.json({
                                status: "success",

                                month: month,

                                totalIncome: totalIncome,

                                totalExpense: totalExpense,

                                balance: balance,

                                categories: categoryResults,

                                transactions: transactionResults
                            });

                        }
                    );

                }
            );

        }
    );

});

// Update Savings Goal
app.put("/api/savings-goals/:id", (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });
    }

    const goalId = req.params.id;
    const { saved_amount } = req.body;

    if (saved_amount === undefined || Number(saved_amount) < 0) {
        return res.status(400).json({
            status: "error",
            message: "Please enter a valid savings amount."
        });
    }

    const query = `
        UPDATE savings_goals
        SET saved_amount = ?
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        query,
        [
            Number(saved_amount),
            goalId,
            req.session.userId
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    status: "error",
                    message: "Could not update savings goal."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "Savings goal not found."
                });
            }

            res.json({
                status: "success",
                message: "Savings goal updated successfully!"
            });

        }
    );

});

// =========================
// Delete Savings Goal
// =========================


app.delete("/api/savings-goals/:id", function (req, res) {

    if (!req.session.userId) {
        return res.status(401).json({
            status: "error",
            message: "Not logged in."
        });
    }

    const goalId = req.params.id;
    const userId = req.session.userId;

    const query = `
        DELETE FROM savings_goals
        WHERE id = ?
        AND user_id = ?
    `;

    db.query(
        query,
        [goalId, userId],
        function (err, result) {

            if (err) {
                console.error(
                    "Delete savings goal error:",
                    err
                );

                return res.status(500).json({
                    status: "error",
                    message: "Could not delete savings goal."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "Savings goal not found."
                });
            }

            return res.json({
                status: "success",
                message: "Savings goal deleted successfully!"
            });

        }
    );

});

// =========================
// Start Server
// =========================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});

