<?php

require_once __DIR__ . '/../helpers/db.php';

function handle_project_types(): void {
    $pdo  = get_pdo();
    $rows = $pdo->query('SELECT id, slug, label, icon FROM project_type ORDER BY label')->fetchAll();
    send_cached_json($rows);
}
