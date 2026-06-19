<?php

require_once __DIR__ . '/../helpers/db.php';
require_once __DIR__ . '/../helpers/jwt.php';

// ----------------------------------------------------------------
// Entry points (appelés depuis index.php)
// ----------------------------------------------------------------

function handle_admin_languages(): void {
    require_jwt();
    $pdo    = get_pdo();
    $method = $_SERVER['REQUEST_METHOD'];
    $id     = isset($_GET['id']) ? intval($_GET['id']) : null;

    if ($method === 'POST'   && !$id) { create_language($pdo);                                                         return; }
    if ($method === 'PUT'    && $id)  { update_language($pdo, $id);                                                    return; }
    if ($method === 'DELETE' && $id)  { delete_ref($pdo, 'language', $id, 'trace_language', 'language_id');            return; }
    bad_method();
}

function handle_admin_skills(): void {
    require_jwt();
    $pdo    = get_pdo();
    $method = $_SERVER['REQUEST_METHOD'];
    $id     = isset($_GET['id']) ? intval($_GET['id']) : null;

    if ($method === 'POST'   && !$id) { create_skill($pdo);                                                            return; }
    if ($method === 'PUT'    && $id)  { update_skill($pdo, $id);                                                       return; }
    if ($method === 'DELETE' && $id)  { delete_ref($pdo, 'skill', $id, 'trace_skill', 'skill_id');                     return; }
    bad_method();
}

function handle_admin_project_types(): void {
    require_jwt();
    $pdo    = get_pdo();
    $method = $_SERVER['REQUEST_METHOD'];
    $id     = isset($_GET['id']) ? intval($_GET['id']) : null;

    if ($method === 'POST'   && !$id) { create_project_type($pdo);                                                            return; }
    if ($method === 'PUT'    && $id)  { update_project_type($pdo, $id);                                                       return; }
    if ($method === 'DELETE' && $id)  { delete_ref($pdo, 'project_type', $id, 'trace_project_type', 'project_type_id');       return; }
    bad_method();
}

function handle_acs_list(): void {
    $pdo  = get_pdo();
    $rows = $pdo->query('SELECT id, slug, title FROM ac ORDER BY title')->fetchAll();
    send_cached_json($rows);
}

function handle_admin_acs(): void {
    require_jwt();
    $pdo    = get_pdo();
    $method = $_SERVER['REQUEST_METHOD'];
    $id     = isset($_GET['id']) ? intval($_GET['id']) : null;

    if ($method === 'POST'   && !$id) { create_ac($pdo);                                               return; }
    if ($method === 'PUT'    && $id)  { update_ac($pdo, $id);                                          return; }
    if ($method === 'DELETE' && $id)  { delete_ref($pdo, 'ac', $id, 'trace_ac', 'ac_id');              return; }
    bad_method();
}

// ----------------------------------------------------------------
// Language
// ----------------------------------------------------------------

function create_language(PDO $pdo): void {
    $data = read_json_payload();
    if ($data === null) return;

    if (empty($data['label'])) {
        http_response_code(422);
        echo json_encode(['error' => 'Le label est obligatoire']);
        return;
    }

    $label = trim($data['label']);
    $color = nullable_string($data['color'] ?? null);
    $slug  = generate_slug($pdo, 'language', $label);

    $pdo->prepare('INSERT INTO language (slug, label, color) VALUES (:slug, :label, :color)')
        ->execute(['slug' => $slug, 'label' => $label, 'color' => $color]);
    $id = (int) $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode(['id' => $id, 'slug' => $slug, 'label' => $label, 'color' => $color]);
}

function update_language(PDO $pdo, int $id): void {
    $data = read_json_payload();
    if ($data === null) return;

    if (empty($data['label'])) {
        http_response_code(422);
        echo json_encode(['error' => 'Le label est obligatoire']);
        return;
    }

    if (!ref_exists($pdo, 'language', $id)) {
        http_response_code(404);
        echo json_encode(['error' => 'Élément introuvable']);
        return;
    }

    $label = trim($data['label']);
    $color = nullable_string($data['color'] ?? null);
    $slug  = generate_slug($pdo, 'language', $label, $id);

    $pdo->prepare('UPDATE language SET slug = :slug, label = :label, color = :color WHERE id = :id')
        ->execute(['slug' => $slug, 'label' => $label, 'color' => $color, 'id' => $id]);

    echo json_encode(['id' => $id, 'slug' => $slug, 'label' => $label, 'color' => $color]);
}

