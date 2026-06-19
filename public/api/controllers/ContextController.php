<?php

require_once __DIR__ . '/../helpers/db.php';

function handle_contexts(): void {
    $pdo  = get_pdo();
    $rows = $pdo->query('SELECT id, slug, label FROM trace_context ORDER BY id')->fetchAll();
    send_cached_json($rows);
}
