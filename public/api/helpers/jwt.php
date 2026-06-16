<?php

define('JWT_TTL',    8 * 3600); // 8 heures

function jwt_encode(array $payload): string {
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['exp'] = time() + JWT_TTL;
    $body    = base64url_encode(json_encode($payload));
    $sig     = base64url_encode(hash_hmac('sha256', "$header.$body", jwt_secret(), true));
    return "$header.$body.$sig";
}

function jwt_decode(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $body, $sig] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "$header.$body", jwt_secret(), true));

    if (!hash_equals($expected, $sig)) return null;

    $payload = json_decode(base64url_decode($body), true);
    if (!$payload || (isset($payload['exp']) && $payload['exp'] < time())) return null;

    return $payload;
}

function jwt_secret(): string {
    static $secret = null;
    if ($secret !== null) return $secret;

    $secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?: '';
    if ($secret !== '') return $secret;

    $host = $_SERVER['HTTP_HOST'] ?? '';
    if (preg_match('/^(localhost|127\.0\.0\.1)(:\d+)?$/', $host)) {
        return $secret = 'dev_only_jwt_secret_change_me';
    }

    throw new RuntimeException('JWT_SECRET non configuré');
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function require_jwt(): array {
    $auth = $_SERVER['HTTP_AUTHORIZATION']
         ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
         ?? (function_exists('apache_request_headers') ? (apache_request_headers()['Authorization'] ?? '') : '')
         ?? '';
    if (!str_starts_with($auth, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['error' => 'Token manquant']);
        exit;
    }
    $payload = jwt_decode(substr($auth, 7));
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Token invalide ou expiré']);
        exit;
    }
    return $payload;
}
