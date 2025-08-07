// Service de gestion d'images et base de données NoSQL
class ImageService {
    constructor() {
        this.apiUrl = 'https://api.jsonbin.io/v3'; // API NoSQL gratuite
        this.apiKey = '$2a$10$9vKvO8jGlOIeX9RZfNbcAOqZ8jYcXx6rAoEzMjQm7wN3pR4qT5bL8'; // Clé d'exemple
        this.binId = null; // ID du bin pour stocker les données
        this.localStorageKey = 'maspalegryProductImages';
        this.maxFileSize = 5 * 1024 * 1536; // 5MB max par image
    }

    // Initialiser le service
    async initialize() {
        try {
            // Essayer de charger depuis l'API
            await this.loadFromAPI();
        } catch (error) {
            console.log('Utilisation du localStorage en mode local:', error.message);
            this.loadFromLocalStorage();
        }
    }

    // Convertir un fichier en base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            if (file.size > this.maxFileSize) {
                reject(new Error('Fichier trop volumineux (max 5MB)'));
                return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
            reader.readAsDataURL(file);
        });
    }

    // Redimensionner une image
    resizeImage(base64, maxWidth = 800, maxHeight = 600, quality = 0.8) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Calculer les nouvelles dimensions
                let { width, height } = img;
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                // Dessiner l'image redimensionnée
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir en base64 avec compression
                const resizedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(resizedBase64);
            };
            img.src = base64;
        });
    }

    // Sauvegarder une image pour un produit
    async saveProductImage(productId, imageFile, type = 'front') {
        try {
            // Convertir en base64
            const base64 = await this.fileToBase64(imageFile);
            
            // Redimensionner l'image
            const resizedBase64 = await this.resizeImage(base64);
            
            // Obtenir les données actuelles
            const imageData = this.getImageData();
            
            // Créer la structure si elle n'existe pas
            if (!imageData[productId]) {
                imageData[productId] = {};
            }
            
            // Sauvegarder l'image
            imageData[productId][type] = {
                data: resizedBase64,
                filename: imageFile.name,
                size: imageFile.size,
                lastModified: Date.now(),
                type: imageFile.type
            };
            
            // Sauvegarder les données
            await this.saveImageData(imageData);
            
            return resizedBase64;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'image:', error);
            throw error;
        }
    }

    // Obtenir l'image d'un produit
    getProductImage(productId, type = 'front') {
        const imageData = this.getImageData();
        return imageData[productId]?.[type]?.data || null;
    }

    // Obtenir toutes les images d'un produit
    getProductImages(productId) {
        const imageData = this.getImageData();
        return imageData[productId] || {};
    }

    // Supprimer les images d'un produit
    async deleteProductImages(productId) {
        const imageData = this.getImageData();
        delete imageData[productId];
        await this.saveImageData(imageData);
    }

    // Obtenir les données d'images depuis localStorage
    getImageData() {
        try {
            return JSON.parse(localStorage.getItem(this.localStorageKey)) || {};
        } catch (error) {
            console.error('Erreur lors du chargement des images:', error);
            return {};
        }
    }

    // Sauvegarder les données d'images
    async saveImageData(data) {
        try {
            // Sauvegarder localement
            localStorage.setItem(this.localStorageKey, JSON.stringify(data));
            
            // Essayer de sauvegarder sur l'API
            await this.saveToAPI(data);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            // La sauvegarde locale a réussi, continuer
        }
    }

    // Charger depuis l'API NoSQL
    async loadFromAPI() {
        if (!this.binId) return;
        
        const response = await fetch(`${this.apiUrl}/b/${this.binId}/latest`, {
            headers: {
                'X-Master-Key': this.apiKey
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            localStorage.setItem(this.localStorageKey, JSON.stringify(result.record));
        }
    }

    // Sauvegarder sur l'API NoSQL
    async saveToAPI(data) {
        if (!this.binId) {
            // Créer un nouveau bin
            const response = await fetch(`${this.apiUrl}/b`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                this.binId = result.metadata.id;
                localStorage.setItem('maspalegryBinId', this.binId);
            }
        } else {
            // Mettre à jour le bin existant
            await fetch(`${this.apiUrl}/b/${this.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey
                },
                body: JSON.stringify(data)
            });
        }
    }

    // Charger depuis localStorage
    loadFromLocalStorage() {
        this.binId = localStorage.getItem('maspalegryBinId');
    }

    // Obtenir la taille totale des données
    getStorageSize() {
        const data = this.getImageData();
        const jsonString = JSON.stringify(data);
        return new Blob([jsonString]).size;
    }

    // Nettoyer les anciennes images
    async cleanupOldImages(daysOld = 30) {
        const imageData = this.getImageData();
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        let cleaned = false;

        Object.keys(imageData).forEach(productId => {
            Object.keys(imageData[productId]).forEach(type => {
                if (imageData[productId][type].lastModified < cutoffTime) {
                    delete imageData[productId][type];
                    cleaned = true;
                }
            });
            
            // Supprimer le produit s'il n'a plus d'images
            if (Object.keys(imageData[productId]).length === 0) {
                delete imageData[productId];
            }
        });

        if (cleaned) {
            await this.saveImageData(imageData);
        }

        return cleaned;
    }
}

// Instance globale du service d'images
const imageService = new ImageService();

// Initialiser le service au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    imageService.initialize();
});
