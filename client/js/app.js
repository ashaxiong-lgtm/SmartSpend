// =========================
// Register User
// =========================
console.log("REGISTER JS LOADED");
const registerForm = document.getElementById("registerForm");

console.log("FORM:", registerForm);



if (registerForm) {

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();


        const name =
            document.querySelector("#name").value.trim();

        const email =
            document.querySelector("#email").value.trim();

        const password =
            document.querySelector("#password").value;

        const confirmPassword =
            document.querySelector("#confirmPassword").value;


        if (password !== confirmPassword) {

            alert("Passwords do not match.");
            return;

        }


        try {

            const response = await fetch("/api/register", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    name: name,
                    email: email,
                    password: password

                })

            });


            const data = await response.json();


            if (response.ok) {

                alert("Account created successfully!");

                window.location.href = "login.html";

            } else {

                alert(data.message);

            }


        } catch(error) {

            console.error("Register error:", error);

            alert("Could not connect to server.");

        }

    });

}

// =========================
// Login User
// =========================

const loginForm = document.querySelector("#loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = document.querySelector("#email").value.trim();
        const password = document.querySelector("#password").value;

        console.log("Login button clicked");
        console.log("Email:", email);

        try {

            const response = await fetch("/api/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })

            });

            const data = await response.json();

            console.log("Server response:", data);

            if (response.ok) {

                alert("Login successful!");

                window.location.href = "dashboard.html";

            } else {

                alert(data.message);

            }

        } catch (error) {

            console.error("Login error:", error);

            alert("Could not connect to the server.");

        }

    });

}


// =========================
// Load Current User
// =========================

async function loadCurrentUser() {

    try {

        const response = await fetch("/api/me");

        const data = await response.json();

        if (!response.ok) {
            window.location.href = "login.html";
            return;
        }

        const user = data.user;

        document.querySelector("#userName").textContent = user.name;
        document.querySelector("#userEmail").textContent = user.email;

        // First letter of user's name
        document.querySelector("#userAvatar").textContent =
            user.name.charAt(0).toUpperCase();

    } catch (error) {

        console.error("Error loading user:", error);

    }

}


// Run only on Dashboard
if (document.querySelector("#userName")) {
    loadCurrentUser();
}

// =========================
// Transaction Form
// =========================

const transactionForm = document.querySelector("#transactionForm");

if (transactionForm) {

    transactionForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const type = document.querySelector("#type").value;
        const title = document.querySelector("#title").value.trim();
        const categoryId = document.querySelector("#category").value;
        const amount = document.querySelector("#amount").value;
        const paymentMethod =
            document.querySelector("#paymentMethod").value;
        const description =
            document.querySelector("#description").value.trim();
        const transactionDate =
            document.querySelector("#transactionDate").value;

        try {

            const url = window.editingTransactionId
                ? `/api/transactions/${window.editingTransactionId}`
                : "/api/transactions";

            const method = window.editingTransactionId
                ? "PUT"
                : "POST";

            const response = await fetch(url, {

                method: method,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    type: type,
                    title: title,
                    category_id: categoryId,
                    amount: amount,
                    payment_method: paymentMethod,
                    description: description,
                    transaction_date: transactionDate
                })

            });

            const data = await response.json();

            if (response.ok) {

                if (window.editingTransactionId) {
                    alert("Transaction updated successfully!");
                } else {
                    alert("Transaction added successfully!");
                }

                transactionForm.reset();

                // Exit edit mode
                window.editingTransactionId = null;

                // Restore button text
                const submitButton =
                    document.querySelector(
                        "#transactionForm button[type='submit']"
                    );

                if (submitButton) {
                    submitButton.textContent = "Add Transaction";
                }

               // Refresh transaction history without reloading the page
await window.refreshTransactionData();

            } else {

                alert(data.message);

            }

        } catch (error) {

            console.error("Transaction error:", error);

            alert("Could not connect to the server.");

        }

    });

}
// =========================
// Load Categories
// =========================

const categorySelect = document.querySelector("#category");
const typeSelect = document.querySelector("#type");

const transactionTypeRadios =
    document.querySelectorAll('input[name="transactionType"]');

if (categorySelect && typeSelect) {

    async function loadCategories(type) {

        console.log("Loading categories for:", type);

        categorySelect.innerHTML =
            '<option value="">Select Category</option>';

        if (!type) {
            return;
        }

        try {

            const response = await fetch(
                `/api/categories?type=${type}`
            );

            const data = await response.json();

            console.log("Categories loaded:", data);

            if (!response.ok || data.status !== "success") {

                console.error(
                    "Category API error:",
                    data
                );

                return;
            }

            data.categories.forEach((category) => {

                const option =
                    document.createElement("option");

                option.value = category.id;

                option.textContent =
                    category.name;

                categorySelect.appendChild(option);

            });

            console.log(
                "Category options:",
                categorySelect.options.length
            );

        } catch (error) {

            console.error(
                "Category loading error:",
                error
            );

        }
    }


    // =========================
    // Income / Expense Radio
    // =========================

    transactionTypeRadios.forEach((radio) => {

        radio.addEventListener("change", function () {

            typeSelect.value = this.value;

            loadCategories(this.value);

        });

    });


    // =========================
    // Hidden Type Select
    // =========================

    typeSelect.addEventListener("change", function () {

        loadCategories(this.value);

    });


    // =========================
    // Initial Load
    // =========================

    if (typeSelect.value) {

        loadCategories(typeSelect.value);

    } else {

        // Default to Income

        typeSelect.value = "income";

        const incomeRadio =
            document.querySelector(
                'input[name="transactionType"][value="income"]'
            );

        if (incomeRadio) {
            incomeRadio.checked = true;
        }

        loadCategories("income");

    }

}

// =========================
// Transaction Summary Cards
// =========================

const transactionTotalIncome =
    document.getElementById("transactionTotalIncome");

const transactionTotalExpense =
    document.getElementById("transactionTotalExpense");

const transactionNetBalance =
    document.getElementById("transactionNetBalance");

if (
    transactionTotalIncome &&
    transactionTotalExpense &&
    transactionNetBalance
) {

   window.loadTransactionSummary = async function () {

        try {

            const response =
                await fetch("/api/dashboard-summary");

            const data =
                await response.json();

            if (!response.ok) {
                console.error(
                    "Transaction summary error:",
                    data.message
                );
                return;
            }

            transactionTotalIncome.textContent =
                `৳ ${Number(data.totalIncome).toLocaleString()}`;

            transactionTotalExpense.textContent =
                `৳ ${Number(data.totalExpense).toLocaleString()}`;

            transactionNetBalance.textContent =
                `৳ ${Number(data.balance).toLocaleString()}`;

                const transactionResponse =
    await fetch("/api/transactions");

const transactionData =
    await transactionResponse.json();

if (transactionResponse.ok) {
    const totalCount =
        document.getElementById("transactionTotalCount");

    if (totalCount) {
        totalCount.textContent =
            transactionData.transactions.length;
    }
}

        } catch (error) {

            console.error(
                "Transaction summary loading error:",
                error
            );

        }

    }

    loadTransactionSummary();

}

// =========================
// Load Dashboard Summary
// =========================

const totalBalanceElement = document.querySelector("#totalBalance");
const totalIncomeElement = document.querySelector("#totalIncome");
const totalExpenseElement = document.querySelector("#totalExpense");
const dashboardInsight =
    document.querySelector("#dashboardInsight");
    
