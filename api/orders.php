<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');
$allowedOrigin = env_get('ALLOWED_ORIGIN', '*');
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = get_pdo();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    // Métricas para dashboard (aceita período opcional from/to)
    if ($method === 'GET' && isset($_GET['metrics'])) {
        $from = $_GET['from'] ?? '';
        $to = $_GET['to'] ?? '';
        $where = [];
        $params = [];
        if ($from !== '') { $where[] = 'created_at >= :from'; $params[':from'] = $from . ' 00:00:00'; }
        if ($to !== '') { $where[] = 'created_at <= :to'; $params[':to'] = $to . ' 23:59:59'; }
        $whereOrders = count($where) ? ('WHERE ' . implode(' AND ', $where)) : 'WHERE DATE(created_at) = CURDATE()';

        $stmt = $pdo->prepare("SELECT COUNT(*) AS orders_count FROM orders $whereOrders");
        $stmt->execute($params);
        $ordersCount = $stmt->fetch() ?: ['orders_count' => 0];

        $whereRev = $where;
        $whereRev[] = "status = 'completed'";
        $whereRevSql = 'WHERE ' . implode(' AND ', $whereRev);
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) AS revenue FROM orders $whereRevSql");
        $stmt->execute($params);
        $revData = $stmt->fetch() ?: ['revenue' => 0];

        // Total de produtos e estoque baixo (< 5)
        $stmt = $pdo->query("SELECT COUNT(*) AS total_products, SUM(CASE WHEN stock <= 5 THEN 1 ELSE 0 END) AS low_stock FROM products");
        $prodData = $stmt->fetch() ?: ['total_products' => 0, 'low_stock' => 0];

        echo json_encode([
            'orders_count' => (int)$ordersCount['orders_count'],
            'revenue' => (float)$revData['revenue'],
            'total_products' => (int)$prodData['total_products'],
            'low_stock' => (int)$prodData['low_stock'],
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    // Estatísticas para gráficos do dashboard
    if ($method === 'GET' && isset($_GET['stats'])) {
        $stats = $_GET['stats'];
        if ($stats === 'last7days') {
            $stmt = $pdo->query("SELECT DATE(created_at) AS d, COALESCE(SUM(total_amount),0) AS v FROM orders WHERE status = 'completed' AND created_at >= (CURDATE() - INTERVAL 6 DAY) GROUP BY DATE(created_at) ORDER BY d ASC");
            $rows = $stmt->fetchAll();
            echo json_encode(['items' => $rows], JSON_UNESCAPED_UNICODE);
            return;
        }
        if ($stats === 'timeseries') {
            $from = $_GET['from'] ?? '';
            $to = $_GET['to'] ?? '';
            $params = [];
            $where = ["status = 'completed'"];
            if ($from !== '') { $where[] = 'created_at >= :from'; $params[':from'] = $from . ' 00:00:00'; }
            if ($to !== '') { $where[] = 'created_at <= :to'; $params[':to'] = $to . ' 23:59:59'; }
            $whereSql = 'WHERE ' . implode(' AND ', $where);
            $stmt = $pdo->prepare("SELECT DATE(created_at) AS d, COALESCE(SUM(total_amount),0) AS v FROM orders $whereSql GROUP BY DATE(created_at) ORDER BY d ASC");
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            echo json_encode(['items' => $rows], JSON_UNESCAPED_UNICODE);
            return;
        }
        if ($stats === 'top_products') {
            $from = $_GET['from'] ?? '';
            $to = $_GET['to'] ?? '';
            $params = [];
            $where = ["o.status = 'completed'"];
            if ($from !== '') { $where[] = 'o.created_at >= :from'; $params[':from'] = $from . ' 00:00:00'; }
            if ($to !== '') { $where[] = 'o.created_at <= :to'; $params[':to'] = $to . ' 23:59:59'; }
            $whereSql = 'WHERE ' . implode(' AND ', $where);
            $stmt = $pdo->prepare("SELECT oi.name AS name, SUM(oi.quantity) AS qty FROM order_items oi JOIN orders o ON o.id = oi.order_id $whereSql GROUP BY oi.name ORDER BY qty DESC LIMIT 5");
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            echo json_encode(['items' => $rows], JSON_UNESCAPED_UNICODE);
            return;
        }
    }

    // Relatórios com filtros (mensal, por categoria e resumo agregado)
    if ($method === 'GET' && isset($_GET['report'])) {
        $report = $_GET['report'];
        $from = $_GET['from'] ?? '';
        $to = $_GET['to'] ?? '';
        $params = [];
        $where = ["o.status = 'completed'"];
        if ($from !== '') { $where[] = 'o.created_at >= :from'; $params[':from'] = $from . ' 00:00:00'; }
        if ($to !== '') { $where[] = 'o.created_at <= :to'; $params[':to'] = $to . ' 23:59:59'; }
        $whereSql = 'WHERE ' . implode(' AND ', $where);

        if ($report === 'monthly') {
            $sql = "SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS ym,
                           COUNT(*) AS orders,
                           COALESCE(SUM(o.total_amount),0) AS revenue,
                           COALESCE(AVG(o.total_amount),0) AS avg_ticket,
                           COALESCE(SUM(oi.quantity),0) AS products_sold
                    FROM orders o
                    LEFT JOIN order_items oi ON oi.order_id = o.id
                    $whereSql
                    GROUP BY ym
                    ORDER BY ym ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            echo json_encode(['items' => $rows], JSON_UNESCAPED_UNICODE);
            return;
        }
        if ($report === 'category') {
            $sql = "SELECT p.category AS category, COALESCE(SUM(oi.quantity),0) AS qty FROM order_items oi JOIN orders o ON o.id = oi.order_id LEFT JOIN products p ON p.id = oi.product_id $whereSql GROUP BY p.category ORDER BY qty DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            echo json_encode(['items' => $rows], JSON_UNESCAPED_UNICODE);
            return;
        }
        if ($report === 'summary') {
            // Totais agregados no período
            $sql1 = "SELECT COUNT(*) AS orders, COALESCE(SUM(o.total_amount),0) AS revenue, COALESCE(AVG(o.total_amount),0) AS avg_ticket FROM orders o $whereSql";
            $stmt = $pdo->prepare($sql1);
            $stmt->execute($params);
            $agg = $stmt->fetch() ?: ['orders'=>0,'revenue'=>0,'avg_ticket'=>0];

            $sql2 = "SELECT COALESCE(SUM(oi.quantity),0) AS products_sold FROM order_items oi JOIN orders o ON o.id = oi.order_id $whereSql";
            $stmt = $pdo->prepare($sql2);
            $stmt->execute($params);
            $ps = $stmt->fetch() ?: ['products_sold'=>0];

            echo json_encode([
                'orders' => (int)($agg['orders'] ?? 0),
                'revenue' => (float)($agg['revenue'] ?? 0),
                'avg_ticket' => (float)($agg['avg_ticket'] ?? 0),
                'products_sold' => (int)($ps['products_sold'] ?? 0),
            ], JSON_UNESCAPED_UNICODE);
            return;
        }
    }

    if ($method === 'GET') {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 10)));
        $status = trim((string)($_GET['status'] ?? ''));
        $q = trim((string)($_GET['q'] ?? ''));

        $where = [];
        $params = [];
        if ($status !== '') { $where[] = 'o.status = :status'; $params[':status'] = $status; }
        if ($q !== '') { $where[] = '(o.customer_name LIKE :q OR o.phone LIKE :q)'; $params[':q'] = '%' . $q . '%'; }
        $whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

        $stmt = $pdo->prepare("SELECT COUNT(*) AS total FROM orders o $whereSql");
        $stmt->execute($params);
        $total = (int)($stmt->fetch()['total'] ?? 0);

        $offset = ($page - 1) * $perPage;
        $sql = "SELECT o.id, o.customer_name, o.phone, o.delivery_method, o.neighborhood, o.address, o.total_amount, o.status, o.created_at
                FROM orders o
                $whereSql
                ORDER BY o.created_at DESC
                LIMIT :limit OFFSET :offset";
        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $orders = $stmt->fetchAll();

        echo json_encode([
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => (int)ceil($total / $perPage),
            'items' => $orders,
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    if ($method === 'POST') {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);
        if (!is_array($payload)) $payload = [];

        // Update status
        if (!empty($payload['id']) && isset($payload['status'])) {
            if (!admin_is_authenticated() || !csrf_validate_request()) {
                http_response_code(403);
                echo json_encode(['error' => true, 'message' => 'Acesso negado']);
                return;
            }
            $id = (int)$payload['id'];
            $status = trim((string)$payload['status']);
            $stmt = $pdo->prepare('UPDATE orders SET status = :status WHERE id = :id');
            $stmt->execute([':status' => $status, ':id' => $id]);
            echo json_encode(['success' => true]);
            return;
        }

        // Create order (com rate-limit e validações)
        // Rate limit por IP: 5 requisições a cada 5 minutos
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (!rate_limit_check('orders_create_' . $ip, 5, 300)) {
            http_response_code(429);
            echo json_encode(['error' => true, 'message' => 'Muitas solicitações. Tente novamente mais tarde.']);
            return;
        }

        $customer_name = trim((string)($payload['customer_name'] ?? ''));
        $phone = trim((string)($payload['phone'] ?? ''));
        $delivery_method = trim((string)($payload['delivery_method'] ?? 'pickup'));
        $neighborhood = trim((string)($payload['neighborhood'] ?? ''));
        $address = trim((string)($payload['address'] ?? ''));
        $items = is_array($payload['items'] ?? null) ? $payload['items'] : [];
        $delivery_fee = (float)($payload['delivery_fee'] ?? 0);
        
        // Validações básicas
        if ($customer_name === '' || empty($items)) {
            http_response_code(422);
            echo json_encode(['error' => true, 'message' => 'Dados do cliente e itens são obrigatórios']);
            return;
        }

        if (mb_strlen($customer_name) > 120) {
            http_response_code(422);
            echo json_encode(['error' => true, 'message' => 'Nome muito longo']);
            return;
        }

        if ($phone !== '') {
            $digits = preg_replace('/\D+/', '', $phone);
            if (strlen($digits) < 8 || strlen($digits) > 20) {
                http_response_code(422);
                echo json_encode(['error' => true, 'message' => 'Telefone inválido']);
                return;
            }
        }

        if (!in_array($delivery_method, ['pickup', 'delivery'], true)) {
            http_response_code(422);
            echo json_encode(['error' => true, 'message' => 'Forma de recebimento inválida']);
            return;
        }

        if ($address !== '' && mb_strlen($address) > 300) {
            http_response_code(422);
            echo json_encode(['error' => true, 'message' => 'Endereço muito longo']);
            return;
        }

        if ($neighborhood !== '' && mb_strlen($neighborhood) > 120) {
            http_response_code(422);
            echo json_encode(['error' => true, 'message' => 'Bairro muito longo']);
            return;
        }

        if ($delivery_fee < 0 || $delivery_fee > 1000) {
            http_response_code(422);
            echo json_encode(['error' => true, 'message' => 'Taxa de entrega inválida']);
            return;
        }

        $pdo->beginTransaction();
        try {
            $subtotal = 0;
            foreach ($items as $it) {
                $price = (float)($it['price'] ?? 0);
                $qty = (int)($it['quantity'] ?? 0);
                $name = (string)($it['name'] ?? '');
                $size = (string)($it['size'] ?? '');
                if ($price < 0 || $price > 100000 || $qty < 1 || $qty > 999 || mb_strlen($name) > 200 || mb_strlen($size) > 20) {
                    http_response_code(422);
                    echo json_encode(['error' => true, 'message' => 'Item inválido']);
                    return;
                }
                $subtotal += $price * $qty;
            }
            $total = $subtotal + $delivery_fee;

            $stmt = $pdo->prepare('INSERT INTO orders (customer_name, phone, delivery_method, neighborhood, address, subtotal, delivery_fee, total_amount, status, created_at) VALUES (:customer_name, :phone, :delivery_method, :neighborhood, :address, :subtotal, :delivery_fee, :total_amount, :status, NOW())');
            $stmt->execute([
                ':customer_name' => $customer_name,
                ':phone' => $phone,
                ':delivery_method' => $delivery_method,
                ':neighborhood' => $neighborhood,
                ':address' => $address,
                ':subtotal' => $subtotal,
                ':delivery_fee' => $delivery_fee,
                ':total_amount' => $total,
                ':status' => 'pending',
            ]);
            $orderId = (int)$pdo->lastInsertId();

            $stmtItem = $pdo->prepare('INSERT INTO order_items (order_id, product_id, name, size, price, quantity) VALUES (:order_id, :product_id, :name, :size, :price, :quantity)');
            foreach ($items as $it) {
                $stmtItem->execute([
                    ':order_id' => $orderId,
                    ':product_id' => (int)($it['id'] ?? 0),
                    ':name' => (string)($it['name'] ?? ''),
                    ':size' => (string)($it['size'] ?? ''),
                    ':price' => (float)($it['price'] ?? 0),
                    ':quantity' => (int)($it['quantity'] ?? 0),
                ]);
                // Opcional: atualizar estoque
                if (!empty($it['id'])) {
                    $pdo->prepare('UPDATE products SET stock = GREATEST(stock - :q, 0) WHERE id = :pid')->execute([':q' => (int)($it['quantity'] ?? 0), ':pid' => (int)$it['id']]);
                }
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'order_id' => $orderId]);
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
        return;
    }

    // Excluir pedido
    if ($method === 'DELETE') {
        if (!admin_is_authenticated() || !csrf_validate_request()) {
            http_response_code(403);
            echo json_encode(['error' => true, 'message' => 'Acesso negado']);
            return;
        }
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => true, 'message' => 'ID inválido']);
            return;
        }
        $stmt = $pdo->prepare('DELETE FROM orders WHERE id = :id');
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
