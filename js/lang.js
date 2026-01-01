const translations = {
    en: {
        // Navigation
        home: 'Home',
        transactions: 'Transactions',
        analysis: 'Analysis',
        settings: 'Settings',

        // Greetings
        goodMorning: 'Good morning,',
        goodAfternoon: 'Good afternoon,',
        goodEvening: 'Good evening,',
        goodNight: 'Good night,',
        yourName: 'Your Name',
        currentBalance: 'Current Balance',
        transactionsHistory: 'Transactions History',
        seeAll: 'See all',
        financeOverview: 'Finance Overview',

        // Home Page
        todayExpense: "Today's Expense",
        monthlyExpense: 'Monthly Expense',
        monthlyIncome: 'Monthly Income',
        incomeVsExpense: 'Income vs Expense',
        income: 'Income',
        expense: 'Expense',
        savings: 'Monthly Savings',
        monthlyBudget: 'Monthly Budget',
        setBudget: 'Set Budget',
        noBudgetSet: 'No budget set',

        // Transactions
        addTransaction: 'Add Transaction',
        editTransaction: 'Edit Transaction',
        searchTransactions: 'Search transactions...',
        all: 'All',
        newest: 'Newest',
        oldest: 'Oldest',
        highest: 'Highest',
        lowest: 'Lowest',
        type: 'Type',
        amount: 'Amount',
        category: 'Category',
        paymentMethod: 'Payment Method',
        date: 'Date',
        note: 'Note (Optional)',

        // Payment Methods
        cash: 'Cash',
        card: 'Card',
        mobileBanking: 'Mobile Banking',
        bank: 'Bank',

        // Categories
        food: 'Food',
        transport: 'Transport',
        bills: 'Bills',
        shopping: 'Shopping',
        medical: 'Medical',
        education: 'Education',
        rent: 'Rent',
        salary: 'Salary',
        investment: 'Investment',
        others: 'Others',
        manageCategories: 'Manage Categories',
        addCategory: 'Add Category',

        // Analysis
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly',
        expenseTrend: 'Expense Trend',
        categoryBreakdown: 'Category Breakdown',
        insights: 'Insights',
        avgDaily: 'Daily Average',
        highestCategory: 'Top Category',

        // Home Page Status Messages
        todaysExpenseLabel: "Today's Expense",
        dailyAvgExpenseLabel: 'Daily Avg Expense',
        noExpensesYet: 'No expenses yet this month',
        spendingHigher: '⚠️ Spending is higher than usual today',
        spendingUnderControl: '✔ Great! Spending is under control today',
        noExpensesToday: '✨ No expenses today - Keep it up!',
        spendingStable: '✔ Spending is stable this month',

        // Savings Messages
        addIncomeToTrack: 'Add income to track your savings',
        expensesExceedIncome: '⚠️ Warning: Expenses exceed income this month',
        excellentSaving: '🎉 Excellent! You\'re doing great. Keep saving!',
        goodJobSaving: '✔ Good job! You\'re managing money well',
        roomToImprove: '💡 You\'re saving, but there\'s room to improve',
        trySaveMore: '⚠️ Try to save more this month',
        youSpentMore: 'You spent more than you earned',
        youSavedPercent: 'You saved {percent} of your income this month',

        // Budget Messages
        budgetExceededMsg: '⚠️ Budget exceeded! Try to reduce spending',
        almostAtLimit: '⚠️ Warning: Almost at budget limit',
        spendingIncreasing: '💡 Spending is increasing. Be careful!',
        managingWell: '✔ Great! You are managing money very well',
        spendingWellControlled: '✔ Excellent! Spending is well under control',
        budgetExceededSub: 'You have exceeded your monthly budget',
        trackSpendingSub: 'Track your spending smartly',

        // Settings
        language: 'Language',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
        currency: 'Currency',
        dataManagement: 'Data Management',
        exportJSON: 'Export as JSON',
        exportCSV: 'Export as CSV',
        importData: 'Import Data',
        resetData: 'Reset All Data',
        about: 'About',
        appDescription: 'Professional Finance Expense Tracker - Offline-first web application for managing your finances.',

        // Buttons
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',

        // Messages
        noTransactions: 'No transactions yet',
        addFirstTransaction: 'Add your first transaction to get started!',
        budgetWarning: 'You are approaching your budget limit!',
        budgetExceeded: 'Budget exceeded!',
        dataResetConfirm: 'Are you sure you want to reset all data? This action cannot be undone.',
        dataExported: 'Data exported successfully!',
        dataImported: 'Data imported successfully!',
        transactionAdded: 'Transaction added!',
        transactionUpdated: 'Transaction updated!',
        transactionDeleted: 'Transaction deleted!',
        budgetSet: 'Budget set successfully!',
        categoryAdded: 'Category added!',

        // Motivational Messages
        motivational: {
            goodSpending: 'Great! You controlled your spending today!',
            highSpending: 'You spent a lot today. Try to save more!',
            noExpense: 'No expenses today. Keep it up!',
            savingWell: 'Excellent! You are saving well this month!',
            overspending: 'Warning! You are overspending this month.',
        },

        // Insights
        insightIncrease: 'increased',
        insightDecrease: 'decreased',
        insightThisMonth: 'this month',
        insightComparedToLast: 'compared to last month',

        // Budget
        setMonthlyBudget: 'Set Monthly Budget',
        budgetAmount: 'Budget Amount',
        remaining: 'Remaining',
        spent: 'Spent',

        // Goals Page
        savingsGoals: 'Savings',
        addNewGoal: 'Add New Goal',
        noGoalsYet: 'No savings goals yet',
        createFirstGoal: 'Create your first goal to start saving!',
        editGoal: 'Edit Goal',
        createNewGoal: 'Create New Goal',
        deleteGoal: 'Delete Goal',
        goalName: 'Goal Name',
        targetAmount: 'Target Amount',
        deadline: 'Deadline (Optional)',
        saved: 'Saved',
        target: 'Target',
        progress: 'Progress',
        addMoney: 'Add Money',
        recentAdditions: 'Recent Additions',
        completed: 'Completed',
        daysLeft: 'days left',
        daysOverdue: 'days overdue',
        goalCreated: 'Goal created successfully!',
        goalUpdated: 'Goal updated successfully!',
        goalDeleted: 'Goal deleted successfully',
        goalCompleted: '🎉 Congratulations! Goal completed!',
        moneyAdded: 'Money added successfully!',
        deleteGoalConfirm: 'Are you sure you want to delete "{name}"? This action cannot be undone.',
        enterGoalName: 'Please enter a goal name',
        targetMustBePositive: 'Target amount must be greater than 0',
        deadlineCannotBePast: 'Deadline cannot be in the past',
        enterValidAmount: 'Please enter a valid amount',
        amountExceedsRemaining: 'Amount cannot exceed remaining target',
        noTransactionsYet: 'No transactions yet',
        transactionUpdated: 'Transaction updated successfully',
        transactionDeleted: 'Transaction deleted successfully',
        deleteTransactionConfirm: 'Delete this transaction of {amount}?',
        deleteTransaction: 'Delete Transaction',
        editTransaction: 'Edit Transaction',
        addMoneyTo: 'Add Money to',
        howMuchToAdd: 'How much would you like to add?',
        goalDescription: 'Set a savings goal and track your progress towards achieving it.',
        goalNamePlaceholder: 'e.g., MacBook Pro',
        addingMoneyTo: 'Adding money to:',

        // Friendly Analysis
        spendingHistory: 'Spending History',
        moneyDistribution: 'Where Your Money Went',
        financialHealth: 'Financial Health',
        statusGreat: 'You are doing great! 🎉',
        statusGood: 'On track nicely 👍',
        statusWarning: 'Spending is high ⚠️',
        statusDanger: 'Budget exceeded 🚨',
        totalSpent: 'Total Spent',
        budgetLeft: 'Budget Left',
        safeDaily: 'Safe Daily Limit',
        perDay: '/day',
    },

    bn: {
        // Navigation
        home: 'হোম',
        transactions: 'লেনদেন',
        analysis: 'বিশ্লেষণ',
        settings: 'সেটিংস',

        // Greetings
        goodMorning: 'সুপ্রভাত,',
        goodAfternoon: 'শুভ অপরাহ্ন,',
        goodEvening: 'শুভ সন্ধ্যা,',
        goodNight: 'শুভ রাত্রি,',
        yourName: 'আপনার নাম',
        currentBalance: 'বর্তমান ব্যালেন্স',
        transactionsHistory: 'লেনদেনের ইতিহাস',
        seeAll: 'সব দেখুন',
        financeOverview: 'আর্থিক সারসংক্ষেপ',

        // Home Page
        todayExpense: 'আজকের খরচ',
        monthlyExpense: 'এই মাসের খরচ',
        monthlyIncome: 'এই মাসের আয়',
        incomeVsExpense: 'আয় ও খরচ',
        income: 'আয়',
        expense: 'খরচ',
        savings: 'সঞ্চয়',
        monthlyBudget: 'মাসিক বাজেট',
        setBudget: 'বাজেট ঠিক করুন',
        noBudgetSet: 'বাজেট সেট করা নেই',

        // Transactions
        addTransaction: 'লেনদেন যোগ করুন',
        editTransaction: 'লেনদেন সম্পাদনা করুন',
        searchTransactions: 'লেনদেন খুঁজুন...',
        all: 'সব',
        newest: 'নতুন',
        oldest: 'পুরাতন',
        highest: 'সর্বোচ্চ',
        lowest: 'সর্বনিম্ন',
        type: 'ধরন',
        amount: 'পরিমাণ',
        category: 'বিভাগ',
        paymentMethod: 'পেমেন্ট পদ্ধতি',
        date: 'তারিখ',
        note: 'নোট (ঐচ্ছিক)',

        // Payment Methods
        cash: 'নগদ',
        card: 'কার্ড',
        mobileBanking: 'মোবাইল ব্যাংকিং',
        bank: 'ব্যাংক',

        // Categories
        food: 'খাবার',
        transport: 'যাতায়াত',
        bills: 'বিল',
        shopping: 'কেনাকাটা',
        medical: 'চিকিৎসা',
        education: 'শিক্ষা',
        rent: 'ভাড়া',
        salary: 'বেতন',
        investment: 'বিনিয়োগ',
        others: 'অন্যান্য',
        manageCategories: 'বিভাগ পরিচালনা করুন',
        addCategory: 'বিভাগ যোগ করুন',

        // Analysis
        weekly: 'সাপ্তাহিক',
        monthly: 'মাসিক',
        yearly: 'বার্ষিক',
        expenseTrend: 'খরচের প্রবণতা',
        categoryBreakdown: 'বিভাগ অনুযায়ী',
        insights: 'অন্তর্দৃষ্টি',
        avgDaily: 'দৈনিক গড়',
        highestCategory: 'শীর্ষ বিভাগ',

        // Home Page Status Messages
        todaysExpenseLabel: 'আজকের খরচ',
        dailyAvgExpenseLabel: 'দৈনিক গড় খরচ',
        noExpensesYet: 'এই মাসে এখনো কোনো খরচ নেই',
        spendingHigher: '⚠️ আজ খরচ বেশি হয়েছে',
        spendingUnderControl: '✔ দারুণ! আজ খরচ নিয়ন্ত্রণে আছে',
        noExpensesToday: '✨ আজ কোনো খরচ নেই - চমৎকার!',
        spendingStable: '✔ এই মাসে খরচ স্থিতিশীল',

        // Savings Messages
        addIncomeToTrack: 'সঞ্চয় ট্র্যাক করতে আয় যোগ করুন',
        expensesExceedIncome: '⚠️ সাবধান: এই মাসে খরচ আয়ের চেয়ে বেশি',
        excellentSaving: '🎉 দুর্দান্ত! খুব ভালো সঞ্চয় হচ্ছে!',
        goodJobSaving: '✔ চমৎকার! টাকা ভালোভাবে সামলাচ্ছেন',
        roomToImprove: '💡 সঞ্চয় হচ্ছে, তবে আরো ভালো করা যায়',
        trySaveMore: '⚠️ এই মাসে আরো সঞ্চয় করার চেষ্টা করুন',
        youSpentMore: 'আয়ের চেয়ে বেশি খরচ হয়েছে',
        youSavedPercent: 'এই মাসে আয়ের {percent} সঞ্চয় হয়েছে',

        // Budget Messages
        budgetExceededMsg: '⚠️ বাজেট শেষ! খরচ কমানোর চেষ্টা করুন',
        almostAtLimit: '⚠️ সাবধান: বাজেট প্রায় শেষ',
        spendingIncreasing: '💡 খরচ বাড়ছে। সাবধান থাকুন!',
        managingWell: '✔ দারুণ! টাকা খুব ভালোভাবে সামলাচ্ছেন',
        spendingWellControlled: '✔ চমৎকার! খরচ সম্পূর্ণ নিয়ন্ত্রণে',
        budgetExceededSub: 'মাসিক বাজেট শেষ হয়ে গেছে',
        trackSpendingSub: 'খরচ স্মার্টভাবে ট্র্যাক করুন',

        // Settings
        language: 'ভাষা',
        theme: 'থিম',
        light: 'হালকা',
        dark: 'অন্ধকার',
        system: 'সিস্টেম',
        currency: 'মুদ্রা',
        dataManagement: 'ডেটা ব্যবস্থাপনা',
        exportJSON: 'JSON হিসাবে রপ্তানি করুন',
        exportCSV: 'CSV হিসাবে রপ্তানি করুন',
        importData: 'ডেটা আমদানি করুন',
        resetData: 'সমস্ত ডেটা রিসেট করুন',
        about: 'সম্পর্কে',
        appDescription: 'পেশাদার ফিন্যান্স এক্সপেন্স ট্র্যাকার - আপনার আর্থিক ব্যবস্থাপনার জন্য অফলাইন-প্রথম ওয়েব অ্যাপ্লিকেশন।',

        // Buttons
        save: 'সেভ করুন',
        cancel: 'বাতিল',
        delete: 'ডিলিট করুন',
        edit: 'এডিট করুন',

        // Messages
        noTransactions: 'কোনো লেনদেন নেই',
        addFirstTransaction: 'প্রথম লেনদেন যোগ করুন!',
        budgetWarning: 'বাজেট শেষ হয়ে আসছে!',
        budgetExceeded: 'বাজেট শেষ!',
        dataResetConfirm: 'সব ডেটা মুছে ফেলবেন? এটি ফেরত আনা যাবে না।',
        dataExported: 'ডেটা এক্সপোর্ট হয়েছে!',
        dataImported: 'ডেটা ইমপোর্ট হয়েছে!',
        transactionAdded: 'লেনদেন যোগ হয়েছে!',
        transactionUpdated: 'লেনদেন আপডেট হয়েছে!',
        transactionDeleted: 'লেনদেন মুছে গেছে!',
        budgetSet: 'বাজেট সেট হয়েছে!',
        categoryAdded: 'ক্যাটাগরি যোগ হয়েছে!',

        // Motivational Messages
        motivational: {
            goodSpending: 'দারুণ! আজ খরচ কম হয়েছে!',
            highSpending: 'আজ বেশি খরচ হয়েছে। সাবধান!',
            noExpense: 'আজ কোনো খরচ নেই। চমৎকার!',
            savingWell: 'দুর্দান্ত! এই মাসে ভালো সঞ্চয় হচ্ছে!',
            overspending: 'সাবধান! এই মাসে বেশি খরচ হচ্ছে।',
        },

        // Insights
        insightIncrease: 'বৃদ্ধি পেয়েছে',
        insightDecrease: 'হ্রাস পেয়েছে',
        insightThisMonth: 'এই মাসে',
        insightComparedToLast: 'গত মাসের তুলনায়',

        // Budget
        setMonthlyBudget: 'মাসিক বাজেট সেট করুন',
        budgetAmount: 'বাজেট',
        remaining: 'বাকি আছে',
        spent: 'খরচ হয়েছে',

        // Goals Page
        savingsGoals: 'সঞ্চয়',
        addNewGoal: 'নতুন লক্ষ্য যোগ করুন',
        noGoalsYet: 'এখনো কোনো সঞ্চয়ের লক্ষ্য নেই',
        createFirstGoal: 'সঞ্চয় শুরু করতে প্রথম লক্ষ্য তৈরি করুন!',
        editGoal: 'লক্ষ্য সম্পাদনা করুন',
        createNewGoal: 'নতুন লক্ষ্য তৈরি করুন',
        deleteGoal: 'লক্ষ্য মুছুন',
        goalName: 'লক্ষ্যের নাম',
        targetAmount: 'লক্ষ্য পরিমাণ',
        deadline: 'সময়সীমা (ঐচ্ছিক)',
        saved: 'সঞ্চিত',
        target: 'লক্ষ্য',
        progress: 'অগ্রগতি',
        addMoney: 'টাকা যোগ করুন',
        recentAdditions: 'সাম্প্রতিক যোগ',
        completed: 'সম্পন্ন',
        daysLeft: 'দিন বাকি',
        daysOverdue: 'দিন বিলম্বিত',
        goalCreated: 'লক্ষ্য তৈরি হয়েছে!',
        goalUpdated: 'লক্ষ্য আপডেট হয়েছে!',
        goalDeleted: 'লক্ষ্য মুছে গেছে',
        goalCompleted: '🎉 অভিনন্দন! লক্ষ্য সম্পন্ন হয়েছে!',
        moneyAdded: 'টাকা যোগ হয়েছে!',
        deleteGoalConfirm: '"{name}" মুছে ফেলবেন? এটি ফেরত আনা যাবে না।',
        enterGoalName: 'লক্ষ্যের নাম লিখুন',
        targetMustBePositive: 'লক্ষ্য পরিমাণ ০ এর বেশি হতে হবে',
        deadlineCannotBePast: 'সময়সীমা অতীতে হতে পারে না',
        enterValidAmount: 'সঠিক পরিমাণ লিখুন',
        amountExceedsRemaining: 'পরিমাণ বাকি লক্ষ্যের বেশি হতে পারবে না',
        noTransactionsYet: 'এখনো কোনো লেনদেন নেই',
        transactionUpdated: 'লেনদেন আপডেট হয়েছে',
        transactionDeleted: 'লেনদেন মুছে গেছে',
        deleteTransactionConfirm: '{amount} এর লেনদেন মুছবেন?',
        deleteTransaction: 'লেনদেন মুছুন',
        editTransaction: 'লেনদেন সম্পাদনা',
        addMoneyTo: 'টাকা যোগ করুন',
        howMuchToAdd: 'কত টাকা যোগ করতে চান?',
        goalDescription: 'একটি সঞ্চয়ের লক্ষ্য সেট করুন এবং আপনার অগ্রগতি ট্র্যাক করুন।',
        goalNamePlaceholder: 'যেমন, ম্যাকবুক প্রো',
        addingMoneyTo: 'টাকা যোগ করা হচ্ছে:',

        // Friendly Analysis
        spendingHistory: 'খরচের ইতিহাস',
        moneyDistribution: 'টাকা কোথায় খরচ হয়েছে',
        financialHealth: 'আর্থিক অবস্থা',
        statusGreat: 'চমৎকার চলছে! 🎉',
        statusGood: 'সঠিক পথে আছেন 👍',
        statusWarning: 'খরচ বেশি হচ্ছে ⚠️',
        statusDanger: 'বাজেট পার হয়েছে 🚨',
        totalSpent: 'মোট খরচ',
        budgetLeft: 'বাজেট বাকি',
        safeDaily: 'নিরাপদ দৈনিক সীমা',
        perDay: '/দিন',
    }
};

class LanguageManager {
    constructor() {
        this.currentLang = 'en';
    }

    async init() {
        // Load saved language preference
        const savedLang = await db.getSetting('language');
        if (savedLang) {
            this.currentLang = savedLang;
        }
        this.updateUI();
    }

    translate(key) {
        const keys = key.split('.');
        let value = translations[this.currentLang];

        for (const k of keys) {
            value = value[k];
            if (!value) {
                return key; // Return key if translation not found
            }
        }

        return value;
    }

    async setLanguage(lang) {
        this.currentLang = lang;
        await db.setSetting('language', lang);
        this.updateUI();
    }

    updateUI() {
        // Update all elements with data-lang attribute
        document.querySelectorAll('[data-lang]').forEach(element => {
            const key = element.getAttribute('data-lang');
            const translation = this.translate(key);

            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
            const key = element.getAttribute('data-lang-placeholder');
            element.placeholder = this.translate(key);
        });

        // Update select options
        document.querySelectorAll('option[data-lang]').forEach(option => {
            const key = option.getAttribute('data-lang');
            option.textContent = this.translate(key);
        });
    }

    getCurrentLanguage() {
        return this.currentLang;
    }
}

// Create global language manager instance
const lang = new LanguageManager();
