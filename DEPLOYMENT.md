# Aviation Store - Guide de Déploiement

## 🚀 Déploiement sur GitHub Pages

### Étapes pour déployer sur GitHub Pages :

1. **Push vers GitHub** :
   ```bash
   git add .
   git commit -m "Initial commit - Aviation Store"
   git push origin main
   ```

2. **Activer GitHub Pages** :
   - Allez dans Settings > Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)

3. **URLs d'accès** :
   - Site principal : `https://dams-ux.github.io/marc/`
   - Page admin (cachée) : `https://dams-ux.github.io/marc/admin.html`
   - Login admin : `https://dams-ux.github.io/marc/login.html`

## 🔐 Accès Administrateur

### Méthode 1 : Code secret sur la page principale
- Tapez `admin` sur la page d'accueil
- Redirection automatique vers le dashboard

### Méthode 2 : Page de login dédiée
- URL directe : `/login.html`
- Identifiants par défaut :
  - **Utilisateur** : `admin`
  - **Mot de passe** : `aviation2024`

### Méthode 3 : URL directe (pour développement)
- Accès direct à `/admin.html`
- Redirection automatique vers login si non connecté

## 🛠️ Configuration de Production

### Changer les identifiants admin :
1. Ouvrir `login.html`
2. Modifier les lignes 95-98 :
   ```javascript
   const adminCredentials = {
       username: 'VOTRE_NOUVEAU_USERNAME',
       password: 'VOTRE_NOUVEAU_MOT_DE_PASSE'
   };
   ```

### Changer le code secret :
1. Ouvrir `script.js`
2. Modifier la ligne 210 :
   ```javascript
   const secretCode = ['v', 'o', 't', 'r', 'e', 'c', 'o', 'd', 'e'];
   ```

## 📁 Structure pour le déploiement

```
marc/
├── index.html          # Page principale (publique)
├── admin.html          # Dashboard admin (protégé)
├── login.html          # Page de connexion admin
├── style.css           # Styles principaux
├── admin-style.css     # Styles admin
├── script.js           # JavaScript principal
├── admin-script.js     # JavaScript admin
├── package.json        # Configuration npm
└── README.md          # Documentation
```

## 🌐 URLs de production recommandées

### Structure recommandée :
- `https://votre-domaine.com/` → Site principal
- `https://votre-domaine.com/admin-login` → Rename login.html
- `https://votre-domaine.com/dashboard` → Rename admin.html

### Renommage pour la sécurité :
```bash
# Renommer les fichiers pour plus de sécurité
mv login.html admin-login.html
mv admin.html dashboard.html

# Mettre à jour les références dans les fichiers
# login.html ligne 108 : window.location.href = 'dashboard.html';
# admin-script.js ligne 15 : window.location.href = 'admin-login.html';
# script.js ligne 231 : window.location.href = 'dashboard.html';
```

## 🔒 Sécurité supplémentaire

### Pour une sécurité renforcée :
1. **Masquer les fichiers admin** dans `.htaccess` (serveur Apache)
2. **Utiliser HTTPS** obligatoirement
3. **Ajouter une authentification 2FA** 
4. **Logs d'accès** côté serveur
5. **Rate limiting** sur les tentatives de connexion

## 📊 Monitoring

### Analytics recommandés :
- Google Analytics pour le trafic public
- Monitoring spécialisé pour l'admin
- Alertes en cas d'accès admin suspect

---

**Note** : En production, remplacez localStorage par une vraie base de données et implémentez une authentification serveur sécurisée.