// ----------------------------------------------------------------
// Skill
// ----------------------------------------------------------------

function create_skill(PDO $pdo): void {
    $data = read_json_payload();
    if ($data === null) return;

    if (empty($data['label'])) {
        http_response_code(422);
        echo json_encode(['error' => 'Le label est obligatoire']);
        return;
    }

    $valid_cats = ['technique', 'framework', 'transversale', 'methodo'];
    if (empty($data['category']) || !in_array($data['category'], $valid_cats, true)) {
        http_response_code(422);
        echo json_encode(['error' => 'La catégorie est invalide']);
        return;
    }

    $label    = trim($data['label']);
    $category = $data['category'];
    $slug     = generate_slug($pdo, 'skill', $label);

    $pdo->prepare('INSERT INTO skill (slug, label, category) VALUES (:slug, :label, :category)')
        ->execute(['slug' => $slug, 'label' => $label, 'category' => $category]);
    $id = (int) $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode(['id' => $id, 'slug' => $slug, 'label' => $label, 'category' => $category]);
}

function update_skill(PDO $pdo, int $id): void {
    $data = read_json_payload();
    if ($data === null) return;

    if (empty($data['label'])) {
        http_response_code(422);
        echo json_encode(['error' => 'Le label est obligatoire']);
        return;
    }

    $valid_cats = ['technique', 'framework', 'transversale', 'methodo'];
    if (empty($data['category']) || !in_array($data['category'], $valid_cats, true)) {
        http_response_code(422);
        echo json_encode(['error' => 'La catégorie est invalide']);
        return;
    }

    if (!ref_exists($pdo, 'skill', $id)) {
        http_response_code(404);
        echo json_encode(['error' => 'Élément introuvable']);
        return;
    }

    $label    = trim($data['label']);
    $category = $data['category'];
    $slug     = generate_slug($pdo, 'skill', $label, $id);

    $pdo->prepare('UPDATE skill SET slug = :slug, label = :label, category = :category WHERE id = :id')
        ->execute(['slug' => $slug, 'label' => $label, 'category' => $category, 'id' => $id]);

    echo json_encode(['id' => $id, 'slug' => $slug, 'label' => $label, 'category' => $category]);
}

// ----------------------------------------------------------------
// ProjectType
// ----------------------------------------------------------------

function create_project_type(PDO $pdo): void {
    $data = read_json_payload();
    if ($data === null) return;

    if (empty($data['label'])) {
        http_response_code(422);
        echo json_encode(['error' => 'Le label est obligatoire']);
        return;
    }

    $label = trim($data['label']);
    $icon  = nullable_string($data['icon'] ?? null);
    $slug  = generate_slug($pdo, 'project_type', $label);

    $pdo->prepare('INSERT INTO project_type (slug, label, icon) VALUES (:slug, :label, :icon)')
        ->execute(['slug' => $slug, 'label' => $label, 'icon' => $icon]);
    $id = (int) $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode(['id' => $id, 'slug' => $slug, 'label' => $label, 'icon' => $icon]);
}

function update_project_type(PDO $pdo, int $id): void {
    $data = read_json_payload();
    if ($data === null) return;

    if (empty($data['label'])) {
        http_response_code(422);
        echo json_encode(['error' => 'Le label est obligatoire']);
        return;
    }

    if (!ref_exists($pdo, 'project_type', $id)) {
        http_response_code(404);
        echo json_encode(['error' => 'Élément introuvable']);
        return;
    }

    $label = trim($data['label']);
    $icon  = nullable_string($data['icon'] ?? null);
    $slug  = generate_slug($pdo, 'project_type', $label, $id);

    $pdo->prepare('UPDATE project_type SET slug = :slug, label = :label, icon = :icon WHERE id = :id')
        ->execute(['slug' => $slug, 'label' => $label, 'icon' => $icon, 'id' => $id]);

    echo json_encode(['id' => $id, 'slug' => $slug, 'label' => $label, 'icon' => $icon]);
}

