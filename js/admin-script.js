// Admin Dashboard JavaScript
let salesChart, productsChart, categoryChart, revenueChart;
let currentTimeRange = 30;
// Product catalog for reference
const products = {
    1: { name: 'T-shirt Pilot Wings', category: 'tshirts' },
    2: { name: 'T-shirt Cessna Vintage', category: 'tshirts' },
    3: { name: 'T-shirt Boeing 747', category: 'tshirts' },
    4: { name: 'Casquette Pilote', category: 'accessories' },
    5: { name: 'Boussole Aviation', category: 'accessories' },
    6: { name: 'Porte-clés Avion', category: 'accessories' },
    7: { name: 'T-shirt Spitfire', category: 'tshirts' },
    8: { name: 'Badge Pilote', category: 'accessories' }
};
// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking admin access');
    checkAdminAccess();
    console.log('Initializing dashboard...');
    
    // Attendre que main.js charge les produits, puis initialiser l'admin
    setTimeout(() => {
        initializeDashboard();
    }, 100);
});

// Check if user has admin access
function checkAdminAccess() {
    const adminSession = sessionStorage.getItem('maspalegryAdmin');

    if (!adminSession || adminSession !== 'true') {
        // Redirect to login page
        window.location.href = 'login.html';
        return;
    }

    // Add logout functionality
    addLogoutButton();
}
// Add logout button to the admin interface
function addLogoutButton() {
    const nav = document.querySelector('.nav');
    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.onclick = logout;
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Déconnexion';
    nav.appendChild(logoutBtn);
}
// Logout function
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        sessionStorage.removeItem('maspalegryAdmin');
        window.location.href = 'login.html';
    }
}
function initializeDashboard() {
    loadSalesData();
    updateStatistics();
    initializeCharts();
    populateSalesTable();
    
    // Charger les produits du localStorage automatiquement
    refreshProductsList();

    // Show a welcome message if no data exists
    const salesData = getSalesData();
    if (salesData.length === 0) {
        showMessage('Aucune donnée de vente trouvée. Utilisez le bouton "Générer des données d\'exemple" pour commencer.', 'info');
    }
}
// Get sales data from localStorage
function getSalesData() {
    return JSON.parse(localStorage.getItem('maspalegrySales') || '[]');
}
// Update statistics cards
function updateStatistics() {
    const salesData = getSalesData();
    const today = new Date().toISOString().split('T')[0];

    // Total sales
    const totalSales = salesData.length;
    document.getElementById('total-sales').textContent = totalSales;

    // Total revenue
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.price, 0);
    document.getElementById('total-revenue').textContent = totalRevenue.toFixed(2) + '€';

    // Best selling product
    const productCounts = {};
    salesData.forEach(sale => {
        productCounts[sale.productName] = (productCounts[sale.productName] || 0) + 1;
    });

    const bestProduct = Object.keys(productCounts).reduce((a, b) =>
        productCounts[a] > productCounts[b] ? a : b, '-');
    document.getElementById('best-product').textContent = bestProduct;

    // Today's sales
    const todaySales = salesData.filter(sale => sale.date === today).length;
    document.getElementById('today-sales').textContent = todaySales;
}
// Initialize all charts
function initializeCharts() {
    initializeSalesChart();
    initializeProductsChart();
    initializeCategoryChart();
    initializeRevenueChart();
}
// Sales over time chart
function initializeSalesChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    const salesData = getSalesData();

    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - currentTimeRange);

    // Prepare data
    const dateMap = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateMap[dateStr] = 0;
    }

    salesData.forEach(sale => {
        if (dateMap.hasOwnProperty(sale.date)) {
            dateMap[sale.date]++;
        }
    });

    const labels = Object.keys(dateMap).sort((a, b) => a.localeCompare(b));
    const data = labels.map(date => dateMap[date]);

    if (salesChart) {
        salesChart.destroy();
    }

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Ventes',
                data: data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}
// Products distribution chart
function initializeProductsChart() {
    const ctx = document.getElementById('productsChart').getContext('2d');
    const salesData = getSalesData();

    const productCounts = {};
    salesData.forEach(sale => {
        productCounts[sale.productName] = (productCounts[sale.productName] || 0) + 1;
    });

    const labels = Object.keys(productCounts);
    const data = Object.values(productCounts);
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];

    if (productsChart) {
        productsChart.destroy();
    }

    productsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}
