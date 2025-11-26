// Carrinho de compras (disponível globalmente)
if (!window.cart) {
    window.cart = [];
}

// Função para formatar preço
function formatPrice(price) {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função para exibir mensagem toast
window.showToast = function(message) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toastElement = document.createElement('div');
    toastElement.className = 'toast show';
    toastElement.style.cssText = `
        background-color: #333;
        color: white;
        padding: 15px 25px;
        border-radius: 4px;
        margin-top: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        animation: fadeIn 0.3s, fadeOut 0.5s 2.5s;
        opacity: 1;
    `;
    toastElement.innerHTML = message;
    
    toastContainer.appendChild(toastElement);
    
    setTimeout(() => {
        toastElement.remove();
    }, 3000);
}

// Função para salvar o carrinho no localStorage
function saveCart() {
    console.log('Salvando carrinho no localStorage:', window.cart);
    try {
        localStorage.setItem('cart', JSON.stringify(window.cart));
        console.log('Carrinho salvo com sucesso no localStorage');
    } catch (error) {
        console.error('Erro ao salvar carrinho no localStorage:', error);
    }
}

// Função para carregar o carrinho do localStorage
function loadCart(shouldOpen = false) {
    console.log('Carregando carrinho do localStorage...');
    try {
        const savedCart = localStorage.getItem('cart');
        console.log('Conteúdo do carrinho no localStorage:', savedCart);
        
        if (savedCart) {
            window.cart = JSON.parse(savedCart);
            console.log('Carrinho carregado com sucesso:', window.cart);
            updateCartUI();
            
            if (shouldOpen) {
                console.log('Abrindo carrinho...');
                openCart();
            }
        } else {
            console.log('Nenhum carrinho encontrado no localStorage');
            window.cart = [];
        }
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        window.cart = [];
    }
    
    console.log('Estado final do carrinho após carregamento:', window.cart);
}

// Função para calcular o total do carrinho
function calculateCartTotal() {
    if (!window.cart || !Array.isArray(window.cart)) return 0;
    return window.cart.reduce((total, item) => {
        if (!item) return total;
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return total + (price * quantity);
    }, 0);
}

// Função para abrir o carrinho
function openCart() {
    document.getElementById('cart-sidebar').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

// Função para fechar o carrinho
function closeCart() {
    document.getElementById('cart-sidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

// Função para adicionar produto ao carrinho
function addToCart(productId, quantity, size) {
    console.log(`Adicionando produto ao carrinho - ID: ${productId}, Quantidade: ${quantity}, Tamanho: ${size}`);
    
    const product = getProductById(parseInt(productId));
    console.log('Produto encontrado:', product);
    
    if (!product) {
        console.error('Produto não encontrado para o ID:', productId);
        return;
    }
    
    // Construir o caminho completo da imagem
    const imageName = product.image || `chinelo${product.id}.jpg`;
    const imagePath = imageName.startsWith('./images/produtos/') ? imageName : `./images/produtos/${imageName}`;
    console.log('Caminho da imagem:', imagePath);
    
    // Verificar se o produto já está no carrinho com o mesmo tamanho
    const existingItemIndex = window.cart.findIndex(item => 
        item && item.id === product.id && item.size === size
    );
    
    console.log('Índice do item existente:', existingItemIndex);
    
    if (existingItemIndex !== -1) {
        // Atualizar quantidade se o produto já estiver no carrinho
        console.log(`Atualizando quantidade do item existente. Quantidade anterior: ${window.cart[existingItemIndex].quantity}, Nova quantidade: ${window.cart[existingItemIndex].quantity + quantity}`);
        window.cart[existingItemIndex].quantity += quantity;
    } else {
        // Adicionar novo item ao carrinho
        const newItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: imagePath,
            quantity: quantity,
            size: size
        };
        console.log('Novo item a ser adicionado:', newItem);
        window.cart.push(newItem);
    }
    
    console.log('Carrinho após adição/atualização:', window.cart);
    
    updateCartUI();
    saveCart();
    showToast('Produto adicionado ao carrinho!');
    openCart();
}

// Função para remover produto do carrinho
function removeFromCart(index) {
    if (window.cart && index >= 0 && index < window.cart.length) {
        window.cart.splice(index, 1);
        updateCartUI();
        saveCart();
    }
}

// Função para atualizar a quantidade de um item
function updateCartItemQuantity(index, newQuantity) {
    if (window.cart && index >= 0 && index < window.cart.length && newQuantity > 0) {
        window.cart[index].quantity = newQuantity;
        updateCartUI();
        saveCart();
    }
}

// Função para atualizar a interface do carrinho
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountElement = document.getElementById('cart-count');
    const cartCountMobileElement = document.getElementById('cart-count-mobile');
    const cartTotalElement = document.getElementById('cart-total-price');
    const checkoutButton = document.getElementById('checkout-button');
    
    if (!cartItemsContainer) {
        console.error('Elemento do carrinho não encontrado');
        return;
    }
    
    const totalItems = window.cart.reduce((total, item) => total + (item?.quantity || 0), 0);
    
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
    if (cartCountMobileElement) {
        cartCountMobileElement.textContent = totalItems;
    }
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center my-4">Seu carrinho está vazio</p>';
        if (checkoutButton) {
            checkoutButton.disabled = true;
        }
    } else {
        if (checkoutButton) {
            checkoutButton.disabled = false;
        }
        
        window.cart.forEach((item, index) => {
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-size">Tamanho: ${item.size}</div>
                    <div class="cart-item-quantity">
                        <button class="decrease-cart-quantity" data-index="${index}">-</button>
                        <input type="number" value="${item.quantity}" min="1" class="cart-quantity-input" data-index="${index}">
                        <button class="increase-cart-quantity" data-index="${index}">+</button>
                    </div>
                    <button class="cart-item-remove" data-index="${index}">Remover</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemElement);
        });
        
        document.querySelectorAll('.decrease-cart-quantity').forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.getAttribute('data-index'));
                updateCartItemQuantity(index, window.cart[index].quantity - 1);
            });
        });
        
        document.querySelectorAll('.increase-cart-quantity').forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.getAttribute('data-index'));
                updateCartItemQuantity(index, window.cart[index].quantity + 1);
            });
        });
        
        document.querySelectorAll('.cart-quantity-input').forEach(input => {
            input.addEventListener('change', () => {
                const index = parseInt(input.getAttribute('data-index'));
                const newValue = parseInt(input.value) || 1;
                updateCartItemQuantity(index, newValue);
            });
        });
        
        document.querySelectorAll('.cart-item-remove').forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.getAttribute('data-index'));
                removeFromCart(index);
            });
        });
    }
    
    if (cartTotalElement) {
        cartTotalElement.textContent = formatPrice(calculateCartTotal());
    }
}