// ----------------------------------------------------------------
// AC
// ----------------------------------------------------------------

function create_ac(PDO $pdo): void {
    $data = read_json_payload();
    if ($data === null) return;

    if (empty($data['title'])) {
        http_response_code(422);
        echo json_encode(['error' => 'Le titre est obligatoire']);
        return;
    }

    $title = trim($data['title']);
    $slug  = generate_slug($pdo, 'ac', $title);

    $pdo->prepare('INSERT INTO ac (slug, title) VALUES (:slug, :title)')
        ->execute(['slug' => $slug, 'title' => $title]);
    $id = (int) $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode(['id' => $id, 'slug' => $slug, 'title' => $title]);
}

function update_ac(PDO $pdo, int $id): void {
    $data = read_json_payload();
    if ($data === null) return;

    if (empty($data['title'])) {
        http_response_code(422);
        echo json_encode(['error' => 'Le titre est obligatoire']);
        return;
    }

    if (!ref_exists($pdo, 'ac', $id)) {
        http_response_code(404);
        echo json_encode(['error' => 'AC introuvable']);
        return;
    }

    $title = trim($data['title']);
    $slug  = generate_slug($pdo, 'ac', $title, $id);

    $pdo->prepare('UPDATE ac SET slug = :slug, title = :title WHERE id = :id')
        ->execute(['slug' => $slug, 'title' => $title, 'id' => $id]);

    echo json_encode(['id' => $id, 'slug' => $slug, 'title' => $title]);
}

// ----------------------------------------------------------------
// Suppression générique
// ----------------------------------------------------------------

function delete_ref(PDO $pdo, string $table, int $id, string $junction, string $fk): void {
    if (!ref_exists($pdo, $table, $id)) {
        http_response_code(404);
        echo json_encode(['error' => 'Élément introuvable']);
        return;
    }

    $used = $pdo->prepare("SELECT 1 FROM `$junction` WHERE `$fk` = :id LIMIT 1");
    $used->execute(['id' => $id]);
    if ($used->fetchColumn()) {
        http_response_code(409);
        echo json_encode(['error' => 'Impossible de supprimer : cet élément est utilisé par une ou plusieurs traces']);
        return;
    }

    $pdo->prepare("DELETE FROM `$table` WHERE id = :id")->execute(['id' => $id]);
    echo json_encode(['deleted' => $id]);
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function generate_slug(PDO $pdo, string $table, string $label, ?int $exclude_id = null): string {
    $s = $label;
    if (function_exists('iconv')) {
        $r = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $label);
        if ($r !== false && $r !== '') $s = $r;
    }
    $s = strtolower($s);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    $s = trim($s, '-');
    if ($s === '') $s = 'item';

    $sql = $exclude_id
        ? "SELECT 1 FROM `$table` WHERE slug = :s AND id != :xid LIMIT 1"
        : "SELECT 1 FROM `$table` WHERE slug = :s LIMIT 1";

    for ($i = 0; $i < 20; $i++) {
        $try    = $i === 0 ? $s : "$s-" . ($i + 1);
        $check  = $pdo->prepare($sql);
        $params = $exclude_id ? ['s' => $try, 'xid' => $exclude_id] : ['s' => $try];
        $check->execute($params);
        if (!$check->fetchColumn()) return $try;
    }

    return $s . '-' . substr(md5($s . microtime()), 0, 8);
}

function ref_exists(PDO $pdo, string $table, int $id): bool {
    $stmt = $pdo->prepare("SELECT 1 FROM `$table` WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $id]);
    return (bool) $stmt->fetchColumn();
}

function bad_method(): void {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}

function read_json_payload(): ?array {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON invalide']);
        return null;
    }
    return $data;
}

function nullable_string(mixed $value): ?string {
    if ($value === null) return null;
    $value = trim((string) $value);
    return $value === '' ? null : $value;
}

function nullable_int(mixed $value): ?int {
    if ($value === null || $value === '') return null;
    return intval($value);
}
