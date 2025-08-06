// Cart functionality
let cart = [];
let cartCount = 0;
let products = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    updateCartDisplay();
    setupFilterButtons();
    setupCartModal();
    loadCartFromStorage();
    setupAdminAccess();
    generateProductCards();
});

// Load products from localStorage or use defaults
function loadProducts() {
    const defaultProducts = {
        1: { name: 'T-shirt Pilot Wings', category: 'tshirts', price: 25.99, icon: 'fas fa-tshirt' },
        2: { name: 'T-shirt Cessna Vintage', category: 'tshirts', price: 24.99, icon: 'fas fa-tshirt' },
        3: { name: 'T-shirt Boeing 747', category: 'tshirts', price: 26.99, icon: 'fas fa-tshirt' },
        4: { name: 'Casquette Pilote', category: 'accessories', price: 19.99, icon: 'fas fa-user-pilot' },
        5: { name: 'Boussole Aviation', category: 'accessories', price: 35.99, icon: 'fas fa-compass' },
        6: { name: 'Porte-clés Avion', category: 'accessories', price: 12.99, icon: 'fas fa-key' },
        7: { name: 'T-shirt Spitfire', category: 'tshirts', price: 27.99, icon: 'fas fa-tshirt' },
        8: { name: 'Badge Pilote', category: 'accessories', price: 15.99, icon: 'fas fa-medal' }
    };
    
    products = JSON.parse(localStorage.getItem('aviationStoreProducts')) || defaultProducts;
    
    // Save default products if none exist
    if (!localStorage.getItem('aviationStoreProducts')) {
        localStorage.setItem('aviationStoreProducts', JSON.stringify(defaultProducts));
    }
}

// Generate product cards dynamically
function generateProductCards() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    // Clear existing static products
    const existingProducts = productsGrid.querySelectorAll('.product-card');
    existingProducts.forEach(card => card.remove());
    
    // Generate cards from products data
    Object.entries(products).forEach(([id, product]) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-category', product.category);
        productCard.setAttribute('data-id', id);
        
        productCard.innerHTML = `
            <div class="product-image">
                <i class="${product.icon}"></i>
            </div>
            <h3>${product.name}</h3>
            <p class="price">${product.price.toFixed(2)}€</p>
            <button class="add-to-cart" onclick="addToCart(${id}, '${product.name}', ${product.price})">
                <i class="fas fa-cart-plus"></i> Ajouter au panier
            </button>
        `;
        
        productsGrid.appendChild(productCard);
    });
}

// Smooth scroll to products section
function scrollToProducts() {
    document.getElementById('products').scrollIntoView({
        behavior: 'smooth'
    });
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
    saveCartToStorage();
    showCartNotification(name);
    
    // Save sale data for admin dashboard
    saveSaleData(id, name, price);
}

// Update cart display
function updateCartDisplay() {
    cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = cartCount;
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
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            
            productCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.5s ease';
                } else {
                    card.style.display = 'none';
                }
            });
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
    saveCartToStorage();
    openCart(); // Refresh the cart display
}

// Checkout function
function checkout() {
    if (cart.length === 0) {
        alert('Votre panier est vide!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Simulate order processing
    alert(`Commande validée!\nTotal: ${total.toFixed(2)}€\n\nMerci pour votre achat!`);
    
    // Clear cart
    cart = [];
    updateCartDisplay();
    saveCartToStorage();
    closeCart();
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('aviationStoreCart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('aviationStoreCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
}

// Save sale data for admin dashboard
function saveSaleData(productId, productName, price) {
    const salesData = JSON.parse(localStorage.getItem('aviationStoreSales') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    salesData.push({
        id: Date.now(),
        productId: productId,
        productName: productName,
        price: price,
        date: today,
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('aviationStoreSales', JSON.stringify(salesData));
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
