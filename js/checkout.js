// Garantir que temos acesso ao Bootstrap e ao carrinho
if (typeof bootstrap === 'undefined') {
    console.error('Bootstrap não está carregado!');
}

// Inicializar carrinho se não existir
if (typeof window.cart === 'undefined') {
    window.cart = [];
}

// Mantido para compatibilidade (não utilizado quando não há seleção de bairro)
const deliveryFees = {};

// Formatação de preço em reais
function formatPrice(price) {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Inicialização do botão de checkout (com logs de diagnóstico)
// Função para atualizar totais
function updateTotals(subtotal) {
    const orderTotalElement = document.getElementById('order-total');
    const deliveryMethodSelect = document.getElementById('delivery-method');

    let deliveryFee = 0;
    const isDelivery = deliveryMethodSelect && deliveryMethodSelect.value === 'delivery';
    if (isDelivery) {
        // Sem bairro, considerar taxa 0 por padrão
        deliveryFee = 0;
    }
    
    if (orderTotalElement) orderTotalElement.textContent = formatPrice(subtotal + deliveryFee);
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('checkout.js inicializado');
    
    // Verificar se o Bootstrap está disponível
    console.log('Bootstrap disponível:', typeof bootstrap !== 'undefined');
    if (typeof bootstrap !== 'undefined') {
        console.log('Bootstrap.Modal disponível:', typeof bootstrap.Modal !== 'undefined');
    }
    
    // Verificar se o modal existe
    const modalElement = document.getElementById('checkout-modal');
    console.log('Elemento do modal encontrado:', !!modalElement);
    
    // Verificar se a função updateOrderSummary está disponível
    console.log('updateOrderSummary disponível:', typeof window.updateOrderSummary === 'function');
    
    // Configurar elementos
    const elements = {
        modal: document.getElementById('checkout-modal'),
        deliveryMethod: document.getElementById('delivery-method'),
        paymentMethod: document.getElementById('payment-method'),
        deliveryFields: document.getElementById('delivery-fields'),
        checkoutForm: document.getElementById('checkout-form')
    };
    
    // Carregar carrinho do localStorage
    if (typeof window.cart === 'undefined') {
        window.cart = [];
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                window.cart = JSON.parse(savedCart);
            } catch (e) {
                console.error('Erro ao carregar carrinho:', e);
                window.cart = [];
            }
        }
    }
    
    // Evento para quando o modal for mostrado (compatibilidade com Bootstrap 5)
    if (elements.modal) {
        const modal = new bootstrap.Modal(elements.modal);
        
        // Atualizar o resumo quando o modal for aberto
        elements.modal.addEventListener('shown.bs.modal', function() {
            console.log('Modal de checkout aberto');
            updateOrderSummary();
        });

        // Atualizar o resumo quando o método de entrega for alterado
        if (elements.deliveryMethod) {
            elements.deliveryMethod.addEventListener('change', function() {
                const addressEl = document.getElementById('address');
                const isDelivery = elements.deliveryMethod.value === 'delivery';
                if (addressEl) addressEl.required = isDelivery;
                updateOrderSummary();
            });
        }

        // Sem bairro: nada a fazer aqui
    }
    
    // Evento para o método de entrega (select)
    if (elements.deliveryMethod && elements.deliveryFields) {
        function handleDeliveryMethodChange() {
            const isDelivery = elements.deliveryMethod.value === 'delivery';
            elements.deliveryFields.classList.toggle('d-none', !isDelivery);
            const addressEl = document.getElementById('address');
            if (addressEl) addressEl.required = isDelivery;
            updateOrderSummary();
        }
        elements.deliveryMethod.addEventListener('change', handleDeliveryMethodChange);
        // aplicar estado inicial
        handleDeliveryMethodChange();
    }
});

// Função para formatar preço em reais
function formatPrice(price) {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função para salvar o carrinho no localStorage
function saveCart() {
    if (window.cart && Array.isArray(window.cart)) {
        localStorage.setItem('cart', JSON.stringify(window.cart));
    }
}

// Função para obter o carrinho atual
function getCurrentCart() {
    // Primeiro tenta obter do window.cart (memória)
    if (window.cart && Array.isArray(window.cart)) {
        return window.cart;
    }
    
    // Se não encontrar, tenta obter do localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        try {
            return JSON.parse(savedCart);
        } catch (e) {
            console.error('Erro ao ler carrinho do localStorage:', e);
        }
    }
    
    return [];
}

