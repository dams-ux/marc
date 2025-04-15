<?php
$host = "localhost"; // Adresse du serveur MySQL
$username = "damien"; // Nom d'utilisateur MySQL
$password = "tedbon66"; // Mot de passe MySQL (vide par défaut pour XAMPP)
$database = "cours"; // Remplacez par le nom de votre base de données

// Connexion à MySQL
$conn = new mysqli($host, $username, $password, $database);

// Vérifier la connexion
if ($conn->connect_error) {
    die("Échec de la connexion : " . $conn->connect_error);
}
echo "Connexion réussie à la base de données MySQL.";
?>
