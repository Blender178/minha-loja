<?php
require_once __DIR__ . '/../config.php';
// Upload de imagem para images/produtos
header('Content-Type: application/json; charset=utf-8');
$allowedOrigin = env_get('ALLOWED_ORIGIN', '*');
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Vary: Origin');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => true, 'message' => 'Método não permitido']);
        exit;
    }
    // Require admin + CSRF
    if (!admin_is_authenticated() || !csrf_validate_request()) {
        http_response_code(403);
        echo json_encode(['error' => true, 'message' => 'Acesso negado']);
        exit;
    }

    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => true, 'message' => 'Arquivo não enviado']);
        exit;
    }

    $file = $_FILES['file'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => true, 'message' => 'Erro no upload: ' . $file['error']]);
        exit;
    }

    // Limit size (2 MB)
    $maxSize = 2 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        http_response_code(413);
        echo json_encode(['error' => true, 'message' => 'Arquivo maior que 2MB']);
        exit;
    }

    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    if (!isset($allowed[$mime])) {
        http_response_code(415);
        echo json_encode(['error' => true, 'message' => 'Tipo de arquivo não suportado']);
        exit;
    }

    // Validar dimensões da imagem
    $imgInfo = @getimagesize($file['tmp_name']);
    if ($imgInfo === false) {
        http_response_code(415);
        echo json_encode(['error' => true, 'message' => 'Arquivo não é uma imagem válida']);
        exit;
    }
    [$width, $height] = $imgInfo;
    if ($width <= 0 || $height <= 0 || $width > 4000 || $height > 4000) {
        http_response_code(422);
        echo json_encode(['error' => true, 'message' => 'Dimensões inválidas (máx. 4000x4000)']);
        exit;
    }

    $ext = $allowed[$mime];
    $newName = bin2hex(random_bytes(8)) . '.' . $ext;

    $targetDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'produtos';
    if (!is_dir($targetDir)) {
        if (!mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
            throw new RuntimeException('Falha ao criar diretório de destino');
        }
    }

    $targetPath = $targetDir . DIRECTORY_SEPARATOR . $newName;
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new RuntimeException('Falha ao mover arquivo enviado');
    }

    // Ajustar permissão do arquivo
    @chmod($targetPath, 0644);

    echo json_encode(['success' => true, 'filename' => $newName, 'path' => 'images/produtos/' . $newName]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => true, 'message' => $e->getMessage()]);
}