if (
    totalBalanceElement &&
    totalIncomeElement &&
    totalExpenseElement
) {

    async function loadDashboardSummary() {

        try {

            const response = await fetch("/api/dashboard-summary");

            const data = await response.json();

            if (!response.ok) {

                console.error(data.message);
                return;

            }

            totalBalanceElement.textContent =
                `৳ ${data.balance.toLocaleString()}`;

            totalIncomeElement.textContent =
                `৳ ${data.totalIncome.toLocaleString()}`;

            totalExpenseElement.textContent =
                `৳ ${data.totalExpense.toLocaleString()}`;
if (dashboardInsight) {

    if (data.totalIncome === 0 && data.totalExpense === 0) {

        dashboardInsight.textContent =
            "Start adding your income and expenses to receive personalized financial insights.";

    } else if (data.balance < 0) {

        dashboardInsight.textContent =
            `⚠ Your expenses are higher than your income by ৳ ${Math.abs(data.balance).toLocaleString()}. Consider reducing unnecessary spending.`;

    } else if (data.totalIncome > 0) {

        const spendingPercentage =
            Math.round(
                (data.totalExpense / data.totalIncome) * 100
            );

        if (spendingPercentage >= 80) {

            dashboardInsight.textContent =
                `⚠ You have spent ${spendingPercentage}% of your income. Try to control unnecessary expenses.`;

        } else if (spendingPercentage >= 50) {

            dashboardInsight.textContent =
                `💡 You have spent ${spendingPercentage}% of your income. Keep an eye on your spending.`;

        } else {

            dashboardInsight.textContent =
                `✓ Great job! You are spending only ${spendingPercentage}% of your income. Keep saving and managing your money wisely.`;

        }

    } else {

        dashboardInsight.textContent =
            "Keep tracking your financial activities to improve your money management.";

    }

}
        } catch (error) {

            console.error(
                "Dashboard summary error:",
                error
            );

        }

    }

    loadDashboardSummary();

}
// =========================
// Load Recent Transactions
// =========================

const transactionsBox = document.querySelector(".transactions-box");

if (transactionsBox) {

    async function loadRecentTransactions() {

        try {

            const response = await fetch(
                "/api/recent-transactions"
            );

            const data = await response.json();

            if (!response.ok) {

                console.error(data.message);
                return;

            }

            const transactionItems =
                transactionsBox.querySelectorAll(".transaction-item");

            // Remove the old fake transactions
            transactionItems.forEach(item => item.remove());

            if (data.transactions.length === 0) {

                const emptyMessage =
                    document.createElement("p");

                emptyMessage.textContent =
                    "No transactions yet.";

                transactionsBox.appendChild(emptyMessage);

                return;

            }

            data.transactions.forEach(transaction => {

                const item =
                    document.createElement("div");

                item.className = "transaction-item";

                const sign =
                    transaction.type === "income"
                        ? "+"
                        : "-";

                const amountClass =
                    transaction.type === "income"
                        ? "income"
                        : "expense";

                item.innerHTML = `
                    <div class="transaction-info">

                        <div class="transaction-icon">
                            ${transaction.type === "income" ? "💰" : "💸"}
                        </div>

                        <div>
                            <strong>${transaction.title}</strong>

                            <small>
                                ${transaction.category_name}
                                • ${transaction.transaction_date}
                            </small>
                        </div>

                    </div>

                    <strong class="${amountClass}">
                        ${sign} ৳ ${Number(transaction.amount).toLocaleString()}
                    </strong>
                `;

                transactionsBox.appendChild(item);

            });

        } catch (error) {

            console.error(
                "Recent transactions error:",
                error
            );

        }

    }

    loadRecentTransactions();

}
// =========================
// Monthly Budget Form
// =========================

const budgetForm = document.querySelector("#budgetForm");

if (budgetForm) {

    budgetForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const amount =
            document.querySelector("#budgetAmount").value;


        try {

            const response = await fetch("/api/budget", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    amount: amount
                })

            });


            const data = await response.json();


        if (response.ok) {

    alert(data.message);

    budgetForm.reset();

    // Update Budget Overview without page refresh
    await window.loadMonthlyBudget();

} else {

                alert(data.message);

            }

        } catch (error) {

            console.error("Budget error:", error);

            alert("Could not connect to the server.");

        }

    });

}
// =========================
// Load Monthly Budget
// =========================

const budgetProgress = document.querySelector("#budgetProgress");

if (budgetProgress) {

   window.loadMonthlyBudget = async function () {

        try {

            const response = await fetch("/api/monthly-budget");

            const data = await response.json();

            if (!response.ok) {
                console.error(data.message);
                return;
            }

            document.querySelector("#budgetPercentage").textContent =
                `${data.percentage}%`;

            document.querySelector("#budgetSpent").textContent =
                `৳ ${data.spent.toLocaleString()}`;

            document.querySelector("#budgetAmountDisplay").textContent =
                `৳ ${data.budget.toLocaleString()}`;

            const monthNames = [
                "January", "February", "March",
                "April", "May", "June",
                "July", "August", "September",
                "October", "November", "December"
            ];

            document.querySelector("#budgetMonth").textContent =
                `${monthNames[data.month - 1]} ${data.year}`;

            const progress =
    Math.min(data.percentage, 100);

budgetProgress.style.width =
    `${progress}%`;

budgetProgress.classList.remove(
    "warning",
    "danger",
    "exceeded"
);

if (data.percentage >= 100) {

    budgetProgress.classList.add("exceeded");

} else if (data.percentage >= 90) {

    budgetProgress.classList.add("danger");

} else if (data.percentage >= 70) {

    budgetProgress.classList.add("warning");

}

                const budgetWarning = document.getElementById("budgetWarning");

if (budgetWarning) {
    budgetProgress.classList.remove(
        "healthy",
        "warning",
        "danger",
        "exceeded"
    );

    if (data.percentage < 70) {
        budgetProgress.classList.add("healthy");
        budgetWarning.className = "budget-warning healthy";
        budgetWarning.textContent =
            "✓ Your budget is under control.";
    } else if (data.percentage < 90) {
        budgetProgress.classList.add("warning");
        budgetWarning.className = "budget-warning warning";
        budgetWarning.textContent =
            "⚠ You are getting close to your monthly budget.";
    } else if (data.percentage <= 100) {
        budgetProgress.classList.add("danger");
        budgetWarning.className = "budget-warning danger";
        budgetWarning.textContent =
            "⚠ You are almost at your monthly budget.";
    } else {
        budgetProgress.classList.add("exceeded");
        budgetWarning.classList.add("exceeded");
        budgetWarning.textContent =
            "🚨 You have exceeded your monthly budget.";
    }
}

        } catch (error) {

            console.error(
                "Budget loading error:",
                error
            );

        }

    }

    loadMonthlyBudget();

}
// =========================
// Savings Goal Form
// =========================

const savingsForm = document.querySelector("#savingsForm");

if (savingsForm) {

    savingsForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const name =
            document.querySelector("#goalName").value.trim();

        const targetAmount =
            document.querySelector("#targetAmount").value;

        const savedAmount =
            document.querySelector("#savedAmount").value || 0;

        const deadline =
            document.querySelector("#deadline").value;


        try {

            const response = await fetch("/api/savings-goals", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    name: name,
                    target_amount: targetAmount,
                    saved_amount: savedAmount,
                    deadline: deadline || null

                })

            });


            const data = await response.json();


if (response.ok) {

    alert(data.message);

    savingsForm.reset();

    // Update Savings Goal Overview without page refresh
    await window.loadSavingsGoal();

} else {

                alert(data.message);

            }

        } catch (error) {

            console.error(
                "Savings goal error:",
                error
            );

            alert("Could not connect to the server.");

        }

    });

}
// =========================
// Load Savings Goal
// =========================

const savingsGoalName =
    document.querySelector("#savingsGoalName");

