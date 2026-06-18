<?php

require_once __DIR__ . '/../helpers/db.php';
require_once __DIR__ . '/../helpers/jwt.php';

function handle_admin_traces(): void {
    require_jwt();

    $method = $_SERVER['REQUEST_METHOD'];
    $id     = isset($_GET['id']) ? intval($_GET['id']) : null;

    match (true) {
        $method === 'POST'   && !$id => create_trace(),
        $method === 'PUT'    && $id  => update_trace($id),
        $method === 'DELETE' && $id  => delete_trace($id),
        default => (function() {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
        })(),
    };
}

// ----------------------------------------------------------------
// POST /api/admin/traces
// ----------------------------------------------------------------
function create_trace(): void {
    $pdo  = get_pdo();
    $data = read_json_payload();
    if ($data === null) return;

    if (empty($data['title'])) {
        http_response_code(422);
        echo json_encode(['error' => 'Le titre est obligatoire']);
        return;
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO trace (title, description, img, img_presentation, date_debut, date_fin, context_id)
            VALUES (:title, :description, :img, :img_presentation, :date_debut, :date_fin, :context_id)
        ");
        $stmt->execute(trace_payload($data));
        $trace_id = (int) $pdo->lastInsertId();

        sync_relations($pdo, $trace_id, $data);
        sync_sections($pdo, $trace_id, $data['sections'] ?? []);

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    http_response_code(201);
    echo json_encode(['id' => $trace_id]);
}

// ----------------------------------------------------------------
// PUT /api/admin/traces?id=X
// ----------------------------------------------------------------
function update_trace(int $id): void {
    $pdo  = get_pdo();
    $data = read_json_payload();
    if ($data === null) return;

    if (empty($data['title'])) {
        http_response_code(422);
        echo json_encode(['error' => 'Le titre est obligatoire']);
        return;
    }

    if (!trace_exists($pdo, $id)) {
        http_response_code(404);
        echo json_encode(['error' => 'Trace introuvable']);
        return;
    }

    try {
        $pdo->beginTransaction();

        $payload = trace_payload($data);
        $payload['id'] = $id;

        $stmt = $pdo->prepare("
            UPDATE trace
            SET title = :title, description = :description, img = :img,
                img_presentation = :img_presentation,
                date_debut = :date_debut, date_fin = :date_fin,
                context_id = :context_id
            WHERE id = :id
        ");
        $stmt->execute($payload);

        sync_relations($pdo, $id, $data);
        sync_sections($pdo, $id, $data['sections'] ?? []);

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    echo json_encode(['id' => $id]);
}

// ----------------------------------------------------------------
// DELETE /api/admin/traces?id=X
// ----------------------------------------------------------------
function delete_trace(int $id): void {
    $pdo  = get_pdo();
    if (!trace_exists($pdo, $id)) {
        http_response_code(404);
        echo json_encode(['error' => 'Trace introuvable']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM trace WHERE id = :id');
    $stmt->execute(['id' => $id]);
    echo json_encode(['deleted' => $id]);
}

// ----------------------------------------------------------------
// Sync des relations many-to-many
// ----------------------------------------------------------------
function sync_relations(PDO $pdo, int $trace_id, array $data): void {
    $tables = [
        'language_ids'     => ['trace_language',     'language_id'],
        'skill_ids'        => ['trace_skill',         'skill_id'],
        'project_type_ids' => ['trace_project_type',  'project_type_id'],
    ];

    foreach ($tables as $key => [$table, $col]) {
        $pdo->prepare("DELETE FROM `$table` WHERE trace_id = :tid")->execute(['tid' => $trace_id]);
        if (!empty($data[$key]) && is_array($data[$key])) {
            $ins = $pdo->prepare("INSERT INTO `$table` (trace_id, `$col`) VALUES (:tid, :val)");
            foreach (array_unique($data[$key]) as $val) {
                $ins->execute(['tid' => $trace_id, 'val' => intval($val)]);
            }
        }
    }
}

// ----------------------------------------------------------------
// Sync des sections + paragraphes
// ----------------------------------------------------------------
function sync_sections(PDO $pdo, int $trace_id, array $sections): void {
    $pdo->prepare("
        DELETE tp FROM trace_paragraph tp
        JOIN trace_section ts ON ts.id = tp.section_id
        WHERE ts.trace_id = :tid
    ")->execute(['tid' => $trace_id]);

    $pdo->prepare('DELETE FROM trace_section WHERE trace_id = :tid')->execute(['tid' => $trace_id]);

    $ins_s = $pdo->prepare('INSERT INTO trace_section (trace_id, position, title) VALUES (:tid, :pos, :title)');
    $ins_p = $pdo->prepare('INSERT INTO trace_paragraph (section_id, position, content, images) VALUES (:sid, :pos, :content, :images)');

    foreach ($sections as $si => $section) {
        $ins_s->execute(['tid' => $trace_id, 'pos' => $si, 'title' => $section['title'] ?? null]);
        $section_id = (int) $pdo->lastInsertId();

        foreach ($section['paragraphs'] ?? [] as $pi => $para) {
            $ins_p->execute([
                'sid'     => $section_id,
                'pos'     => $pi,
                'content' => $para['content'] ?? null,
                'images'  => encode_json_nullable($para['images'] ?? null),
            ]);
        }
    }
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

function trace_payload(array $data): array {
    return [
        'title'            => trim((string) $data['title']),
        'description'      => nullable_string($data['description'] ?? null),
        'img'              => nullable_string($data['img'] ?? null),
        'img_presentation' => encode_json_nullable($data['img_presentation'] ?? null),
        'date_debut'       => nullable_string($data['date_debut'] ?? null),
        'date_fin'         => nullable_string($data['date_fin'] ?? null),
        'context_id'       => nullable_int($data['context_id'] ?? null),
    ];
}

function trace_exists(PDO $pdo, int $id): bool {
    $stmt = $pdo->prepare('SELECT 1 FROM trace WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    return (bool) $stmt->fetchColumn();
}

// ----------------------------------------------------------------
// POST /api/admin/traces/{id}/upload
// ----------------------------------------------------------------
function handle_admin_upload(int $trace_id): void {
    require_jwt();

    $pdo = get_pdo();
    if (!trace_exists($pdo, $trace_id)) {
        http_response_code(404);
        echo json_encode(['error' => 'Trace introuvable']);
        return;
    }

    if (empty($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
        http_response_code(422);
        echo json_encode(['error' => 'Aucun fichier reçu']);
        return;
    }

    $file = $_FILES['file'];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(422);
        echo json_encode(['error' => 'Échec du téléversement']);
        return;
    }

    $max_size = 8 * 1024 * 1024; // 8 Mo
    if ($file['size'] > $max_size) {
        http_response_code(422);
        echo json_encode(['error' => 'Fichier trop volumineux (8 Mo max)']);
        return;
    }

    $allowed_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed_ext, true)) {
        http_response_code(422);
        echo json_encode(['error' => 'Type de fichier non autorisé']);
        return;
    }

    $image_info = @getimagesize($file['tmp_name']);
    if ($image_info === false) {
        http_response_code(422);
        echo json_encode(['error' => 'Le fichier n\'est pas une image valide']);
        return;
    }

    $dir = __DIR__ . "/../../assets/trace/$trace_id";
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        http_response_code(500);
        echo json_encode(['error' => 'Impossible de créer le dossier de stockage']);
        return;
    }

    $filename = safe_upload_filename($dir, $file['name'], $ext);
    $destination = "$dir/$filename";

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        http_response_code(500);
        echo json_encode(['error' => 'Échec de l\'enregistrement du fichier']);
        return;
    }

    echo json_encode(['filename' => $filename]);
}

function safe_upload_filename(string $dir, string $original_name, string $ext): string {
    $base = pathinfo($original_name, PATHINFO_FILENAME);
    $base = preg_replace('/[^a-zA-Z0-9_-]+/', '-', $base);
    $base = trim($base, '-');
    if ($base === '') $base = 'image';

    $filename = "$base.$ext";
    $i = 1;
    while (file_exists("$dir/$filename")) {
        $filename = "$base-$i.$ext";
        $i++;
    }
    return $filename;
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

function encode_json_nullable(mixed $value): ?string {
    if ($value === null || $value === '') return null;
    return json_encode($value);
}
