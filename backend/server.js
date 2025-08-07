// Backend simple pour Aviation Store (Node.js + Express)
// Ce fichier montre comment implémenter les APIs de paiement côté serveur

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const config = {
    stripe: {
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    taxes: {
        rate: 0.20 // TVA 20%
    },
    shipping: {
        standard: 5.99,
        express: 12.99,
        free_threshold: 50.00
    }
};

// Routes API

// Créer un Payment Intent Stripe
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'eur', customer_details } = req.body;
        
        // Validation
        if (!amount || amount < 0.50) {
            return res.status(400).json({ 
                error: 'Montant minimum: 0.50€' 
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe utilise les centimes
            currency,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                order_id: generateOrderId(),
                customer_email: customer_details?.email || ''
            }
        });

        res.json({
            client_secret: paymentIntent.client_secret,
            order_id: paymentIntent.metadata.order_id
        });
    } catch (error) {
        console.error('Erreur Payment Intent:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la création du paiement' 
        });
    }
});

// Webhook Stripe pour confirmer les paiements
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
    } catch (err) {
        console.error('Erreur webhook signature:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gérer les événements
    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object;
            console.log('Paiement réussi:', paymentIntent.id);
            
            // Ici vous pouvez :
            // - Enregistrer la commande en base
            // - Envoyer un email de confirmation
            // - Déclencher l'expédition
            handleSuccessfulPayment(paymentIntent);
            break;
        }
            
        case 'payment_intent.payment_failed': {
            const failedPayment = event.data.object;
            console.log('Paiement échoué:', failedPayment.id);
            handleFailedPayment(failedPayment);
            break;
        }
            
        default:
            console.log(`Événement non géré: ${event.type}`);
    }

    res.json({received: true});
});

// Créer une commande
app.post('/api/orders', async (req, res) => {
    try {
        const { customer, items, payment_method } = req.body;
        
        // Validation des données
        if (!customer || !items || items.length === 0) {
            return res.status(400).json({ 
                error: 'Données de commande incomplètes' 
            });
        }
        
        // Calculer les totaux
        const subtotal = items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0);
        const shipping = calculateShipping(subtotal, customer.country);
        const tax = (subtotal + shipping) * config.taxes.rate;
        const total = subtotal + shipping + tax;
        
        // Créer la commande
        const order = {
            id: generateOrderId(),
            date: new Date().toISOString(),
            customer,
            items,
            subtotal,
            shipping,
            tax,
            total,
            payment_method,
            status: 'pending'
        };
        
        // Enregistrer en base (ici simulation avec un fichier)
        await saveOrder(order);
        
        res.json({ 
            success: true, 
            order 
        });
        
    } catch (error) {
        console.error('Erreur création commande:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la création de la commande' 
        });
    }
});

// Récupérer une commande
app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await getOrder(orderId);
        
        if (!order) {
            return res.status(404).json({ 
                error: 'Commande non trouvée' 
            });
        }
        
        res.json(order);
        
    } catch (error) {
        console.error('Erreur récupération commande:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération de la commande' 
        });
    }
});

// Envoyer email de confirmation
app.post('/api/send-confirmation-email', async (req, res) => {
    try {
        const { orderId, email } = req.body;
        
        // Récupérer la commande
        const order = await getOrder(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        
        // Envoyer l'email (ici simulation)
        const emailSent = await sendConfirmationEmail(order, email);
        
        if (emailSent) {
            res.json({ success: true, message: 'Email envoyé' });
        } else {
            res.status(500).json({ error: 'Erreur envoi email' });
        }
        
    } catch (error) {
        console.error('Erreur envoi email:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
    }
});

// Fonctions utilitaires

function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `AV${timestamp}${random}`.toUpperCase();
}

function calculateShipping(subtotal, country) {
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

async function handleSuccessfulPayment(paymentIntent) {
    // Mettre à jour le statut de la commande
    const orderId = paymentIntent.metadata.order_id;
    const order = await getOrder(orderId);
    
    if (order) {
        order.status = 'paid';
        order.payment_intent_id = paymentIntent.id;
        await saveOrder(order);
        
        // Envoyer email de confirmation
        await sendConfirmationEmail(order, order.customer.email);
        
        console.log(`Commande ${orderId} confirmée et email envoyé`);
    }
}

async function handleFailedPayment(paymentIntent) {
    const orderId = paymentIntent.metadata.order_id;
    console.log(`Paiement échoué pour la commande ${orderId}`);
    
    // Optionnel: envoyer un email d'information au client
}

// Simulation de base de données (remplacez par une vraie DB)
const fs = require('fs').promises;

async function saveOrder(order) {
    try {
        const filePath = './orders.json';
        let orders = [];
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            orders = JSON.parse(data);
        } catch (err) {
            // Fichier n'existe pas encore, créer un tableau vide
            console.log('Création d\'un nouveau fichier de commandes:', err.message);
            orders = [];
        }
        
        // Mettre à jour ou ajouter
        const index = orders.findIndex(o => o.id === order.id);
        if (index >= 0) {
            orders[index] = order;
        } else {
            orders.push(order);
        }
        
        await fs.writeFile(filePath, JSON.stringify(orders, null, 2));
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde commande:', error);
        return false;
    }
}

async function getOrder(orderId) {
    try {
        const data = await fs.readFile('./orders.json', 'utf8');
        const orders = JSON.parse(data);
        return orders.find(order => order.id === orderId);
    } catch (error) {
        console.error('Erreur récupération commande:', error);
        return null;
    }
}

async function sendConfirmationEmail(order, email) {
    // Ici vous intégreriez un service d'email comme SendGrid, Mailgun, etc.
    console.log(`📧 Email de confirmation envoyé à ${email} pour la commande ${order.id}`);
    
    // Simulation
    return new Promise(resolve => {
        setTimeout(() => resolve(true), 1000);
    });
}

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
    console.log(`📋 APIs disponibles:`);
    console.log(`   POST /api/create-payment-intent - Créer un Payment Intent`);
    console.log(`   POST /api/stripe-webhook - Webhook Stripe`);
    console.log(`   POST /api/orders - Créer une commande`);
    console.log(`   GET  /api/orders/:id - Récupérer une commande`);
    console.log(`   POST /api/send-confirmation-email - Envoyer email`);
});

module.exports = app;