// Category distribution chart
function initializeCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const salesData = getSalesData();

    const categoryCounts = { tshirts: 0, accessories: 0 };
    salesData.forEach(sale => {
        const product = products[sale.productId];
        if (product) {
            categoryCounts[product.category]++;
        }
    });

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['T-shirts', 'Accessoires'],
            datasets: [{
                label: 'Ventes',
                data: [categoryCounts.tshirts, categoryCounts.accessories],
                backgroundColor: ['#667eea', '#764ba2'],
                borderColor: ['#5a6fd8', '#6a4190'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}
// Revenue over time chart
function initializeRevenueChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    const salesData = getSalesData();

    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - currentTimeRange);

    // Prepare data
    const dateMap = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateMap[dateStr] = 0;
    }

    salesData.forEach(sale => {
        if (dateMap.hasOwnProperty(sale.date)) {
            dateMap[sale.date] += sale.price;
        }
    });

    const labels = Object.keys(dateMap).sort((a, b) => a.localeCompare(b));
    const data = labels.map(date => dateMap[date]);

    if (revenueChart) {
        revenueChart.destroy();
    }

    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Chiffre d\'affaires (€)',
                data: data,
                backgroundColor: 'rgba(39, 174, 96, 0.8)',
                borderColor: '#27ae60',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
