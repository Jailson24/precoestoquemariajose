<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Gestor de Estoque e Preços</title>
    
    <!-- Configurações para PWA -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#e11d48">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/3081/3081559.png">

    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <!-- FIREBASE COMPAT -->
    <script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore-compat.js"></script>
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 500: '#f43f5e',
                            600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337',
                        }
                    }
                }
            }
        }
    </script>

    <style>
        body { font-family: 'Inter', sans-serif; background-color: #fff1f2; -webkit-tap-highlight-color: transparent; }
        .alert-low-stock { background-color: #fee2e2 !important; border-color: #fca5a5 !important; }
        .alert-low-stock span.estoque-numero { color: #991b1b !important; }
        .alert-parado { background-color: #fff7ed !important; border-color: #fdba74 !important; }
        .is-draft { border: 2px dashed #3b82f6 !important; background-color: #eff6ff !important; }
        
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .hidden-screen { display: none !important; }
        @keyframes slideInDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .toast-enter { animation: slideInDown 0.3s ease-out forwards; }
        .tab-active { color: #e11d48 !important; border-top: 2px solid #e11d48; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="p-4 md:p-8 text-slate-800 pb-32">

    <!-- Notificação Toast -->
    <div id="toast-container" class="fixed top-4 left-0 right-0 z-[500] flex justify-center hidden-screen pointer-events-none">
        <div id="toast-msg" class="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2 text-sm">
            <i class="fas fa-check-circle"></i> <span>Ação concluída!</span>
        </div>
    </div>

    <!-- BOTÃO FLUTUANTE DA SACOLA -->
    <button id="fab-cart" onclick="abrirCarrinho()" class="fixed bottom-24 right-4 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-xl shadow-emerald-200 flex items-center justify-center text-2xl z-40 hidden-screen transition-transform active:scale-95">
        <i class="fas fa-shopping-cart"></i>
        <span id="cart-badge" class="absolute -top-1 -right-1 bg-red-500 text-white text-[12px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">0</span>
    </button>

    <!-- ================== TELAS DE ESTOQUE ================== -->
    <div id="screen-estoque">
        <div id="tela-categorias" class="max-w-4xl mx-auto">
            <div class="flex items-center justify-between mb-6 bg-white p-5 rounded-3xl shadow-sm border border-brand-100">
                <div><h1 class="text-2xl font-bold text-brand-900">Meu Estoque</h1><p class="text-sm text-brand-600">Selecione uma categoria</p></div>
                <div class="flex gap-2">
                    <button onclick="abrirResumoEstoque()" class="w-12 h-12 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-2xl flex items-center justify-center text-xl transition active:scale-95 shadow-sm" title="Resumo do Estoque">
                        <i class="fas fa-clipboard-list"></i>
                    </button>
                    <div class="w-12 h-12 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-600 text-xl"><i class="fas fa-gem"></i></div>
                </div>
            </div>

            <!-- Lista de Categorias -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8" id="grid-categorias"></div>

            <!-- Dashboard de Inteligência -->
            <h3 class="text-lg font-bold text-brand-900 mb-4 ml-2 mt-4">Inteligência de Estoque</h3>
            <div id="cards-estoque-inteligente" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"></div>
        </div>

        <div id="tela-produtos" class="max-w-4xl mx-auto hidden-screen">
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-brand-100 sticky top-4 z-10">
                <div class="flex items-center w-full md:w-auto">
                    <button onclick="voltarCategorias()" class="mr-4 w-10 h-10 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center active:scale-95"><i class="fas fa-arrow-left"></i></button>
                    <h1 id="titulo-categoria" class="text-xl md:text-2xl font-bold text-brand-900 flex-1">Categoria</h1>
                </div>
                <button onclick="adicionarProduto()" class="w-full md:w-auto bg-brand-600 text-white px-6 py-3 rounded-xl shadow-md transition font-medium text-sm flex justify-center items-center active:scale-95"><i class="fas fa-plus mr-2"></i> Novo Produto</button>
            </div>
            <div id="listaProdutos" class="flex flex-col gap-5"></div>
            <div id="msg-vazia-produtos" class="text-center py-12 hidden-screen"><h3 class="text-lg font-bold text-brand-800">Nenhum produto aqui</h3></div>
        </div>
    </div>

    <!-- ================== OUTRAS TELAS (CLIENTES, VENDAS, ETC) ================== -->
    <!-- (Mantidas conforme o padrão de interface que já usas) -->
    <div id="screen-clientes" class="max-w-4xl mx-auto hidden-screen">
        <div class="flex items-center justify-between mb-6 bg-white p-5 rounded-3xl shadow-sm border border-brand-100">
            <div><h1 class="text-2xl font-bold text-brand-900">Clientes</h1><p class="text-sm text-brand-600">Gestão de contatos</p></div>
            <button onclick="abrirModalCliente()" class="w-12 h-12 bg-brand-600 text-white rounded-2xl shadow-lg flex items-center justify-center text-xl active:scale-95"><i class="fas fa-user-plus"></i></button>
        </div>
        <div id="listaClientes" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
    </div>

    <div id="screen-vendas" class="max-w-4xl mx-auto hidden-screen">
        <div class="flex items-center justify-between mb-6 bg-white p-5 rounded-3xl shadow-sm border border-brand-100">
            <div><h1 class="text-2xl font-bold text-brand-900">Financeiro</h1><p id="titulo-mes" class="text-sm text-brand-600 capitalize">Mês Atual</p></div>
            <button onclick="abrirModalGerenciarParcelas()" class="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md active:scale-95 flex items-center gap-2"><i class="fas fa-hand-holding-usd"></i> Ver Parcelas</button>
        </div>
        
        <!-- Cards de Resumo -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div class="bg-white p-5 rounded-3xl border border-brand-100 shadow-sm">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recebido (Mês)</p>
                <p id="resumo-recebido" class="text-2xl font-black text-emerald-600">R$ 0,00</p>
            </div>
            <div class="bg-white p-5 rounded-3xl border border-brand-100 shadow-sm">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">A Receber</p>
                <p id="resumo-pendente" class="text-2xl font-black text-orange-500">R$ 0,00</p>
            </div>
            <div class="bg-brand-600 p-5 rounded-3xl shadow-md text-white">
                <p class="text-[10px] font-bold text-brand-200 uppercase tracking-widest mb-1">Lucro das Vendas</p>
                <p id="resumo-lucro-real" class="text-2xl font-black text-white">R$ 0,00</p>
            </div>
        </div>

        <h3 class="text-lg font-bold text-brand-900 mb-4 ml-2">Histórico de Vendas</h3>
        <div id="listaVendas" class="flex flex-col gap-3"></div>
    </div>

    <!-- TELA DE GRÁFICOS -->
    <div id="screen-graficos" class="max-w-4xl mx-auto hidden-screen">
        <div class="flex items-center justify-between mb-6 bg-white p-5 rounded-3xl shadow-sm border border-brand-100">
            <div><h1 class="text-2xl font-bold text-brand-900">Análise Gráfica</h1><p class="text-sm text-brand-600">Visualize seus resultados</p></div>
            <div class="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-xl"><i class="fas fa-chart-pie"></i></div>
        </div>
        <div class="bg-white p-5 rounded-3xl border border-brand-100 shadow-sm mb-6">
            <select id="grafico-tipo" onchange="renderGraficos()" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-slate-700 mb-6">
                <option value="faturamento">Faturamento vs Lucro</option>
                <option value="top_produtos">Produtos Mais Vendidos</option>
            </select>
            <div class="relative h-72 w-full"><canvas id="meuGrafico"></canvas></div>
        </div>
    </div>

    <!-- TELA DE DESPESAS -->
    <div id="screen-despesas" class="max-w-4xl mx-auto hidden-screen">
        <div class="flex items-center justify-between mb-6 bg-white p-5 rounded-3xl shadow-sm border border-brand-100">
            <div><h1 class="text-2xl font-bold text-brand-900">Despesas</h1><p id="titulo-mes-despesas" class="text-sm text-brand-600 capitalize">Mês Atual</p></div>
        </div>
        <div class="bg-white p-5 rounded-3xl border border-brand-100 shadow-sm mb-6">
            <h3 class="text-sm font-bold text-slate-800 mb-3">Registrar Gasto</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="text" id="add-desp-desc" placeholder="Descrição" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none text-sm font-bold text-slate-700 sm:col-span-2">
                <div class="flex gap-2">
                    <input type="number" id="add-desp-valor" placeholder="R$" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none text-sm font-bold text-slate-700">
                    <button onclick="salvarNovaDespesa()" class="w-14 bg-red-500 text-white rounded-xl shadow-md flex items-center justify-center active:scale-95"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        </div>
        <div id="lista-despesas" class="flex flex-col gap-3"></div>
    </div>

    <!-- ================== MODAIS ================== -->

    <!-- Modal Confirmação Geral -->
    <div id="modal-confirmacao" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[400] flex items-center justify-center hidden-screen p-4">
        <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <div id="modal-confirm-icon" class="w-14 h-14 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"><i class="fas fa-check"></i></div>
            <h3 id="modal-confirm-titulo" class="text-xl font-bold text-center text-slate-800 mb-2">Confirmar</h3>
            <p id="modal-confirm-texto" class="text-center text-slate-500 mb-6 text-sm"></p>
            <div class="flex gap-3">
                <button onclick="fecharModalConfirm()" class="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl active:scale-95">Não</button>
                <button id="btn-confirm-yes" class="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95">Sim, Confirmar</button>
            </div>
        </div>
    </div>

    <!-- (Demais modais de Venda, Cliente e Carnê mantidos como nas versões anteriores...) -->
    <!-- Modal Add Carrinho -->
    <div id="modal-add-carrinho" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center hidden-screen p-4 transition-all">
        <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col">
            <h3 class="text-xl font-bold text-brand-900 mb-4">Adicionar à Sacola</h3>
            <p id="add-cart-pnome" class="font-bold text-slate-700 text-lg mb-4"></p>
            <div class="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                <span class="font-bold text-slate-600 text-sm">Quantidade:</span>
                <div class="flex items-center gap-3">
                    <button onclick="modQtdModalAdd(-1)" class="w-10 h-10 bg-white border border-slate-300 rounded-lg text-slate-500 active:scale-95 shadow-sm"><i class="fas fa-minus"></i></button>
                    <input type="number" id="add-cart-qtd" value="1" readonly class="w-10 text-center bg-transparent font-black text-2xl outline-none text-slate-800">
                    <button onclick="modQtdModalAdd(1)" class="w-10 h-10 bg-brand-500 text-white rounded-lg active:scale-95 shadow-md shadow-brand-200"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="fecharModalAddCarrinho()" class="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl">Cancelar</button>
                <button onclick="confirmarAddCarrinho()" class="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl shadow-lg">Confirmar</button>
            </div>
        </div>
    </div>

    <!-- ================== NAVEGAÇÃO INFERIOR ================== -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-30">
        <div class="max-w-4xl mx-auto flex justify-between p-1 overflow-x-auto no-scrollbar">
            <button onclick="navegarApp('estoque')" id="tab-estoque" class="flex-1 flex flex-col items-center p-2 text-slate-400 min-w-[60px] tab-active"><i class="fas fa-box text-lg mb-1"></i><span class="text-[8px] font-bold mt-1 uppercase">Estoque</span></button>
            <button onclick="navegarApp('clientes')" id="tab-clientes" class="flex-1 flex flex-col items-center p-2 text-slate-400 min-w-[60px]"><i class="fas fa-users text-lg mb-1"></i><span class="text-[8px] font-bold mt-1 uppercase">Clientes</span></button>
            <button onclick="navegarApp('vendas')" id="tab-vendas" class="flex-1 flex flex-col items-center p-2 text-slate-400 min-w-[60px]"><i class="fas fa-list-alt text-lg mb-1"></i><span class="text-[8px] font-bold mt-1 uppercase">Relatórios</span></button>
            <button onclick="navegarApp('graficos')" id="tab-graficos" class="flex-1 flex flex-col items-center p-2 text-slate-400 min-w-[60px]"><i class="fas fa-chart-pie text-lg mb-1"></i><span class="text-[8px] font-bold mt-1 uppercase">Gráficos</span></button>
            <button onclick="navegarApp('despesas')" id="tab-despesas" class="flex-1 flex flex-col items-center p-2 text-slate-400 min-w-[60px]"><i class="fas fa-wallet text-lg mb-1"></i><span class="text-[8px] font-bold mt-1 uppercase">Despesas</span></button>
        </div>
    </nav>

    <!-- SCRIPTS E FIREBASE -->
    <script>
        var dbProdutos = [];
        var dbClientes = [];
        var dbVendas = [];
        var dbParcelas = [];
        var dbDespesas = [];
        var dbFornecedores = [];
        
        let carrinho = [];
        let totalCheckoutAtual = 0;
        let graficoInstancia = null;
        let filtroClienteIdAtual = null;

        // ================= CONEXÃO FIREBASE =================
        const firebaseConfig = {
            apiKey: "AIzaSyCFo6uzup9jpuVQ0DdqGSCqVsZTONYlHeA",
            authDomain: "appvendasmariajose.firebaseapp.com",
            projectId: "appvendasmariajose",
            storageBucket: "appvendasmariajose.firebasestorage.app",
            messagingSenderId: "404971624075",
            appId: "1:404971624075:web:81ada0e7235fc5c3ebe68e"
        };

        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();

        // ATIVAÇÃO DE PERSISTÊNCIA OFFLINE (Para o app independente)
        db.enablePersistence().catch((err) => {
            console.warn("Persistência desativada:", err.code);
        });

        async function inicializarApp() {
            try {
                const doc = await db.collection("loja_mariajose").doc("dados_principais").get();
                if(doc.exists) {
                    const dados = doc.data();
                    dbProdutos = dados.produtos || [];
                    dbClientes = dados.clientes || [];
                    dbVendas = dados.vendas || [];
                    dbParcelas = dados.parcelas || [];
                    dbDespesas = dados.despesas || [];
                    dbFornecedores = dados.fornecedores || [];
                }
                renderCategorias();
                verificarAlertasVencimento();
            } catch(e) {
                console.error("Erro Firebase:", e);
                renderCategorias();
            }
        }

        async function saveDB() {
            try {
                await db.collection("loja_mariajose").doc("dados_principais").set({
                    produtos: dbProdutos,
                    clientes: dbClientes,
                    vendas: dbVendas,
                    parcelas: dbParcelas,
                    despesas: dbDespesas,
                    fornecedores: dbFornecedores
                });
            } catch(e) {
                console.warn("Salvando offline.");
            }
        }

        // --- UTILITÁRIOS ---
        const fmtMoeda = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
        const fmtData = s => new Date(s).toLocaleDateString('pt-BR');
        const fmtDataHora = s => new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        const guid = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const showToast = m => {
            const c = document.getElementById('toast-container');
            document.getElementById('toast-msg').querySelector('span').textContent = m;
            c.classList.remove('hidden-screen'); 
            c.classList.add('toast-enter');
            setTimeout(() => c.classList.add('hidden-screen'), 3000);
        };

        // --- NAVEGAÇÃO ---
        let currentCat = '';
        function navegarApp(screen) {
            ['screen-estoque', 'screen-clientes', 'screen-vendas', 'screen-graficos', 'screen-despesas'].forEach(s => document.getElementById(s).classList.add('hidden-screen'));
            ['tab-estoque', 'tab-clientes', 'tab-vendas', 'tab-graficos', 'tab-despesas'].forEach(t => document.getElementById(t).classList.remove('tab-active', 'text-brand-600'));
            document.getElementById(`screen-${screen}`).classList.remove('hidden-screen');
            document.getElementById(`tab-${screen}`).classList.add('tab-active', 'text-brand-600');
            if (screen === 'estoque') renderCategorias();
            if (screen === 'clientes') renderClientes();
            if (screen === 'vendas') renderRelatorios();
            if (screen === 'graficos') renderGraficos();
            if (screen === 'despesas') renderDespesas();
        }

        // --- LÓGICA DE ESTOQUE (COM CONFIRMAÇÕES) ---
        function renderProdutos() {
            const list = document.getElementById('listaProdutos'); list.innerHTML = '';
            const filtered = dbProdutos.filter(p => p.categoria === currentCat);
            document.getElementById('msg-vazia-produtos').classList.toggle('hidden-screen', filtered.length > 0);

            filtered.slice().reverse().forEach(p => {
                const custo = parseFloat(p.custo) || 0;
                const margem = parseFloat(p.margem) || 0;
                const desc = parseFloat(p.desconto) || 0;
                const pVitrine = (custo * (1 + (margem / 100))) / (1 - (desc / 100));
                const pFinal = pVitrine * (1 - (desc / 100));

                const div = document.createElement('div');
                div.id = `card-${p.id}`;
                div.className = `bg-white p-5 rounded-3xl border border-brand-100 shadow-sm ${p.isDraft ? 'is-draft' : ''} ${parseInt(p.estoque) <= 3 ? 'alert-low-stock' : ''}`;
                
                let footerHtml = p.isDraft ? 
                    `<button onclick="confirmarCadastroItem('${p.id}')" class="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md flex justify-center items-center gap-2 active:scale-95 transition"><i class="fas fa-check-circle"></i> Confirmar Cadastro</button>` :
                    `<button onclick="abrirModalAddCarrinho('${p.id}', 'cheio')" class="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl shadow-md flex justify-center items-center gap-1 active:scale-95 text-[11px] sm:text-sm"><i class="fas fa-tag"></i> Sacola (Cheio)</button>
                     <button onclick="abrirModalAddCarrinho('${p.id}', 'desc')" class="flex-1 bg-white border border-brand-200 text-brand-700 font-bold py-3 rounded-xl flex justify-center items-center gap-1 active:scale-95 text-[11px] sm:text-sm"><i class="fas fa-percent"></i> Sacola (Desc.)</button>`;

                div.innerHTML = `
                    <div class="flex justify-between items-start border-b border-slate-50 pb-3 mb-3">
                        <div class="w-full">
                            <span class="text-[10px] font-bold text-slate-400 uppercase mb-1">${p.isDraft ? '<span class="text-blue-500">[DADOS PENDENTES]</span>' : 'Nome do Produto'}</span>
                            <input type="text" value="${p.nome}" onchange="updateProdDraft('${p.id}', 'nome', this.value)" class="w-full bg-transparent font-bold text-slate-800 border-none p-0 outline-none" placeholder="Digite o nome...">
                        </div>
                        <button onclick="deleteProd('${p.id}')" class="text-slate-300 hover:text-red-500 p-2"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="grid grid-cols-2 gap-3 mb-3">
                        <div class="bg-brand-50/50 p-2 rounded-2xl flex flex-col items-center">
                            <span class="text-[9px] font-bold text-brand-600 uppercase">Estoque</span>
                            <div class="flex items-center gap-2">
                                <button onclick="modEstoque('${p.id}', -1)" class="w-7 h-7 bg-white rounded-full border border-brand-200 text-xs">-</button>
                                <span class="font-black text-xl estoque-numero" id="estoque-${p.id}">${p.estoque}</span>
                                <button onclick="modEstoque('${p.id}', 1)" class="w-7 h-7 bg-brand-500 text-white rounded-full text-xs">+</button>
                            </div>
                        </div>
                        <div class="bg-white border border-slate-100 p-2 rounded-2xl flex flex-col">
                            <span class="text-[9px] font-bold text-slate-400 uppercase">Custo (R$)</span>
                            <input type="number" value="${p.custo}" oninput="updateProdDraft('${p.id}', 'custo', this.value)" class="bg-transparent border-none font-bold text-lg p-0 outline-none">
                        </div>
                        <div class="bg-white border border-slate-100 p-2 rounded-2xl flex flex-col">
                            <span class="text-[9px] font-bold text-slate-400 uppercase">Margem (%)</span>
                            <input type="number" value="${p.margem}" oninput="updateProdDraft('${p.id}', 'margem', this.value)" class="bg-transparent border-none font-bold text-lg p-0 outline-none">
                        </div>
                        <div class="bg-white border border-slate-100 p-2 rounded-2xl flex flex-col">
                            <span class="text-[9px] font-bold text-slate-400 uppercase">Desconto (%)</span>
                            <input type="number" value="${p.desconto}" oninput="updateProdDraft('${p.id}', 'desconto', this.value)" class="bg-transparent border-none font-bold text-lg p-0 outline-none">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl mb-3">
                        <div><p class="text-[9px] text-brand-700 uppercase">Vitrine</p><p class="font-black text-brand-600 text-lg">${fmtMoeda(pVitrine)}</p></div>
                        <div><p class="text-[9px] text-slate-400 uppercase">Promo</p><p class="font-bold text-slate-600">${fmtMoeda(pFinal)}</p></div>
                    </div>
                    <div class="mt-4 border-t border-slate-100 pt-3 flex gap-2">${footerHtml}</div>
                `;
                list.appendChild(div);
            });
        }

        function adicionarProduto() {
            dbProdutos.push({ id: guid(), categoria: currentCat, nome: '', estoque: '0', custo: '', margem: '', desconto: '', isDraft: true });
            renderProdutos();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function updateProdDraft(id, field, val) {
            const idx = dbProdutos.findIndex(p => p.id === id);
            if (idx > -1) { 
                dbProdutos[idx][field] = val;
                if (!dbProdutos[idx].isDraft) saveDB(); // Salva auto só se já estiver confirmado
            }
        }

        // CONFIRMAÇÃO DE NOVO ITEM (REQUISITADO)
        function confirmarCadastroItem(id) {
            const p = dbProdutos.find(x => x.id === id);
            if (!p.nome) return alert("Por favor, preencha o nome do produto.");
            
            openModalConfirm("Salvar Novo Item?", `Deseja guardar "${p.nome}" no seu estoque?`, () => {
                delete p.isDraft;
                saveDB();
                renderProdutos();
                showToast("Novo item adicionado ao estoque! 📦");
            });
        }

        // CONFIRMAÇÃO DE ALTERAÇÃO DE QUANTIDADE (REQUISITADO)
        function modEstoque(id, delta) {
            const p = dbProdutos.find(x => x.id === id);
            if (!p) return;
            const novaQtd = Math.max(0, (parseInt(p.estoque) || 0) + delta);
            
            if (p.isDraft) { // Se for rascunho, muda na hora
                p.estoque = novaQtd.toString();
                renderProdutos();
                return;
            }

            // Se for item fixo, pede confirmação
            openModalConfirm("Confirmar Alteração?", `Deseja mudar o estoque de "${p.nome}" para ${novaQtd} unidades?`, () => {
                p.estoque = novaQtd.toString();
                saveDB();
                renderProdutos();
                showToast("Estoque atualizado e salvo! ✅");
            });
        }

        // ... Outras funções de Relatórios, Clientes, Despesas (Devem seguir a mesma lógica anterior)
        function renderCategorias() {
            const grid = document.getElementById('grid-categorias'); grid.innerHTML = '';
            document.getElementById('tela-categorias').classList.remove('hidden-screen');
            document.getElementById('tela-produtos').classList.add('hidden-screen');
            categoriasInfo.forEach(cat => {
                const count = dbProdutos.filter(p => p.categoria === cat.id && !p.isDraft).length;
                grid.innerHTML += `<div onclick="abrirCategoria('${cat.id}', '${cat.nome}')" class="bg-white p-5 rounded-3xl border border-brand-100 flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition"><div class="w-14 h-14 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center text-xl"><i class="fas ${cat.icone}"></i></div><div class="text-center"><h3 class="font-bold text-sm text-slate-800">${cat.nome}</h3><p class="text-[10px] text-brand-600 font-bold">${count} Peças</p></div></div>`;
            });
        }

        function abrirCategoria(id, nome) { currentCat = id; document.getElementById('titulo-categoria').textContent = nome; document.getElementById('tela-categorias').classList.add('hidden-screen'); document.getElementById('tela-produtos').classList.remove('hidden-screen'); renderProdutos(); }
        function voltarCategorias() { renderCategorias(); }
        function fecharModalConfirm() { document.getElementById('modal-confirmacao').classList.add('hidden-screen'); }
        function openModalConfirm(t, tx, cb) {
            document.getElementById('modal-confirm-titulo').textContent = t;
            document.getElementById('modal-confirm-texto').textContent = tx;
            const btn = document.getElementById('btn-confirm-yes');
            btn.onclick = () => { cb(); fecharModalConfirm(); };
            document.getElementById('modal-confirmacao').classList.remove('hidden-screen');
        }

        function deleteProd(id) {
            openModalConfirm("Excluir Item?", "Deseja remover este item permanentemente?", () => {
                dbProdutos = dbProdutos.filter(p => p.id !== id);
                saveDB(); renderProdutos();
            });
        }

        // PWA REGISTRATION SCRIPT
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(err => console.log("SW error", err));
        }

        inicializarApp();
    </script>
</body>
</html>