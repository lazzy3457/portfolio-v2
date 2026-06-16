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

    foreach ($traces as &$t) {
        $t['img_presentation'] = decode_json($t['img_presentation']);
        $t['languages']        = fetch_trace_languages($pdo, $t['id']);
        $t['skills']           = fetch_trace_skills($pdo, $t['id']);
        $t['project_types']    = fetch_trace_project_types($pdo, $t['id']);
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

    echo json_encode($trace);
}

// ----------------------------------------------------------------
// Helpers de jointure
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

    foreach ($sections as &$section) {
        $pstmt = $pdo->prepare("
            SELECT id, position, content, images
            FROM trace_paragraph
            WHERE section_id = :sid
            ORDER BY position
        ");
        $pstmt->execute(['sid' => $section['id']]);
        $paragraphs = $pstmt->fetchAll();
        foreach ($paragraphs as &$p) {
            $p['images'] = decode_json($p['images']);
        }
        $section['paragraphs'] = $paragraphs;
    }

    return $sections;
}

function decode_json(?string $value): mixed {
    if ($value === null) return null;
    $decoded = json_decode($value, true);
    return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
}
