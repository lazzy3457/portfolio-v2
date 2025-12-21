<?php
// 1. Toujours définir le Content-Type JSON dès le début pour éviter le texte brut
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Gestion du mode OPTIONS (Preflight request de certains navigateurs)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = 'localhost';
$dbname = 'portfolio';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Database connection failed",
        "details" => $e->getMessage()
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['table'])) {
        
        // --- SÉCURITÉ : Liste blanche des tables ---
        // Empêche un utilisateur d'accéder à des tables sensibles via l'URL
        $allowed_tables = ['trace', 'users', 'projects']; // Ajoutez vos tables ici
        $table = $_GET['table'];

        if (!in_array($table, $allowed_tables)) {
            http_response_code(400);
            echo json_encode(["error" => "Table non autorisée"]);
            exit;
        }

        // Construction de la requête avec des placeholders pour la sécurité
        $requete = "SELECT * FROM `$table` WHERE 1=1";
        $params = [];

        if (isset($_GET["id_trace"])) {
            $requete .= ' AND id = :id';
            $params['id'] = intval($_GET["id_trace"]);
        }

        if (isset($_GET['limit'])) {
            $requete .= ' LIMIT ' . intval($_GET['limit']);
        }

        try {
            $stmt = $pdo->prepare($requete); 
            $stmt->execute($params);
            $results = $stmt->fetchAll();

            $formatted_results = [];

            // Traitement spécifique pour la table 'trace' (décodage JSON)
            if ($table === "trace") {
                foreach ($results as $row) {
                    $json_fields = ['content', 'img_presentation', 'tags'];
                    foreach ($json_fields as $field) {
                        if (isset($row[$field]) && is_string($row[$field])) {
                            $decoded = json_decode($row[$field], true);
                            // On ne remplace que si le JSON est valide
                            if (json_last_error() === JSON_ERROR_NONE) {
                                $row[$field] = $decoded;
                            }
                        }
                    }
                    $formatted_results[] = $row;
                }
            } else {
                $formatted_results = $results;
            }

            echo json_encode($formatted_results);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Erreur de requête", "message" => $e->getMessage()]);
        }

    } else {
        http_response_code(400);
        echo json_encode(["error" => "Le paramètre 'table' est requis"]);
    }
}
?>