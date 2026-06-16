<?php

require_once __DIR__ . '/helpers/db.php';
require_once __DIR__ . '/helpers/jwt.php';

function handle_auth_login(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $email    = trim($data['email']    ?? '');
    $password = trim($data['password'] ?? '');

    if (!$email || !$password) {
        http_response_code(422);
        echo json_encode(['error' => 'Email et mot de passe requis']);
        return;
    }

    $pdo  = get_pdo();
    $stmt = $pdo->prepare('SELECT id, email, password_hash FROM admin_user WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Identifiants incorrects']);
        return;
    }

    $token = jwt_encode(['sub' => $user['id'], 'email' => $user['email']]);
    echo json_encode(['token' => $token]);
}