// Populate sales table
function populateSalesTable() {
    const salesData = getSalesData().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const tbody = document.getElementById('sales-tbody');

    tbody.innerHTML = '';

    if (salesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666;">Aucune vente enregistrée</td></tr>';
        return;
    }

    salesData.forEach(sale => {
        const row = document.createElement('tr');
        const date = new Date(sale.timestamp);

        row.innerHTML = `
            <td>${new Date(sale.date).toLocaleDateString('fr-FR')}</td>
            <td>${sale.productName}</td>
            <td>${sale.price.toFixed(2)}€</td>
            <td>${date.toLocaleTimeString('fr-FR')}</td>
        `;

        tbody.appendChild(row);
    });
}
// Update time range for charts
function updateTimeRange(days) {
    currentTimeRange = parseInt(days);

    // Update active button
    document.querySelectorAll('.chart-controls .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Refresh time-based charts
    initializeSalesChart();
    initializeRevenueChart();
}
// Filter sales by date
function filterSalesByDate() {
    const filterDate = document.getElementById('date-filter').value;
    if (!filterDate) return;

    const salesData = getSalesData().filter(sale => sale.date === filterDate);
    const tbody = document.getElementById('sales-tbody');

    tbody.innerHTML = '';

    if (salesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666;">Aucune vente pour cette date</td></tr>';
        return;
    }

    salesData.forEach(sale => {
        const row = document.createElement('tr');
        const date = new Date(sale.timestamp);

        row.innerHTML = `
            <td>${new Date(sale.date).toLocaleDateString('fr-FR')}</td>
            <td>${sale.productName}</td>
            <td>${sale.price.toFixed(2)}€</td>
            <td>${date.toLocaleTimeString('fr-FR')}</td>
        `;

        tbody.appendChild(row);
    });
}
// Clear filters
function clearFilters() {
    document.getElementById('date-filter').value = '';
    populateSalesTable();
}
// Generate sample data
function generateSampleData() {
    const sampleData = [];
    const productIds = Object.keys(products);

    // Generate data for the last 30 days
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Random number of sales per day (0-5)
        const salesCount = Math.floor(Math.random() * 6);

        for (let j = 0; j < salesCount; j++) {
            const productId = productIds[Math.floor(Math.random() * productIds.length)];
            const product = products[productId];
            const basePrice = Math.random() * 20 + 15; // Random price between 15-35€

            const sale = {
                id: Date.now() + Math.random(),
                productId: parseInt(productId),
                productName: product.name,
                price: Math.round(basePrice * 100) / 100,
                date: dateStr,
                timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString()
            };

            sampleData.push(sale);
        }
    }

    // Save to localStorage
    localStorage.setItem('maspalegrySales', JSON.stringify(sampleData));

    // Refresh dashboard
    refreshData();
    showMessage('Données d\'exemple générées avec succès!', 'success');
}
// Clear all data
function clearAllData() {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données de vente? Cette action est irréversible.')) {
        localStorage.removeItem('maspalegrySales');
        refreshData();
        showMessage('Toutes les données ont été supprimées.', 'info');
    }
}
// Refresh all data
function refreshData() {
    updateStatistics();
    initializeCharts();
    populateSalesTable();
    loadProductsList();
}
// Export data
function exportData() {
    const salesData = getSalesData();

    if (salesData.length === 0) {
        showMessage('Aucune donnée à exporter.', 'error');
        return;
    }

    // Convert to CSV
    const headers = ['Date', 'Produit', 'Prix', 'Catégorie', 'Timestamp'];
    const csvContent = [
        headers.join(','),
        ...salesData.map(sale => {
            const product = products[sale.productId];
            return [
                sale.date,
                `"${sale.productName}"`,
                sale.price,
                product ? product.category : 'unknown',
                sale.timestamp
            ].join(',');
        })
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `aviation-store-sales-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showMessage('Données exportées avec succès!', 'success');
}
// Load sales data on page load
function loadSalesData() {
    // This function can be expanded to load data from a server
    // For now, it just ensures localStorage is accessible
    try {
        getSalesData();
    } catch (error) {
        console.error('Error loading sales data:', error);
        showMessage('Erreur lors du chargement des données.', 'error');
    }
}
// Show message to user
function showMessage(text, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;

    // Insert after header
    const header = document.querySelector('.header');
    header.parentNode.insertBefore(message, header.nextSibling);

    // Remove message after 5 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 5000);
}
// Products Management Functions
let productToDelete = null;
// Get products from localStorage
function getProducts() {
    return JSON.parse(localStorage.getItem('maspalegryProducts')) || {
        1: { name: 'T-shirt Pilot Wings', category: 'tshirts', price: 25.99, icon: 'fas fa-tshirt' },
        2: { name: 'T-shirt Cessna Vintage', category: 'tshirts', price: 24.99, icon: 'fas fa-tshirt' },
        3: { name: 'T-shirt Boeing 747', category: 'tshirts', price: 26.99, icon: 'fas fa-tshirt' },
        4: { name: 'Casquette Pilote', category: 'accessories', price: 19.99, icon: 'fas fa-user-pilot' },
        5: { name: 'Boussole Aviation', category: 'accessories', price: 35.99, icon: 'fas fa-compass' },
        6: { name: 'Porte-clés Avion', category: 'accessories', price: 12.99, icon: 'fas fa-key' },
        7: { name: 'T-shirt Spitfire', category: 'tshirts', price: 27.99, icon: 'fas fa-tshirt' },
        8: { name: 'Badge Pilote', category: 'accessories', price: 15.99, icon: 'fas fa-medal' }
    };
}
// Save products to localStorage
function saveProducts(products) {
    localStorage.setItem('maspalegryProducts', JSON.stringify(products));
    // Also update the global products variable
    Object.assign(window.products, products);
}
// Load and display products list
function loadProductsList() {
    // Les produits sont déjà dans le HTML, on ne fait rien au chargement initial
    console.log('Products already displayed in HTML');
}

// Fonction pour recharger les produits depuis localStorage (utilise main.js)
function refreshProductsList() {
    const container = document.getElementById('admin-products-list');
    if (!container) {
        console.error('Container admin-products-list non trouvé !');
        return;
    }
    
    // Utiliser la variable products de main.js au lieu de recharger
    if (!window.products || Object.keys(window.products).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Aucun produit trouvé. Les produits se chargent depuis main.js...</p>';
        return;
    }
    
    console.log('Admin: Affichage des produits depuis main.js:', window.products);
    
    // Vider et recréer
    container.innerHTML = '';
    
    Object.entries(window.products).forEach(([id, product]) => {
        const productCard = document.createElement('div');
        productCard.className = 'admin-product-card';
        productCard.innerHTML = `
            <div class="admin-product-header">
                <div class="admin-product-info">
                    <div class="admin-product-icon">
                        <i class="${product.icon || 'fas fa-box'}"></i>
                    </div>
                    <h3>${product.name}</h3>
                    <div class="admin-product-price">${product.price.toFixed(2)}€</div>
                    <div class="admin-product-category">${product.category === 'tshirts' ? 'T-shirts' : 'Accessoires'}</div>
                    ${product.description ? `<p style="margin: 5px 0; color: #666; font-size: 0.9em;">${product.description}</p>` : ''}
                </div>
                <div class="admin-product-actions">
                    <button class="btn-icon btn-edit" onclick="editProduct(${id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteProduct(${id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(productCard);
    });
    
    console.log('Products refreshed:', Object.keys(products).length, 'products loaded');
}