if (savingsGoalName) {

  window.loadSavingsGoal = async function () {

        try {

            const response =
                await fetch("/api/savings-goals");

            const data =
                await response.json();

            if (!response.ok) {

                console.error(data.message);
                return;

            }

            // Load all savings goals into the dropdown
const savingsGoalSelect =
    document.querySelector("#savingsGoalSelect");

if (savingsGoalSelect) {

    savingsGoalSelect.innerHTML = `
        <option value="">
            Select a savings goal
        </option>
    `;

    (data.goals || []).forEach((goal) => {

        const option =
            document.createElement("option");

        option.value = goal.id;
        option.textContent = goal.name;

        savingsGoalSelect.appendChild(option);

    });
}

// =========================
// Display All Savings Goals
// =========================

const allSavingsGoalsList =
    document.getElementById("allSavingsGoalsList");

const savingsGoalCount =
    document.getElementById("savingsGoalCount");

if (allSavingsGoalsList) {

    const goals = data.goals || [];

    if (savingsGoalCount) {
        savingsGoalCount.textContent =
            `${goals.length} ${goals.length === 1 ? "Goal" : "Goals"}`;
    }

    if (goals.length === 0) {

        allSavingsGoalsList.innerHTML = `
            <div class="savings-empty-state">

                <div class="savings-empty-icon">
                    $
                </div>

                <h4>
                    No savings goals yet
                </h4>

                <p>
                    Create your first savings goal to start tracking your progress.
                </p>

            </div>
        `;

    } else {

        allSavingsGoalsList.innerHTML = "";

        goals.forEach((goal) => {

            const target =
                Number(goal.target_amount);

            const saved =
                Number(goal.saved_amount);

            let progress = 0;

            if (target > 0) {
                progress =
                    Math.min(
                        100,
                        Math.round((saved / target) * 100)
                    );
            }

            const isCompleted =
                progress >= 100;

            const goalCard =
                document.createElement("div");

            goalCard.className =
                "savings-goal-card";

            goalCard.innerHTML = `
                <div class="savings-goal-card-header">

                    <div>
                        <h4>
                            ${goal.name}
                        </h4>

                        <p>
                            Track your savings progress
                        </p>
                    </div>

                    <strong>
                        ${progress}%
                    </strong>

                </div>

                <div class="savings-goal-progress">
                    <div
                        class="savings-goal-progress-bar"
                        style="width: ${progress}%"
                    ></div>
                </div>

                <div class="savings-goal-card-footer">

                    <div>
                        <span>Saved</span>
                        <strong>
                            ৳ ${saved.toLocaleString()}
                        </strong>
                    </div>

                    <div>
                        <span>Target</span>
                        <strong>
                            ৳ ${target.toLocaleString()}
                        </strong>
                    </div>

                </div>

               <div class="savings-goal-actions">

    ${
        isCompleted
            ? `
                <button
                    type="button"
                    class="savings-done-btn"
                    data-goal-id="${goal.id}"
                >
                    ✓ Done
                </button>
            `
            : ""
    }

    <button
        type="button"
        class="savings-delete-btn"
        data-goal-id="${goal.id}"
    >
        🗑 Delete
    </button>

</div>
            `;

            allSavingsGoalsList.appendChild(goalCard);

        });

    }
}


if (!data.goal) {

    savingsGoalName.textContent =
        "No savings goal yet";

    document.querySelector(
        "#savingsPercentage"
    ).textContent = "0%";

    document.querySelector(
        "#savedAmountDisplay"
    ).textContent = "৳ 0";

    document.querySelector(
        "#targetAmountDisplay"
    ).textContent = "৳ 0";

    document.querySelector(
        "#savingsProgress"
    ).style.width = "0%";

    return;
}

            const goal = data.goal;


                 const saved =
                Number(goal.saved_amount);

            const target =
                Number(goal.target_amount);

       

            const percentage =
                target > 0
                    ? Math.round((saved / target) * 100)
                    : 0;

            document.querySelector(
                "#savingsGoalName"
            ).textContent = goal.name;

            document.querySelector(
                "#savingsPercentage"
            ).textContent = `${percentage}%`;

            document.querySelector(
                "#savedAmountDisplay"
            ).textContent =
                `৳ ${saved.toLocaleString()}`;

            document.querySelector(
                "#targetAmountDisplay"
            ).textContent =
                `৳ ${target.toLocaleString()}`;

            document.querySelector(
                "#savingsProgress"
            ).style.width =
                `${Math.min(percentage, 100)}%`;

        } catch (error) {

            console.error(
                "Savings goal error:",
                error
            );

        }

    }

    loadSavingsGoal();

}

// =========================
// Add Money to Savings Goal
// =========================

const addSavingsBtn =
    document.getElementById("addSavingsBtn");
    

