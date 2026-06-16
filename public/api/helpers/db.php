<?php

function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $host    = $_ENV['DB_HOST']    ?? 'localhost';
    $dbname  = $_ENV['DB_NAME']    ?? 'portfolio';
    $user    = $_ENV['DB_USER']    ?? 'root';
    $pass    = $_ENV['DB_PASS']    ?? '';
    $charset = 'utf8mb4';

    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=$charset",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
    return $pdo;
}