// Garantir que a função está disponível globalmente
window.updateOrderSummary = function() {
    console.log('=== INÍCIO updateOrderSummary ===');
    
    // Obter elementos do DOM
    const orderSummaryElement = document.getElementById('order-summary');
    const orderTotalElement = document.getElementById('order-total');
    const deliveryMethodSelect = document.getElementById('delivery-method');
    const deliveryFields = document.getElementById('delivery-fields');
    
    console.log('Elementos do DOM:');
    console.log('- orderSummaryElement:', orderSummaryElement ? 'Encontrado' : 'NÃO ENCONTRADO');
    console.log('- orderTotalElement:', orderTotalElement ? 'Encontrado' : 'NÃO ENCONTRADO');
    console.log('- deliveryFields:', deliveryFields ? 'Encontrado' : 'NÃO ENCONTRADO');

    // Verificar elementos necessários
    if (!orderSummaryElement || !orderTotalElement) {
        console.error('ERRO: Elementos necessários não encontrados!');
        console.log('=== FIM updateOrderSummary (erro) ===');
        return;
    }

    // Garantir que window.cart existe e é um array
    if (!window.cart || !Array.isArray(window.cart)) {
        console.log('Carrinho não encontrado ou inválido, inicializando como array vazio');
        window.cart = [];
    }

    console.log('Carrinho atual:', window.cart);
    console.log('Número de itens no carrinho:', window.cart.length);
    
    let html = '';
    let subtotal = 0;
    
    // Verificar se o carrinho está vazio
    if (window.cart.length === 0) {
        console.log('Carrinho vazio, exibindo mensagem de carrinho vazio');
        orderSummaryElement.innerHTML = '<p class="text-center text-muted">Nenhum item no carrinho</p>';
        orderTotalElement.textContent = formatPrice(0);
        
        // Desabilitar botão de finalizar compra
        const submitButton = document.querySelector('#checkout-form button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
        }
        
        console.log('=== FIM updateOrderSummary (carrinho vazio) ===');
        return;
    }

    // Adicionar cabeçalho
    html += '';
    
    // Adicionar itens do carrinho ao resumo
    console.log('Itens no carrinho:', window.cart);
    
    window.cart.forEach((item, index) => {
        console.log(`Processando item ${index}:`, item);
        
        if (!item) {
            console.log(`Item ${index} é inválido, pulando...`);
            return; // Pular itens inválidos
        }
        
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseInt(item.quantity) || 0;
        const itemTotal = itemPrice * itemQuantity;
        subtotal += itemTotal;
        
        console.log(`Item ${index} - Preço: ${itemPrice}, Quantidade: ${itemQuantity}, Total: ${itemTotal}`);
        
        // Garantir que o caminho da imagem está correto
        let imagePath = item.image || '';
        if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('./images/')) {
            imagePath = `./images/produtos/${imagePath}`;
        } else if (!imagePath) {
            imagePath = './images/placeholder.svg';
        }
        
        html += `
            <div class="summary-item d-flex justify-content-between align-items-start mb-3">
                <div class="d-flex align-items-center">
                    <img src="${imagePath}" alt="${item.name || 'Produto'}" class="me-2" 
                        style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
                        onerror="this.onerror=null; this.src='./images/placeholder.svg'">
                    <div>
                        <div class="fw-bold">${item.name || 'Produto sem nome'}</div>
                        <div class="text-muted small">
                            ${item.size ? `Tamanho: ${item.size}<br>` : ''}
                            ${itemQuantity}x ${formatPrice(itemPrice)}
                        </div>
                    </div>
                </div>
                <div class="text-end fw-bold">
                    ${formatPrice(itemTotal)}
                </div>
            </div>`;
    });
    
    // Adicionar linha divisória
    html += '<div class="border-top my-3"></div>';

    // Atualizar container de resumo
    orderSummaryElement.innerHTML = html;

    // Calcular taxa de entrega
    let deliveryFee = 0;
    const isDelivery = deliveryMethodSelect && deliveryMethodSelect.value === 'delivery';
    // Mostrar/ocultar campos de entrega
    if (deliveryFields) {
        deliveryFields.classList.toggle('d-none', !isDelivery);
    }

    // Atualizar total
    if (orderTotalElement) {
        orderTotalElement.textContent = formatPrice(subtotal + deliveryFee);
    }

    // Remover estas linhas pois a lógica foi movida para cima
}



