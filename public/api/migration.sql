-- ============================================================
-- Migration : refonte schéma traces
-- Exécuter dans l'ordre sur la BDD `portfolio`
-- ============================================================

-- --------------------------------------------------------
-- Tables de référence
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `trace_context` (
    `id`    INT AUTO_INCREMENT PRIMARY KEY,
    `slug`  VARCHAR(50)  NOT NULL UNIQUE,
    `label` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `trace_context` (`slug`, `label`) VALUES
    ('pro',   'Professionnel'),
    ('univ',  'Universitaire'),
    ('perso', 'Personnel')
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`);

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `project_type` (
    `id`    INT AUTO_INCREMENT PRIMARY KEY,
    `slug`  VARCHAR(50)  NOT NULL UNIQUE,
    `label` VARCHAR(100) NOT NULL,
    `icon`  VARCHAR(50)  DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `project_type` (`slug`, `label`, `icon`) VALUES
    ('web-app',  'Application Web',  '🌐'),
    ('api',      'API / Back-end',   '⚙️'),
    ('mobile',   'Application Mobile','📱'),
    ('data',     'Data / IA',        '📊'),
    ('jeu',      'Jeu',              '🎮'),
    ('script',   'Script / Outil',   '🛠️'),
    ('design',   'Design / UI',      '🎨')
ON DUPLICATE KEY UPDATE
    `label` = VALUES(`label`),
    `icon` = VALUES(`icon`);

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `language` (
    `id`    INT AUTO_INCREMENT PRIMARY KEY,
    `slug`  VARCHAR(50)  NOT NULL UNIQUE,
    `label` VARCHAR(100) NOT NULL,
    `color` VARCHAR(20)  DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `language` (`slug`, `label`, `color`) VALUES
    ('javascript', 'JavaScript', '#f7df1e'),
    ('typescript', 'TypeScript', '#3178c6'),
    ('react',      'React',      '#61dafb'),
    ('php',        'PHP',        '#777bb4'),
    ('python',     'Python',     '#3776ab'),
    ('java',       'Java',       '#ed8b00'),
    ('sql',        'SQL',        '#e48e00'),
    ('html',       'HTML',       '#e34f26'),
    ('css',        'CSS',        '#1572b6'),
    ('c',          'C',          '#a8b9cc'),
    ('cpp',        'C++',        '#00599c'),
    ('csharp',     'C#',         '#239120'),
    ('bash',       'Bash',       '#4eaa25')
ON DUPLICATE KEY UPDATE
    `label` = VALUES(`label`),
    `color` = VALUES(`color`);

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `skill` (
    `id`       INT AUTO_INCREMENT PRIMARY KEY,
    `slug`     VARCHAR(100) NOT NULL UNIQUE,
    `label`    VARCHAR(150) NOT NULL,
    `category` VARCHAR(50)  DEFAULT NULL
        COMMENT 'technique | framework | transversale | methodo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `admin_user` (
    `id`            INT AUTO_INCREMENT PRIMARY KEY,
    `email`         VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Table principale (garde la compatibilité avec les colonnes
-- existantes, ajoute context_id)
-- ============================================================

-- Si la table trace n'existe pas, la créer complètement
CREATE TABLE IF NOT EXISTS `trace` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `title`            VARCHAR(255) NOT NULL,
    `description`      TEXT         DEFAULT NULL,
    `img`              VARCHAR(255) DEFAULT NULL,
    `img_presentation` JSON         DEFAULT NULL,
    `date_debut`       DATE         DEFAULT NULL,
    `date_fin`         DATE         DEFAULT NULL,
    `context_id`       INT          DEFAULT NULL,
    `created_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`context_id`) REFERENCES `trace_context`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Si la table existait déjà, ajouter les colonnes manquantes
ALTER TABLE `trace`
    ADD COLUMN IF NOT EXISTS `date_debut`  DATE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `date_fin`    DATE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `context_id`  INT  DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Migration : remplir context_id depuis l'ancien champ `type` (si présent)
-- Adapter selon les valeurs réelles dans ta BDD :
-- UPDATE trace SET context_id = (SELECT id FROM trace_context WHERE slug = 'pro')
--     WHERE type IN ('pro', 'professionnel', 'professional');
-- UPDATE trace SET context_id = (SELECT id FROM trace_context WHERE slug = 'univ')
--     WHERE type IN ('univ', 'universitaire', 'academique', 'académique');

-- ============================================================
-- Tables de jonction (many-to-many)
-- ============================================================

CREATE TABLE IF NOT EXISTS `trace_language` (
    `trace_id`    INT NOT NULL,
    `language_id` INT NOT NULL,
    PRIMARY KEY (`trace_id`, `language_id`),
    FOREIGN KEY (`trace_id`)    REFERENCES `trace`(`id`)    ON DELETE CASCADE,
    FOREIGN KEY (`language_id`) REFERENCES `language`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `trace_skill` (
    `trace_id` INT NOT NULL,
    `skill_id` INT NOT NULL,
    PRIMARY KEY (`trace_id`, `skill_id`),
    FOREIGN KEY (`trace_id`) REFERENCES `trace`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`skill_id`) REFERENCES `skill`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `trace_project_type` (
    `trace_id`        INT NOT NULL,
    `project_type_id` INT NOT NULL,
    PRIMARY KEY (`trace_id`, `project_type_id`),
    FOREIGN KEY (`trace_id`)        REFERENCES `trace`(`id`)        ON DELETE CASCADE,
    FOREIGN KEY (`project_type_id`) REFERENCES `project_type`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Contenu structuré (remplace le JSON imbriqué `content`)
-- ============================================================

CREATE TABLE IF NOT EXISTS `trace_section` (
    `id`       INT AUTO_INCREMENT PRIMARY KEY,
    `trace_id` INT         NOT NULL,
    `position` INT         NOT NULL DEFAULT 0,
    `title`    VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (`trace_id`) REFERENCES `trace`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `trace_paragraph` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `section_id` INT  NOT NULL,
    `position`   INT  NOT NULL DEFAULT 0,
    `content`    TEXT DEFAULT NULL,
    `images`     JSON DEFAULT NULL,
    FOREIGN KEY (`section_id`) REFERENCES `trace_section`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