if (addSavingsBtn) {

    addSavingsBtn.addEventListener("click", async () => {

        const goalId =
            document.getElementById("savingsGoalSelect").value;

        const amount =
            Number(
                document.getElementById("addSavingsAmount").value
            );

        if (!goalId) {
            alert("Please select a savings goal.");
            return;
        }

        if (!amount || amount <= 0) {
            alert("Please enter a valid savings amount.");
            return;
        }

        try {

            // Get all savings goals
            const response =
                await fetch("/api/savings-goals");

            const data =
                await response.json();

            if (!response.ok) {
                alert(data.message || "Could not load savings goals.");
                return;
            }

            // Find selected goal
            const goal =
                (data.goals || []).find(
                    item => Number(item.id) === Number(goalId)
                );

            if (!goal) {
                alert("Selected savings goal was not found.");
                return;
            }

            const currentSaved =
                Number(goal.saved_amount);

            const target =
                Number(goal.target_amount);

            const newSavedAmount =
                currentSaved + amount;

            if (newSavedAmount > target) {
                alert(
                    `You can add maximum ৳ ${(target - currentSaved).toLocaleString()}.`
                );
                return;
            }

            // Update selected goal
            const updateResponse =
                await fetch(
                    `/api/savings-goals/${goalId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            saved_amount: newSavedAmount
                        })
                    }
                );

            const updateData =
                await updateResponse.json();

            if (updateResponse.ok) {

                alert("Savings added successfully!");

                document.getElementById(
                    "addSavingsAmount"
                ).value = "";

                await window.loadSavingsGoal();

            } else {

                alert(
                    updateData.message ||
                    "Could not update savings."
                );

            }

        } catch (error) {

            console.error(
                "Add savings error:",
                error
            );

            alert("Could not connect to the server.");

        }

    });

}

// =========================
// Savings Goal Selection
// =========================

const savingsGoalSelect =
    document.getElementById("savingsGoalSelect");

if (savingsGoalSelect) {

    savingsGoalSelect.addEventListener("change", async () => {

        const goalId =
            savingsGoalSelect.value;

        const currentSavedAmount =
            document.getElementById("currentSavedAmount");

        const currentTargetAmount =
            document.getElementById("currentTargetAmount");

        const afterAddingAmount =
            document.getElementById("afterAddingAmount");

        if (!goalId) {

            currentSavedAmount.textContent = "৳ 0";
            currentTargetAmount.textContent = "৳ 0";
            afterAddingAmount.textContent = "৳ 0";

            return;
        }

        try {

            const response =
                await fetch("/api/savings-goals");

            const data =
                await response.json();

            if (!response.ok) {
                console.error(data.message);
                return;
            }

            const goal =
                (data.goals || []).find(
                    item => Number(item.id) === Number(goalId)
                );

            if (!goal) {
                return;
            }

            const saved =
                Number(goal.saved_amount);

            const target =
                Number(goal.target_amount);

            currentSavedAmount.textContent =
                `৳ ${saved.toLocaleString()}`;

            currentTargetAmount.textContent =
                `৳ ${target.toLocaleString()}`;

            afterAddingAmount.textContent =
                `৳ ${saved.toLocaleString()}`;

        } catch (error) {

            console.error(
                "Savings goal selection error:",
                error
            );

        }

    });

}

// =========================
// Complete Savings Goal
// =========================

document.addEventListener("click", async (event) => {

    const doneButton =
        event.target.closest(".savings-done-btn");

    if (!doneButton) {
        return;
    }

    const goalId =
        doneButton.dataset.goalId;

    const confirmed =
        confirm(
            "This savings goal has reached 100%. Do you want to mark it as Done and remove it?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `/api/savings-goals/${goalId}`,
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if (response.ok) {

            alert(data.message);

            await window.loadSavingsGoal();

        } else {

            alert(
                data.message ||
                "Could not complete savings goal."
            );

        }

    } catch (error) {

        console.error(
            "Complete savings goal error:",
            error
        );

        alert(
            "Could not connect to the server."
        );

    }

});

// =========================
// Delete Savings Goal
// =========================

document.addEventListener("click", async (event) => {

    const deleteButton =
        event.target.closest(".savings-delete-btn");

    if (!deleteButton) {
        return;
    }

    const goalId =
        deleteButton.dataset.goalId;

    const confirmed =
        confirm(
            "Are you sure you want to delete this savings goal?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `/api/savings-goals/${goalId}`,
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if (response.ok) {

            alert("Savings goal deleted successfully!");

            await window.loadSavingsGoal();

        } else {

            alert(
                data.message ||
                "Could not delete savings goal."
            );

        }

    } catch (error) {

        console.error(
            "Delete savings goal error:",
            error
        );

        alert(
            "Could not connect to the server."
        );

    }

});

// =========================
// Add Bill Form
// =========================

const billForm = document.querySelector("#billForm");

if (billForm) {

    billForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const title =
            document.querySelector("#billTitle").value.trim();

        const amount =
            document.querySelector("#billAmount").value;

        const categoryId =
            document.querySelector("#billCategory").value;

        const dueDate =
            document.querySelector("#dueDate").value;

        const repeatType =
            document.querySelector("#repeatType").value;

        const description =
            document.querySelector("#billDescription").value.trim();


        try {

            const response = await fetch("/api/bills", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    title: title,
                    amount: amount,
                    category_id: categoryId || null,
                    due_date: dueDate,
                    repeat_type: repeatType,
                    description: description

                })

            });


            const data = await response.json();


           if (response.ok) {

    alert(data.message);

   billForm.reset();

await window.loadBills();

} else {

                alert(data.message);

            }

        } catch (error) {

            console.error("Bill error:", error);

            alert("Could not connect to the server.");

        }

    });

}
// =========================
// Load Bill Categories
// =========================

const billCategorySelect =
    document.querySelector("#billCategory");

if (billCategorySelect) {

    async function loadBillCategories() {

        try {

            const response =
                await fetch("/api/categories?type=expense");

            const data =
                await response.json();

            if (!response.ok) {
                console.error(data.message);
                return;
            }

            data.categories.forEach(category => {

                const option =
                    document.createElement("option");

                option.value = category.id;
                option.textContent = category.name;

                billCategorySelect.appendChild(option);

            });

        } catch (error) {

            console.error(
                "Bill category error:",
                error
            );

        }

    }

    loadBillCategories();

}

// =========================
// Load Bills
// =========================

const billsList = document.querySelector("#billsList");

if (billsList) {

 window.loadBills = async function () {

        try {

            const response = await fetch("/api/bills");

            const data = await response.json();

            if (!response.ok) {

                console.error(data.message);
                return;

            }

            billsList.innerHTML = "";

            if (data.bills.length === 0) {

                billsList.innerHTML =
                    "<p>No bills added yet.</p>";

                return;

            }

            data.bills.forEach(bill => {

                const billItem =
                    document.createElement("div");

                billItem.className = "bill-item";

                const today = new Date();
                const dueDate = new Date(bill.due_date);

                // Remove time for accurate date comparison
                today.setHours(0, 0, 0, 0);
                dueDate.setHours(0, 0, 0, 0);

                const difference =
                    Math.ceil(
                        (dueDate - today) /
                        (1000 * 60 * 60 * 24)
                    );

                let statusText;
                let statusClass;

                if (bill.status === "paid") {

                    statusText = "Paid";
                    statusClass = "paid";

                } else if (difference < 0) {

                    statusText = "Overdue";
                    statusClass = "overdue";

                } else if (difference === 0) {

                    statusText = "Due Today";
                    statusClass = "due-soon";

                } else if (difference <= 3) {

                    statusText =
                        `Due in ${difference} days`;

                    statusClass = "due-soon";

                } else {

                    statusText =
                        `Due in ${difference} days`;

                    statusClass = "";

                }


               billItem.innerHTML = `
    <div>
        <strong>${bill.title}</strong>

        <small>
            ${bill.category_name || "Other"}
            • ${statusText}
        </small>
    </div>

    <div>
        <strong>
            ৳ ${Number(bill.amount).toLocaleString()}
        </strong>

        ${
    bill.status !== "paid"
        ? `
            <div class="bill-actions">

                <button
                    class="mark-paid-btn"
                    data-id="${bill.id}"
                >
                    Mark as Paid
                </button>

                <button
                    class="delete-bill-btn"
                    data-id="${bill.id}"
                >
                    🗑 Delete
                </button>

            </div>
          `
        : `
            <div class="bill-actions">

                <span class="paid-status">
                    ✓ Paid
                </span>

                <button
                    class="delete-bill-btn"
                    data-id="${bill.id}"
                >
                    🗑 Delete
                </button>

            </div>
          `
}
    </div>
`;

                if (statusClass) {
                    billItem.classList.add(statusClass);
                }

                billsList.appendChild(billItem);

            });

        } catch (error) {

            console.error(
                "Bills loading error:",
                error
            );

        }

    }

    loadBills();

}
// =========================
// Mark Bill as Paid
// =========================

document.addEventListener("click", async (event) => {

    if (!event.target.classList.contains("mark-paid-btn")) {
        return;
    }

    const billId = event.target.dataset.id;

    try {

        const response = await fetch(
            `/api/bills/${billId}/pay`,
            {
                method: "PUT"
            }
        );

        const data = await response.json();

        if (response.ok) {

            alert(data.message);

            // Reload bills
          await window.loadBills();

        } else {

            alert(data.message);

        }

    } catch (error) {

        console.error("Payment error:", error);

        alert("Could not update bill.");

    }

});


// ===============================
// ANALYTICS
// ===============================

const incomeExpenseChart = document.getElementById("incomeExpenseChart");
const expenseCategoryChart = document.getElementById("expenseCategoryChart");

const weeklyExpenseChart =
    document.getElementById("weeklyExpenseChart");

const monthlyExpenseChart =
    document.getElementById("monthlyExpenseChart");

if (
    incomeExpenseChart ||
    expenseCategoryChart ||
    weeklyExpenseChart ||
    monthlyExpenseChart
) {

    fetch("/api/analytics")
        .then(response => response.json())
        .then(data => {

            if (data.status !== "success") {
                console.error(data.message);
                return;
            }

          // ===============================
// Analytics Highlight Cards
// ===============================

const highestCategoryElement =
    document.getElementById("highestCategory");

const highestCategoryAmountElement =
    document.getElementById("highestCategoryAmount");

const highestCategoryPercentElement =
    document.getElementById("highestCategoryPercent");

const spendingTrendElement =
    document.getElementById("spendingTrend");

const incomeUtilizedElement =
    document.getElementById("incomeUtilized");

const incomeUtilizedTextElement =
    document.getElementById("incomeUtilizedText");

const incomeUtilizedCircleElement =
    document.getElementById("incomeUtilizedCircle");


// ===============================
// Highest Category
// ===============================

if (
    highestCategoryElement &&
    highestCategoryAmountElement &&
    highestCategoryPercentElement
) {

    if (data.categories && data.categories.length > 0) {

        const highestCategory =
            [...data.categories].sort(
                (a, b) =>
                    Number(b.amount) - Number(a.amount)
            )[0];

        const totalExpense =
            Number(data.totalExpense);

        const categoryAmount =
            Number(highestCategory.amount);

        const categoryPercent =
            totalExpense > 0
                ? Math.round(
                    (categoryAmount / totalExpense) * 100
                )
                : 0;

        highestCategoryElement.textContent =
            highestCategory.category;

        highestCategoryAmountElement.textContent =
            `৳ ${categoryAmount.toLocaleString()}`;

        highestCategoryPercentElement.textContent =
            `${categoryPercent}% of your total expenses`;

    } else {

        highestCategoryElement.textContent =
            "No expenses";

        highestCategoryAmountElement.textContent =
            "৳ 0";

        highestCategoryPercentElement.textContent =
            "0% of your total expenses";
    }

}


// ===============================
// Spending Trend
// ===============================

if (spendingTrendElement) {

    const currentMonthExpense =
        Number(data.currentMonthExpense);

    const previousMonthExpense =
        Number(data.previousMonthExpense);


    if (previousMonthExpense > 0) {

        const trend =
            Math.round(
                (
                    (
                        currentMonthExpense -
                        previousMonthExpense
                    ) /
                    previousMonthExpense
                ) * 100
            );


        if (trend > 0) {

            spendingTrendElement.textContent =
                `+${trend}%`;

        } else if (trend < 0) {

            spendingTrendElement.textContent =
                `${trend}%`;

        } else {

            spendingTrendElement.textContent =
                "0%";

        }

    } else {

        spendingTrendElement.textContent =
            "—";

    }

}


// ===============================
// Income Utilized
// ===============================

const totalIncome =
    Number(data.totalIncome);

const totalExpense =
    Number(data.totalExpense);

let incomeUtilized = 0;

if (totalIncome > 0) {

    incomeUtilized =
        Math.round(
            (totalExpense / totalIncome) * 100
        );

}

if (incomeUtilizedElement) {

    incomeUtilizedElement.textContent =
        `${incomeUtilized}%`;

}

if (incomeUtilizedTextElement) {

    incomeUtilizedTextElement.textContent =
        `${incomeUtilized}%`;

}

if (incomeUtilizedCircleElement) {

    incomeUtilizedCircleElement.textContent =
        `${incomeUtilized}%`;

    const utilizedCircle =
        incomeUtilizedCircleElement.closest(".utilized-circle");

    if (utilizedCircle) {

        const safePercentage =
            Math.min(Math.max(incomeUtilized, 0), 100);

        utilizedCircle.style.setProperty(
            "--utilized-percent",
            `${safePercentage}%`
        );
    }
}


            // ===============================
            // Income vs Expense Chart
            // ===============================

            if (incomeExpenseChart) {

                new Chart(incomeExpenseChart, {
                    type: "bar",

                    data: {
                        labels: ["Income", "Expense"],

                        datasets: [{
                            label: "Amount (৳)",
                            data: [
                                data.totalIncome,
                                data.totalExpense
                            ]
                        }]
                    },

                    options: {
                        responsive: true,

                        plugins: {
                            legend: {
                                display: false
                            }
                        },

                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }


            // ===============================
            // Expense by Category Chart
            // ===============================

            if (expenseCategoryChart) {

                const categoryLabels = data.categories.map(
                    item => item.category
                );

                const categoryAmounts = data.categories.map(
                    item => Number(item.amount)
                );

                new Chart(expenseCategoryChart, {
                    type: "doughnut",

                    data: {
                        labels: categoryLabels,

                        datasets: [{
                            label: "Expenses",
                            data: categoryAmounts
                        }]
                    },

                    options: {
                        responsive: true
                    }
                });
            }

            // ===============================
// Weekly Expense Bar Chart
// ===============================

if (weeklyExpenseChart) {

    const weeklyLabels = [];
    const weeklyAmounts = [];

    for (let i = 6; i >= 0; i--) {

        const date = new Date();

        date.setDate(date.getDate() - i);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        const dateKey = `${year}-${month}-${day}`;

const expense = (data.weeklyExpenses || []).find(
    item => item.expense_date === dateKey
);

        weeklyLabels.push(
            date.toLocaleDateString("en-US", {
                weekday: "short"
            })
        );

        weeklyAmounts.push(
            expense ? Number(expense.amount) : 0
        );
    }

    new Chart(weeklyExpenseChart, {

        type: "bar",

        data: {

            labels: weeklyLabels,

            datasets: [{

                label: "Weekly Expenses (৳)",

                data: weeklyAmounts,

                borderRadius: 6

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    display: false
                }

            },

            scales: {

                y: {

                    beginAtZero: true,

                    ticks: {

                        callback: function(value) {
                            return `৳ ${Number(value).toLocaleString()}`;
                        }

                    }

                }

            }

        }

    });

}


// ===============================
// Monthly Expense Bar Chart
// ===============================

if (monthlyExpenseChart) {

    const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    const monthlyAmounts = monthNames.map(
        (_, index) => {

            const monthNumber = index + 1;

            const expense = (data.monthlyExpenses || []).find(
    item =>
        Number(item.month_number) === monthNumber
);

            return expense
                ? Number(expense.amount)
                : 0;
        }
    );

    new Chart(monthlyExpenseChart, {

        type: "bar",

        data: {

            labels: monthNames,

            datasets: [{

                label: "Monthly Expenses (৳)",

                data: monthlyAmounts,

                borderRadius: 6

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    display: false
                }

            },

            scales: {

                y: {

                    beginAtZero: true,

                    ticks: {

                        callback: function(value) {
                            return `৳ ${Number(value).toLocaleString()}`;
                        }

                    }

                }

            }

        }

    });

}

            // ===============================
            // Financial Insight
            // ===============================

            const insightElement = document.getElementById("analyticsInsight");

            if (insightElement) {

                if (data.balance > 0) {

                    insightElement.textContent =
                        `Great job! You currently have a positive balance of ৳ ${data.balance.toLocaleString()}. Keep managing your expenses wisely.`;

                } else if (data.balance < 0) {

                    insightElement.textContent =
                        `Your expenses are higher than your income by ৳ ${Math.abs(data.balance).toLocaleString()}. Consider reducing unnecessary spending.`;

                } else {

                    insightElement.textContent =
                        "Your income and expenses are currently balanced.";
                }
            }

        })

        .catch(error => {
            console.error("Analytics error:", error);
        });
}

// ===============================
// REPORTS
// ===============================

const reportIncome = document.getElementById("reportIncome");
const reportExpense = document.getElementById("reportExpense");
const reportBalance = document.getElementById("reportBalance");

const reportMonth = document.getElementById("reportMonth");
const generateReportBtn = document.getElementById("generateReportBtn");
const printReportBtn = document.getElementById("printReportBtn");
const exportCsvBtn =
    document.getElementById("exportCsvBtn");

const reportTransactions =
    document.getElementById("reportTransactions");

const transactionCount =
    document.getElementById("transactionCount");

const topCategories =
    document.getElementById("topCategories");

const reportInsight =
    document.getElementById("reportInsight");

const reportCategoryChart =
    document.getElementById("reportCategoryChart");

let reportChart = null;


// ===============================
// Set Current Month
// ===============================

if (reportMonth) {

    const now = new Date();

    const year = now.getFullYear();

    const month =
        String(now.getMonth() + 1).padStart(2, "0");

    reportMonth.value = `${year}-${month}`;
}


// ===============================
// Generate Report
// ===============================

async function generateReport() {

    if (!reportMonth) return;

    const month = reportMonth.value;

    if (!month) {
        alert("Please select a month.");
        return;
    }

    try {

        const response =
            await fetch(`/api/reports?month=${month}`);

        const data =
            await response.json();

        if (!response.ok) {

            console.error(data.message);

            if (response.status === 401) {
                window.location.href = "login.html";
            }

            return;
        }


        // ===============================
        // Summary
        // ===============================

        reportIncome.textContent =
            `৳ ${Number(data.totalIncome).toLocaleString()}`;

        reportExpense.textContent =
            `৳ ${Number(data.totalExpense).toLocaleString()}`;

        reportBalance.textContent =
            `৳ ${Number(data.balance).toLocaleString()}`;


        // ===============================
        // Transaction Count
        // ===============================

        transactionCount.textContent =
            `${data.transactions.length} transaction${
                data.transactions.length !== 1 ? "s" : ""
            }`;


        // ===============================
        // Transactions Table
        // ===============================

        reportTransactions.innerHTML = "";

        if (data.transactions.length === 0) {

            reportTransactions.innerHTML = `
                <tr>
                    <td colspan="5">
                        No transactions found for this month.
                    </td>
                </tr>
            `;

        } else {

            data.transactions.forEach(transaction => {

                const row =
                    document.createElement("tr");

                const type =
                    transaction.type === "income"
                        ? "Income"
                        : "Expense";

                row.innerHTML = `
                 <td>
    ${new Date(transaction.transaction_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC"
    })}
</td>

                    <td>${transaction.title}</td>

                    <td>${transaction.category_name}</td>

                    <td>${type}</td>

                    <td>
                        ৳ ${Number(transaction.amount).toLocaleString()}
                    </td>
                `;

                reportTransactions.appendChild(row);

            });

        }


        // ===============================
        // Top Categories
        // ===============================

        topCategories.innerHTML = "";

        if (data.categories.length === 0) {

            topCategories.innerHTML = `
                <p>No expense data available.</p>
            `;

        } else {

            data.categories.slice(0, 5).forEach((category, index) => {

                const item =
                    document.createElement("div");

                item.className = "top-category-item";

                item.innerHTML = `
                    <span>
                        ${index + 1}. ${category.category}
                    </span>

                    <strong>
                        ৳ ${Number(category.amount).toLocaleString()}
                    </strong>
                `;

                topCategories.appendChild(item);

            });

        }


        // ===============================
        // Expense Chart
        // ===============================

        if (reportChart) {
            reportChart.destroy();
        }

        if (reportCategoryChart && data.categories.length > 0) {

            reportChart = new Chart(
                reportCategoryChart,
                {
                    type: "doughnut",

                    data: {
                        labels: data.categories.map(
                            item => item.category
                        ),

                        datasets: [{
                            data: data.categories.map(
                                item => Number(item.amount)
                            )
                        }]
                    },

                    options: {
                        responsive: true
                    }
                }
            );

        }


        // ===============================
        // Smart Insight
        // ===============================

        if (data.balance > 0) {

            reportInsight.textContent =
                `You saved ৳ ${Number(data.balance).toLocaleString()} this month. Your income is higher than your expenses.`;

        } else if (data.balance < 0) {

            reportInsight.textContent =
                `Your expenses are ৳ ${Math.abs(Number(data.balance)).toLocaleString()} higher than your income this month. Consider reducing unnecessary spending.`;

        } else {

            reportInsight.textContent =
                "Your income and expenses are balanced this month.";

        }

    } catch (error) {

        console.error("Report error:", error);

    }

}


// ===============================
// Generate Button
// ===============================

if (generateReportBtn) {

    generateReportBtn.addEventListener(
        "click",
        generateReport
    );

}


// ===============================
// Print Report
// ===============================

if (printReportBtn) {

    printReportBtn.addEventListener(
        "click",
        () => {
            window.print();
        }
    );

}


// ===============================
// Automatically Generate
// ===============================

if (reportMonth) {
    generateReport();
}

// ===============================
// Logout
// ===============================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async (event) => {

        event.preventDefault();

        try {

            const response = await fetch("/api/logout", {
                method: "POST"
            });

            const data = await response.json();

            if (response.ok) {

                window.location.href = "login.html";

            } else {

                alert(data.message);

            }

        } catch (error) {

            console.error("Logout error:", error);

            alert("Could not logout.");
        }

    });

}

// ===============================
// SETTINGS - PROFILE
// ===============================

const profileForm = document.getElementById("profileForm");

if (profileForm) {

    async function loadProfile() {

        try {

            const response = await fetch("/api/me");
            const data = await response.json();

            if (!response.ok) {
                window.location.href = "login.html";
                return;
            }

            const user = data.user;

            document.getElementById("profileName").value =
                user.name;

            document.getElementById("profileEmail").value =
                user.email;

            document.getElementById("accountId").textContent =
                user.id;

const accountCreated =
    document.getElementById("accountCreated");

if (accountCreated) {

    const createdDate =
        new Date(user.created_at);

    accountCreated.textContent =
        createdDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

}

        } catch (error) {

            console.error("Profile loading error:", error);

        }

    }


    profileForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const name =
            document.getElementById("profileName").value.trim();

        const email =
            document.getElementById("profileEmail").value.trim();


        try {

            const response = await fetch("/api/profile", {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email
                })

            });


            const data = await response.json();


            if (response.ok) {

                alert("Profile updated successfully!");

                loadProfile();

                // Update header
                if (document.getElementById("userName")) {
                    document.getElementById("userName").textContent =
                        name;
                }

                if (document.getElementById("userEmail")) {
                    document.getElementById("userEmail").textContent =
                        email;
                }

                if (document.getElementById("userAvatar")) {
                    document.getElementById("userAvatar").textContent =
                        name.charAt(0).toUpperCase();
                }

            } else {

                alert(data.message);

            }

        } catch (error) {

            console.error("Profile update error:", error);

            alert("Could not update profile.");

        }

    });


    loadProfile();

}
// ===============================
// SETTINGS - CHANGE PASSWORD
// ===============================

const passwordForm = document.getElementById("passwordForm");

if (passwordForm) {

    passwordForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const currentPassword =
            document.getElementById("currentPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        if (newPassword !== confirmPassword) {

            alert("New passwords do not match.");
            return;

        }


        try {

            const response = await fetch(
                "/api/change-password",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                }
            );


            const data = await response.json();


            if (response.ok) {

                alert("Password changed successfully!");

                passwordForm.reset();

            } else {

                alert(data.message);

            }

        } catch (error) {

            console.error(
                "Password change error:",
                error
            );

            alert("Could not change password.");

        }

    });

}
// ===============================
// DASHBOARD - UPCOMING BILLS
// ===============================

const dashboardBillsList =
    document.getElementById("dashboardBillsList");

if (dashboardBillsList) {

    async function loadDashboardBills() {

        try {

            const response = await fetch("/api/bills");
            const data = await response.json();

            if (!response.ok) {

                dashboardBillsList.innerHTML =
                    "<p>Could not load bills.</p>";

                return;
            }

            dashboardBillsList.innerHTML = "";

            if (data.bills.length === 0) {

                dashboardBillsList.innerHTML = `
                    <p>
                        No bills added yet.
                        <a href="bills.html">Add a bill</a>
                    </p>
                `;

                return;
            }

            // Show only the first 4 bills
            data.bills.slice(0, 4).forEach(bill => {

                const billItem =
                    document.createElement("div");

                billItem.className = "bill-item";

                const today = new Date();
                const dueDate = new Date(bill.due_date);

                today.setHours(0, 0, 0, 0);
                dueDate.setHours(0, 0, 0, 0);

                const difference =
                    Math.ceil(
                        (dueDate - today) /
                        (1000 * 60 * 60 * 24)
                    );

                let statusText;
                let statusClass;

                if (bill.status === "paid") {

                    statusText = "Paid";
                    statusClass = "paid";

                } else if (difference < 0) {

                    statusText = "Overdue";
                    statusClass = "overdue";

                } else if (difference === 0) {

                    statusText = "Due Today";
                    statusClass = "due-soon";

                } else if (difference <= 3) {

                    statusText =
                        `Due in ${difference} days`;

                    statusClass = "due-soon";

                } else {

                    statusText =
                        `Due in ${difference} days`;

                    statusClass = "";

                }

                billItem.innerHTML = `
                    <div>
                        <strong>${bill.title}</strong>

                        <small>
                            ${bill.category_name || "Other"}
                            • ${statusText}
                        </small>
                    </div>

                    <div>
                        <strong>
                            ৳ ${Number(bill.amount).toLocaleString()}
                        </strong>
                    </div>
                `;

                if (statusClass) {
                    billItem.classList.add(statusClass);
                }

                dashboardBillsList.appendChild(billItem);

            });

        } catch (error) {

            console.error(
                "Dashboard bills error:",
                error
            );

            dashboardBillsList.innerHTML =
                "<p>Could not load bills.</p>";
        }
    }

    loadDashboardBills();
}
// ===============================
// DASHBOARD - TOTAL SAVINGS
// ===============================

const totalSavingsElement =
    document.getElementById("totalSavings");

if (totalSavingsElement) {

    async function loadTotalSavings() {

        try {

            const response =
                await fetch("/api/savings-goals");

            const data =
                await response.json();

            if (!response.ok) {
                console.error(data.message);
                return;
            }

            if (!data.goal) {
                totalSavingsElement.textContent = "৳ 0";
                return;
            }

            const savedAmount =
                Number(data.goal.saved_amount);

            totalSavingsElement.textContent =
                `৳ ${savedAmount.toLocaleString()}`;

        } catch (error) {

            console.error(
                "Total savings loading error:",
                error
            );

        }
    }

    loadTotalSavings();
}
// ===============================
// TRANSACTION HISTORY
// ===============================

const transactionHistory =
    document.getElementById("transactionHistory");

const transactionHistoryCount =
    document.getElementById("transactionHistoryCount");
if (transactionHistory) {

   window.loadTransactionHistory = async function () {

        try {

            const response =
                await fetch("/api/transactions");

            const data =
                await response.json();

            if (!response.ok) {

                transactionHistory.innerHTML = `
                    <tr>
                        <td colspan="7">
                            Could not load transactions.
                        </td>
                    </tr>
                `;

                return;
            }

            transactionHistory.innerHTML = "";

if (transactionHistoryCount) {

    transactionHistoryCount.textContent =
        `${data.transactions.length} transaction${
            data.transactions.length !== 1
                ? "s"
                : ""
        }`;

}

            if (data.transactions.length === 0) {

                transactionHistory.innerHTML = `
                    <tr>
                        <td colspan="7">
                            No transactions found.
                        </td>
                    </tr>
                `;

                return;
            }

            data.transactions.forEach(transaction => {

                const row =
                    document.createElement("tr");

                const type =
                    transaction.type === "income"
                        ? "Income"
                        : "Expense";

                const amountClass =
                    transaction.type === "income"
                        ? "income"
                        : "expense";

                const sign =
                    transaction.type === "income"
                        ? "+"
                        : "-";

               row.innerHTML = `
    <td>
    ${new Date(transaction.transaction_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC"
    })}
</td>

    <td>
        <strong>
            ${transaction.title}
        </strong>
    </td>

    <td>
        ${transaction.category_name || "Other"}
    </td>

    <td>
        <span class="${amountClass}">
            ${type}
        </span>
    </td>

    <td>
        ${transaction.payment_method}
    </td>

    <td>
        <strong class="${amountClass}">
            ${sign} ৳ ${Number(
                transaction.amount
            ).toLocaleString()}
        </strong>
    </td>

    <td>
        <button
            type="button"
            class="edit-transaction-btn"
            data-id="${transaction.id}"
        >
            ✏️ Edit
        </button>

        <button
            type="button"
            class="delete-transaction-btn"
            data-id="${transaction.id}"
        >
            🗑️ Delete
        </button>
    </td>
`;
                transactionHistory.appendChild(row);

            });

        } catch (error) {

            console.error(
                "Transaction history error:",
                error
            );

            transactionHistory.innerHTML = `
                <tr>
                    <td colspan="7">
                        Could not load transactions.
                    </td>
                </tr>
            `;

        }

    }

    loadTransactionHistory();

}

// ===============================
// TRANSACTION FILTERS & SEARCH
// ===============================

const transactionSearch =
    document.getElementById("transactionSearch");

const transactionTypeFilter =
    document.getElementById("transactionTypeFilter");

const transactionCategoryFilter =
    document.getElementById("transactionCategoryFilter");

const transactionDateFilter =
    document.getElementById("transactionDateFilter");
const transactionMonthFilter =
    document.getElementById("transactionMonthFilter");


const clearTransactionFilters =
    document.getElementById("clearTransactionFilters");

let allTransactions = [];

if (transactionSearch) {

   window.loadFilterTransactions = async function () {

        try {

            const response =
                await fetch("/api/transactions");

            const data =
                await response.json();

            if (!response.ok) {
                console.error(data.message);
                return;
            }

            allTransactions = data.transactions;

            loadTransactionFilterCategories();

            displayFilteredTransactions();

        } catch (error) {

            console.error(
                "Filter transactions error:",
                error
            );

        }

    }


    function loadTransactionFilterCategories() {

        if (!transactionCategoryFilter) {
            return;
        }

        const categories = [
            ...new Set(
                allTransactions
                    .map(transaction =>
                        transaction.category_name
                    )
                    .filter(category => category)
            )
        ];

        transactionCategoryFilter.innerHTML = `
            <option value="all">
                All Categories
            </option>
        `;

        categories.forEach(category => {

            const option =
                document.createElement("option");

            option.value = category;
            option.textContent = category;

            transactionCategoryFilter.appendChild(option);

        });

    }


    function displayFilteredTransactions() {

        if (!transactionHistory) {
            return;
        }

        const searchValue =
            transactionSearch.value
                .toLowerCase()
                .trim();

        const typeValue =
            transactionTypeFilter
                ? transactionTypeFilter.value
                : "all";

        const categoryValue =
            transactionCategoryFilter
                ? transactionCategoryFilter.value
                : "all";

       const dateValue =
    transactionDateFilter
        ? transactionDateFilter.value
        : "";

const monthValue =
    transactionMonthFilter
        ? transactionMonthFilter.value
        : "";


        const filteredTransactions =
            allTransactions.filter(transaction => {

                const matchesSearch =
                    transaction.title
                        .toLowerCase()
                        .includes(searchValue) ||

                    (transaction.category_name || "")
                        .toLowerCase()
                        .includes(searchValue) ||

                    (transaction.payment_method || "")
                        .toLowerCase()
                        .includes(searchValue);


                const matchesType =
                    typeValue === "all" ||
                    transaction.type === typeValue;


                const matchesCategory =
                    categoryValue === "all" ||
                    transaction.category_name === categoryValue;


               const transactionMonth =
    transaction.transaction_date
        ? transaction.transaction_date.substring(0, 7)
        : "";

const transactionDate =
    transaction.transaction_date
        ? transaction.transaction_date.substring(0, 10)
        : "";

const matchesMonth =
    !monthValue ||
    transactionMonth === monthValue;

const matchesDate =
    !dateValue ||
    transactionDate === dateValue;

               return (
    matchesSearch &&
    matchesType &&
    matchesCategory &&
    matchesMonth &&
    matchesDate
);

            });


        transactionHistory.innerHTML = "";


        if (transactionHistoryCount) {

            transactionHistoryCount.textContent =
                `${filteredTransactions.length} transaction${
                    filteredTransactions.length !== 1
                        ? "s"
                        : ""
                }`;

        }


        if (filteredTransactions.length === 0) {

            transactionHistory.innerHTML = `
                <tr>
                   <td colspan="7">
    No transactions match your filters.
</td>
                </tr>
            `;

            return;

        }


        filteredTransactions.forEach(transaction => {

            const row =
                document.createElement("tr");

            const type =
                transaction.type === "income"
                    ? "Income"
                    : "Expense";

            const amountClass =
                transaction.type === "income"
                    ? "income"
                    : "expense";

            const sign =
                transaction.type === "income"
                    ? "+"
                    : "-";

            row.innerHTML = `
               <td>
    ${new Date(transaction.transaction_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC"
    })}
</td>

                <td>
                    <strong>
                        ${transaction.title}
                    </strong>
                </td>

                <td>
                    ${transaction.category_name || "Other"}
                </td>

                <td>
                    <span class="${amountClass}">
                        ${type}
                    </span>
                </td>

                <td>
                    ${transaction.payment_method}
                </td>

             <td>
    <strong class="${amountClass}">
        ${sign} ৳ ${Number(
            transaction.amount
        ).toLocaleString()}
    </strong>
</td>

<td class="transaction-actions">
    <button
        type="button"
        class="edit-transaction-btn"
        data-id="${transaction.id}"
    >
        ✏️ Edit
    </button>

    <button
        type="button"
        class="delete-transaction-btn"
        data-id="${transaction.id}"
    >
        🗑️ Delete
    </button>
</td>
`;

            transactionHistory.appendChild(row);

        });

    }


    transactionSearch.addEventListener(
        "input",
        displayFilteredTransactions
    );


    if (transactionTypeFilter) {

        transactionTypeFilter.addEventListener(
            "change",
            displayFilteredTransactions
        );

    }


    if (transactionCategoryFilter) {

        transactionCategoryFilter.addEventListener(
            "change",
            displayFilteredTransactions
        );

    }


    if (transactionDateFilter) {

        transactionDateFilter.addEventListener(
            "change",
            displayFilteredTransactions
        );

    }

    if (transactionMonthFilter) {
    transactionMonthFilter.addEventListener(
        "change",
        displayFilteredTransactions
    );
}


    if (clearTransactionFilters) {

        clearTransactionFilters.addEventListener(
            "click",
            () => {

                transactionSearch.value = "";

                transactionTypeFilter.value = "all";

                transactionCategoryFilter.value = "all";

                transactionDateFilter.value = "";

                transactionMonthFilter.value = "";

                displayFilteredTransactions();

            }
        );

    }


    loadFilterTransactions();

}

// ===============================
// REFRESH TRANSACTIONS AFTER ADD
// ===============================

window.refreshTransactionData = async function () {

    if (window.loadTransactionHistory) {
        await window.loadTransactionHistory();
    }

    if (window.loadFilterTransactions) {
        await window.loadFilterTransactions();
    }

    if (window.loadTransactionSummary) {
        await window.loadTransactionSummary();
    }

};

// ===============================
// DELETE TRANSACTION BUTTON
// ===============================

document.addEventListener("click", async (event) => {

    const deleteButton =
        event.target.closest(".delete-transaction-btn");

    if (!deleteButton) {
        return;
    }

    const transactionId =
        deleteButton.dataset.id;

    const confirmDelete = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            `/api/transactions/${transactionId}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(data.message || "Could not delete transaction.");

            return;
        }

        alert("Transaction deleted successfully!");

        // Refresh transaction data
await window.refreshTransactionData();

    } catch (error) {

        console.error("Delete transaction error:", error);

        alert("Something went wrong while deleting the transaction.");

    }

});
//..............................
// Edit Transaction
//..............................
document.addEventListener("click", async (event) => {
    const editButton = event.target.closest(".edit-transaction-btn");

    if (!editButton) return;

    const transactionId = editButton.dataset.id;

    try {
        const response = await fetch(
            `/api/transactions/${transactionId}`
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Could not load transaction.");
            return;
        }

        const transaction = data.transaction;

        // Fill the transaction form
        document.getElementById("type").value = transaction.type;
        document.getElementById("title").value = transaction.title;
        document.getElementById("amount").value = transaction.amount;
        document.getElementById("paymentMethod").value =
            transaction.payment_method;
        document.getElementById("description").value =
            transaction.description || "";
        document.getElementById("transactionDate").value =
            transaction.transaction_date;

        // Load categories for selected transaction type
        const categorySelect = document.getElementById("category");

        const categoryResponse = await fetch(
            `/api/categories?type=${transaction.type}`
        );

        const categoryData = await categoryResponse.json();

        if (categoryResponse.ok) {
            categorySelect.innerHTML =
                '<option value="">Select Category</option>';

            categoryData.categories.forEach((category) => {
                const option = document.createElement("option");

                option.value = category.id;
                option.textContent = category.name;

                if (category.id == transaction.category_id) {
                    option.selected = true;
                }

                categorySelect.appendChild(option);
            });
        }

        // Store editing transaction ID
        window.editingTransactionId = transactionId;

        // Change button text
        const submitButton =
            document.querySelector("#transactionForm button[type='submit']");

        if (submitButton) {
            submitButton.textContent = "Update Transaction";
        }

        // Scroll to form
        document
            .getElementById("transactionForm")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    } catch (error) {
        console.error("Edit transaction error:", error);
        alert("Something went wrong while loading the transaction.");
    }
});


