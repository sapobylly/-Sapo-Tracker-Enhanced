// 🐸 Sapo Tracker Enhanced - App Logic
// Versione localStorage compatibile con GitHub Pages

console.log('🚀 Inizializzazione App dopo login...');

// Global variables
let monthlyChart = null;
let categoryChart = null;

// Main initialization function (called after security login)
window.initializeFinanceApp = function() {
    console.log('🐸 Inizializzazione Sapo Tracker Enhanced...');
    
    try {
        // Clear any old data to prevent conflicts
        cleanupOldData();
        
        // Initialize the app
        initializeApp();
        
        // Load and display data
        loadDashboard();
        
        // Setup charts
        initializeCharts();
        
        // Load transactions
        loadTransactions();
        
        console.log('✅ App inizializzata con successo!');
        showNotification('🎉 Sapo Tracker Enhanced è pronto!', 'success');
        
    } catch (error) {
        console.error('❌ Errore durante l\'inizializzazione:', error);
        showNotification('❌ Errore durante l\'inizializzazione dell\'app', 'error');
    }
};

// Cleanup function to remove problematic data
function cleanupOldData() {
    console.log('🧹 Pulizia localStorage...');
    
    // Remove any keys that might cause conflicts
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('encrypted_') || key.includes('api_') || key.includes('server_'))) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed problematic key: ${key}`);
    });
}

// Initialize app data structure
function initializeApp() {
    console.log('🔧 Inizializzazione struttura dati...');
    
    // Initialize localStorage structure if not exists
    if (!localStorage.getItem('sapo_transactions')) {
        localStorage.setItem('sapo_transactions', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('sapo_investments')) {
        localStorage.setItem('sapo_investments', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('sapo_material_goods')) {
        localStorage.setItem('sapo_material_goods', JSON.stringify([]));
    }
    
    // Set current date for date inputs
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
    
    console.log('✅ Struttura dati inizializzata');
}

// Transaction management
function addTransaction(event, type, isQuick = false) {
    event.preventDefault();
    console.log('🔄 Iniziando addTransaction...');
    
    try {
        const form = event.target;
        const formData = new FormData(form);
        
        // Validate required fields
        const amount = parseFloat(formData.get('amount'));
        const description = formData.get('description');
        
        if (!amount || amount <= 0) {
            throw new Error('Importo non valido');
        }
        
        if (!description || description.trim() === '') {
            throw new Error('Descrizione richiesta');
        }
        
        // Create transaction object
        const transaction = {
            id: generateId(),
            type: type,
            amount: amount,
            description: description.trim(),
            category: formData.get('category') || (isQuick ? 'altro' : 'generale'),
            date: formData.get('date') || new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            isQuick: isQuick || false
        };
        
        console.log('💾 Salvando transazione:', transaction);
        
        // Save to localStorage
        const transactions = getTransactions();
        transactions.push(transaction);
        localStorage.setItem('sapo_transactions', JSON.stringify(transactions));
        
        console.log('✅ Transazione salvata con successo');
        
        // Update UI
        loadDashboard();
        updateCharts();
        loadTransactions();
        
        // Show success notification
        const typeText = type === 'income' ? 'Entrata' : 'Uscita';
        showNotification(`✅ ${typeText} di €${amount.toFixed(2)} salvata!`, 'success');
        
        // Reset form and close modal
        form.reset();
        const modalId = form.closest('.modal').id;
        hideModal(modalId);
        
        console.log('🎉 Transazione completata con successo');
        
    } catch (error) {
        console.error('❌ Errore completo in addTransaction:', error);
        showNotification(`❌ Errore nel salvataggio: ${error.message}`, 'error');
    }
}

// Get transactions from localStorage
function getTransactions() {
    try {
        const transactions = localStorage.getItem('sapo_transactions');
        return transactions ? JSON.parse(transactions) : [];
    } catch (error) {
        console.error('❌ Errore lettura transazioni:', error);
        return [];
    }
}

// Quick transaction function
function addQuickTransaction(type, amount, description) {
    console.log(`🚀 Quick ${type}:`, amount, description);
    
    try {
        const transaction = {
            id: generateId(),
            type: type,
            amount: amount,
            description: description,
            category: 'rapida',
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            isQuick: true
        };
        
        const transactions = getTransactions();
        transactions.push(transaction);
        localStorage.setItem('sapo_transactions', JSON.stringify(transactions));
        
        // Update UI
        loadDashboard();
        updateCharts();
        loadTransactions();
        
        const typeText = type === 'income' ? 'Entrata' : 'Uscita';
        showNotification(`⚡ ${typeText} rapida di €${amount} aggiunta!`, 'success');
        
    } catch (error) {
        console.error('❌ Errore quick transaction:', error);
        showNotification('❌ Errore nell\'aggiunta rapida', 'error');
    }
}

// Investment management
function addInvestment(event) {
    event.preventDefault();
    console.log('📈 Aggiungendo investimento...');
    
    try {
        const form = event.target;
        const formData = new FormData(form);
        
        const investment = {
            id: generateId(),
            name: formData.get('name'),
            amount: parseFloat(formData.get('amount')),
            currentValue: parseFloat(formData.get('currentValue')),
            type: formData.get('type'),
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        };
        
        const investments = getInvestments();
        investments.push(investment);
        localStorage.setItem('sapo_investments', JSON.stringify(investments));
        
        loadDashboard();
        showNotification(`📈 Investimento "${investment.name}" aggiunto!`, 'success');
        
        form.reset();
        hideModal('addInvestmentModal');
        
    } catch (error) {
        console.error('❌ Errore investimento:', error);
        showNotification('❌ Errore nel salvataggio dell\'investimento', 'error');
    }
}

// Get investments from localStorage
function getInvestments() {
    try {
        const investments = localStorage.getItem('sapo_investments');
        return investments ? JSON.parse(investments) : [];
    } catch (error) {
        console.error('❌ Errore lettura investimenti:', error);
        return [];
    }
}

// Material goods management
function addMaterialGood() {
    const name = prompt('Nome del bene materiale:');
    const value = prompt('Valore stimato (€):');
    
    if (name && value && !isNaN(parseFloat(value))) {
        try {
            const good = {
                id: generateId(),
                name: name.trim(),
                value: parseFloat(value),
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            };
            
            const goods = getMaterialGoods();
            goods.push(good);
            localStorage.setItem('sapo_material_goods', JSON.stringify(goods));
            
            loadDashboard();
            showNotification(`🏠 Bene materiale "${good.name}" aggiunto!`, 'success');
            
        } catch (error) {
            console.error('❌ Errore bene materiale:', error);
            showNotification('❌ Errore nel salvataggio del bene materiale', 'error');
        }
    }
}

// Get material goods from localStorage
function getMaterialGoods() {
    try {
        const goods = localStorage.getItem('sapo_material_goods');
        return goods ? JSON.parse(goods) : [];
    } catch (error) {
        console.error('❌ Errore lettura beni materiali:', error);
        return [];
    }
}

// Dashboard calculations
function loadDashboard() {
    console.log('📊 Caricando dashboard...');
    
    try {
        const transactions = getTransactions();
        const investments = getInvestments();
        const materialGoods = getMaterialGoods();
        
        // Calculate totals
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const investmentValue = investments
            .reduce((sum, inv) => sum + inv.currentValue, 0);
            
        const materialGoodsValue = materialGoods
            .reduce((sum, good) => sum + good.value, 0);
        
        const balance = totalIncome - totalExpenses + investmentValue + materialGoodsValue;
        
        // Get current month data
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyIncome = transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'income' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
            
        const monthlyExpenses = transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'expense' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Update UI elements
        document.getElementById('totalBalance').textContent = `€${balance.toFixed(2)}`;
        document.getElementById('monthlyIncome').textContent = `€${monthlyIncome.toFixed(2)}`;
        document.getElementById('monthlyExpenses').textContent = `€${monthlyExpenses.toFixed(2)}`;
        document.getElementById('investmentValue').textContent = `€${investmentValue.toFixed(2)}`;
        
        console.log('✅ Dashboard aggiornata', {
            balance, monthlyIncome, monthlyExpenses, investmentValue
        });
        
    } catch (error) {
        console.error('❌ Errore dashboard:', error);
        showNotification('❌ Errore nel caricamento della dashboard', 'error');
    }
}

// Load and display transactions
function loadTransactions() {
    console.log('📋 Caricando transazioni...');
    
    try {
        const transactions = getTransactions();
        const container = document.getElementById('transactionsList');
        
        if (transactions.length === 0) {
            container.innerHTML = '<p class="text-white opacity-75 text-center py-4">Nessuna transazione ancora</p>';
            return;
        }
        
        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Show last 10 transactions
        const recentTransactions = transactions.slice(0, 10);
        
        container.innerHTML = recentTransactions.map(transaction => `
            <div class="transaction-item ${transaction.type === 'income' ? 'transaction-income' : 'transaction-expense'}">
                <div class="flex justify-between items-center">
                    <div class="flex-1">
                        <div class="font-semibold text-white">
                            ${transaction.description}
                            ${transaction.isQuick ? '<span class="text-xs bg-yellow-500 px-2 py-1 rounded ml-2">RAPIDA</span>' : ''}
                        </div>
                        <div class="text-sm text-white opacity-75">
                            ${transaction.category} • ${formatDate(transaction.date)}
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-lg ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}">
                            ${transaction.type === 'income' ? '+' : '-'}€${transaction.amount.toFixed(2)}
                        </div>
                        <button onclick="deleteTransaction('${transaction.id}')" 
                                class="text-xs text-red-400 hover:text-red-300 opacity-75 hover:opacity-100">
                            <i class="fas fa-trash"></i> Elimina
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        console.log(`✅ Caricate ${recentTransactions.length} transazioni`);
        
    } catch (error) {
        console.error('❌ Errore caricamento transazioni:', error);
        showNotification('❌ Errore nel caricamento delle transazioni', 'error');
    }
}

