<?php

header('Content-Type: application/json; charset=utf-8');
apply_cors_headers();
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Résoudre le chemin depuis REQUEST_URI (enlève le préfixe /api/)
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = preg_replace('#^.*?/api#', '', $uri); // → /traces, /languages, etc.
$uri = rtrim($uri, '/') ?: '/';

try {
    route($uri);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur base de données']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// ----------------------------------------------------------------
// Routeur
// ----------------------------------------------------------------
function apply_cors_headers(): void {
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

function route(string $uri): void {
    $method = $_SERVER['REQUEST_METHOD'];

    // GET /traces  ou  GET /traces?id=X
    if ($uri === '/traces' && $method === 'GET') {
        require_once __DIR__ . '/controllers/TraceController.php';
        handle_traces();
        return;
    }

    // GET /languages
    if ($uri === '/languages' && $method === 'GET') {
        require_once __DIR__ . '/controllers/LanguageController.php';
        handle_languages();
        return;
    }

    // GET /skills
    if ($uri === '/skills' && $method === 'GET') {
        require_once __DIR__ . '/controllers/SkillController.php';
        handle_skills();
        return;
    }

    // GET /project-types
    if ($uri === '/project-types' && $method === 'GET') {
        require_once __DIR__ . '/controllers/ProjectTypeController.php';
        handle_project_types();
        return;
    }

    // GET /contexts
    if ($uri === '/contexts' && $method === 'GET') {
        require_once __DIR__ . '/controllers/ContextController.php';
        handle_contexts();
        return;
    }

    // POST /auth/login
    if ($uri === '/auth/login' && $method === 'POST') {
        require_once __DIR__ . '/auth.php';
        handle_auth_login();
        return;
    }

    // /admin/traces  (POST, PUT, DELETE — protégé JWT)
    if ($uri === '/admin/traces') {
        require_once __DIR__ . '/controllers/AdminController.php';
        handle_admin_traces();
        return;
    }

    // POST /admin/traces/{id}/upload  (upload d'image — protégé JWT)
    if (preg_match('#^/admin/traces/(\d+)/upload$#', $uri, $m) && $method === 'POST') {
        require_once __DIR__ . '/controllers/AdminController.php';
        handle_admin_upload((int) $m[1]);
        return;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Route introuvable', 'uri' => $uri]);
}
