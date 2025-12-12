<?php

    header('Access-Control-Allow-Origin: *'); 
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    $host = 'localhost';
    $dbname = 'portfolio';
    $user = 'root';
    $pass = '';
    $charset = 'utf8mb4'; // Encodage des caractères

    // Construction de la chaîne DSN (Data Source Name)
    $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

    // Options de connexion (facultatif mais recommandé)
    $options = [
        PDO::ATTR_ERRMODE               => PDO::ERRMODE_EXCEPTION, // Mode d'erreur : lève des exceptions
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,     // Mode de récupération par défaut : tableau associatif
        PDO::ATTR_EMULATE_PREPARES     => false,              // Désactive l'émulation des requêtes préparées pour plus de sécurité
    ];

    try {
        // Instanciation de la classe PDO
        $pdo = new PDO($dsn, $user, $pass, $options);
        // RETIRER : echo "Connexion à la base de données réussie !";

        /*
        * Ici, vous pouvez exécuter des requêtes SQL
        */

    } catch (\PDOException $e) {
        // Gestion de l'erreur - On utilise `die` qui va arrêter l'exécution et renvoyer le message d'erreur
        // Ceci est la seule sortie pour l'échec de connexion
        die("Échec de la connexion à la base de données: " . $e->getMessage()); 
    }


    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (isset($_GET['table'])) {
            $requete = 'SELECT * FROM ' . $_GET['table'];
            $stmt = $pdo->query($requete); 
            $results = $stmt->fetchAll();

            // 🌟 BOUCLE DE CORRECTION : Désérialisation du champ 'tags'
            $processedResults = array_map(function($row) {
                // Tente de décoder le JSON dans le champ 'tags'
                $tags_decoded = json_decode($row['tags'], true); 
                
                // Si le décodage réussit et qu'il y a des données
                if (json_last_error() === JSON_ERROR_NONE) {
                    $row['tags'] = $tags_decoded;
                }
                // Si le décodage échoue, on pourrait laisser la chaîne ou mettre un tableau vide
                // Pour l'instant, on laisse la valeur par défaut (la chaîne) en cas d'erreur.

                return $row;
            }, $results);
            // 🌟 FIN DE LA BOUCLE DE CORRECTION

            // Retourner les résultats traités au format JSON
            header('Content-Type: application/json');
            echo json_encode($processedResults); // Utilisation des résultats traités

        } else {
            // ... (gestion d'erreur)
        }
    }
?>
