<?php

require_once __DIR__ . '/../helpers/db.php';

function handle_traces(): void {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        $id ? get_trace($id) : list_traces();
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}

// ----------------------------------------------------------------
// GET /api/traces  (liste avec filtres server-side)
// ----------------------------------------------------------------
function list_traces(): void {
    $pdo    = get_pdo();
    $params = [];

    $sql = "
        SELECT DISTINCT
            t.id, t.title, t.description, t.img, t.img_presentation,
            t.date_debut, t.date_fin, t.created_at,
            tc.slug  AS context_slug,
            tc.label AS context_label
        FROM trace t
        LEFT JOIN trace_context tc ON tc.id = t.context_id
        LEFT JOIN trace_language tl     ON tl.trace_id = t.id
        LEFT JOIN trace_skill ts        ON ts.trace_id = t.id
        LEFT JOIN trace_project_type tp ON tp.trace_id = t.id
        WHERE 1=1
    ";

    if (!empty($_GET['search'])) {
        $sql .= ' AND (t.title LIKE :search OR t.description LIKE :search2)';
        $params['search']  = '%' . $_GET['search'] . '%';
        $params['search2'] = '%' . $_GET['search'] . '%';
    }

    if (!empty($_GET['context'])) {
        $sql .= ' AND tc.slug = :context';
        $params['context'] = $_GET['context'];
    }

    if (!empty($_GET['language_id'])) {
        $sql .= ' AND tl.language_id = :language_id';
        $params['language_id'] = intval($_GET['language_id']);
    }

    if (!empty($_GET['skill_id'])) {
        $sql .= ' AND ts.skill_id = :skill_id';
        $params['skill_id'] = intval($_GET['skill_id']);
    }

    if (!empty($_GET['project_type_id'])) {
        $sql .= ' AND tp.project_type_id = :project_type_id';
        $params['project_type_id'] = intval($_GET['project_type_id']);
    }

    $sql .= ' ORDER BY t.created_at DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $traces = $stmt->fetchAll();

    if (empty($traces)) {
        echo json_encode([]);
        return;
    }

    $ids = array_column($traces, 'id');

    // 3 requêtes batch au lieu de 3×N requêtes individuelles
    $languages     = batch_by_trace($pdo, $ids, "
        SELECT tl.trace_id, l.id, l.slug, l.label, l.color
        FROM language l
        JOIN trace_language tl ON tl.language_id = l.id
        WHERE tl.trace_id IN (%s)
        ORDER BY l.label
    ");
    $skills        = batch_by_trace($pdo, $ids, "
        SELECT ts.trace_id, s.id, s.slug, s.label, s.category
        FROM skill s
        JOIN trace_skill ts ON ts.skill_id = s.id
        WHERE ts.trace_id IN (%s)
        ORDER BY s.category, s.label
    ");
    $project_types = batch_by_trace($pdo, $ids, "
        SELECT tpt.trace_id, pt.id, pt.slug, pt.label, pt.icon
        FROM project_type pt
        JOIN trace_project_type tpt ON tpt.project_type_id = pt.id
        WHERE tpt.trace_id IN (%s)
        ORDER BY pt.label
    ");

    foreach ($traces as &$t) {
        $tid = $t['id'];
        $t['img_presentation'] = decode_json($t['img_presentation']);
        $t['languages']        = $languages[$tid]     ?? [];
        $t['skills']           = $skills[$tid]        ?? [];
        $t['project_types']    = $project_types[$tid] ?? [];
    }

    echo json_encode($traces);
}

// ----------------------------------------------------------------
// GET /api/traces?id=X  (détail complet)
// ----------------------------------------------------------------
function get_trace(int $id): void {
    $pdo = get_pdo();

    $stmt = $pdo->prepare("
        SELECT t.*, tc.slug AS context_slug, tc.label AS context_label
        FROM trace t
        LEFT JOIN trace_context tc ON tc.id = t.context_id
        WHERE t.id = :id
    ");
    $stmt->execute(['id' => $id]);
    $trace = $stmt->fetch();

    if (!$trace) {
        http_response_code(404);
        echo json_encode(['error' => 'Trace introuvable']);
        return;
    }

    $trace['img_presentation'] = decode_json($trace['img_presentation']);
    $trace['languages']        = fetch_trace_languages($pdo, $id);
    $trace['skills']           = fetch_trace_skills($pdo, $id);
    $trace['project_types']    = fetch_trace_project_types($pdo, $id);
    $trace['sections']         = fetch_trace_sections($pdo, $id);
    $trace['acs']              = fetch_trace_acs($pdo, $id);

    echo json_encode($trace);
}

// ----------------------------------------------------------------
// Batch loader : regroupe les relations par trace_id en 1 requête
// ----------------------------------------------------------------
function batch_by_trace(PDO $pdo, array $ids, string $sql_tpl): array {
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare(sprintf($sql_tpl, $placeholders));
    $stmt->execute($ids);
    $grouped = [];
    foreach ($stmt->fetchAll() as $row) {
        $tid = $row['trace_id'];
        unset($row['trace_id']);
        $grouped[$tid][] = $row;
    }
    return $grouped;
}

// ----------------------------------------------------------------
// Helpers de jointure (utilisés pour le détail d'une trace)
// ----------------------------------------------------------------
function fetch_trace_languages(PDO $pdo, int $trace_id): array {
    $stmt = $pdo->prepare("
        SELECT l.id, l.slug, l.label, l.color
        FROM language l
        JOIN trace_language tl ON tl.language_id = l.id
        WHERE tl.trace_id = :id
        ORDER BY l.label
    ");
    $stmt->execute(['id' => $trace_id]);
    return $stmt->fetchAll();
}

function fetch_trace_skills(PDO $pdo, int $trace_id): array {
    $stmt = $pdo->prepare("
        SELECT s.id, s.slug, s.label, s.category
        FROM skill s
        JOIN trace_skill ts ON ts.skill_id = s.id
        WHERE ts.trace_id = :id
        ORDER BY s.category, s.label
    ");
    $stmt->execute(['id' => $trace_id]);
    return $stmt->fetchAll();
}

function fetch_trace_project_types(PDO $pdo, int $trace_id): array {
    $stmt = $pdo->prepare("
        SELECT pt.id, pt.slug, pt.label, pt.icon
        FROM project_type pt
        JOIN trace_project_type tpt ON tpt.project_type_id = pt.id
        WHERE tpt.trace_id = :id
        ORDER BY pt.label
    ");
    $stmt->execute(['id' => $trace_id]);
    return $stmt->fetchAll();
}

function fetch_trace_sections(PDO $pdo, int $trace_id): array {
    $stmt = $pdo->prepare("
        SELECT id, position, title
        FROM trace_section
        WHERE trace_id = :id
        ORDER BY position
    ");
    $stmt->execute(['id' => $trace_id]);
    $sections = $stmt->fetchAll();

    if (empty($sections)) return [];

    // 1 requête batch pour tous les paragraphes au lieu de 1 par section
    $sid_list     = array_column($sections, 'id');
    $placeholders = implode(',', array_fill(0, count($sid_list), '?'));
    $pstmt        = $pdo->prepare("
        SELECT id, section_id, position, content, images, display_mode, carousel_interval
        FROM trace_paragraph
        WHERE section_id IN ($placeholders)
        ORDER BY section_id, position
    ");
    $pstmt->execute($sid_list);

    $by_section = [];
    foreach ($pstmt->fetchAll() as $p) {
        $p['images'] = decode_json($p['images']);
        $sid = $p['section_id'];
        unset($p['section_id']);
        $by_section[$sid][] = $p;
    }

    foreach ($sections as &$section) {
        $section['paragraphs'] = $by_section[$section['id']] ?? [];
    }

    return $sections;
}

function fetch_trace_acs(PDO $pdo, int $trace_id): array {
    $stmt = $pdo->prepare("
        SELECT a.id, a.slug, a.title, ta.description, ta.position
        FROM trace_ac ta
        JOIN ac a ON a.id = ta.ac_id
        WHERE ta.trace_id = :id
        ORDER BY ta.position ASC
    ");
    $stmt->execute(['id' => $trace_id]);
    return $stmt->fetchAll();
}

function decode_json(?string $value): mixed {
    if ($value === null) return null;
    $decoded = json_decode($value, true);
    return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
}
