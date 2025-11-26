// Admin Dashboard JavaScript

// Função de escape global (usada em múltiplos escopos)
window.esc = window.esc || function(v) {
    const s = String(v ?? '');
    return s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
};

document.addEventListener('DOMContentLoaded', function() {
    // Toggle Sidebar
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('wrapper').classList.toggle('toggled');
        });
    }

// Dashboard: carregar últimos 5 pedidos (tabela do dashboard)
async function loadDashboardLatestOrders() {
    const tbody = document.getElementById('dashboard-orders-tbody');
    if (!tbody) return;
    const API_BASE = '../api';
    try {
        const res = await fetch(`${API_BASE}/orders.php?page=1&per_page=5`);
        if (!res.ok) throw new Error('Falha ao carregar últimos pedidos');
        const data = await res.json();
        const rows = (data.items||[]).map(o => {
            const statusClass = o.status === 'completed' ? 'bg-success' : (o.status === 'canceled' ? 'bg-danger' : 'bg-warning');
            const statusLabel = o.status === 'completed' ? 'Concluído' : (o.status === 'canceled' ? 'Cancelado' : 'Pendente');
            return `
                <tr>
                    <td>#${o.id}</td>
                    <td>${esc(o.customer_name)}</td>
                    <td>${new Date(o.created_at).toLocaleString('pt-BR')}</td>
                    <td>R$ ${Number(o.total_amount).toFixed(2).replace('.', ',')}</td>
                    <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-success order-complete" data-id="${o.id}"><i class="fas fa-check"></i></button>
                            <button class="btn btn-sm btn-danger order-cancel" data-id="${o.id}"><i class="fas fa-times"></i></button>
                            <button class="btn btn-sm btn-outline-danger order-delete" data-id="${o.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
        tbody.innerHTML = rows || '<tr><td colspan="6" class="text-center text-muted">Sem pedidos</td></tr>';
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar</td></tr>';
    }
}

// Atualiza gráficos do Dashboard para o período selecionado
async function updateDashboardCharts(from = '', to = '') {
    const API_BASE = '../api';
    // Time series
    if (window.salesChart) {
        try {
            const params = new URLSearchParams({ stats: 'timeseries' });
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            const r = await fetch(`${API_BASE}/orders.php?${params.toString()}`);
            const d = await r.json();
            const labels = (d.items||[]).map(x => x.d);
            const data = (d.items||[]).map(x => Number(x.v||0));
            window.salesChart.data.labels = labels.map(s => new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
            window.salesChart.data.datasets[0].data = data;
            window.salesChart.update();
        } catch (e) { console.error(e); }
    }
    // Top products
    if (window.productsChart) {
        try {
            const params = new URLSearchParams({ stats: 'top_products' });
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            const r = await fetch(`${API_BASE}/orders.php?${params.toString()}`);
            const d = await r.json();
            const labels = (d.items||[]).map(x => x.name);
            const data = (d.items||[]).map(x => Number(x.qty||0));
            window.productsChart.data.labels = labels;
            window.productsChart.data.datasets[0].data = data;
            window.productsChart.update();
        } catch (e) { console.error(e); }
    }
}

// Preenche tabela de Resumo no Dashboard
async function updateDashboardSummary(from = '', to = '') {
    const API_BASE = '../api';
    const tbody = document.getElementById('dashboard-summary-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Carregando...</td></tr>';
    try {
        const params = new URLSearchParams({ report: 'monthly' });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const res = await fetch(`${API_BASE}/orders.php?${params.toString()}`);
        const d = await res.json();
        const fmt = (v) => (Number(v)||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const rows = (d.items||[]).map(it => `
            <tr>
                <td>${it.ym}</td>
                <td>${it.orders}</td>
                <td>${fmt(it.revenue)}</td>
                <td>${fmt(it.avg_ticket)}</td>
                <td>${it.products_sold || 0}</td>
            </tr>`).join('');
        tbody.innerHTML = rows || '<tr><td colspan="5" class="text-center text-muted">Sem dados no período</td></tr>';
    } catch (e) { console.error(e); tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar</td></tr>'; }
}

// Dashboard Metrics
function initDashboardMetrics() {
    updateMetrics();
    // Atualiza a cada 60s (sem período definido usa hoje)
    setInterval(() => updateMetrics(), 60000);

    const btn = document.getElementById('dashboard-apply-period');
    if (btn) {
        btn.addEventListener('click', () => {
            const from = document.getElementById('dashboard-date-from')?.value || '';
            const to = document.getElementById('dashboard-date-to')?.value || '';
            updateMetrics(from, to);
            updateDashboardCharts(from, to);
            updateDashboardSummary(from, to);
        });
    }
}

async function updateMetrics(from = '', to = '') {
    try {
        const params = new URLSearchParams({ metrics: '1' });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const res = await fetch(`../api/orders.php?${params.toString()}`);
        if (!res.ok) throw new Error('Falha ao carregar métricas');
        const data = await res.json();
        const fmt = (v) => (Number(v)||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
        setText('metric-orders-today', String(data.orders_count ?? data.orders_today ?? 0));
        setText('metric-revenue-today', fmt(data.revenue ?? data.revenue_today ?? 0));
        setText('metric-total-products', String(data.total_products || 0));
    } catch (e) { console.error(e); }
}

    // Initialize Bootstrap Tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize Bootstrap Popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Initialize Charts
    initCharts();
    // Fill dashboard summary initially (default period)
    updateDashboardSummary();

    // Add event listeners for product management
    initProductManagement();

    // Add event listeners for order management
    initOrderManagement();

    // Dashboard metrics
    initDashboardMetrics();

    // Dashboard latest orders
    loadDashboardLatestOrders();

    // Add event listeners for report filters
    initReportFilters();
});

// Initialize Charts
function initCharts() {
    if (typeof Chart === 'undefined') return;

    const API_BASE = '../api';
    const currency = (v) => (Number(v)||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Sales Chart (last 7 days from API)
    const salesChartEl = document.getElementById('salesChart');
    if (salesChartEl) {
        fetch(`${API_BASE}/orders.php?stats=last7days`)
            .then(r => r.json())
            .then(d => {
                const today = new Date();
                const labels = [];
                const data = [];
                const map = new Map((d.items||[]).map(r => [r.d, Number(r.v||0)]));
                for (let i = 6; i >= 0; i--) {
                    const dt = new Date(today);
                    dt.setDate(today.getDate()-i);
                    const key = dt.toISOString().slice(0,10);
                    labels.push(dt.toLocaleDateString('pt-BR', { weekday: 'short' }));
                    data.push(map.get(key) || 0);
                }
                window.salesChart = new Chart(salesChartEl, {
                    type: 'line',
                    data: { labels, datasets: [{ label: 'Vendas (R$)', data, backgroundColor: 'rgba(13, 110, 253, 0.1)', borderColor: 'rgba(13, 110, 253, 1)', borderWidth: 2, tension: 0.3, fill: true }] },
                    options: { responsive: true, plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (ctx) => currency(ctx.raw) } } }, scales: { y: { beginAtZero: true, ticks: { callback: (v)=> 'R$ ' + v } } } }
                });
            }).catch(console.error);
    }

    // Products Chart (top products by qty)
    const productsChartEl = document.getElementById('productsChart');
    if (productsChartEl) {
        fetch(`${API_BASE}/orders.php?stats=top_products`)
            .then(r => r.json())
            .then(d => {
                const labels = (d.items||[]).map(x => x.name);
                const values = (d.items||[]).map(x => Number(x.qty||0));
                window.productsChart = new Chart(productsChartEl, {
                    type: 'doughnut',
                    data: { labels, datasets: [{ data: values, backgroundColor: ['rgba(13,110,253,0.8)','rgba(25,135,84,0.8)','rgba(255,193,7,0.8)','rgba(220,53,69,0.8)','rgba(108,117,125,0.8)'], borderWidth: 1 }] },
                    options: { responsive: true, plugins: { legend: { position: 'right' } } }
                });
            }).catch(console.error);
    }

    // Monthly and Category charts for Reports (init empty, updated by filters)
    const monthlySalesChartEl = document.getElementById('monthlySalesChart');
    if (monthlySalesChartEl) {
        window.monthlySalesChart = new Chart(monthlySalesChartEl, {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Vendas Mensais (R$)', data: [], backgroundColor: 'rgba(13, 110, 253, 0.8)', borderColor: 'rgba(13, 110, 253, 1)', borderWidth: 1 }] },
            options: { responsive: true, plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (ctx)=> currency(ctx.raw) } } }, scales: { y: { beginAtZero: true, ticks: { callback: (v)=> 'R$ ' + v } } } }
        });
    }
    const categorySalesChartEl = document.getElementById('categorySalesChart');
    if (categorySalesChartEl) {
        window.categorySalesChart = new Chart(categorySalesChartEl, {
            type: 'pie',
            data: { labels: [], datasets: [{ data: [], backgroundColor: ['rgba(13,110,253,0.8)','rgba(220,53,69,0.8)','rgba(255,193,7,0.8)','rgba(25,135,84,0.8)','rgba(108,117,125,0.8)'], borderWidth: 1 }] },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });
    }
}

// Product Management
function initProductManagement() {
    const tbody = document.getElementById('products-tbody');
    const pagination = document.getElementById('admin-products-pagination');
    const searchInput = document.getElementById('admin-product-search');
    const searchBtn = document.getElementById('admin-product-search-btn');
    const modalEl = document.getElementById('addProductModal');
    const saveBtn = document.getElementById('save-product-btn');
    const form = document.getElementById('product-form');
    const fileInput = document.getElementById('product-image');
    const imagePreview = document.getElementById('product-image-preview');

    const API_BASE = '../api';
    const PER_PAGE = 12;
    let state = { page: 1, q: '' };

    async function fetchProducts(page = 1, q = '') {
        const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE), category: 'all', q: q });
        const res = await fetch(`${API_BASE}/products.php?${params.toString()}`);
        if (!res.ok) throw new Error('Falha ao carregar produtos');
        return res.json();
    }

    function renderRows(items) {
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!items || items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Nenhum produto encontrado</td></tr>`;
            // limpar cards também
            const cards = document.getElementById('products-cards');
            if (cards) cards.innerHTML = '<div class="text-center text-muted py-3">Nenhum produto encontrado</div>';
            return;
        }
        items.forEach(p => {
            const tr = document.createElement('tr');
            const imgPath = p.image ? `../images/produtos/${p.image}` : '';
            tr.innerHTML = `
                <td>${p.id}</td>
                <td><img src="${imgPath}" alt="Produto" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;" onerror="this.src='../images/placeholder.svg';"></td>
                <td>${esc(p.name)}</td>
                <td>R$ ${Number(p.price).toFixed(2).replace('.', ',')}</td>
                <td>${esc(p.category)}</td>
                <td>${p.stock}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary admin-edit" data-id="${p.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger admin-delete" data-id="${p.id}" data-name="${p.name}"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Render cards para mobile
        const cards = document.getElementById('products-cards');
        if (cards) {
            const html = (items||[]).map(p => {
                const imgPath = p.image ? `../images/produtos/${p.image}` : '';
                return `
                <div class="card mb-2">
                    <div class="card-body d-flex gap-2 align-items-center">
                        <img src="${imgPath}" alt="Produto" class="img-thumbnail" onerror="this.src='../images/placeholder.svg';">
                        <div class="flex-grow-1">
                            <div class="fw-semibold">${esc(p.name)}</div>
                            <div class="small text-muted">Categoria: ${esc(p.category)} • Estoque: ${p.stock}</div>
                            <div class="fw-bold">R$ ${Number(p.price).toFixed(2).replace('.', ',')}</div>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-primary admin-edit" data-id="${p.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger admin-delete" data-id="${p.id}" data-name="${p.name}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>`;
            }).join('');
            cards.innerHTML = html;
        }
    }

    function buildPagination(total, page, perPage) {
        if (!pagination) return;
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        pagination.innerHTML = '';
        const addItem = (label, targetPage, disabled = false, active = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.dataset.page = String(targetPage);
            a.textContent = label;
            if (!disabled) {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    state.page = targetPage;
                    load();
                });
            }
            li.appendChild(a);
            pagination.appendChild(li);
        };
        addItem('Anterior', page - 1, page <= 1);
        for (let i = 1; i <= totalPages; i++) addItem(String(i), i, false, i === page);
        addItem('Próximo', page + 1, page >= totalPages);
    }

    async function load() {
        try {
            if (!tbody) return;
            const data = await fetchProducts(state.page, state.q);
            renderRows(data.items || []);
            buildPagination(Number(data.total || 0), Number(data.page || 1), Number(data.per_page || PER_PAGE));
        } catch (e) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Erro ao carregar produtos</td></tr>`;
            console.error(e);
        }
    }

    // Busca
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => { state.q = searchInput.value.trim(); state.page = 1; load(); });
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); state.q = searchInput.value.trim(); state.page = 1; load(); } });
    }

    // Upload de imagem ao selecionar arquivo
    if (fileInput) {
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch(`${API_BASE}/upload.php`, { method: 'POST', headers: { 'X-CSRF-Token': (window.__CSRF__||'') }, body: fd });
            if (!res.ok) { showToast('Falha no upload da imagem', 'danger'); return; }
            const data = await res.json();
            if (data && data.success) {
                // Guardar filename no input (dataset)
                fileInput.dataset.filename = data.filename;
                if (imagePreview) {
                    imagePreview.src = `../images/produtos/${data.filename}`;
                    imagePreview.style.display = 'inline-block';
                }
                showToast('Imagem enviada com sucesso', 'success');
            } else {
                showToast('Falha no upload da imagem', 'danger');
            }
        });
    }

    // Salvar (criar/editar)
    if (saveBtn && form) {
        saveBtn.addEventListener('click', async () => {
            const id = Number(document.getElementById('product-id').value || 0);
            const name = document.getElementById('product-name').value.trim();
            const price = parseFloat(document.getElementById('product-price').value || '0');
            const category = document.getElementById('product-category').value;
            const stock = parseInt(document.getElementById('product-stock').value || '0');
            const description = document.getElementById('product-description').value.trim();
            const sizes = Array.from(document.querySelectorAll('#addProductModal input.form-check-input[id^="size-"]:checked'))
                .map(inp => {
                    const label = inp.nextElementSibling;
                    return label ? label.textContent.trim() : inp.id.replace(/^size-/, '').replace('-', '/');
                });
            const image = fileInput?.dataset?.filename || '';

            const payload = { id, name, price, description, category, sizes, stock, image };

            try {
                const res = await fetch(`${API_BASE}/products.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': (window.__CSRF__||'') },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Falha ao salvar');
                const data = await res.json();
                if (data && data.success) {
                    showToast('Produto salvo com sucesso!', 'success');
                    // Resetar e fechar modal
                    form.reset();
                    if (fileInput) { delete fileInput.dataset.filename; }
                    if (imagePreview) { imagePreview.style.display = 'none'; imagePreview.src = ''; }
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    modal && modal.hide();
                    // Recarregar lista
                    load();
                } else {
                    showToast(data?.message || 'Erro ao salvar', 'danger');
                }
            } catch (e) {
                console.error(e);
                showToast('Erro ao salvar produto', 'danger');
            }
        });
    }

    // Delegação: editar / excluir
    tbody?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = Number(target.dataset.id || 0);
        if (target.classList.contains('admin-delete')) {
            const name = target.dataset.name || '';
            if (confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) {
                fetch(`${API_BASE}/products.php?id=${id}`, { method: 'DELETE', headers: { 'X-CSRF-Token': (window.__CSRF__||'') } })
                    .then(res => { if (!res.ok) throw new Error('Falha ao excluir'); return res.json(); })
                    .then(() => { showToast('Produto excluído!', 'success'); load(); })
                    .catch(err => { console.error(err); showToast('Erro ao excluir', 'danger'); });
            }
        }
        if (target.classList.contains('admin-edit')) {
            // Buscar dados atuais (linha já tem)
            const tr = target.closest('tr');
            const name = tr.children[2].textContent;
            const priceText = tr.children[3].textContent.replace('R$','').trim().replace('.', '').replace(',', '.');
            const category = tr.children[4].textContent.trim();
            const stock = parseInt(tr.children[5].textContent || '0');
            // Preencher modal
            document.getElementById('product-id').value = String(id);
            document.getElementById('product-name').value = name;
            document.getElementById('product-price').value = Number(priceText).toFixed(2);
            document.getElementById('product-category').value = category;
            document.getElementById('product-stock').value = String(stock);
            document.getElementById('product-description').value = '';
            // Reset sizes para default marcados
            document.querySelectorAll('#addProductModal input.form-check-input[id^="size-"]').forEach(el => { el.checked = true; });
            // Limpar preview (não temos filename aqui, permanece)
            if (fileInput) { delete fileInput.dataset.filename; }
            if (imagePreview) { imagePreview.style.display = 'none'; imagePreview.src = ''; }
            // Abrir modal
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    });

    // Abrir modal para novo produto limpa o formulário
    document.querySelector('[data-bs-target="#addProductModal"]')?.addEventListener('click', () => {
        form?.reset();
        const hidden = document.getElementById('product-id');
        if (hidden) hidden.value = '';
        if (fileInput) { delete fileInput.dataset.filename; }
        if (imagePreview) { imagePreview.style.display = 'none'; imagePreview.src = ''; }
    });

    // Carregar lista inicial
    load();
}

// Order Management
function initOrderManagement() {
    const tbody = document.getElementById('orders-tbody');
    const pagination = document.getElementById('admin-orders-pagination');
    const searchInput = document.getElementById('admin-orders-search');
    const searchBtn = document.getElementById('admin-orders-search-btn');
    const statusFilters = document.querySelectorAll('.status-filter');
    const API_BASE = '../api';
    const PER_PAGE = 10;
    let state = { page: 1, q: '', status: '' };

    async function fetchOrders(page = 1, q = '', status = '') {
        const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
        if (q) params.set('q', q);
        if (status) params.set('status', status);
        const res = await fetch(`${API_BASE}/orders.php?${params.toString()}`);
        if (!res.ok) throw new Error('Falha ao carregar pedidos');
        return res.json();
    }

    function renderRows(items) {
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!items || items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Nenhum pedido encontrado</td></tr>`;
            const cards = document.getElementById('orders-cards');
            if (cards) cards.innerHTML = '<div class="text-center text-muted py-3">Nenhum pedido encontrado</div>';
            return;
        }
        items.forEach(o => {
            const tr = document.createElement('tr');
            const statusClass = o.status === 'completed' ? 'bg-success' : (o.status === 'canceled' ? 'bg-danger' : 'bg-warning');
            tr.innerHTML = `
                <td>#${o.id}</td>
                <td>${esc(o.customer_name)}</td>
                <td>${new Date(o.created_at).toLocaleString('pt-BR')}</td>
                <td>R$ ${Number(o.total_amount).toFixed(2).replace('.', ',')}</td>
                <td>${o.delivery_method === 'delivery' ? 'Entrega' : 'Retirada na Loja'}${o.neighborhood ? ' - ' + esc(o.neighborhood) : ''}</td>
                <td><span class="badge ${statusClass}">${o.status === 'completed' ? 'Concluído' : (o.status === 'canceled' ? 'Cancelado' : 'Pendente')}</span></td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-success order-complete" data-id="${o.id}"><i class="fas fa-check"></i></button>
                        <button class="btn btn-sm btn-danger order-cancel" data-id="${o.id}"><i class="fas fa-times"></i></button>
                        <button class="btn btn-sm btn-outline-danger order-delete" data-id="${o.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function buildPagination(total, page, perPage) {
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        pagination.innerHTML = '';
        const addItem = (label, targetPage, disabled = false, active = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.dataset.page = String(targetPage);
            a.textContent = label;
            if (!disabled) {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    state.page = targetPage;
                    load();
                });
            }
            li.appendChild(a);
            pagination.appendChild(li);
        };
        addItem('Anterior', page - 1, page <= 1);
        for (let i = 1; i <= totalPages; i++) addItem(String(i), i, false, i === page);
        addItem('Próximo', page + 1, page >= totalPages);
    }

    async function load() {
        try {
            if (!tbody) return;
            const data = await fetchOrders(state.page, state.q, state.status);
            renderRows(data.items || []);
            buildPagination(Number(data.total || 0), Number(data.page || 1), Number(data.per_page || PER_PAGE));
        } catch (e) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Erro ao carregar pedidos</td></tr>`;
            console.error(e);
        }
    }

    // Busca
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => { state.q = searchInput.value.trim(); state.page = 1; load(); });
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); state.q = searchInput.value.trim(); state.page = 1; load(); } });
    }
    // Filtro status
    statusFilters.forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); state.status = a.dataset.status || ''; state.page = 1; load(); }));

    // Delegação: atualizar status
    tbody?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = Number(btn.dataset.id || 0);
        if (!id) return;
        let status = '';
        if (btn.classList.contains('order-complete')) status = 'completed';
        if (btn.classList.contains('order-cancel')) status = 'canceled';
        if (status) {
            try {
                const res = await fetch(`${API_BASE}/orders.php`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': (window.__CSRF__||'') }, body: JSON.stringify({ id, status }) });
                if (!res.ok) throw new Error('Falha ao atualizar status');
                showToast('Pedido atualizado!', 'success');
                load();
                updateMetrics();
            } catch (err) { console.error(err); showToast('Erro ao atualizar', 'danger'); }
            return;
        }
        if (btn.classList.contains('order-delete')) {
            if (!confirm('Deseja realmente excluir este pedido? Esta ação não pode ser desfeita.')) return;
            try {
                const res = await fetch(`${API_BASE}/orders.php?id=${id}`, { method: 'DELETE', headers: { 'X-CSRF-Token': (window.__CSRF__||'') } });
                if (!res.ok) throw new Error('Falha ao excluir pedido');
                showToast('Pedido excluído!', 'success');
                load();
                updateMetrics();
            } catch (err) { console.error(err); showToast('Erro ao excluir pedido', 'danger'); }
        }
    });

    // Carregar lista inicial
    load();
}

