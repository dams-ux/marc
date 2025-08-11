// Checkout functionality
let checkoutCart = [];
let selectedPaymentMethod = null;

// Initialize checkout page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize user session for checkout
    getUserSession();
    
    // Load cart from current user session
    checkoutCart = getUserCart();
    
    if (checkoutCart.length === 0) {
        // Redirect to products if cart is empty
        window.location.href = 'index.html#products';
        return;
    }
    
    // Display order summary
    displayOrderSummary();
    
    // Setup form validation
    setupFormValidation();
    
    // Update cart count in header
    updateCartDisplay();
});

// Display order summary
function displayOrderSummary() {
    const orderItems = document.getElementById('order-items');
    const orderTotal = document.getElementById('order-total');
    
    orderItems.innerHTML = '';
    let total = 0;
    
    checkoutCart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        itemElement.innerHTML = `
            <div>
                <strong>${item.name}</strong><br>
                <span style="color: #666;">Quantité: ${item.quantity}</span>
            </div>
            <div>
                <strong>${(item.price * item.quantity).toFixed(2)}€</strong>
            </div>
        `;
        orderItems.appendChild(itemElement);
        total += item.price * item.quantity;
    });
    
    orderTotal.textContent = `Total : ${total.toFixed(2)}€`;
}

// Select payment method
function selectPaymentMethod(method) {
    // Remove selected class from all methods
    const methods = document.querySelectorAll('.payment-method');
    methods.forEach(m => m.classList.remove('selected'));
    
    // Add selected class to clicked method
    const selectedMethod = document.querySelector(`[data-method="${method}"]`);
    if (selectedMethod) {
        selectedMethod.classList.add('selected');
    }
    
    // Set the selected method
    selectedPaymentMethod = method;
    document.getElementById('paymentMethod').value = method;
    
    console.log('Payment method selected:', method);
}

// Setup form validation
function setupFormValidation() {
    const form = document.getElementById('checkout-form');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            processOrder();
        }
    });
}

// Validate form
function validateForm() {
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'postalCode', 'country'];
    let isValid = true;
    
    // Check required fields
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!field.value.trim()) {
            field.style.borderColor = '#e74c3c';
            isValid = false;
        } else {
            field.style.borderColor = '#ddd';
        }
    });
    
    // Check payment method
    if (!selectedPaymentMethod) {
        showNotification('Veuillez sélectionner un mode de paiement', 'error');
        isValid = false;
    }
    
    // Email validation
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        document.getElementById('email').style.borderColor = '#e74c3c';
        showNotification('Format d\'email invalide', 'error');
        isValid = false;
    }
    
    if (!isValid) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
    }
    
    return isValid;
}

// Process order
async function processOrder() {
    const submitBtn = document.getElementById('submit-btn');
    const form = document.getElementById('checkout-form');
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
    
    try {
        // Collect form data
        const formData = new FormData(form);
        const orderData = {
            orderNumber: generateOrderNumber(),
            userId: currentUserId,
            timestamp: new Date().toISOString(),
            customer: {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: {
                    street: formData.get('address'),
                    city: formData.get('city'),
                    postalCode: formData.get('postalCode'),
                    country: formData.get('country')
                }
            },
            items: checkoutCart,
            total: checkoutCart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            paymentMethod: selectedPaymentMethod,
            comments: formData.get('comments'),
            status: 'pending' // Status initial : en attente de paiement
        };
        
        console.log('Order data prepared:', orderData);
        
        // Simulate payment processing
        const paymentResult = await processPayment(orderData);
        
        if (paymentResult.success) {
            // Payment successful - now save the sale and complete order
            orderData.status = 'completed';
            orderData.paymentId = paymentResult.paymentId;
            orderData.paidAt = new Date().toISOString();
            
            // Save order
            saveOrder(orderData);
            
            // Save sales data (only after successful payment)
            saveSalesAfterPayment(orderData);
            
            // Clear user cart
            clearUserCart();
            
            // Redirect to success page
            sessionStorage.setItem('lastOrder', JSON.stringify(orderData));
            window.location.href = 'order-success.html';
        } else {
            throw new Error(paymentResult.message || 'Erreur de paiement');
        }
        
    } catch (error) {
        console.error('Order processing error:', error);
        showNotification('Erreur lors du traitement de la commande: ' + error.message, 'error');
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-lock"></i> Passer la commande';
    }
}

// Generate unique order number
function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    return `MP${year}${month}${day}${random}`;
}