// ===============================
// EXPORT REPORT AS CSV
// ===============================

if (exportCsvBtn) {

    exportCsvBtn.addEventListener("click", async () => {

        if (!reportMonth || !reportMonth.value) {
            alert("Please select a month first.");
            return;
        }

        try {

            const month = reportMonth.value;

            const response =
                await fetch(`/api/reports?month=${month}`);

            const data =
                await response.json();

            if (!response.ok) {
                alert(data.message || "Could not load report.");
                return;
            }

            if (data.transactions.length === 0) {
                alert("No transactions found for this month.");
                return;
            }

            let csv = "Date,Title,Category,Type,Amount\n";

            data.transactions.forEach(transaction => {

                csv += [
                    transaction.transaction_date,
                    `"${transaction.title.replace(/"/g, '""')}"`,
                    `"${(transaction.category_name || "Other").replace(/"/g, '""')}"`,
                    transaction.type,
                    transaction.amount
                ].join(",") + "\n";

            });

            const blob = new Blob(
                [csv],
                { type: "text/csv;charset=utf-8;" }
            );

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            link.download =
                `SmartSpend_Report_${month}.csv`;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            URL.revokeObjectURL(url);

        } catch (error) {

            console.error("CSV export error:", error);

            alert("Could not export the report.");

        }

    });

}