// Delete transaction
function deleteTransaction(id) {
    if (confirm('Sei sicuro di voler eliminare questa transazione?')) {
        try {
            const transactions = getTransactions();
            const filteredTransactions = transactions.filter(t => t.id !== id);
            localStorage.setItem('sapo_transactions', JSON.stringify(filteredTransactions));
            
            loadDashboard();
            updateCharts();
            loadTransactions();
            
            showNotification('🗑️ Transazione eliminata', 'success');
            
        } catch (error) {
            console.error('❌ Errore eliminazione:', error);
            showNotification('❌ Errore nell\'eliminazione', 'error');
        }
    }
}

// Initialize charts
function initializeCharts() {
    console.log('📈 Inizializzando grafici...');
    
    try {
        initMonthlyChart();
        initCategoryChart();
        console.log('✅ Grafici inizializzati');
    } catch (error) {
        console.error('❌ Errore inizializzazione grafici:', error);
    }
}

// Monthly chart
function initMonthlyChart() {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    const transactions = getTransactions();
    const monthlyData = calculateMonthlyData(transactions);
    
    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'Entrate',
                    data: monthlyData.income,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Uscite',
                    data: monthlyData.expenses,
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: 'white' }
                }
            },
            scales: {
                x: { 
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                y: { 
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                }
            }
        }
    });
}

