# 📦 Guide de Gestion des Produits - Aviation Store

## 🛠️ Interface d'Administration des Produits

### Accès à la Gestion des Produits

1. **Connectez-vous à l'admin** :
   - Tapez `admin` sur la page principale, OU
   - Allez sur `/login.html` (admin / aviation2024), OU  
   - Accès direct `/admin.html` (redirection auto vers login)

2. **Section "Gestion des Produits"** :
   - Visible dans le dashboard admin
   - Liste tous les produits actuels
   - Bouton "Ajouter un produit" en haut à droite

## ➕ Ajouter un Nouveau Produit

### Informations Requises :
- **Nom du produit** * (obligatoire)
- **Prix** * (en euros, obligatoire)
- **Catégorie** * (T-shirts ou Accessoires, obligatoire)
- **Icône Font Awesome** (optionnel)
- **Description** (optionnel)

### Exemples d'Icônes Font Awesome :
```
T-shirts: fas fa-tshirt
Casquettes: fas fa-user-pilot
Accessoires: fas fa-compass, fas fa-key, fas fa-medal
Général: fas fa-box, fas fa-star, fas fa-heart
```

### Processus d'Ajout :
1. Cliquez sur "Ajouter un produit"
2. Remplissez le formulaire
3. Cliquez "Enregistrer"
4. Le produit apparaît immédiatement dans la boutique

## ✏️ Modifier un Produit Existant

### Étapes :
1. Dans la liste des produits admin, cliquez sur l'icône "crayon" (🖊️)
2. Le formulaire se pré-remplit avec les données actuelles
3. Modifiez les champs souhaités
4. Cliquez "Enregistrer"

### Effets de la Modification :
- ✅ Mise à jour immédiate sur le site public
- ✅ Conservation des données de vente existantes
- ✅ Mise à jour des statistiques si le prix change

## 🗑️ Supprimer un Produit

### Processus de Suppression :
1. Cliquez sur l'icône "poubelle" (🗑️) du produit
2. Confirmation demandée
3. Suppression définitive après confirmation

### ⚠️ Attention :
- La suppression est **irréversible**
- Les données de vente historiques restent conservées
- Le produit disparaît immédiatement du site public

## 🔄 Synchronisation Automatique

### Mise à Jour en Temps Réel :
- **Site Public** ↔️ **Admin** : Synchronisation automatique
- **localStorage** : Sauvegarde locale des modifications
- **Pas de rechargement** nécessaire de la page

### Données Synchronisées :
- Nom et prix des produits
- Catégories et icônes
- Descriptions produits
- Statistiques de vente

## 📊 Impact sur les Statistiques

### Après Modification de Produit :
- ✅ Graphiques mis à jour automatiquement
- ✅ Statistiques recalculées
- ✅ Tableau des ventes conservé
- ✅ Chiffre d'affaires actualisé

### Après Suppression de Produit :
- ❌ Produit retiré des futures ventes
- ✅ Historique des ventes conservé
- ⚠️ Graphiques ajustés pour les nouveaux produits uniquement

## 🛍️ Structure des Produits

### Format de Stockage (localStorage) :
```javascript
{
  "1": {
    "name": "T-shirt Pilot Wings",
    "price": 25.99,
    "category": "tshirts",
    "icon": "fas fa-tshirt",
    "description": "Description optionnelle"
  }
}
```

### Catégories Disponibles :
- **`tshirts`** → Affiché comme "T-shirts"
- **`accessories`** → Affiché comme "Accessoires"

## 🔧 Fonctionnalités Avancées

### Gestion des ID Produits :
- **Auto-incrémentation** : Nouveau produit = ID suivant
- **Réutilisation** : Les ID supprimés ne sont pas réutilisés
- **Cohérence** : Liaison automatique avec les ventes

### Validation des Données :
- **Prix** : Nombres positifs uniquement
- **Nom** : Texte requis
- **Icônes** : Format Font Awesome validé
- **Catégorie** : Liste fermée (tshirts/accessories)

## 🚀 Conseils d'Utilisation

### Bonnes Pratiques :
1. **Testez** les nouvelles icônes avant validation
2. **Descriptions courtes** pour un affichage optimal  
3. **Prix cohérents** pour maintenir l'expérience utilisateur
4. **Sauvegarde régulière** via export CSV

### Icônes Recommandées par Catégorie :

**T-shirts :**
- `fas fa-tshirt` (classique)
- `fas fa-user-tie` (business)
- `fas fa-heart` (passion)

**Accessoires :**
- `fas fa-compass` (navigation)
- `fas fa-key` (porte-clés)
- `fas fa-medal` (badges)
- `fas fa-user-pilot` (casquettes)
- `fas fa-clock` (montres)
- `fas fa-gem` (bijoux)

## 🔒 Sécurité et Permissions

### Accès Restreint :
- ❌ **Utilisateurs publics** : Aucun accès
- ✅ **Admins connectés** : Accès complet
- 🔐 **Session required** : Authentification obligatoire

### Données Protégées :
- Modification impossible sans authentification
- Session expirée = redirection automatique
- Confirmation requise pour suppressions

---

**🎯 Objectif** : Permettre une gestion flexible et sécurisée du catalogue produits en temps réel, sans interruption de service pour les clients.

**📞 Support** : En cas de problème, consultez les logs du navigateur (F12) ou contactez le développeur.
