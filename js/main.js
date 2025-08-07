// Cart functionality
let cart = [];
let cartCount = 0;
let products = {};

// User session management
let currentUserId = null;
const USER_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 heures

// Admin session management
let adminInactivityTimer;
const ADMIN_SESSION_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

// Fonction pour générer un ID utilisateur unique
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Fonction pour obtenir ou créer une session utilisateur
function getUserSession() {
    // Vérifier s'il y a une session existante
    const existingSession = sessionStorage.getItem('maspalegryUserSession');
    const sessionTimestamp = sessionStorage.getItem('maspalegryUserSessionTimestamp');
    
    if (existingSession && sessionTimestamp) {
        const now = Date.now();
        const sessionTime = parseInt(sessionTimestamp);
        
        // Vérifier si la session est encore valide (24 heures)
        if (now - sessionTime < USER_SESSION_DURATION) {
            currentUserId = existingSession;
            console.log('Session utilisateur existante trouvée:', currentUserId);
            return currentUserId;
        }
    }
    
    // Créer une nouvelle session utilisateur
    currentUserId = generateUserId();
    sessionStorage.setItem('maspalegryUserSession', currentUserId);
    sessionStorage.setItem('maspalegryUserSessionTimestamp', Date.now().toString());
    console.log('Nouvelle session utilisateur créée:', currentUserId);
    return currentUserId;
}

// Fonction pour obtenir le panier de l'utilisateur actuel
function getUserCart() {
    const cartKey = `maspalegryCart_${currentUserId}`;
    const savedCart = localStorage.getItem(cartKey);
    return savedCart ? JSON.parse(savedCart) : [];
}

// Fonction pour sauvegarder le panier de l'utilisateur actuel
function saveUserCart() {
    const cartKey = `maspalegryCart_${currentUserId}`;
    localStorage.setItem(cartKey, JSON.stringify(cart));
    console.log('Panier sauvegardé pour utilisateur:', currentUserId, cart);
}

