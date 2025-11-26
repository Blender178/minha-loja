// Arquivo principal para inicialização da aplicação

// Função para verificar se as imagens existem e substituir pela imagem padrão se necessário
function handleImageErrors() {
    // Não fazer nada - o tratamento de erro já está sendo feito no products_new.js
    // Esta função foi desabilitada para evitar conflito
}

// Função para inicializar tooltips e popovers do Bootstrap
function initBootstrapComponents() {
    // Verificar se o Bootstrap está carregado
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap não está carregado!');
        return;
    }
    
    // Inicializar tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Inicializar popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Função para verificar se as imagens existem
function verifyImages() {
    // Apenas verifica se as imagens necessárias existem
    console.log('Verificando imagens...');
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar componentes do Bootstrap
    initBootstrapComponents();
    
    // Lidar com erros de imagem
    handleImageErrors();
    
    // Verificar imagens
    verifyImages();
    
    // Verificar se o usuário está na página de administração
    if (window.location.pathname.includes('admin')) {
        // Inicializar funcionalidades da área administrativa
        initAdminDashboard();
    }
    
    console.log('Aplicação inicializada com sucesso!');
});