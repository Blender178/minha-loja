<?php
require_once __DIR__ . '/../config.php';

$is_authenticated = admin_is_authenticated();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login_intent'])) {
    if (!rate_limit_check('admin_login', 10, 300)) {
        $error_message = "Muitas tentativas. Tente novamente mais tarde.";
    } elseif (!csrf_validate_request()) {
        $error_message = "Falha de segurança. Recarregue a página.";
    } else {
        $user = trim((string)($_POST['username'] ?? ''));
        $pass = (string)($_POST['password'] ?? '');
        if (admin_credentials_valid($user, $pass)) {
            admin_login($user);
            $is_authenticated = true;
        } else {
            $error_message = "Credenciais inválidas";
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['logout_intent'])) {
    if (csrf_validate_request()) {
        admin_logout();
        header("Location: index.php");
        exit;
    } else {
        $error_message = "Falha de segurança no logout. Recarregue a página.";
    }
}

// No-cache para área autenticada
if ($is_authenticated) {
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administração - Loja de Chinelos</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <link rel="stylesheet" href="../css/admin.css?v=<?php echo filemtime('../css/admin.css'); ?>">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <?php if (!$is_authenticated): ?>
    <!-- Tela de Login -->
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-4">
                <div class="card shadow">
                    <div class="card-body p-5">
                        <h2 class="text-center mb-4">Área Administrativa</h2>
                        
                        <?php if (isset($error_message)): ?>
                            <div class="alert alert-danger"><?php echo $error_message; ?></div>
                        <?php endif; ?>
                        
                        <form method="post" action="">
                            <input type="hidden" name="login_intent" value="1">
                            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(csrf_token(), ENT_QUOTES); ?>">
                            <div class="mb-3">
                                <label for="username" class="form-label">Usuário</label>
                                <input type="text" class="form-control" id="username" name="username" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Senha</label>
                                <input type="password" class="form-control" id="password" name="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Entrar</button>
                        </form>
                        
                        <div class="mt-3 text-center">
                            <a href="../index.php" class="text-decoration-none">Voltar para a loja</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php else: ?>
    <!-- Painel Administrativo -->
    <div class="d-flex" id="wrapper">
        <!-- Sidebar -->
        <div class="bg-dark text-white" id="sidebar-wrapper">
            <div class="sidebar-heading p-3">
                <h4>Chinelos Store</h4>
                <p class="mb-0">Painel Administrativo</p>
            </div>
            <div class="list-group list-group-flush">
                <a href="#dashboard" class="list-group-item list-group-item-action bg-transparent text-white active" data-bs-toggle="tab">
                    <i class="fas fa-tachometer-alt me-2"></i> Dashboard
                </a>
                <a href="#orders" class="list-group-item list-group-item-action bg-transparent text-white" data-bs-toggle="tab">
                    <i class="fas fa-shopping-bag me-2"></i> Pedidos
                </a>
                <a href="#products" class="list-group-item list-group-item-action bg-transparent text-white" data-bs-toggle="tab">
                    <i class="fas fa-box me-2"></i> Produtos
                </a>
                <a href="#reports" class="list-group-item list-group-item-action bg-transparent text-white" data-bs-toggle="tab">
                    <i class="fas fa-chart-bar me-2"></i> Relatórios
                </a>
                <form method="post" class="mt-auto">
                    <input type="hidden" name="logout_intent" value="1">
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(csrf_token(), ENT_QUOTES); ?>">
                    <button type="submit" class="list-group-item list-group-item-action bg-transparent text-white border-0 text-start">
                        <i class="fas fa-sign-out-alt me-2"></i> Sair
                    </button>
                </form>
            </div>
        </div>
        
        <!-- Conteúdo da Página -->
        <div id="page-content-wrapper" class="bg-light">
            <nav class="navbar navbar-expand-lg navbar-light bg-white py-3 px-4 shadow-sm">
                <div class="d-flex align-items-center">
                    <i class="fas fa-bars primary-text fs-4 me-3" id="menu-toggle"></i>
                    <h4 class="mb-0">Painel Administrativo</h4>
                </div>
            </nav>
            
            <div class="container-fluid px-4 py-3">
                <div class="tab-content">
                    <!-- Dashboard -->
                    <div class="tab-pane fade show active" id="dashboard">
                        <h3 class="mb-4">Dashboard</h3>
                        
                        <div class="row g-3 mb-2">
                            <div class="col-md-6">
                                <div class="d-flex gap-2 align-items-end">
                                    <div>
                                        <label for="dashboard-date-from" class="form-label mb-1">Data inicial</label>
                                        <input type="date" id="dashboard-date-from" class="form-control">
                                    </div>
                                    <div>
                                        <label for="dashboard-date-to" class="form-label mb-1">Data final</label>
                                        <input type="date" id="dashboard-date-to" class="form-control">
                                    </div>
                                    <button id="dashboard-apply-period" class="btn btn-primary">Aplicar</button>
                                </div>
                            </div>
                        </div>

                        <div class="row g-3 mb-4">
                            <div class="col-md-3">
                                <div class="card text-white bg-primary">
                                    <div class="card-body d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="card-title">Pedidos Hoje</h6>
                                            <h3 class="card-text" id="metric-orders-today">0</h3>
                                        </div>
                                        <i class="fas fa-shopping-cart fa-2x"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-3">
                                <div class="card text-white bg-success">
                                    <div class="card-body d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="card-title">Faturamento</h6>
                                            <h3 class="card-text" id="metric-revenue-today">R$ 0,00</h3>
                                        </div>
                                        <i class="fas fa-money-bill-wave fa-2x"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-3">
                                <div class="card text-white bg-warning">
                                    <div class="card-body d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="card-title">Produtos</h6>
                                            <h3 class="card-text" id="metric-total-products">0</h3>
                                        </div>
                                        <i class="fas fa-box fa-2x"></i>
                                    </div>
                                </div>
                            </div>
                            
                            
                        </div>
                        
                        <div class="row">
                            <div class="col-md-8">
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h5 class="card-title mb-0">Vendas dos Últimos 7 Dias</h5>
                                    </div>
                                    <div class="card-body">
                                        <canvas id="salesChart" height="250"></canvas>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-4">
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h5 class="card-title mb-0">Produtos Mais Vendidos</h5>
                                    </div>
                                    <div class="card-body">
                                        <canvas id="productsChart" height="250"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-12">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="card-title mb-0">Últimos Pedidos</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="table-responsive">
                                            <table class="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>Cliente</th>
                                                        <th>Data</th>
                                                        <th>Valor</th>
                                                        <th>Status</th>
                                                        <th>Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="dashboard-orders-tbody">
                                                    <!-- Carregado via JS -->
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Pedidos -->
                    <div class="tab-pane fade" id="orders">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h3>Gerenciamento de Pedidos</h3>
                            
                            <div class="d-flex gap-2">
                                <div class="input-group">
                                    <input type="text" id="admin-orders-search" class="form-control" placeholder="Buscar pedido...">
                                    <button id="admin-orders-search-btn" class="btn btn-primary"><i class="fas fa-search"></i></button>
                                </div>
                                
                                <div class="dropdown">
                                    <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                        Filtrar por Status
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item status-filter" data-status="" href="#">Todos</a></li>
                                        <li><a class="dropdown-item status-filter" data-status="pending" href="#">Pendentes</a></li>
                                        <li><a class="dropdown-item status-filter" data-status="completed" href="#">Concluídos</a></li>
                                        <li><a class="dropdown-item status-filter" data-status="canceled" href="#">Cancelados</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-body">
                                <div class="table-responsive d-none d-md-block">
                                    <table class="table table-striped" id="admin-orders-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Cliente</th>
                                                <th>Data</th>
                                                <th>Valor</th>
                                                <th>Forma de Entrega</th>
                                                <th>Status</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody id="orders-tbody">
                                            <!-- Carregado via JS -->
                                        </tbody>
                                    </table>
                                </div>
                                <div id="orders-cards" class="d-md-none"></div>
                                
                                <nav>
                                    <ul id="admin-orders-pagination" class="pagination justify-content-center"></ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Produtos -->
                    <div class="tab-pane fade" id="products">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h3>Gerenciamento de Produtos</h3>
                            
                            <div class="d-flex gap-2">
                                <div class="input-group">
                                    <input type="text" id="admin-product-search" class="form-control" placeholder="Buscar produto...">
                                    <button id="admin-product-search-btn" class="btn btn-primary"><i class="fas fa-search"></i></button>
                                </div>
                                
                                <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addProductModal">
                                    <i class="fas fa-plus"></i> Novo Produto
                                </button>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-body">
                                <div class="table-responsive d-none d-md-block">
                                    <table class="table table-striped" id="admin-products-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Imagem</th>
                                                <th>Nome</th>
                                                <th>Preço</th>
                                                <th>Categoria</th>
                                                <th>Estoque</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody id="products-tbody">
                                            <!-- Carregado via JS -->
                                        </tbody>
                                    </table>
                                </div>
                                <div id="products-cards" class="d-md-none"></div>
                                
                                <nav>
                                    <ul id="admin-products-pagination" class="pagination justify-content-center"></ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Relatórios -->
                    <div class="tab-pane fade" id="reports">
                        <h3 class="mb-4">Relatórios e Métricas</h3>
                        
                        <div class="row mb-4">
                            <div class="col-md-12">
                                <div class="card">
                                    <div class="card-header">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <h5 class="card-title mb-0">Filtros</h5>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <form class="row g-3">
                                            <div class="col-md-4">
                                                <label for="date-from" class="form-label">Data Inicial</label>
                                                <input type="date" class="form-control" id="date-from">
                                            </div>
                                            <div class="col-md-4">
                                                <label for="date-to" class="form-label">Data Final</label>
                                                <input type="date" class="form-control" id="date-to">
                                            </div>
                                            <div class="col-md-4">
                                                <label for="report-type" class="form-label">Tipo de Relatório</label>
                                                <select class="form-select" id="report-type">
                                                    <option value="sales">Vendas</option>
                                                    <option value="products">Produtos</option>
                                                    <option value="customers">Clientes</option>
                                                </select>
                                            </div>
                                            <div class="col-12">
                                                <button type="submit" class="btn btn-primary">Gerar Relatório</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h5 class="card-title mb-0">Vendas por Mês</h5>
                                    </div>
                                    <div class="card-body">
                                        <canvas id="monthlySalesChart" height="300"></canvas>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="card mb-4">
                                    <div class="card-header">
                                        <h5 class="card-title mb-0">Vendas por Categoria</h5>
                                    </div>
                                    <div class="card-body">
                                        <canvas id="categorySalesChart" height="300"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-12">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="card-title mb-0">Resumo de Vendas</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="table-responsive">
                                            <table class="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>Mês</th>
                                                        <th>Total de Pedidos</th>
                                                        <th>Faturamento</th>
                                                        <th>Ticket Médio</th>
                                                        <th>Produtos Vendidos</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="reports-summary-tbody">
                                                    <!-- Preenchido via JS -->
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal para Adicionar Produto -->
    <div class="modal fade" id="addProductModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Adicionar Novo Produto</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="product-form">
                        <input type="hidden" id="product-id">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="product-name" class="form-label">Nome do Produto</label>
                                <input type="text" class="form-control" id="product-name" required>
                            </div>
                            <div class="col-md-6">
                                <label for="product-price" class="form-label">Preço (R$)</label>
                                <input type="number" class="form-control" id="product-price" step="0.01" required>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="product-category" class="form-label">Categoria</label>
                                <select class="form-select" id="product-category" required>
                                    <option value="">Selecione uma categoria</option>
                                    <option value="masculino">Masculino</option>
                                    <option value="feminino">Feminino</option>
                                    <option value="infantil">Infantil</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label for="product-stock" class="form-label">Estoque</label>
                                <input type="number" class="form-control" id="product-stock" required>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="product-description" class="form-label">Descrição</label>
                            <textarea class="form-control" id="product-description" rows="3" required></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label for="product-image" class="form-label">Imagem</label>
                            <input type="file" class="form-control" id="product-image">
                            <small class="text-muted">Formatos aceitos: JPG, PNG, WEBP</small>
                            <div class="mt-2">
                                <img id="product-image-preview" src="" alt="Prévia" style="max-width: 120px; display: none;">
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Tamanhos Disponíveis</label>
                            <div class="row">
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-17-18" checked><label class="form-check-label" for="size-17-18">17/18</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-19" checked><label class="form-check-label" for="size-19">19</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-19-20" checked><label class="form-check-label" for="size-19-20">19/20</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-20" checked><label class="form-check-label" for="size-20">20</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-20-21" checked><label class="form-check-label" for="size-20-21">20/21</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-21" checked><label class="form-check-label" for="size-21">21</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-22" checked><label class="form-check-label" for="size-22">22</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-23-24" checked><label class="form-check-label" for="size-23-24">23/24</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-25" checked><label class="form-check-label" for="size-25">25</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-25-26" checked><label class="form-check-label" for="size-25-26">25/26</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-27-28" checked><label class="form-check-label" for="size-27-28">27/28</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-29" checked><label class="form-check-label" for="size-29">29</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-29-30" checked><label class="form-check-label" for="size-29-30">29/30</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-30" checked><label class="form-check-label" for="size-30">30</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-31-32" checked><label class="form-check-label" for="size-31-32">31/32</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-31" checked><label class="form-check-label" for="size-31">31</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-32-33" checked><label class="form-check-label" for="size-32-33">32/33</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-34" checked><label class="form-check-label" for="size-34">34</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-33-34" checked><label class="form-check-label" for="size-33-34">33/34</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-35-36" checked><label class="form-check-label" for="size-35-36">35/36</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-37" checked><label class="form-check-label" for="size-37">37</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-38" checked><label class="form-check-label" for="size-38">38</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-37-38" checked><label class="form-check-label" for="size-37-38">37/38</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-39-40" checked><label class="form-check-label" for="size-39-40">39/40</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-39" checked><label class="form-check-label" for="size-39">39</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-40" checked><label class="form-check-label" for="size-40">40</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-41" checked><label class="form-check-label" for="size-41">41</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-41-42" checked><label class="form-check-label" for="size-41-42">41/42</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-42" checked><label class="form-check-label" for="size-42">42</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-43-44" checked><label class="form-check-label" for="size-43-44">43/44</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-45-46" checked><label class="form-check-label" for="size-45-46">45/46</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-45" checked><label class="form-check-label" for="size-45">45</label></div></div>
                                <div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" id="size-47-48" checked><label class="form-check-label" for="size-47-48">47/48</label></div></div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" id="save-product-btn" class="btn btn-primary">Salvar Produto</button>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>
    
    <!-- Scripts -->
    <script>window.__CSRF__ = '<?php echo htmlspecialchars(csrf_token(), ENT_QUOTES); ?>';</script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
    <script src="../js/admin.js?v=<?php echo filemtime('../js/admin.js'); ?>"></script>
</body>
</html>