// Force load products - fonction de debug
function forceLoadProducts() {
    console.log('Force loading products...');
    const container = document.getElementById('admin-products-list');
    
    if (!container) {
        alert('Conteneur admin-products-list non trouvé!');
        return;
    }
    
    // Créer des produits manuellement
    const defaultProducts = {
        1: { name: 'T-shirt Pilot Wings', category: 'tshirts', price: 25.99, icon: 'fas fa-tshirt' },
        2: { name: 'T-shirt Cessna Vintage', category: 'tshirts', price: 24.99, icon: 'fas fa-tshirt' },
        3: { name: 'Casquette Pilote', category: 'accessories', price: 19.99, icon: 'fas fa-user-pilot' },
        4: { name: 'Boussole Aviation', category: 'accessories', price: 35.99, icon: 'fas fa-compass' }
    };
    
    // Sauvegarder dans localStorage
    localStorage.setItem('maspalegryProducts', JSON.stringify(defaultProducts));
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Créer les cartes manuellement
    Object.entries(defaultProducts).forEach(([id, product]) => {
        const productCard = document.createElement('div');
        productCard.className = 'admin-product-card';
        productCard.innerHTML = `
            <div class="admin-product-header">
                <div class="admin-product-info">
                    <div class="admin-product-icon">
                        <i class="${product.icon}"></i>
                    </div>
                    <h3>${product.name}</h3>
                    <div class="admin-product-price">${product.price.toFixed(2)}€</div>
                    <div class="admin-product-category">${product.category === 'tshirts' ? 'T-shirts' : 'Accessoires'}</div>
                </div>
                <div class="admin-product-actions">
                    <button class="btn-icon btn-edit" onclick="editProduct(${id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteProduct(${id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(productCard);
    });
    
    alert('Produits forcés! ' + Object.keys(defaultProducts).length + ' produits ajoutés.');
}

// Open add product modal
function openAddProductModal() {
    document.getElementById('product-modal-title').textContent = 'Ajouter un Produit';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-modal').style.display = 'block';
}
// Edit product
function editProduct(id) {
    const products = getProducts();
    const product = products[id];

    if (!product) return;

    document.getElementById('product-modal-title').textContent = 'Modifier le Produit';
    document.getElementById('product-id').value = id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-icon').value = product.icon || '';
    document.getElementById('product-description').value = product.description || '';

    document.getElementById('product-modal').style.display = 'block';
}
// Save product (add or edit)
function saveProduct(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const productId = document.getElementById('product-id').value;
    const products = getProducts();

    const productData = {
        name: formData.get('name'),
        price: parseFloat(formData.get('price')),
        category: formData.get('category'),
        icon: formData.get('icon') || 'fas fa-box',
        description: formData.get('description') || ''
    };

    if (productId) {
        // Edit existing product
        products[productId] = productData;
        showMessage(`Produit modifié avec succès!`, 'success');
    } else {
        // Add new product
        const newId = Math.max(...Object.keys(products).map(Number)) + 1;
        products[newId] = productData;
        showMessage(`Produit ajouté avec succès!`, 'success');
    }

    saveProducts(products);
    refreshProductsList(); // Utiliser la nouvelle fonction
    closeProductModal();

    // Refresh dashboard if needed
    if (productId) {
        refreshData();
    }
}
// Delete product
function deleteProduct(id) {
    const products = getProducts();
    const product = products[id];

    if (!product) return;

    productToDelete = id;
    document.getElementById('delete-product-name').textContent = product.name;
    document.getElementById('delete-modal').style.display = 'block';
}
// Confirm delete product
function confirmDeleteProduct() {
    if (!productToDelete) return;

    const products = getProducts();
    const productName = products[productToDelete].name;

    delete products[productToDelete];
    saveProducts(products);

    refreshProductsList(); // Utiliser la nouvelle fonction
    closeDeleteModal();
    refreshData();

    showMessage(`Produit "${productName}" supprimé avec succès!`, 'info');
    productToDelete = null;
}
// Close product modal
function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}
// Close delete modal
function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    productToDelete = null;
}
// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const productModal = document.getElementById('product-modal');
    const deleteModal = document.getElementById('delete-modal');

    if (event.target === productModal) {
        closeProductModal();
    }

    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});
