<?php require_once __DIR__ . '/../config.php'; 
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chinellus Rondonópolis</title>
        <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous">

    <!-- Estilos personalizados (devem vir por último!) -->
    <style>
      #preloader { position: fixed; inset: 0; background: #ffffffff; display: flex; align-items: center; justify-content: center; z-index: 2000; transition: opacity .3s ease, visibility .3s ease; }
      #preloader.hidden { opacity: 0; visibility: hidden; }
      #preloader .loader { width: 48px; height: 48px; border: 4px solid #ff9807ff; border-top-color: transparent; border-radius: 50%; animation: pre_spin 1s linear infinite; }
      @keyframes pre_spin { to { transform: rotate(360deg); } }
    </style>
    <link rel="stylesheet" href="css/style.css?v=3">
    <!-- Inicializar variáveis globais -->
    <script>
        // Garantir que o objeto cart existe
        window.cart = window.cart || [];
        console.log('Inicializando carrinho...');
    </script>
</head>
<body>
    <div id="preloader" aria-hidden="true"><div class="loader"></div></div>
    <?php $mapsUrl = env_get('STORE_MAPS_URL', ''); if (!empty($mapsUrl)): ?>
    <div class="w-100 tipbar" style="background:#000000; color:#fff; position: sticky; top: 0; z-index: 1031;">
        <div class="container text-center py-2" style="font-size: .75rem;">
            <a href="<?php echo htmlspecialchars($mapsUrl); ?>" target="_blank" rel="noopener" class="text-white" style="text-decoration: none;">
                <i class="fas fa-map-marker-alt me-2"></i> Av. Rotary Internacional, 847 - Vila Sao Sebastiao II, Rondonópolis - MT, 78730-289
            </a>
        </div>
    </div>
    <style>
        /* Quando a tipbar existe, deslocar o header para não sobrepor */
        header { top: 30px; }
    </style>
    <?php endif; ?>
    <!-- Cabeçalho -->
    <header class="text-black py-2">
        <div class="container">
            <!-- Navbar para Mobile -->
            <nav class="navbar navbar-expand-lg navbar-dark p-0">
                <div class="container-fluid px-0">
                    <!-- Logo -->
                    <a class="navbar-brand mb-0 h1" href="#">Chinellusroo</a>

                    <!-- Botões Mobile (Busca e Carrinho) -->
                    <div class="d-flex align-items-center gap-2 d-lg-none">
                        <button class="btn btn-light btn-sm" type="button" data-bs-toggle="collapse" data-bs-target="#searchCollapse" style="background-color: #000; border-color: #000; color: #fff">
                            <i class="fas fa-search"></i>
                        </button>
                        <button id="cart-toggle-mobile" class="btn btn-light btn-sm position-relative">
                            <i class="fas fa-shopping-cart"></i>
                            <span id="cart-count-mobile" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">0</span>
                        </button>
                    </div>

                    <!-- Container Desktop -->
                    <div class="collapse navbar-collapse" id="navbarContent">
                        <!-- Barra de Busca Desktop -->
                        <div class="col-lg-5 mx-auto d-none d-lg-block">
                            <div class="input-group">
                                <input type="text" id="search-input-desktop" class="form-control" placeholder="Buscar produtos..." style="width: 320px;">
                                <button id="search-button-desktop" class="btn btn-light" type="button"><i class="fas fa-search"></i></button>
                            </div>
                        </div>

                        

                        <!-- Carrinho Desktop -->
                        <div class="d-none d-lg-block">
                            <button id="cart-toggle" class="btn btn-light position-relative">
                                <i class="fas fa-shopping-cart"></i>
                                <span id="cart-count" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">0</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <!-- Busca Mobile (Colapsável) -->
            <div class="collapse mt-2" id="searchCollapse">
                <div class="input-group">
                    <input type="text" id="search-input-mobile" class="form-control" placeholder="Buscar produtos...">
                    <button id="search-button-mobile" class="btn btn-light" type="button"><i class="fas fa-search"></i></button>
                </div>
            </div>
        </div>
    </header>

    <!-- Carrinho Lateral -->
    <div id="cart-sidebar" class="cart-sidebar">
        <div class="cart-header">
            <h3>Seu Carrinho</h3>
            <button id="close-cart" class="btn-close"></button>
        </div>
        <div id="cart-items" class="cart-items">
            <!-- Itens do carrinho serão adicionados aqui via JavaScript -->
        </div>
        <div class="cart-footer">
            <div class="cart-total">
                <span>Total:</span>
                <span id="cart-total-price">R$ 0,00</span>
            </div>
            <button id="checkout-button" class="btn btn-success w-100">Finalizar Compra</button>
        </div>
    </div>

    <!-- Conteúdo Principal -->
    <main class="container my-5">
        <h2 class="text-center mb-4">Nossos Chinelos</h2>
        
        <!-- Filtros -->
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="d-flex justify-content-center flex-wrap gap-2">
                    <button class="btn btn-outline-primary filter-btn active" data-filter="all">Todos</button>
                    <button class="btn btn-outline-primary filter-btn" data-filter="masculino">Masculino</button>
                    <button class="btn btn-outline-primary filter-btn" data-filter="feminino">Feminino</button>
                    <button class="btn btn-outline-primary filter-btn" data-filter="infantil">Infantil</button>
                </div>
            </div>
        </div>
        
        <!-- Lista de Produtos -->
        <div id="products-container" class="row">
            <!-- Os produtos serão carregados dinamicamente via JavaScript -->
        </div>
    </main>

    <!-- Modal de Detalhes do Produto -->
    <div class="modal fade" id="product-modal" tabindex="-1" role="dialog" aria-labelledby="modal-product-title" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modal-product-title">Nome do Produto</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <img id="modal-product-image" src="" alt="Produto" class="img-fluid rounded">
                        </div>
                        <div class="col-md-6">
                            <h4 id="modal-product-price">R$ 0,00</h4>
                            <p id="modal-product-description">Descrição do produto</p>
                            
                            <div class="mb-3">
                                <label for="product-size" class="form-label">Tamanho</label>
                                <select id="product-size" class="form-select">
                                    <option value="17/18">17/18</option>
                                    <option value="19">19</option>
                                    <option value="19/20">19/20</option>
                                    <option value="20">20</option>
                                    <option value="20/21">20/21</option>
                                    <option value="21">21</option>
                                    <option value="22">22</option>
                                    <option value="23/24">23/24</option>
                                    <option value="25">25</option>
                                    <option value="25/26">25/26</option>
                                    <option value="27/28">27/28</option>
                                    <option value="29">29</option>
                                    <option value="29/30">29/30</option>
                                    <option value="30">30</option>
                                    <option value="31/32">31/32</option>
                                    <option value="31">31</option>
                                    <option value="32/33">32/33</option>
                                    <option value="34">34</option>
                                    <option value="33/34">33/34</option>
                                    <option value="35/36">35/36</option>
                                    <option value="37">37</option>
                                    <option value="38">38</option>
                                    <option value="37/38">37/38</option>
                                    <option value="39/40">39/40</option>
                                    <option value="39">39</option>
                                    <option value="40">40</option>
                                    <option value="41">41</option>
                                    <option value="41/42">41/42</option>
                                    <option value="42">42</option>
                                    <option value="43/44">43/44</option>
                                    <option value="45/46">45/46</option>
                                    <option value="45">45</option>
                                    <option value="47/48">47/48</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="product-quantity" class="form-label">Quantidade</label>
                                <div class="input-group">
                                    <button id="decrease-quantity" class="btn btn-outline-secondary">-</button>
                                    <input type="number" id="product-quantity" class="form-control text-center" value="1" min="1">
                                    <button id="increase-quantity" class="btn btn-outline-secondary">+</button>
                                </div>
                            </div>
                            
                            <button id="add-to-cart-btn" class="btn btn-success w-100">Adicionar ao Carrinho</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal de Checkout -->
    <div class="modal fade" id="checkout-modal" tabindex="-1" role="dialog" aria-labelledby="modal-checkout-title" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Finalizar Compra</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="checkout-form">
                        <div class="mb-3">
                            <label for="customer-name" class="form-label">Nome e Sobrenome</label>
                            <input type="text" class="form-control" id="customer-name" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label" for="delivery-method">Forma de Recebimento</label>
                            <select class="form-select" id="delivery-method">
                                <option value="pickup" selected>Retirar na Loja</option>
                                <option value="delivery">Entrega (Com a taxa de entrega)</option>
                            </select>
                        </div>
                        
                        <div id="delivery-fields" class="mb-3 d-none">
                            <label for="address" class="form-label">Endereço Completo</label>
                            <textarea class="form-control" id="address" rows="3" placeholder="Rua, número, ponto de referência..."></textarea>
                        </div>

                        
                        <div class="mb-3">
                            <label class="form-label" for="payment-method">Forma de Pagamento</label>
                            <select class="form-select" id="payment-method">
                                <option value="pix" selected>PIX</option>
                                <option value="dinheiro">Dinheiro</option>
                            </select>
                        </div>
                        
                        <div class="mb-3">
                            <div id="order-summary" class="bg-white border p-3 rounded">
                                <!-- Resumo do pedido será preenchido via JavaScript -->
                            </div>
                            
                            <div class="d-flex justify-content-between mt-2 fw-bold">
                                <span>Total:</span>
                                <span id="order-total">R$ 0,00</span>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn w-100" style="background-color: #23801a; color: #fff; padding: 10px 0;" >Enviar Pedido via WhatsApp</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Container de Paginação -->
    <div id="pagination-container" class="container mb-4"></div>

    <!-- Footer -->
    <footer class="bg-dark text-white py-4 mt-5">
        <div class="container">
            <div class="row">
                <div class="col-md-4">
                    <h5>Chinellusroo</h5>
                    <p>Sua loja favorita de chinelos!</p>
                </div>
                <div class="col-md-4">
                    <h5>Contato</h5>
                    <ul class="list-unstyled">
                        <li><i class="fas fa-phone me-2"></i>(66) 9 9215-0407</li>
                        <li><i class="fas fa-envelope me-2"></i>chinellusloja275@gmail.com</li>
                        <?php $mapsUrl = env_get('STORE_MAPS_URL', ''); if (!empty($mapsUrl)): ?>
                        <li>
                            <i class="fas fa-map-marker-alt me-2"></i>
                            <a href="<?php echo htmlspecialchars($mapsUrl); ?>" class="text-white text-decoration-underline" target="_blank" rel="noopener">Como chegar</a>
                        </li>
                        <?php endif; ?>
                    </ul>
                </div>
                <div class="col-md-4">
                    <h5>Redes Sociais</h5>
                    <div class="social-links">
                        <a href="https://www.facebook.com/chinellusroo/" class="text-white me-3" target="_blank"><i class="fab fa-facebook-f"></i></a>
                        <a href="https://www.instagram.com/chinellusrondonopolis/" class="text-white me-3" target="_blank"><i class="fab fa-instagram"></i></a>
                        <a href="https://api.whatsapp.com/send/?phone=556692150407" class="text-white me-3" target="_blank"><i class="fab fa-whatsapp"></i></a>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12 text-center">
                    <p class="mb-0">&copy; 2025 Chinellusroo. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    </footer>

    <!-- Toast Container -->
    <div id="toast-container" style="position: fixed; top: 20px; right: 20px; z-index: 1060;"></div>

    <!-- Overlay de Fundo -->
    <div id="overlay" class="overlay"></div>

    <!-- Botão WhatsApp Flutuante -->
    <a href="https://wa.me/<?php echo htmlspecialchars(env_get('WHATSAPP_NUMBER', '')); ?>?text=Ol%C3%A1%2C%20quero%20fazer%20um%20pedido" class="whatsapp-float" target="_blank" rel="noopener" aria-label="WhatsApp">
        <i class="fab fa-whatsapp"></i>
    </a>

    <!-- Scripts do Bootstrap -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
    
    <!-- Definir window.WHATSAPP_NUMBER com o número do .env para uso no checkout.js -->
    <script>window.WHATSAPP_NUMBER = '<?php echo htmlspecialchars(env_get('WHATSAPP_NUMBER', ''), ENT_QUOTES); ?>';</script>
    
    <!-- Carregar scripts na ordem correta -->
    <script src="js/products_new.js?v=3"></script>
    <script src="js/cart_new.js?v=3"></script>
    <script src="js/checkout.js?v=3"></script>
    <script src="js/main.js?v=3"></script>
    <script>
      (function(){
        function hidePreloader(){
          var el = document.getElementById('preloader');
          if (el && !el.classList.contains('hidden')) { el.classList.add('hidden'); }
        }
        // Esconde após todos os recursos carregarem
        window.addEventListener('load', hidePreloader);
        // Fallback: se algo impedir o evento load, oculta após 3.5s
        setTimeout(hidePreloader, 3500);
      })();
    </script>
    
    <!-- Script de inicialização -->
    <script>
        // Verificar se o Bootstrap está carregado
        console.log('Bootstrap carregado:', typeof bootstrap !== 'undefined');
        
        // Inicialização quando o DOM estiver totalmente carregado
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM totalmente carregado');
            
            // Verificar se o Bootstrap foi carregado corretamente
            if (typeof bootstrap === 'undefined') {
                console.error('ERRO: Bootstrap não foi carregado corretamente!');
                return;
            }
            
            console.log('Bootstrap carregado com sucesso');
            
            // Deixe o js/cart_new.js gerenciar o clique do botão de checkout
            const checkoutButton = document.getElementById('checkout-button');
            if (checkoutButton) {
                console.log('Botão de checkout será gerenciado por cart_new.js');
            }
        });
        
        // Bloco removido que utilizava loadScript (não definido)
    </script>
</body>
</html>
