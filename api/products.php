<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');
$allowedOrigin = env_get('ALLOWED_ORIGIN', '*');
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = get_pdo();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        // Buscar por ID específico
        $idGet = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($idGet > 0) {
            $stmt = $pdo->prepare('SELECT id, name, price, description, category, sizes, stock, image FROM products WHERE id = :id');
            $stmt->execute([':id' => $idGet]);
            $item = $stmt->fetch();
            if ($item) {
                $item['sizes'] = isset($item['sizes']) && is_string($item['sizes'])
                    ? array_values(array_filter(array_map('trim', explode(',', $item['sizes']))))
                    : [];
                $item['price'] = (float)$item['price'];
                $item['stock'] = (int)$item['stock'];
            }
            echo json_encode(['item' => $item]);
            return;
        }

        // Lista com paginação/filtro/busca
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 12)));
        $category = trim((string)($_GET['category'] ?? 'all'));
        $query = trim((string)($_GET['q'] ?? ''));

        $where = [];
        $params = [];

        if ($category !== 'all' && $category !== '') {
            $where[] = 'category = :category';
            $params[':category'] = $category;
        }

        if ($query !== '') {
            // OBS: Com ATTR_EMULATE_PREPARES = false, não podemos reutilizar o mesmo nome de parâmetro em múltiplos lugares.
            // Use parâmetros distintos (:q1 e :q2) para evitar SQLSTATE[HY093].
            $where[] = '(name LIKE :q1 OR description LIKE :q2)';
            $params[':q1'] = '%' . $query . '%';
            $params[':q2'] = '%' . $query . '%';
        }

        $whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

        $stmt = $pdo->prepare("SELECT COUNT(*) AS total FROM products $whereSql");
        $stmt->execute($params);
        $total = (int)($stmt->fetch()['total'] ?? 0);

        $offset = ($page - 1) * $perPage;
        $sql = "SELECT id, name, price, description, category, sizes, stock, image
                FROM products
                $whereSql
                ORDER BY id DESC
                LIMIT :limit OFFSET :offset";
        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        foreach ($items as &$it) {
            $it['sizes'] = isset($it['sizes']) && is_string($it['sizes'])
                ? array_values(array_filter(array_map('trim', explode(',', $it['sizes']))))
                : [];
            $it['price'] = (float)$it['price'];
            $it['stock'] = (int)$it['stock'];
        }

        echo json_encode([
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => (int)ceil($total / $perPage),
            'items' => $items,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return;
    }

    // Leitura do corpo JSON para create/update
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);
    if (!is_array($payload)) $payload = [];

    if ($method === 'POST') {
        if (!admin_is_authenticated() || !csrf_validate_request()) {
            http_response_code(403);
            echo json_encode(['error' => true, 'message' => 'Acesso negado']);
            return;
        }
        // Create or Update dependendo de 'id'
        $id = isset($payload['id']) ? (int)$payload['id'] : 0;
        $name = trim((string)($payload['name'] ?? ''));
        $price = (float)($payload['price'] ?? 0);
        $description = trim((string)($payload['description'] ?? ''));
        $category = trim((string)($payload['category'] ?? 'masculino'));
        $sizesArr = $payload['sizes'] ?? [];
        if (is_array($sizesArr)) {
            $sizesArr = array_values(array_filter(array_map('trim', $sizesArr)));
        } else {
            $sizesArr = [];
        }
        $sizes = implode(',', $sizesArr);
        $stock = (int)($payload['stock'] ?? 0);
        $image = trim((string)($payload['image'] ?? ''));

        // Validações
        $allowedCategories = ['masculino','feminino','infantil'];
        $allowedSizes = ['17/18','19','19/20','20','20/21','21','22','23/24','25','25/26','27/28','29','29/30','30','31/32','31','32/33','34','33/34','35/36','37','38','37/38','39/40','39','40','41','41/42','42','43/44','45/46','45','47/48'];

        if ($name === '' || mb_strlen($name) > 120) {
            http_response_code(422);
            echo json_encode(['error' => true, 'message' => 'Nome inválido']);
            return;
        }

        if ($price < 0 || $price > 100000) {
            http_response_code(422);
            echo json_encode(['error' => true, 'message' => 'Preço inválido']);
            return;
        }

        if (mb_strlen($description) > 1000) {
            http_response_code(422);
            echo json_encode(['error' => true, 'message' => 'Descrição muito longa']);
            return;
        }

        if (!in_array($category, $allowedCategories, true)) {
            http_response_code(422);
            echo json_encode(['error' => true, 'message' => 'Categoria inválida']);
            return;
        }

        if ($stock < 0 || $stock > 1000000) {
            http_response_code(422);
            echo json_encode(['error' => true, 'message' => 'Estoque inválido']);
            return;
        }

        // Validar tamanhos somente se fornecidos
        foreach ($sizesArr as $sz) {
            if (!in_array($sz, $allowedSizes, true)) {
                http_response_code(422);
                echo json_encode(['error' => true, 'message' => 'Tamanho inválido']);
                return;
            }
        }

        // Validar nome da imagem (apenas caracteres seguros)
        if ($image !== '' && !preg_match('/^[A-Za-z0-9_.-]+\.(jpg|jpeg|png|webp)$/i', $image)) {
            http_response_code(422);
            echo json_encode(['error' => true, 'message' => 'Nome de imagem inválido']);
            return;
        }

        if ($id > 0) {
            $sql = "UPDATE products SET name=:name, price=:price, description=:description, category=:category, sizes=:sizes, stock=:stock, image=:image WHERE id=:id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':name' => $name,
                ':price' => $price,
                ':description' => $description,
                ':category' => $category,
                ':sizes' => $sizes,
                ':stock' => $stock,
                ':image' => $image,
                ':id' => $id,
            ]);
        } else {
            $sql = "INSERT INTO products (name, price, description, category, sizes, stock, image) VALUES (:name, :price, :description, :category, :sizes, :stock, :image)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':name' => $name,
                ':price' => $price,
                ':description' => $description,
                ':category' => $category,
                ':sizes' => $sizes,
                ':stock' => $stock,
                ':image' => $image,
            ]);
            $id = (int)$pdo->lastInsertId();
        }

        // Retornar item atualizado/inserido
        $stmt = $pdo->prepare('SELECT id, name, price, description, category, sizes, stock, image FROM products WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $item = $stmt->fetch();
        if ($item) {
            $item['sizes'] = isset($item['sizes']) && is_string($item['sizes'])
                ? array_values(array_filter(array_map('trim', explode(',', $item['sizes']))))
                : [];
            $item['price'] = (float)$item['price'];
            $item['stock'] = (int)$item['stock'];
        }
        echo json_encode(['success' => true, 'item' => $item]);
        return;
    }

    if ($method === 'DELETE') {
        if (!admin_is_authenticated() || !csrf_validate_request()) {
            http_response_code(403);
            echo json_encode(['error' => true, 'message' => 'Acesso negado']);
            return;
        }
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => true, 'message' => 'ID inválido']);
            return;
        }
        $stmt = $pdo->prepare('DELETE FROM products WHERE id = :id');
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true]);
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => true, 'message' => 'Método não permitido']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => true, 'message' => $e->getMessage()]);
}