// Process payment (mock implementation with different payment providers)
async function processPayment(orderData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate API call delay
            const isSuccess = Math.random() > 0.1; // 90% success rate for demo
            
            if (isSuccess) {
                resolve({
                    success: true,
                    paymentId: 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    transactionId: 'txn_' + Date.now(),
                    message: 'Paiement accepté'
                });
            } else {
                resolve({
                    success: false,
                    message: 'Paiement refusé - Veuillez vérifier vos informations'
                });
            }
        }, 2000); // 2 second delay to simulate processing
    });
}

// Save order to localStorage
function saveOrder(orderData) {
    const orders = JSON.parse(localStorage.getItem('maspalegryOrders') || '[]');
    orders.push(orderData);
    localStorage.setItem('maspalegryOrders', JSON.stringify(orders));
    console.log('Order saved:', orderData.orderNumber);
}

// Save sales data after successful payment
function saveSalesAfterPayment(orderData) {
    const salesData = JSON.parse(localStorage.getItem('maspalegrySales') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    // Add each item as a separate sale record
    orderData.items.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
            salesData.push({
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                orderNumber: orderData.orderNumber,
                productId: item.id,
                productName: item.name,
                price: item.price,
                date: today,
                timestamp: orderData.paidAt, // Use payment timestamp
                userId: orderData.userId,
                customerEmail: orderData.customer.email,
                paymentMethod: orderData.paymentMethod,
                status: 'completed' // Only completed sales are recorded
            });
        }
    });
    
    localStorage.setItem('maspalegrySales', JSON.stringify(salesData));
    console.log('Sales data saved after payment completion');
}

// Clear user cart after successful order
function clearUserCart() {
    checkoutCart = [];
    // Clear global cart variable if it exists
    if (typeof window.cart !== 'undefined') {
        window.cart = [];
    }
    saveUserCart(); // Save empty cart
    updateCartDisplay(); // Update display
}

// Update cart display for header
function updateCartDisplay() {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = checkoutCart.reduce((total, item) => total + item.quantity, 0);
    }
}

// Notification system (reuse from main.js but ensure it's available)
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
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
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Create Payment Intent (simulation - en production, ceci doit être fait côté serveur)
async function createPaymentIntent() {
    const total = calculateTotal();
    
    // En production, vous feriez un appel à votre serveur
    // qui créerait le Payment Intent avec l'API Stripe
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                client_secret: 'pi_test_' + Math.random().toString(36).substr(2, 9) + '_secret_test',
                amount: Math.round(total * 100), // Stripe utilise les centimes
                currency: 'eur'
            });
        }, 1000);
    });
}

// Process Apple Pay
async function processApplePayment() {
    if (window.ApplePaySession?.canMakePayments?.()) {
        const session = new ApplePaySession(3, {
            countryCode: 'FR',
            currencyCode: 'EUR',
            supportedNetworks: ['visa', 'masterCard', 'amex'],
            merchantCapabilities: ['supports3DS'],
            total: {
                label: 'Aviation Store',
                amount: calculateTotal().toFixed(2)
            }
        });
        
        session.begin();
        // Implémentation complète d'Apple Pay...
    } else {
        throw new Error('Apple Pay n\'est pas disponible sur cet appareil');
    }
}

// Process Google Pay
async function processGooglePayment() {
    if (window.google?.payments) {
        // Implémentation Google Pay...
        throw new Error('Google Pay sera bientôt disponible');
    } else {
        throw new Error('Google Pay n\'est pas disponible');
    }
}

// Process successful payment
function processSuccessfulPayment(method, paymentData) {
    const orderData = {
        id: generateOrderId(),
        date: new Date().toISOString(),
        customer: getFormData(),
        items: cart,
        subtotal: calculateSubtotal(),
        shipping: calculateShipping(),
        tax: calculateTax(),
        total: calculateTotal(),
        paymentMethod: method,
        paymentData: paymentData,
        status: 'confirmed'
    };
    
    // Sauvegarder la commande
    saveOrder(orderData);
    
    // Vider le panier
    clearCart();
    
    // Rediriger vers la page de confirmation
    localStorage.setItem('lastOrder', JSON.stringify(orderData));
    window.location.href = 'order-confirmation.html';
}

// Generate order ID
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `AV${timestamp}${random}`.toUpperCase();
}

