// Admin Dashboard JavaScript
let salesChart, productsChart, categoryChart, revenueChart;
let currentTimeRange = 30;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking admin access');
    checkAdminAccess();
    console.log('Initializing dashboard...');
    
    // Attendre que main.js charge les produits, puis initialiser l'admin
    setTimeout(() => {
        initializeDashboard();
    }, 100);
    
    // Écouter les événements de mise à jour des produits
    window.addEventListener('productsUpdated', function() {
        console.log('Products updated event received, refreshing admin list...');
        setTimeout(() => {
            refreshProductsList();
        }, 200);
    });
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
    
    // Forcer le chargement des produits depuis main.js puis afficher
    const checkProducts = () => {
        console.log('Checking products availability...');
        
        // Essayer de charger depuis localStorage d'abord
        const storedProducts = getProducts();
        if (storedProducts && Object.keys(storedProducts).length > 0) {
            console.log('Products found in localStorage:', storedProducts);
            window.products = storedProducts;
            refreshProductsList();
            return;
        }
        
        // Sinon attendre que main.js charge les produits par défaut
        if (window.products && Object.keys(window.products).length > 0) {
            console.log('Products found in window.products:', window.products);
            refreshProductsList();
        } else {
            console.log('Products not ready yet, retrying...');
            setTimeout(checkProducts, 200);
        }
    };
    
    // Démarrer la vérification avec un petit délai pour laisser main.js se charger
    setTimeout(checkProducts, 100);

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
// Get products from localStorage (source of truth)
function getProducts() {
    const stored = localStorage.getItem('maspalegryProducts');
    if (stored) {
        const products = JSON.parse(stored);
        // Synchronize with window.products
        window.products = products;
        return products;
    }
    return window.products || {};
}
// Save products to localStorage
function saveProducts(products) {
    try {
        console.log('Saving products to localStorage...', Object.keys(products).length, 'products');
        localStorage.setItem('maspalegryProducts', JSON.stringify(products));
        window.products = products; // Mettre à jour la variable globale
        localStorage.setItem('maspalegryProductsLastUpdate', Date.now().toString());
        
        console.log('Products saved to localStorage, triggering update event');
        
        // Déclencher l'événement de mise à jour
        const event = new CustomEvent('productsUpdated', { 
            detail: { products: products, source: 'admin' } 
        });
        window.dispatchEvent(event);
        
        // Utiliser la nouvelle fonction de synchronisation
        setTimeout(() => {
            forceSyncProducts();
        }, 50);
        
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde :', error);
        return false;
    }
}
// Load and display products list
function loadProductsList() {
    // Les produits sont déjà dans le HTML, on ne fait rien au chargement initial
    console.log('Products already displayed in HTML');
}

// Fonction pour recharger les produits depuis localStorage (utilise main.js)
// Fonction pour forcer la synchronisation entre admin et index
function forceSyncProducts() {
    console.log('Forcing products synchronization...');
    
    // Recharger les produits depuis localStorage
    const products = getProducts();
    console.log('Current products in localStorage:', Object.keys(products).length);
    
    // Mettre à jour la variable globale
    window.products = products;
    
    // Déclencher un événement pour notifier les autres scripts
    const event = new CustomEvent('productsSynced', { 
        detail: { products: products, timestamp: Date.now() } 
    });
    window.dispatchEvent(event);
    
    // Forcer le rafraîchissement de l'affichage
    if (typeof generateProductCards === 'function') {
        generateProductCards();
    }
    
    console.log('Products synchronization completed');
}

function refreshProductsList() {
    console.log('Refreshing products list...');
    const container = document.getElementById('admin-products-list');
    if (!container) {
        console.error('Container admin-products-list non trouvé !');
        return;
    }
    
    // S'assurer qu'on a les derniers produits depuis localStorage
    const products = getProducts();
    window.products = products;
    
    if (!products || Object.keys(products).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Aucun produit trouvé. Utilisez le bouton "Ajouter un Produit" pour commencer.</p>';
        return;
    }
    
    console.log('Products to display:', products);
    
    // Utiliser generateProductCards de main.js qui gère déjà l'admin
    if (typeof generateProductCards === 'function') {
        generateProductCards();
    } else {
        // Fallback si generateProductCards n'est pas disponible
        console.warn('generateProductCards not available, using fallback');
        container.innerHTML = '';
        Object.keys(products).forEach(id => {
            const product = products[id];
            // Utiliser la fonction de main.js qui prend (container, id, product)
            if (typeof createAdminProductCard === 'function') {
                createAdminProductCard(container, id, product);
            } else {
                console.error('createAdminProductCard function not available');
            }
        });
    }
}

