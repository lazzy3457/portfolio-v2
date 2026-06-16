<?php
header('Content-Type: application/json');
apply_legacy_cors_headers();
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function apply_legacy_cors_headers(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $configured = $_ENV['CORS_ALLOWED_ORIGINS'] ?? getenv('CORS_ALLOWED_ORIGINS') ?: '';
    $allowed = $configured !== ''
        ? array_map('trim', explode(',', $configured))
        : [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'https://loic-merlhe.wstr.fr',
        ];

    header('Vary: Origin');
    if ($origin !== '' && in_array($origin, $allowed, true)) {
        header("Access-Control-Allow-Origin: $origin");
    }
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
    echo json_encode(["error" => "Connexion échouée"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['table'])) {
    $allowed_tables = ['trace'];
    $table = $_GET['table'];

    if (!in_array($table, $allowed_tables)) {
        echo json_encode([]);
        exit;
    }

    $requete = "SELECT * FROM `$table` WHERE 1=1";
    $params = [];

    // Recherche par mot-clé
    if (!empty($_GET['search'])) {
        $searchTerm = $_GET['search'];
        $requete .= ' AND (title LIKE :s1 OR description LIKE :s2 OR JSON_CONTAINS(tags, :s3))';
        $params['s1'] = '%' . $searchTerm . '%';
        $params['s2'] = '%' . $searchTerm . '%';
        $params['s3'] = json_encode($searchTerm);
    }

    // Filtrage par ID (Indispensable pour la page Trace.jsx)
    if (isset($_GET["id_trace"])) {
        $requete .= ' AND id = :id';
        $params['id'] = intval($_GET["id_trace"]);
    }

    try {
        $stmt = $pdo->prepare($requete); 
        $stmt->execute($params);
        $results = $stmt->fetchAll();

        foreach ($results as &$row) {
            $json_fields = ['tags', 'content', 'img_presentation'];
            foreach ($json_fields as $field) {
                if (isset($row[$field]) && is_string($row[$field])) {
                    // On décode le JSON pour envoyer un objet à React
                    $decoded = json_decode($row[$field], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $row[$field] = $decoded;
                    }
                }
            }
        }

        echo json_encode($results);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Erreur SQL", "message" => $e->getMessage()]);
    }
}