// Category chart
function initCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const transactions = getTransactions();
    const categoryData = calculateCategoryData(transactions);
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryData.labels,
            datasets: [{
                data: categoryData.data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: 'white' },
                    position: 'bottom'
                }
            }
        }
    });
}

// Update charts
function updateCharts() {
    initMonthlyChart();
    initCategoryChart();
}

// Calculate monthly data for chart
function calculateMonthlyData(transactions) {
    const months = {};
    const currentDate = new Date();
    
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months[key] = { income: 0, expenses: 0, label: date.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }) };
    }
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (months[key]) {
            if (transaction.type === 'income') {
                months[key].income += transaction.amount;
            } else {
                months[key].expenses += transaction.amount;
            }
        }
    });
    
    return {
        labels: Object.values(months).map(m => m.label),
        income: Object.values(months).map(m => m.income),
        expenses: Object.values(months).map(m => m.expenses)
    };
}

// Calculate category data for chart
function calculateCategoryData(transactions) {
    const categories = {};
    
    transactions
        .filter(t => t.type === 'expense')
        .forEach(transaction => {
            const category = transaction.category || 'altro';
            categories[category] = (categories[category] || 0) + transaction.amount;
        });
    
    return {
        labels: Object.keys(categories),
        data: Object.values(categories)
    };
}

// Modal management
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
        event.target.style.display = 'none';
    }
});

// Export/Import functions
function exportData() {
    try {
        const data = {
            transactions: getTransactions(),
            investments: getInvestments(),
            materialGoods: getMaterialGoods(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `sapo-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('📥 Dati esportati con successo!', 'success');
        
    } catch (error) {
        console.error('❌ Errore export:', error);
        showNotification('❌ Errore nell\'esportazione', 'error');
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('⚠️ Questo sovrascriverà tutti i dati esistenti. Continuare?')) {
                    if (data.transactions) {
                        localStorage.setItem('sapo_transactions', JSON.stringify(data.transactions));
                    }
                    if (data.investments) {
                        localStorage.setItem('sapo_investments', JSON.stringify(data.investments));
                    }
                    if (data.materialGoods) {
                        localStorage.setItem('sapo_material_goods', JSON.stringify(data.materialGoods));
                    }
                    
                    loadDashboard();
                    updateCharts();
                    loadTransactions();
                    
                    showNotification('📤 Dati importati con successo!', 'success');
                }
                
            } catch (error) {
                console.error('❌ Errore import:', error);
                showNotification('❌ File non valido', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Utility functions
function generateId() {
    return 'sapo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

console.log('🐸 Sapo Tracker Enhanced loaded successfully!');
