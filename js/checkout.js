// Checkout functionality
let stripe;
let elements;
let card;
let cart = [];
let paymentMethod = 'stripe';

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

// Configuration
const config = {
    stripe: {
        publishableKey: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY', // À remplacer par votre vraie clé
        secretKey: 'sk_test_YOUR_STRIPE_SECRET_KEY' // À garder secret côté serveur
    },
    paypal: {
        clientId: 'YOUR_PAYPAL_CLIENT_ID' // À remplacer par votre vraie clé
    },
    shipping: {
        standard: 5.99,
        express: 12.99,
        free_threshold: 50.00
    },
    tax_rate: 0.20 // TVA 20%
};

// Initialize checkout
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    initializeStripe();
    initializePayPal();
    setupEventListeners();
    updateOrderSummary();
});

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('maspalegryCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    } else {
        // Redirect to home if no cart
        window.location.href = 'index.html';
    }
}

// Initialize Stripe
function initializeStripe() {
    // Pour la démonstration, nous utilisons une clé de test publique
    // En production, remplacez par votre vraie clé Stripe
    stripe = Stripe(config.stripe.publishableKey);
    elements = stripe.elements();
    
    // Créer l'élément de carte
    const style = {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
    };
    
    card = elements.create('card', { style });
    card.mount('#card-element');
    
    // Gérer les erreurs en temps réel
    card.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });
}

// Initialize PayPal
function initializePayPal() {
    if (typeof paypal !== 'undefined') {
        paypal.Buttons({
            createOrder: function(data, actions) {
                const total = calculateTotal();
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: total.toFixed(2),
                            currency_code: 'EUR'
                        },
                        description: 'Commande Aviation Store'
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    processSuccessfulPayment('paypal', details);
                });
            },
            onError: function(err) {
                console.error('Erreur PayPal:', err);
                showError('Erreur lors du paiement PayPal. Veuillez réessayer.');
            }
        }).render('#paypal-button-container');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Payment method selection
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            selectPaymentMethod(this.dataset.method);
        });
    });
    
    // Form submission
    document.getElementById('checkout-form').addEventListener('submit', handleFormSubmit);
    
    // Country change for shipping calculation
    document.getElementById('country').addEventListener('change', updateOrderSummary);
}

// Select payment method
function selectPaymentMethod(method) {
    paymentMethod = method;
    
    // Update UI
    document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('active');
    });
    document.querySelector(`[data-method="${method}"]`).classList.add('active');
    
    // Show/hide payment forms
    document.getElementById('stripe-payment').style.display = method === 'stripe' ? 'block' : 'none';
    document.getElementById('paypal-payment').style.display = method === 'paypal' ? 'block' : 'none';
    
    // Update button text
    const buttonText = document.getElementById('button-text');
    switch(method) {
        case 'stripe':
            buttonText.innerHTML = '<i class="fas fa-lock"></i> Payer par carte';
            break;
        case 'paypal':
            buttonText.innerHTML = '<i class="fab fa-paypal"></i> Payer avec PayPal';
            break;
        case 'apple':
            buttonText.innerHTML = '<i class="fab fa-apple-pay"></i> Payer avec Apple Pay';
            break;
        case 'google':
            buttonText.innerHTML = '<i class="fab fa-google-pay"></i> Payer avec Google Pay';
            break;
    }
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const submitButton = document.getElementById('submit-button');
    const buttonText = document.getElementById('button-text');
    const loading = document.getElementById('loading');
    
    // Disable submit button and show loading
    submitButton.disabled = true;
    buttonText.style.display = 'none';
    loading.classList.add('show');
    
    try {
        // Validate form
        if (!validateForm()) {
            throw new Error('Veuillez remplir tous les champs obligatoires');
        }
        
        // Process payment based on method
        switch(paymentMethod) {
            case 'stripe':
                await processStripePayment();
                break;
            case 'paypal':
                // PayPal est géré par son propre bouton
                showError('Veuillez utiliser le bouton PayPal ci-dessus');
                break;
            case 'apple':
                await processApplePayment();
                break;
            case 'google':
                await processGooglePayment();
                break;
            default:
                throw new Error('Méthode de paiement non supportée');
        }
    } catch (error) {
        showError(error.message);
    } finally {
        // Re-enable submit button and hide loading
        submitButton.disabled = false;
        buttonText.style.display = 'flex';
        loading.classList.remove('show');
    }
}

// Process Stripe payment
async function processStripePayment() {
    const formData = getFormData();
    
    // Créer un Payment Intent côté serveur (simulation)
    const paymentIntent = await createPaymentIntent();
    
    const {error, paymentMethod} = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
            payment_method: {
                card: card,
                billing_details: {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                    address: {
                        line1: formData.address,
                        city: formData.city,
                        postal_code: formData.zipCode,
                        country: formData.country,
                    }
                }
            }
        }
    );
    
    if (error) {
        throw new Error(error.message);
    } else {
        processSuccessfulPayment('stripe', paymentMethod);
    }
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
    cart = [];
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