// ===============================
// SMARTSPEND DUE BILL POPUP
// ===============================

function showDueBillsPopup(bills) {

    // Remove existing popup if there is one
    const existingPopup =
        document.getElementById("dueBillsPopup");

    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement("div");

    popup.id = "dueBillsPopup";
    popup.className = "due-bills-popup";

    let billsHTML = "";

    bills.forEach((bill) => {

        const days = Number(bill.days_left);

        let dueText;

        if (days < 0) {
            dueText =
                `Overdue by ${Math.abs(days)} day(s)`;
        } else if (days === 0) {
            dueText = "Due today";
        } else if (days === 1) {
            dueText = "Due tomorrow";
        } else {
            dueText = `Due in ${days} days`;
        }

        billsHTML += `
            <div class="due-bill-item">

                <div class="due-bill-info">

                    <strong>
                        ${bill.title}
                    </strong>

                    <span>
                        ৳ ${Number(bill.amount).toLocaleString()}
                    </span>

                </div>

                <small>
                    ${dueText}
                </small>

            </div>
        `;
    });

    popup.innerHTML = `

        <div class="due-bills-popup-header">

            <div class="due-bills-popup-title">

                <div class="due-bills-icon">
                    🔔
                </div>

                <div>
                    <h3>Bills Due Soon</h3>

                    <p>
                        You have ${bills.length}
                        bill${bills.length !== 1 ? "s" : ""}
                        due soon.
                    </p>
                </div>

            </div>

            <button
                type="button"
                id="closeDueBillsPopup"
                class="due-bills-close"
            >
                ×
            </button>

        </div>

        <div class="due-bills-list">

            ${billsHTML}

        </div>

        <button
            type="button"
            id="viewBillsFromPopup"
            class="due-bills-view-btn"
        >
            View Bills
        </button>

    `;

    document.body.appendChild(popup);

    // Close popup
    document
        .getElementById("closeDueBillsPopup")
        .addEventListener("click", () => {

            popup.remove();

        });

    // View Bills button
    document
        .getElementById("viewBillsFromPopup")
        .addEventListener("click", () => {

            popup.remove();

            document
                .getElementById("billsList")
                ?.scrollIntoView({
                    behavior: "smooth"
                });

        });

}

