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

    } // Au lieu de : die("Message d'erreur");
    catch (\PDOException $e) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            "error" => "Database connection failed",
            "details" => $e->getMessage()
        ]);
        exit;
    }


    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (isset($_GET['table'])) {
            $requete = 'SELECT * FROM ' . $_GET['table'];
            if (isset($_GET["id_trace"])) {
                $id_trace = intval($_GET["id_trace"]); // Cast en entier pour éviter les injections SQL
                $requete .= ' WHERE id = ' . $id_trace;
            }
            if (isset($_GET['limit'])) {
                $limit = (int)$_GET['limit']; // Cast en entier pour éviter les injections SQL
                $requete .= ' LIMIT ' . $limit;
            }
            $stmt = $pdo->prepare($requete); 
            $stmt->execute([]);
            $results = $stmt->fetchAll();

            $formatted_results = [];

            if ($_GET['table'] == "trace") {
                
                // 3. Parcourir les résultats et décoder les chaînes JSON
                foreach ($results as $row) {
                    // Convertir la chaîne JSON 'content' en un tableau/objet PHP natif
                    if (isset($row['content']) && is_string($row['content'])) {
                        $row['content'] = json_decode($row['content'], true); // 'true' pour tableau associatif
                    }
    
                    // Convertir la chaîne JSON 'img_presentation' en un tableau/objet PHP natif
                    if (isset($row['img_presentation']) && is_string($row['img_presentation'])) {
                        $row['img_presentation'] = json_decode($row['img_presentation'], true);
                    }
                    
                    // Convertir la chaîne JSON 'tags' en un tableau/objet PHP natif
                    if (isset($row['tags']) && is_string($row['tags'])) {
                        $row['tags'] = json_decode($row['tags'], true);
                    }
                    $formatted_results[] = $row;
                }
            }
            else {
                $formatted_results = $results;
            }

                


            // Retourner les résultats traités au format JSON
            header('Content-Type: application/json');
            echo json_encode($formatted_results); // Utilisation des résultats traités

        } else {
            // ... (gestion d'erreur)
        }
    }
?>
