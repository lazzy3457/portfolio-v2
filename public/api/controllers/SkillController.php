<?php

require_once __DIR__ . '/../helpers/db.php';

function handle_skills(): void {
    $pdo  = get_pdo();
    $rows = $pdo->query('SELECT id, slug, label, category FROM skill ORDER BY category, label')->fetchAll();
    send_cached_json($rows);
}