// Save order to localStorage (en production, envoyez au serveur)
function saveOrder(orderData) {
    let orders = JSON.parse(localStorage.getItem('maspalegryOrders') || '[]');
    orders.push(orderData);
    localStorage.setItem('maspalegryOrders', JSON.stringify(orders));
    
    // Également sauvegarder pour les analytics admin
    let salesData = JSON.parse(localStorage.getItem('maspalegrySales') || '[]');
    orderData.items.forEach(item => {
        salesData.push({
            date: new Date().toISOString().split('T')[0],
            productName: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
        });
    });
    localStorage.setItem('maspalegrySales', JSON.stringify(salesData));
}

// Clear cart
function clearCart() {
    if (typeof window.cart !== 'undefined') {
        window.cart = [];
    }
    localStorage.removeItem('maspalegryCart');
}

// Validate form
function validateForm() {
    const requiredFields = [
        'firstName', 'lastName', 'email', 'phone', 
        'address', 'city', 'zipCode', 'country'
    ];
    
    for (let field of requiredFields) {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            element.focus();
            return false;
        }
    }
    
    // Validate email
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById('email').focus();
        return false;
    }
    
    return true;
}

// Get form data
function getFormData() {
    return {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        zipCode: document.getElementById('zipCode').value,
        country: document.getElementById('country').value
    };
}

// Update order summary
function updateOrderSummary() {
    const itemsContainer = document.getElementById('order-items');
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    const tax = calculateTax();
    const total = calculateTotal();
    
    // Update items
    itemsContainer.innerHTML = cart.map(item => `
        <div class="order-item">
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>Quantité: ${item.quantity}</p>
            </div>
            <div class="item-price">${(item.price * item.quantity).toFixed(2)}€</div>
        </div>
    `).join('');
    
    // Update totals
    document.getElementById('subtotal').textContent = subtotal.toFixed(2) + '€';
    document.getElementById('shipping').textContent = shipping.toFixed(2) + '€';
    document.getElementById('tax').textContent = tax.toFixed(2) + '€';
    document.getElementById('total').textContent = total.toFixed(2) + '€';
}

// Calculate subtotal
function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Calculate shipping
function calculateShipping() {
    const subtotal = calculateSubtotal();
    const country = document.getElementById('country').value;
    
    // Livraison gratuite au-delà de 50€ en France
    if (country === 'FR' && subtotal >= config.shipping.free_threshold) {
        return 0;
    }
    
    // Tarifs selon le pays
    switch(country) {
        case 'FR':
            return config.shipping.standard;
        case 'BE':
        case 'CH':
            return 8.99;
        case 'CA':
        case 'US':
            return 15.99;
        default:
            return config.shipping.standard;
    }
}

// Calculate tax
function calculateTax() {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    return (subtotal + shipping) * config.tax_rate;
}

// Calculate total
function calculateTotal() {
    return calculateSubtotal() + calculateShipping() + calculateTax();
}

// Show error message
function showError(message) {
    showNotification('Erreur: ' + message, 'error');
    // En production, utilisez une notification plus élégante
}

// Simuler des APIs de paiement en mode démo
const DEMO_MODE = true;

if (DEMO_MODE) {
    // Mode démonstration - logs uniquement en développement
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🚀 Mode démonstration activé');
        console.log('💳 APIs de paiement simulées');
        console.log('🔧 Configuration requise pour la production:');
        console.log('   - Clés Stripe: https://dashboard.stripe.com/apikeys');
        console.log('   - Client ID PayPal: https://developer.paypal.com/');
        console.log('   - Serveur backend pour gérer les paiements sécurisés');
    }
}

// Instructions pour la mise en production
const PRODUCTION_SETUP = {
    stripe: {
        steps: [
            '1. Créer un compte Stripe: https://dashboard.stripe.com/',
            '2. Obtenir les clés API (publishable et secret)',
            '3. Configurer les webhooks pour les confirmations',
            '4. Implémenter côté serveur pour créer les Payment Intents',
            '5. Remplacer les clés de test par les clés de production'
        ],
        fees: '1.4% + 0.25€ par transaction en Europe'
    },
    paypal: {
        steps: [
            '1. Créer un compte PayPal Business',
            '2. Créer une app sur https://developer.paypal.com/',
            '3. Obtenir le Client ID et Secret',
            '4. Configurer les webhooks',
            '5. Passer en mode live'
        ],
        fees: '2.9% + 0.35€ par transaction'
    },
    security: [
        'HTTPS obligatoire pour les paiements',
        'Validation côté serveur',
        'Stockage sécurisé des données clients',
        'Conformité PCI DSS',
        'Gestion des erreurs et des remboursements'
    ]
};

// Log de production uniquement en développement
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('📋 Guide de mise en production:', PRODUCTION_SETUP);
}