// ===============================
// BILL DUE SOON NOTIFICATION
// ===============================

async function checkDueBills() {



    try {

        const response = await fetch("/api/bills/due-soon");

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            return;
        }

        const bills = data.bills || [];

        if (bills.length === 0) {
            return;
        }

        let message = "";

        bills.forEach((bill) => {

            const days = Number(bill.days_left);

            let dueText;

            if (days < 0) {
                dueText = `Overdue by ${Math.abs(days)} day(s)`;
            } else if (days === 0) {
                dueText = "Due today";
            } else if (days === 1) {
                dueText = "Due tomorrow";
            } else {
                dueText = `Due in ${days} days`;
            }

            message +=
                `${bill.title} — ৳ ${Number(bill.amount).toLocaleString()} — ${dueText}\n`;
        });

     showDueBillsPopup(bills);

    } catch (error) {

        console.error("Due bills error:", error);

    }

}

if (window.location.pathname.endsWith("/bills.html")) {
    checkDueBills();
}

// =========================
// View All Savings Goals
// =========================

const viewAllGoalsBtn =
    document.getElementById("viewAllGoalsBtn");

if (viewAllGoalsBtn) {

    viewAllGoalsBtn.addEventListener("click", () => {

        const allSavingsGoals =
            document.getElementById("allSavingsGoals");

        if (allSavingsGoals) {

            allSavingsGoals.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    });

}
// =========================
// Delete Bill
// =========================

document.addEventListener("click", async (event) => {

    const deleteButton =
        event.target.closest(".delete-bill-btn");

    if (!deleteButton) {
        return;
    }

    const billId =
        deleteButton.dataset.id;

    const confirmed =
        confirm(
            "Are you sure you want to delete this bill?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `/api/bills/${billId}`,
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if (response.ok) {

            alert(data.message);

            await window.loadBills();

        } else {

            alert(
                data.message ||
                "Could not delete bill."
            );

        }

    } catch (error) {

        console.error(
            "Delete bill error:",
            error
        );

        alert(
            "Could not connect to the server."
        );

    }

});