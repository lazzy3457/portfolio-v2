<?php

require_once __DIR__ . '/../helpers/db.php';

function handle_languages(): void {
    $pdo  = get_pdo();
    $rows = $pdo->query('SELECT id, slug, label, color FROM language ORDER BY label')->fetchAll();
    send_cached_json($rows);
}