// Open add product modal
function openAddProductModal() {
    document.getElementById('product-modal-title').textContent = 'Ajouter un Produit';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    
    // Vider les aperçus d'images
    document.getElementById('preview-front').innerHTML = `
        <div class="placeholder">
            <i class="fas fa-image"></i>
            <span>Aperçu de l'image principale</span>
        </div>
    `;
    document.getElementById('preview-back').innerHTML = `
        <div class="placeholder">
            <i class="fas fa-image"></i>
            <span>Aperçu de l'image arrière</span>
        </div>
    `;
    
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

    // Charger les images existantes
    if (product.images) {
        if (product.images.front) {
            document.getElementById('preview-front').innerHTML = `
                <img src="${product.images.front}" alt="Image principale" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                <button type="button" class="remove-image" onclick="removeImage('front')" title="Supprimer l'image">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }
        if (product.images.back) {
            document.getElementById('preview-back').innerHTML = `
                <img src="${product.images.back}" alt="Image arrière" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                <button type="button" class="remove-image" onclick="removeImage('back')" title="Supprimer l'image">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }
    }

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

    // Gestion des images - récupérer les images actuelles dans les previews
    const frontImg = document.querySelector('#preview-front img');
    const backImg = document.querySelector('#preview-back img');
    
    // Si on modifie un produit existant, partir de ses images existantes
    if (productId) {
        const existingProduct = products[productId];
        if (existingProduct.images) {
            productData.images = { ...existingProduct.images };
        }
    }
    
    // Mettre à jour avec les nouvelles images si elles existent
    if (frontImg || backImg || productData.images) {
        if (!productData.images) {
            productData.images = {};
        }
        
        if (frontImg) {
            productData.images.front = frontImg.src;
        }
        if (backImg) {
            productData.images.back = backImg.src;
        }
    }

    if (productId) {
        // Edit existing product
        products[productId] = productData;
        showMessage(`Produit "${productData.name}" modifié avec succès!`, 'success');
    } else {
        // Add new product
        const newId = Math.max(...Object.keys(products).map(Number)) + 1;
        products[newId] = productData;
        showMessage(`Produit "${productData.name}" ajouté avec succès!`, 'success');
    }

    // Sauvegarder et synchroniser (forceSyncProducts est appelé dans saveProducts)
    const saveSuccess = saveProducts(products);
    
    if (saveSuccess) {
        console.log('Product saved successfully, closing modal');
        closeProductModal();
        
        // Optionnel : petit délai pour la synchronisation visuelle
        setTimeout(() => {
            console.log('Sync completed after product save');
        }, 200);
    } else {
        console.error('Failed to save product');
        showMessage('Erreur lors de la sauvegarde du produit', 'error');
    }

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

// Image upload handling
function handleImageUpload(event, position) {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier que c'est bien une image
    if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide.');
        return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('La taille de l\'image ne doit pas dépasser 5MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const previewElement = document.getElementById(`preview-${position}`);
        previewElement.innerHTML = `
            <img src="${e.target.result}" alt="Aperçu ${position}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
            <button type="button" class="remove-image" onclick="removeImage('${position}')" title="Supprimer l'image">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Mettre à jour le texte du bouton
        const fileInputText = event.target.nextElementSibling;
        fileInputText.textContent = file.name;
    };
    reader.readAsDataURL(file);
}

// Remove image
function removeImage(position) {
    const input = document.getElementById(`product-image-${position}`);
    const preview = document.getElementById(`preview-${position}`);
    const fileInputText = input.nextElementSibling;
    
    input.value = '';
    fileInputText.textContent = 'Choisir une image...';
    preview.innerHTML = `
        <div class="placeholder">
            <i class="fas fa-image"></i>
            <span>Aperçu de l'image ${position === 'front' ? 'principale' : 'arrière'}</span>
        </div>
    `;
}