// Função para abrir o modal de checkout
function openCheckoutModal() {
    console.log('Abrindo modal de checkout...');
    try {
        console.log('Carrinho atual:', window.cart);
        
        if (!window.cart || window.cart.length === 0) {
            console.log('Carrinho vazio, exibindo mensagem');
            showToast('Seu carrinho está vazio!');
            return;
        }

        console.log('Procurando elemento do modal...');
        const modalElement = document.getElementById('checkout-modal');
        if (!modalElement) {
            console.error('ERRO: Elemento do modal de checkout não encontrado!');
            return;
        }
        console.log('Elemento do modal encontrado:', modalElement);

        console.log('Fechando carrinho...');
        closeCart();

        console.log('Inicializando modal...');
        
        // Verificar se o Bootstrap está disponível
        if (typeof bootstrap === 'undefined') {
            console.error('ERRO: Bootstrap não está disponível!');
            showToast('Erro: Bootstrap não está carregado corretamente');
            return;
        }
        
        // Verificar se o Modal está disponível
        if (typeof bootstrap.Modal === 'undefined') {
            console.error('ERRO: Bootstrap.Modal não está disponível!');
            showToast('Erro: Bootstrap.Modal não está disponível');
            return;
        }
        
        try {
            const modal = new bootstrap.Modal(modalElement);
            console.log('Modal inicializado com sucesso:', modal);
            
            // Adicionar evento para quando o modal for mostrado
            const onModalShown = function() {
                console.log('Evento shown.bs.modal disparado');
                console.log('Verificando visibilidade do modal:', modalElement.classList.contains('show'));
                
                if (typeof updateOrderSummary === 'function') {
                    console.log('Chamando updateOrderSummary...');
                    updateOrderSummary();
                } else {
                    console.error('ERRO: Função updateOrderSummary não encontrada!');
                }
            };
            
            // Adicionar evento para quando o modal for escondido
            modalElement.addEventListener('hidden.bs.modal', function() {
                console.log('Modal foi fechado');
            });
            
            // Adicionar evento para quando o modal for mostrado
            modalElement.addEventListener('shown.bs.modal', onModalShown);
            
            console.log('Mostrando modal...');
            modal.show();
            
            // Verificar se o modal foi aberto após um curto atraso
            setTimeout(() => {
                console.log('Verificando estado do modal após 500ms...');
                console.log('Modal tem classe show:', modalElement.classList.contains('show'));
                console.log('Modal tem display block:', window.getComputedStyle(modalElement).display === 'block');
                
                // Se o modal ainda não estiver visível, tentar forçar a exibição
                if (!modalElement.classList.contains('show')) {
                    console.log('Tentando forçar a exibição do modal...');
                    modalElement.classList.add('show');
                    modalElement.style.display = 'block';
                    modalElement.setAttribute('aria-modal', 'true');
                    modalElement.setAttribute('role', 'dialog');
                    document.body.classList.add('modal-open');
                    
                    // Adicionar backdrop
                    const backdrop = document.createElement('div');
                    backdrop.className = 'modal-backdrop fade show';
                    document.body.appendChild(backdrop);
                }
            }, 500);
            
        } catch (error) {
            console.error('Erro ao inicializar o modal:', error);
            showToast('Erro ao abrir o checkout. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao abrir modal de checkout:', error);
        showToast('Erro ao abrir o checkout. Tente novamente.');
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    try {
        const cartToggle = document.getElementById('cart-toggle');
        if (cartToggle) {
            cartToggle.addEventListener('click', openCart);
        }

        const cartToggleMobile = document.getElementById('cart-toggle-mobile');
        if (cartToggleMobile) {
            cartToggleMobile.addEventListener('click', openCart);
        }

        const closeCartBtn = document.getElementById('close-cart');
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', closeCart);
        }

        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.addEventListener('click', closeCart);
        }

        const checkoutButton = document.getElementById('checkout-button');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', function(e) {
                e.preventDefault();
                if (typeof openCheckoutModal === 'function') {
                    openCheckoutModal();
                } else {
                    console.error('Função openCheckoutModal não encontrada');
                }
            });
        }

        loadCart(false);
    } catch (error) {
        console.error('Erro ao inicializar o carrinho:', error);
    }
});