// Fonction pour afficher l'ID de session utilisateur (pour debug)
function showUserSession() {
    if (window.location.search.includes('debug=true')) {
        const sessionInfo = document.createElement('div');
        sessionInfo.id = 'user-session-info';
        sessionInfo.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 10000;
            font-family: monospace;
        `;
        sessionInfo.textContent = `Session: ${currentUserId.substr(-8)}`;
        document.body.appendChild(sessionInfo);
    }
}

// Fonction pour vider le panier de l'utilisateur actuel
function clearUserCart() {
    cart = [];
    updateCartDisplay();
    saveUserCart();
    showNotification('Panier vidé!', 'info');
}

// Initialize admin session management
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la session utilisateur
    getUserSession();
    
    // Charger le panier de l'utilisateur
    cart = getUserCart();
    updateCartDisplay();
    
    // Afficher l'info de session si en mode debug
    showUserSession();
    
    checkAdminSession();
    resetAdminInactivityTimer();
    
    // Charger les produits au démarrage
    loadProducts().then(() => {
        generateProductCards();
        setupFilterButtons();
        setupCartModal();
        setupAdminAccess();
    });
    
    // Reset timer on user activity
    document.addEventListener('click', resetAdminInactivityTimer);
    document.addEventListener('keypress', resetAdminInactivityTimer);
    document.addEventListener('scroll', resetAdminInactivityTimer);
    document.addEventListener('mousemove', resetAdminInactivityTimer);
    
    // Écouter les changements de produits depuis l'admin
    let lastUpdate = localStorage.getItem('maspalegryProductsLastUpdate');
    setInterval(() => {
        const currentUpdate = localStorage.getItem('maspalegryProductsLastUpdate');
        if (currentUpdate && currentUpdate !== lastUpdate) {
            console.log('Products updated, reloading...');
            lastUpdate = currentUpdate;
            loadProducts().then(() => {
                generateProductCards();
            });
        }
    }, 1000); // Vérifier toutes les secondes
    
    // Écouter les événements personnalisés de mise à jour des produits
    window.addEventListener('productsUpdated', function(event) {
        console.log('Products updated event received in main.js');
        loadProducts().then(() => {
            generateProductCards();
        });
    });
});

// Check if admin is logged in and show logout button
function checkAdminSession() {
    const adminSession = sessionStorage.getItem('maspalegryAdmin');
    const adminTimestamp = sessionStorage.getItem('maspalegryAdminTimestamp');
    
    if (adminSession === 'true' && adminTimestamp) {
        const now = Date.now();
        const loginTime = parseInt(adminTimestamp);
        
        // Check if session is still valid (within 5 minutes)
        if (now - loginTime < ADMIN_SESSION_DURATION) {
            showAdminLogoutButton();
            // Update timestamp to extend session
            sessionStorage.setItem('maspalegryAdminTimestamp', now.toString());
        } else {
            // Session expired
            logoutAdmin();
        }
    }
}

// Show admin logout button in navbar
function showAdminLogoutButton() {
    const nav = document.querySelector('.nav');
    const existingLogoutBtn = document.getElementById('admin-logout-btn');
    const adminLink = nav.querySelector('.admin-link');
    
    // Show the admin link and change to admin dashboard
    if (adminLink) {
        adminLink.classList.remove('hidden');
        adminLink.href = 'admin.html';
        adminLink.innerHTML = `
            <i class="fas fa-chart-line"></i>
            Dashboard Admin
        `;
    }
    
    if (!existingLogoutBtn) {
        
        // Create logout button
        const logoutBtn = document.createElement('a');
        logoutBtn.id = 'admin-logout-btn';
        logoutBtn.href = '#';
        logoutBtn.className = 'admin-logout-link';
        logoutBtn.onclick = function(e) {
            e.preventDefault();
            logoutAdmin();
        };
        logoutBtn.innerHTML = `
            <i class="fas fa-sign-out-alt"></i>
            Déconnexion
        `;
        
        // Insert after admin link
        if (adminLink) {
            adminLink.parentNode.insertBefore(logoutBtn, adminLink.nextSibling);
        }
    }
}

// Reset inactivity timer
function resetAdminInactivityTimer() {
    const adminSession = sessionStorage.getItem('maspalegryAdmin');
    
    if (adminSession === 'true') {
        clearTimeout(adminInactivityTimer);
        
        // Update timestamp
        sessionStorage.setItem('maspalegryAdminTimestamp', Date.now().toString());
        
        // Set new timer
        adminInactivityTimer = setTimeout(() => {
            logoutAdmin('Session expirée après 5 minutes d\'inactivité');
        }, ADMIN_SESSION_DURATION);
    }
}

// Logout admin
function logoutAdmin(message = 'Déconnexion réussie') {
    sessionStorage.removeItem('maspalegryAdmin');
    sessionStorage.removeItem('maspalegryAdminTimestamp');
    clearTimeout(adminInactivityTimer);
    
    // Remove logout button
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.remove();
    }
    
    // Hide admin link
    const adminLink = document.querySelector('.admin-link');
    if (adminLink) {
        adminLink.classList.add('hidden');
    }
    
    showNotification(message, 'info');
    
    // Redirect to login if on admin page
    if (window.location.pathname.includes('admin.html')) {
        window.location.href = 'login.html';
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Style de la notification
    let backgroundColor;
    if (type === 'error') {
        backgroundColor = '#ff4444';
    } else if (type === 'warning') {
        backgroundColor = '#ffaa00';
    } else {
        backgroundColor = '#4CAF50';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        max-width: 300px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-suppression après 5 secondes
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Initialize the application
// Note: Initialization is handled by the main DOMContentLoaded listener above

// Load products from localStorage or use defaults
async function loadProducts() {
    const defaultProducts = {
        1: { 
            name: 'T-shirt Pilot Wings', 
            category: 'tshirts', 
            price: 25.99, 
            icon: 'fas fa-tshirt',
            description: 'T-shirt premium avec design "Pilot Wings" brodé'
        },
        2: { 
            name: 'T-shirt Cessna Vintage', 
            category: 'tshirts', 
            price: 24.99, 
            icon: 'fas fa-tshirt',
            description: 'T-shirt vintage avec illustration Cessna classic'
        },
        3: { 
            name: 'T-shirt Boeing 747', 
            category: 'tshirts', 
            price: 26.99, 
            icon: 'fas fa-tshirt',
            description: 'T-shirt avec silhouette Boeing 747 et schéma technique'
        },
        4: { name: 'Casquette Pilote', category: 'accessories', price: 19.99, icon: 'fas fa-user-pilot' },
        5: { name: 'Boussole Aviation', category: 'accessories', price: 35.99, icon: 'fas fa-compass' },
        6: { name: 'Porte-clés Avion', category: 'accessories', price: 12.99, icon: 'fas fa-key' },
        7: { 
            name: 'T-shirt Spitfire', 
            category: 'tshirts', 
            price: 27.99, 
            icon: 'fas fa-tshirt',
            description: 'T-shirt collector avec Supermarine Spitfire'
        },
        8: { name: 'Badge Pilote', category: 'accessories', price: 15.99, icon: 'fas fa-medal' }
    };
    
    // Charger depuis localStorage en priorité, sinon utiliser les défauts
    const storedProducts = localStorage.getItem('maspalegryProducts');
    if (storedProducts) {
        products = JSON.parse(storedProducts);
        console.log('✅ Produits chargés depuis localStorage (modifications conservées)');
    } else {
        products = defaultProducts;
        localStorage.setItem('maspalegryProducts', JSON.stringify(defaultProducts));
        console.log('✅ Produits par défaut initialisés pour la première fois');
    }
    
    // Exposer les produits à l'objet window pour l'admin
    window.products = products;
    
    // Debug: vérifier les produits avec images
    console.log('Products loaded:', products);
    Object.entries(products).forEach(([id, product]) => {
        if (product.images) {
            console.log(`Product ${id} (${product.name}) has images:`, Object.keys(product.images));
        }
    });
    
    // Les images sont maintenant directement incluses dans les données des produits
    // Pas besoin de fonction séparée pour charger les images
}

// Cette fonction n'est plus nécessaire car les images sont dans les données des produits
// Conservée pour la compatibilité
async function loadProductImages() {
    // Les images sont maintenant directement stockées dans products[id].images
    console.log('Images chargées directement depuis les données des produits');
}

// Generate product cards dynamically for both index and admin
function generateProductCards() {
    console.log('generateProductCards called, products:', products);
    
    // Détecter quel conteneur utiliser selon la page
    let container = document.getElementById('products-grid'); // Pour index.html
    let isAdminPage = false;
    
    if (!container) {
        container = document.getElementById('admin-products-list'); // Pour admin.html
        isAdminPage = true;
    }
    
    if (!container) {
        console.error('Aucun conteneur de produits trouvé (products-grid ou admin-products-list)!');
        return;
    }
    
    console.log('Conteneur trouvé:', container.id, 'Page admin:', isAdminPage);
    
    // Vérifier si products est défini et non vide
    if (!products || Object.keys(products).length === 0) {
        console.warn('No products found, loading defaults...');
        loadProducts().then(() => generateProductCards());
        return;
    }
    
    // Clear existing static products  
    const existingProducts = container.querySelectorAll('.product-card, .admin-product-card');
    existingProducts.forEach(card => card.remove());
    
    console.log('Generating cards for', Object.keys(products).length, 'products');
    
    // Generate cards from products data
    Object.entries(products).forEach(([id, product]) => {
        console.log(`Creating card for product ${id}:`, product.name);
        
        if (isAdminPage) {
            // Format admin avec les boutons d'édition/suppression
            createAdminProductCard(container, id, product);
        } else {
            // Format normal pour l'index
            createIndexProductCard(container, id, product);
        }
    });
    
    console.log('Cards generated successfully, total in DOM:', container.children.length);
}

// Créer une carte produit pour l'index
function createIndexProductCard(container, id, product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.setAttribute('data-category', product.category);
    productCard.setAttribute('data-id', id);
    
    // Déterminer l'affichage de l'image/icône
    let imageDisplay = '';
    if (product.images?.front) {
        // Produit avec image personnalisée - remplace l'icône par défaut
        imageDisplay = `
            <img src="${product.images.front}" 
                 alt="${product.name} - vue de face" 
                 class="product-img"
                 onclick="openProductGallery(${id})"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
                 onload="console.log('Image loaded for product ${id}')">
            <div class="product-icon-fallback" style="display: none;">
                <i class="${product.icon}"></i>
            </div>
            ${product.images.back ? `
                <div class="image-indicator">
                    <i class="fas fa-images"></i>
                    <span>Cliquer pour voir les photos</span>
                </div>
            ` : ''}
        `;
    } else {
        // Produit avec icône par défaut uniquement
        imageDisplay = `
            <div class="product-icon">
                <i class="${product.icon}"></i>
            </div>
        `;
    }
    
    productCard.innerHTML = `
        <div class="product-image">
            ${imageDisplay}
        </div>
        <h3>${product.name}</h3>
        ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
        <p class="price">${product.price.toFixed(2)}€</p>
        <button class="add-to-cart" onclick="addToCart(${id}, '${product.name}', ${product.price})">
            <i class="fas fa-cart-plus"></i> Ajouter au panier
        </button>
    `;
    
    container.appendChild(productCard);
}

// Créer une carte produit pour l'admin
function createAdminProductCard(container, id, product) {
    const productCard = document.createElement('div');
    productCard.className = 'admin-product-card';
    
    // Déterminer l'affichage de l'image/icône comme pour l'index
    let imageDisplay = '';
    if (product.images?.front) {
        // Produit avec image personnalisée
        imageDisplay = `
            <img src="${product.images.front}" 
                 alt="${product.name} - vue de face" 
                 class="admin-product-image"
                 onclick="openProductGallery(${id})"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
                 onload="console.log('Admin image loaded for product ${id}')">
            <div class="admin-product-icon-fallback" style="display: none;">
                <i class="${product.icon}"></i>
            </div>
            ${product.images.back ? `
                <div class="admin-image-indicator">
                    <i class="fas fa-images"></i>
                    <span>Cliquer pour voir</span>
                </div>
            ` : ''}
        `;
    } else {
        // Produit avec icône par défaut uniquement
        imageDisplay = `
            <div class="admin-product-icon">
                <i class="${product.icon || 'fas fa-box'}"></i>
            </div>
        `;
    }
    
    productCard.innerHTML = `
        <div class="admin-product-header">
            <div class="admin-product-info">
                ${imageDisplay}
                <h3>${product.name}</h3>
                <div class="admin-product-price">${product.price.toFixed(2)}€</div>
                <div class="admin-product-category">${product.category === 'tshirts' ? 'T-shirts' : 'Accessoires'}</div>
                ${product.description ? `<p style="margin: 5px 0; color: #666; font-size: 0.9em; text-align: center;">${product.description}</p>` : ''}
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
}

// Smooth scroll to products section
function scrollToProducts() {
    document.getElementById('products').scrollIntoView({
        behavior: 'smooth'
    });
}

// Ouvrir la galerie de photos du produit
function openProductGallery(productId) {
    const product = products[productId];
    if (!product?.images) return;
    
    // Créer la modal de galerie
    const galleryModal = document.createElement('div');
    galleryModal.className = 'product-gallery-modal';
    galleryModal.innerHTML = `
        <div class="gallery-overlay" onclick="closeProductGallery()"></div>
        <div class="gallery-content">
            <div class="gallery-header">
                <h2>${product.name}</h2>
                <button class="gallery-close" onclick="closeProductGallery()">&times;</button>
            </div>
            <div class="gallery-body">
                <div class="gallery-main-image">
                    <img id="gallery-main-img" src="${product.images.front}" alt="${product.name}">
                    <div class="image-controls">
                        <button class="zoom-btn" onclick="toggleZoom()">
                            <i class="fas fa-search-plus" id="zoom-icon"></i>
                        </button>
                    </div>
                </div>
                <div class="gallery-thumbnails">
                    <div class="thumbnail active" onclick="switchImage('${product.images.front}', this)">
                        <img src="${product.images.front}" alt="Vue de face">
                        <span>Devant</span>
                    </div>
                    <div class="thumbnail" onclick="switchImage('${product.images.back}', this)">
                        <img src="${product.images.back}" alt="Vue de dos">
                        <span>Derrière</span>
                    </div>
                </div>
            </div>
            <div class="gallery-footer">
                <div class="product-info">
                    <p class="product-description">${product.description || ''}</p>
                    <p class="product-price">${product.price.toFixed(2)}€</p>
                </div>
                <button class="btn btn-primary" onclick="addToCart(${productId}, '${product.name}', ${product.price}); closeProductGallery();">
                    <i class="fas fa-cart-plus"></i> Ajouter au panier
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(galleryModal);
    document.body.style.overflow = 'hidden'; // Empêcher le scroll de la page
}

// Fermer la galerie
function closeProductGallery() {
    const modal = document.querySelector('.product-gallery-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = ''; // Rétablir le scroll
    }
}

// Changer d'image dans la galerie
function switchImage(imageSrc, thumbnail) {
    const mainImg = document.getElementById('gallery-main-img');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    // Mettre à jour l'image principale
    mainImg.src = imageSrc;
    
    // Mettre à jour l'état actif des thumbnails
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbnail.classList.add('active');
    
    // Réinitialiser le zoom
    mainImg.style.transform = 'scale(1)';
    const zoomIcon = document.getElementById('zoom-icon');
    if (zoomIcon) {
        zoomIcon.className = 'fas fa-search-plus';
    }
}

// Toggle zoom sur l'image
function toggleZoom() {
    const mainImg = document.getElementById('gallery-main-img');
    const zoomIcon = document.getElementById('zoom-icon');
    
    if (mainImg.style.transform === 'scale(2)') {
        mainImg.style.transform = 'scale(1)';
        zoomIcon.className = 'fas fa-search-plus';
    } else {
        mainImg.style.transform = 'scale(2)';
        zoomIcon.className = 'fas fa-search-minus';
    }
}

// Add item to cart
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    saveUserCart(); // Utiliser la nouvelle fonction de sauvegarde utilisateur
    showCartNotification(name);
    
    // Ne plus sauvegarder les ventes ici - seulement après paiement confirmé
    console.log('Produit ajouté au panier (vente en attente de paiement):', name);
}

// Update cart display
function updateCartDisplay() {
    cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
}

// Show cart notification
function showCartNotification(itemName) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${itemName} ajouté au panier!
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #1E90FF;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 25px;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Setup filter buttons
function setupFilterButtons() {
    console.log('Setting up filter buttons...');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    
    console.log('Found', filterButtons.length, 'filter buttons and', productCards.length, 'product cards');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Filter button clicked:', button.getAttribute('data-filter'));
            
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            let visibleCount = 0;
            
            productCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                console.log('Card category:', cardCategory, 'Filter:', filter);
                
                if (filter === 'all' || cardCategory === filter) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.5s ease';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            console.log('Visible cards after filtering:', visibleCount);
        });
    });
}

// Setup cart modal
function setupCartModal() {
    const cartIcon = document.querySelector('.cart-icon');
    const modal = document.getElementById('cart-modal');
    
    cartIcon.addEventListener('click', openCart);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCart();
        }
    });
}

// Open cart modal
function openCart() {
    const modal = document.getElementById('cart-modal');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    // Clear current items
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #666;">Votre panier est vide</p>';
    } else {
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div>
                    <strong>${item.name}</strong><br>
                    <span style="color: #666;">Quantité: ${item.quantity}</span>
                </div>
                <div>
                    <span style="font-weight: bold;">${(item.price * item.quantity).toFixed(2)}€</span>
                    <button onclick="removeFromCart(${item.id})" style="margin-left: 10px; background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 15px; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
    }
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2) + '€';
    
    modal.style.display = 'block';
}

// Close cart modal
function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

// Remove item from cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartDisplay();
    saveUserCart(); // Utiliser la nouvelle fonction de sauvegarde utilisateur
    openCart(); // Refresh the cart display
}

// Checkout function
function checkout() {
    if (cart.length === 0) {
        showNotification('Votre panier est vide!', 'warning');
        return;
    }
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// Admin access system - Secret code
function setupAdminAccess() {
    const secretCode = ['a', 'd', 'm', 'i', 'n']; // Type "admin"
    let userInput = [];
    
    document.addEventListener('keydown', function(e) {
        // Add the pressed key to user input
        userInput.push(e.key.toLowerCase());
        
        // Keep only the last 5 keys
        if (userInput.length > secretCode.length) {
            userInput.shift();
        }
        
        // Check if the sequence matches
        if (userInput.length === secretCode.length && 
            userInput.every((key, index) => key === secretCode[index])) {
            
            // Create admin session
            sessionStorage.setItem('maspalegryAdmin', 'true');
            
            // Show admin access notification
            showAdminAccessNotification();
            
            // Reset the input
            userInput = [];
            
            // Redirect to admin page after short delay
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
        }
    });
}

// Show admin access notification
function showAdminAccessNotification() {
    const notification = document.createElement('div');
    notification.className = 'admin-access-notification';
    notification.innerHTML = `
        <i class="fas fa-user-shield"></i>
        Accès administrateur activé...
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #FF4500 0%, #1E90FF 100%);
        color: white;
        padding: 2rem 3rem;
        border-radius: 15px;
        z-index: 5000;
        animation: adminAccess 1.5s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        text-align: center;
        font-size: 1.2rem;
        font-weight: bold;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after animation
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 1500);
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .cart-notification {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    @keyframes adminAccess {
        0% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.5); 
        }
        50% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1.1); 
        }
        100% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1); 
        }
    }
`;
document.head.appendChild(style);

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.nav');
    
    if (mobileMenuToggle && nav) {
        mobileMenuToggle.addEventListener('click', function() {
            // Toggle menu
            nav.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!nav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                nav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        });
    }
});
