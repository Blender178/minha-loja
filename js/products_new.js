// Formatação de preço
function formatPrice(price) {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Dados dos produtos
// Cada produto pode ter um nome customizado de imagem
// Exemplo: image: "meu-chinelo-especial.jpg"
window.products = [
    {
        id: 1,
        name: "Chinelo Tropical",
        price: 39.90,
        description: "Chinelo confortável com estampa tropical, ideal para o verão.",
        category: "masculino",
        sizes: ["33/34", "35/36", "37/38", "39/40", "41/42", "43/44"],
        stock: 25,
        image: "chinelo-tropical.jpg" // Nome customizado da imagem
    },
    {
        id: 2,
        name: "Chinelo Floral",
        price: 35.90,
        description: "Chinelo com estampa floral delicada e solado macio.",
        category: "feminino",
        sizes: ["33/34", "35/36", "37/38", "39/40", "41/42"],
        stock: 18,
        image: "chinelo-floral.jpg" // Nome customizado da imagem
    },
    {
        id: 3,
        name: "Chinelo Listrado",
        price: 29.90,
        description: "Chinelo com listras coloridas e solado antiderrapante.",
        category: "infantil",
        sizes: ["33/34", "35/36", "37/38"],
        stock: 30,
        image: "chinelo-listrado.jpg" // Nome customizado da imagem
    },
    {
        id: 4,
        name: "Chinelo Esportivo",
        price: 45.90,
        description: "Chinelo com design esportivo, ideal para atividades ao ar livre.",
        category: "masculino",
        sizes: ["37/38", "39/40", "41/42", "43/44"],
        stock: 15,
        image: "chinelo-esportivo.jpg" // Nome customizado da imagem
    },
    {
        id: 5,
        name: "Chinelo Casual",
        price: 32.90,
        description: "Chinelo casual com design minimalista, combina com qualquer look.",
        category: "feminino",
        sizes: ["33/34", "35/36", "37/38", "39/40"],
        stock: 22,
        image: "chinelo-casual.jpg" // Nome customizado da imagem
    },
    {
        id: 6,
        name: "Chinelo Esportivo",
        price: 45.90,
        description: "Chinelo com design esportivo, ideal para atividades ao ar livre.",
        category: "masculino",
        sizes: ["37/38", "39/40", "41/42", "43/44"],
        stock: 15,
        image: "chinelo-esportivo.jpg" // Nome customizado da imagem
    },
    {
        id: 7,
        name: "Chinelo Esportivo",
        price: 45.90,
        description: "Chinelo com design esportivo, ideal para atividades ao ar livre.",
        category: "masculino",
        sizes: ["37/38", "39/40", "41/42", "43/44"],
        stock: 15,
        image: "chinelo-esportivo.jpg" // Nome customizado da imagem
    },
    {
        id: 8,
        name: "Chinelo Esportivo",
        price: 45.90,
        description: "Chinelo com design esportivo, ideal para atividades ao ar livre.",
        category: "masculino",
        sizes: ["37/38", "39/40", "41/42", "43/44"],
        stock: 15,
        image: "chinelo-esportivo.jpg" // Nome customizado da imagem
    },
    {
        id: 9,
        name: "Chinelo Esportivo",
        price: 45.90,
        description: "Chinelo com design esportivo, ideal para atividades ao ar livre.",
        category: "masculino",
        sizes: ["37/38", "39/40", "41/42", "43/44"],
        stock: 15,
        image: "chinelo-esportivo.jpg" // Nome customizado da imagem
    },
    {
        id: 10,
        name: "Chinelo Esportivo",
        price: 45.90,
        description: "Chinelo com design esportivo, ideal para atividades ao ar livre.",
        category: "masculino",
        sizes: ["37/38", "39/40", "41/42", "43/44"],
        stock: 15,
        image: "chinelo-esportivo.jpg" // Nome customizado da imagem
    },
    {
        id: 11,
        name: "Chinelo Esportivo",
        price: 45.90,
        description: "Chinelo com design esportivo, ideal para atividades ao ar livre.",
        category: "masculino",
        sizes: ["37/38", "39/40", "41/42", "43/44"],
        stock: 15,
        image: "chinelo-esportivo.jpg" // Nome customizado da imagem
    },
    {
        id: 12,
        name: "Chinelo Esportivo",
        price: 45.90,
        description: "Chinelo com design esportivo, ideal para atividades ao ar livre.",
        category: "masculino",
        sizes: ["37/38", "39/40", "41/42", "43/44"],
        stock: 15,
        image: "chinelo-esportivo.jpg" // Nome customizado da imagem
    },
    {
        id: 13,
        name: "Chinelo Esportivo",
        price: 45.90,
        description: "Chinelo com design esportivo, ideal para atividades ao ar livre.",
        category: "masculino",
        sizes: ["37/38", "39/40", "41/42", "43/44"],
        stock: 15,
        image: "chinelo-esportivo.jpg" // Nome customizado da imagem
    }
];

// Configurações de paginação
const ITEMS_PER_PAGE = 12;
let currentPage = 1;
let currentFilter = 'all';
let currentQuery = '';

// Função para criar paginação
function createPagination(totalItems, currentPage, itemsPerPage) {
    console.log('[pagination] totalItems=', totalItems, 'itemsPerPage=', itemsPerPage);
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    console.log('[pagination] totalPages=', totalPages, 'currentPage=', currentPage);
    if (totalPages <= 1) return '';

    let html = `
        <nav aria-label="Navegação de páginas">
            <ul class="pagination pagination-custom justify-content-center">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>
                </li>`;

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>`;
    }

    html += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage + 1}">Próximo</a>
                </li>
            </ul>
        </nav>`;

    return html;
}

// Carregar produtos
async function loadProducts(filter = 'all', page = 1, query = '') {
    const productsContainer = document.getElementById('products-container');
    const paginationContainer = document.getElementById('pagination-container');
    
    if (!productsContainer || !paginationContainer) return;
    
    // Limpar contêineres
    productsContainer.innerHTML = '';
    paginationContainer.innerHTML = '';
    try {
        // Chamada à API
        const params = new URLSearchParams({
            page: String(page),
            per_page: String(ITEMS_PER_PAGE),
            category: filter || 'all',
            q: query || ''
        });
        const url = `api/products.php?${params.toString()}`;
        console.log('[loadProducts] Fetching:', url);
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const items = Array.isArray(data.items) ? data.items : [];
        const total = Number(data.total || items.length);
        const totalPages = Math.max(1, Number(data.total_pages || Math.ceil(total / ITEMS_PER_PAGE)));
        console.log('[loadProducts] received items=', items.length, 'total=', total, 'totalPages=', totalPages);

        // Cache para buscas por ID
        window.latestProducts = items;

        // Atualizar produtos
        if (items.length === 0) {
            productsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-box-open fa-3x mb-3" style="color: #6c757d;"></i>
                    <h4>Nenhum produto encontrado</h4>
                    <p>Tente ajustar os filtros ou a busca.</p>
                </div>
            `;
        } else {
            items.forEach(product => {
                const card = document.createElement('div');
                card.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
                
                const imagePath = `./images/produtos/${product.image || ''}`;
                
                card.innerHTML = `
                    <div class="product-card product-image-medium" data-id="${product.id}">
                        <div class="product-image-container">
                            <img 
                                src="${imagePath}" 
                                alt="${product.name}" 
                                class="product-image"
                                onerror="this.parentElement.innerHTML = '<div style=\'padding: 40px; text-align: center; background: #f8f9fa; height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center;\'><i class=\'fas fa-image\' style=\'font-size: 3rem; color: #ddd;\'></i><p style=\'color: #6c757d; margin-top: 10px;\'>Sem imagem</p></div>';">
                        </div>
                        <div class="product-details">
                            <h5 class="product-title">${product.name}</h5>
                            <div class="product-price">${formatPrice(product.price)}</div>
                            <div class="product-category">${product.category}</div>
                        </div>
                    </div>
                `;
                
                productsContainer.appendChild(card);
                
                card.querySelector('.product-card').addEventListener('click', () => {
                    openProductModal(product);
                });
            });
            
            // Paginação
            if (total > ITEMS_PER_PAGE) {
                const showingFrom = (page - 1) * ITEMS_PER_PAGE + 1;
                const showingTo = Math.min(page * ITEMS_PER_PAGE, total);
                const infoHTML = `<div class="pagination-info text-center text-muted mb-2">Mostrando ${showingFrom}–${showingTo} de ${total} resultados</div>`;
                const paginationHTML = createPagination(total, page, ITEMS_PER_PAGE);
                paginationContainer.innerHTML = infoHTML + paginationHTML;

                paginationContainer.querySelectorAll('.page-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const newPage = parseInt(link.getAttribute('data-page'));
                        if (newPage >= 1 && newPage <= totalPages) {
                            currentPage = newPage;
                            loadProducts(currentFilter, currentPage, currentQuery);
                            productsContainer.scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                });
            }
        }
    } catch (err) {
        console.error('[loadProducts] error:', err);
        productsContainer.innerHTML = `
            <div class=\"col-12 text-center py-5\">
                <i class=\"fas fa-triangle-exclamation fa-3x mb-3\" style=\"color: #dc3545;\"></i>
                <h4>Erro ao carregar produtos</h4>
                <p>Tente novamente mais tarde.</p>
            </div>
        `;
    }
}

// Função para buscar um produto pelo ID
function getProductById(id) {
    if (Array.isArray(window.latestProducts)) {
        const found = window.latestProducts.find(p => Number(p.id) === Number(id));
        if (found) return found;
    }
    if (Array.isArray(window.products)) {
        return window.products.find(product => Number(product.id) === Number(id));
    }
    return null;
}

// Abrir modal do produto
function openProductModal(product) {
    try {
        // Verificar se o Bootstrap está carregado
        if (typeof bootstrap === 'undefined') {
            console.error('Bootstrap não está carregado!');
            return;
        }
        
        // Verificar se o modal existe
        const modalElement = document.getElementById('product-modal');
        if (!modalElement) {
            console.error('Elemento do modal não encontrado!');
            return;
        }

        // Inicializar o modal
        const modal = new bootstrap.Modal(modalElement);
        
        // Atualizar título
        const titleElement = document.getElementById('modal-product-title');
        if (titleElement) {
            titleElement.textContent = product.name;
        }

        // Atualizar imagem
        const imageElement = document.getElementById('modal-product-image');
        if (imageElement) {
            imageElement.src = `./images/produtos/${product.image}`;
            imageElement.onerror = function() {
                const container = this.parentElement;
                if (container) {
                    container.innerHTML = '<div style="padding: 40px; text-align: center; background: #f8f9fa; height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center;"><i class="fas fa-image" style="font-size: 3rem; color: #ddd;"></i><p style="color: #999; margin-top: 10px;">Sem imagem</p></div>';
                }
            };
        }

        // Atualizar preço
        const priceElement = document.getElementById('modal-product-price');
        if (priceElement) {
            priceElement.textContent = formatPrice(product.price);
        }

        // Atualizar descrição
        const descriptionElement = document.getElementById('modal-product-description');
        if (descriptionElement) {
            descriptionElement.textContent = product.description;
        }

        // Atualizar quantidade
        document.getElementById('product-quantity').value = '1';

        // Atualizar select de tamanhos
        const sizeSelect = document.getElementById('product-size');
        if (sizeSelect) {
            sizeSelect.innerHTML = '';
            sizeSelect.appendChild(new Option('Selecione o tamanho', '', true, true));
            
            product.sizes.forEach(size => {
                const option = new Option(size, size);
                sizeSelect.appendChild(option);
            });
        }

        // Configurar botão de adicionar ao carrinho
        const cartButton = document.getElementById('add-to-cart-btn');
        if (cartButton) {
            cartButton.setAttribute('data-id', product.id);
        }

        // Resetar quantidade para 1
        const quantityInput = document.getElementById('product-quantity');
        if (quantityInput) {
            quantityInput.value = '1';
        }

        // Mostrar o modal
        modal.show();
    } catch (error) {
        console.error('Erro ao abrir o modal:', error);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Carregar produtos na página inicial
    currentFilter = 'all';
    currentQuery = '';
    loadProducts(currentFilter, 1, currentQuery);
    
    // Configurar filtros
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            currentFilter = filter;
            currentPage = 1; // Resetar para a primeira página ao mudar o filtro
            loadProducts(currentFilter, currentPage, currentQuery);
        });
    });

    // Integração da busca do header (desktop e mobile)
    const inputDesktop = document.getElementById('search-input-desktop');
    const buttonDesktop = document.getElementById('search-button-desktop');
    const inputMobile = document.getElementById('search-input-mobile');
    const buttonMobile = document.getElementById('search-button-mobile');

    function executeSearch(query) {
        currentQuery = (query || '').trim();
        // Sincronizar os dois inputs
        if (inputDesktop && document.activeElement !== inputDesktop) inputDesktop.value = currentQuery;
        if (inputMobile && document.activeElement !== inputMobile) inputMobile.value = currentQuery;
        currentPage = 1;
        loadProducts(currentFilter, currentPage, currentQuery);
    }

    if (buttonDesktop && inputDesktop) {
        buttonDesktop.addEventListener('click', () => executeSearch(inputDesktop.value));
        inputDesktop.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeSearch(inputDesktop.value);
            }
        });
    }

    if (buttonMobile && inputMobile) {
        buttonMobile.addEventListener('click', () => executeSearch(inputMobile.value));
        inputMobile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeSearch(inputMobile.value);
            }
        });
    }

    // Configurar evento de adicionar ao carrinho
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            const quantityInput = document.getElementById('product-quantity');
            const sizeSelect = document.getElementById('product-size');
            
            const quantity = parseInt(quantityInput?.value || '1');
            const size = sizeSelect?.value;
            
            if (!size) {
                showToast('Por favor, selecione um tamanho!');
                return;
            }
            
            if (!productId) {
                showToast('Erro ao identificar o produto!');
                return;
            }

            try {
                addToCart(productId, quantity, size);
                const modalElement = document.getElementById('product-modal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            } catch (error) {
                console.error('Erro ao adicionar ao carrinho:', error);
                showToast('Erro ao adicionar ao carrinho. Tente novamente.');
            }
        });
    }
    
    // Controles de quantidade
    if (document.getElementById('product-quantity')) {
        document.getElementById('decrease-quantity').addEventListener('click', () => {
            const input = document.getElementById('product-quantity');
            const value = parseInt(input.value);
            if (value > 1) input.value = value - 1;
        });
        
        document.getElementById('increase-quantity').addEventListener('click', () => {
            const input = document.getElementById('product-quantity');
            input.value = parseInt(input.value) + 1;
        });
    }
});