// Report Filters
function initReportFilters() {
    const reportForm = document.querySelector('#reports form');
    if (!reportForm) return;
    const API_BASE = '../api';
    const currency = (v) => (Number(v)||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    async function loadReports() {
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;
        const params = new URLSearchParams();
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);

        // Monthly
        try {
            const resM = await fetch(`${API_BASE}/orders.php?report=monthly&${params.toString()}`);
            if (resM.ok) {
                const d = await resM.json();
                const labels = (d.items||[]).map(x => x.ym);
                const values = (d.items||[]).map(x => Number(x.revenue||0));
                if (window.monthlySalesChart) {
                    window.monthlySalesChart.data.labels = labels;
                    window.monthlySalesChart.data.datasets[0].data = values;
                    window.monthlySalesChart.update();
                }
                const tbody = document.getElementById('reports-summary-tbody');
                if (tbody) {
                    const fmt = (v) => (Number(v)||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    const rows = (d.items||[]).map(it => `
                        <tr>
                            <td>${it.ym}</td>
                            <td>${it.orders}</td>
                            <td>${fmt(it.revenue)}</td>
                            <td>${fmt(it.avg_ticket)}</td>
                            <td>${it.products_sold || 0}</td>
                        </tr>`).join('');
                    tbody.innerHTML = rows || '<tr><td colspan="5" class="text-center text-muted">Sem dados no período</td></tr>';
                }
            }
        } catch (e) { console.error(e); }

        // Category
        try {
            const resC = await fetch(`${API_BASE}/orders.php?report=category&${params.toString()}`);
            if (resC.ok) {
                const d = await resC.json();
                const labels = (d.items||[]).map(x => x.category || 'N/A');
                const values = (d.items||[]).map(x => Number(x.qty||0));
                if (window.categorySalesChart) {
                    window.categorySalesChart.data.labels = labels;
                    window.categorySalesChart.data.datasets[0].data = values;
                    window.categorySalesChart.update();
                }
            }
        } catch (e) { console.error(e); }

        showToast('Relatório gerado com sucesso!', 'success');
    }

    reportForm.addEventListener('submit', function(e) {
        e.preventDefault();
        loadReports();
    });

    // Carrega ao abrir a aba pela primeira vez
    loadReports();
}

// Show Toast Notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    // Create toast content
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toastEl);
    
    // Initialize and show toast
    const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 3000 });
    toast.show();
    
    // Remove toast after it's hidden
    toastEl.addEventListener('hidden.bs.toast', function() {
        toastEl.remove();
    });
}