// Função para gerar mensagem do WhatsApp
function generateWhatsAppMessage() {
    const name = document.getElementById('customer-name')?.value || '';
    const address = document.getElementById('address')?.value || '';
    const deliveryMethod = document.getElementById('delivery-method')?.value || 'pickup';
    const paymentMethod = document.getElementById('payment-method')?.value || 'pix';

    let lines = [];
    lines.push('*Novo Pedido*');
    if (name) lines.push(`Cliente: ${name}`);
    lines.push('');

    // Resumo dos itens
    window.cart.forEach(item => {
        if (!item) return;
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseInt(item.quantity) || 0;
        const lineTotal = itemPrice * itemQuantity;
        lines.push(`• ${item.name || 'Produto'}${item.size ? ` (Tam: ${item.size})` : ''}`);
        lines.push(`  ${itemQuantity} x ${formatPrice(itemPrice)} = ${formatPrice(lineTotal)}`);
        lines.push('');
    });

    const subtotal = window.cart.reduce((total, item) => {
        if (!item) return total;
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseInt(item.quantity) || 0;
        return total + (itemPrice * itemQuantity);
    }, 0);
    const deliveryFee = deliveryMethod === 'delivery' ? 0 : 0; // sem bairro, taxa 0 por padrão
    const total = subtotal + deliveryFee;

    // Mostrar somente o Total, conforme solicitado
    lines.push(`Total: ${formatPrice(total)}`);
    lines.push('');
    lines.push(`Forma de Recebimento: ${deliveryMethod === 'delivery' ? 'Entrega' : 'Retirar na Loja'}`);
    if (deliveryMethod === 'delivery' && address) {
        lines.push(`Endereço: ${address}`);
    }
    lines.push(`Forma de Pagamento: ${paymentMethod.toUpperCase()}`);
    lines.push('');
    lines.push('Por favor, poderia verificar a disponibilidade dos itens?');

    return encodeURIComponent(lines.join('\n'));
}

// Inicializar eventos quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Event listener para fechar modal
    const modalElement = document.getElementById('checkout-modal');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', function () {
            const form = document.getElementById('checkout-form');
            if (form) {
                form.reset();
            }
        });
    }

    // Listeners antigos de radios removidos (agora é select)

    // Event listener para alteração do bairro
    const neighborhoodSelect = document.getElementById('neighborhood');
    if (neighborhoodSelect) {
        neighborhoodSelect.addEventListener('change', updateOrderSummary);
    }

    // Base da API relativa à raiz do projeto
    const BASE_API = 'api';

    // Event listener para o formulário de checkout
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('customer-name')?.value || '';
            const method = (document.getElementById('delivery-method')?.value || 'pickup');
            const address = document.getElementById('address')?.value || '';
            const paymentMethod = (document.getElementById('payment-method')?.value || 'pix');
            const isDelivery = method === 'delivery';
            const deliveryFee = isDelivery ? 0 : 0;
            const items = (window.cart || []).filter(Boolean).map(it => ({
                id: it.id,
                name: it.name,
                size: it.size,
                price: parseFloat(it.price) || 0,
                quantity: parseInt(it.quantity) || 0,
            }));

            const payload = {
                customer_name: name,
                delivery_method: method,
                address: address,
                items: items,
                delivery_fee: deliveryFee,
                payment_method: paymentMethod
            };

            const proceed = () => {
                const message = generateWhatsAppMessage();
                const phoneNumber = (window.WHATSAPP_NUMBER || '').replace(/\D+/g, '') || '5500000000000';
                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                // Limpar carrinho e atualizar UI imediatamente
                window.cart = [];
                saveCart();
                if (typeof window.updateCartUI === 'function') {
                    window.updateCartUI();
                }
                // Redirecionar para o WhatsApp
                window.open(whatsappUrl, '_blank');
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('checkout-modal'));
                if (modal) modal.hide();
            };

            // Registrar pedido na API; se falhar, segue para WhatsApp mesmo assim
            fetch(`${BASE_API}/orders.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(() => proceed())
            .catch((err) => { console.error('Falha ao registrar pedido:', err); proceed(); });
        });
    }

    // Atualizar o resumo inicial do pedido
    updateOrderSummary();
})
