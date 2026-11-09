
// Get today's date
function getTodayDate() {
    let today = new Date();

    let year = today.getFullYear();
    let month = String(today.getMonth() + 1).padStart(2, "0");
    let day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

// Get current month
function getCurrentMonth() {
    return getTodayDate().slice(0, 7);
}

// Load saved transactions
let transactions =
    JSON.parse(localStorage.getItem("transactions")) || [];

transactions.forEach(function(item) {
    if (!item.date) {
        item.date = getTodayDate();
    }

    if (!item.category) {
        item.category =
            item.type === "income" ? "Income" : "Other";
    }
});

// Chart variables
let expensePieChart = null;
let monthlyBarChart = null;

// Save transactions
function saveTransactions() {
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}

// Add transaction
function addTransaction() {

    let description =
        document.getElementById("description").value.trim();

    let amount =
        Number(document.getElementById("amount").value);

    let type =
        document.getElementById("type").value;

    let category =
        document.getElementById("category").value;

    let date =
        document.getElementById("transactionDate").value;

    if (
        description === "" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        date === ""
    ) {
        alert("Please enter valid transaction details!");
        return;
    }

    let transaction = {
        id: Date.now(),
        description: description,
        amount: amount,
        type: type,
        category: type === "income" ? "Income" : category,
        date: date
    };

    transactions.push(transaction);

    saveTransactions();

    document.getElementById("description").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("transactionDate").value =
        getTodayDate();

    updateDashboard();
}

// Update dashboard
function updateDashboard() {

    let income = 0;
    let expense = 0;

    transactions.forEach(function(item) {

        if (item.type === "income") {
            income += item.amount;
        } else {
            expense += item.amount;
        }

    });

    let balance = income - expense;

    document.getElementById("totalIncome").innerText =
        "₹" + income.toLocaleString("en-IN");

    document.getElementById("totalExpense").innerText =
        "₹" + expense.toLocaleString("en-IN");

    document.getElementById("balance").innerText =
        "₹" + balance.toLocaleString("en-IN");

    displayTransactions();
    updateMonthlyReport();
}

// Display transaction history
function displayTransactions() {

    let list = document.getElementById("transactionList");

    list.innerHTML = "";

    transactions.forEach(function(item) {

        let li = document.createElement("li");
        let details = document.createElement("span");

        details.innerText =
            item.description +
            " - ₹" + item.amount.toLocaleString("en-IN") +
            " (" + item.type + ")" +
            " - " + item.category +
            " - " + item.date;

        let editButton = document.createElement("button");
        editButton.innerText = "Edit";

        editButton.onclick = function() {
            editTransaction(item.id);
        };

        let deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete";

        deleteButton.onclick = function() {
            deleteTransaction(item.id);
        };

        li.appendChild(details);
        li.appendChild(editButton);
        li.appendChild(deleteButton);

        list.appendChild(li);

    });
}

// Edit transaction
function editTransaction(id) {

    let transaction = transactions.find(function(item) {
        return item.id === id;
    });

    if (!transaction) return;

    let newDescription = prompt(
        "Enter new description:",
        transaction.description
    );

    if (newDescription === null || newDescription.trim() === "") {
        return;
    }

    let amountInput = prompt(
        "Enter new amount:",
        transaction.amount
    );

    if (amountInput === null || amountInput.trim() === "") {
        return;
    }

    let newAmount = Number(amountInput);

    if (!Number.isFinite(newAmount) || newAmount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }

    let newDate = prompt(
        "Enter date (YYYY-MM-DD):",
        transaction.date
    );

    if (newDate === null || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
        alert("Please enter a valid date!");
        return;
    }

    transaction.description = newDescription.trim();
    transaction.amount = newAmount;
    transaction.date = newDate;

    if (transaction.type === "expense") {

        let newCategory = prompt(
            "Enter category (Food, Travel, Shopping, Bills, Education, Other):",
            transaction.category
        );

        if (newCategory !== null && newCategory.trim() !== "") {
            transaction.category = newCategory.trim();
        }
    }

    saveTransactions();
    updateDashboard();

    alert("Transaction updated successfully!");
}

// Delete transaction
function deleteTransaction(id) {

    transactions = transactions.filter(function(item) {
        return item.id !== id;
    });

    saveTransactions();
    updateDashboard();
}

// Update charts
function updateCharts(categoryTotals, monthlyIncome, monthlyExpense) {

    if (typeof Chart === "undefined") {
        console.error("Chart.js library is not loaded.");
        return;
    }

    let categories = Object.keys(categoryTotals);
    let amounts = Object.values(categoryTotals);

    // Pie chart
    if (expensePieChart === null) {

        expensePieChart = new Chart(
            document.getElementById("expensePieChart"),
            {
                type: "pie",

                data: {
                    labels: categories,
                    datasets: [{
                        label: "Expenses",
                        data: amounts
                    }]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            position: "bottom"
                        }
                    }
                }
            }
        );

    } else {

        expensePieChart.data.labels = categories;
        expensePieChart.data.datasets[0].data = amounts;
        expensePieChart.update();

    }

    // Bar chart
    if (monthlyBarChart === null) {

        monthlyBarChart = new Chart(
            document.getElementById("monthlyBarChart"),
            {
                type: "bar",

                data: {
                    labels: ["Income", "Expenses"],
                    datasets: [{
                        label: "Amount (₹)",
                        data: [monthlyIncome, monthlyExpense]
                    }]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );

    } else {

        monthlyBarChart.data.datasets[0].data = [
            monthlyIncome,
            monthlyExpense
        ];

        monthlyBarChart.update();

    }
}

// Monthly expense report
function updateMonthlyReport() {

    let selectedMonth =
        document.getElementById("reportMonth").value;

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    let categoryTotals = {};

    let monthlyTransactions = transactions.filter(function(item) {
        return item.date && item.date.startsWith(selectedMonth);
    });

    monthlyTransactions.forEach(function(item) {

        if (item.type === "income") {

            monthlyIncome += item.amount;

        } else {

            monthlyExpense += item.amount;

            let category = item.category || "Other";

            if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
            }

            categoryTotals[category] += item.amount;
        }

    });

    let monthlyBalance = monthlyIncome - monthlyExpense;

    document.getElementById("monthlyIncome").innerText =
        "₹" + monthlyIncome.toLocaleString("en-IN");

    document.getElementById("monthlyExpense").innerText =
        "₹" + monthlyExpense.toLocaleString("en-IN");

    document.getElementById("monthlyBalance").innerText =
        "₹" + monthlyBalance.toLocaleString("en-IN");

    // Display category totals
    let categoryList =
        document.getElementById("monthlyCategoryList");

    categoryList.innerHTML = "";

    let categories = Object.keys(categoryTotals);

    if (categories.length === 0) {

        let li = document.createElement("li");
        li.innerText = "No expenses found for this month.";
        categoryList.appendChild(li);

    } else {

        categories.forEach(function(category) {

            let li = document.createElement("li");

            li.innerText =
                category + " : ₹" +
                categoryTotals[category].toLocaleString("en-IN");

            categoryList.appendChild(li);

        });

    }

    // Update charts
    updateCharts(
        categoryTotals,
        monthlyIncome,
        monthlyExpense
    );
}

// Initialize website
document.getElementById("transactionDate").value =
    getTodayDate();

document.getElementById("reportMonth").value =
    getCurrentMonth();

document.getElementById("reportMonth").addEventListener(
    "change",
    updateMonthlyReport
);

saveTransactions();
updateDashboard();
