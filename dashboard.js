import { db } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ================= FUNÇÕES GERAIS =================
function getFuncionario() {
  return JSON.parse(localStorage.getItem("funcionario"));
}

function verificarAdmin() {
  const funcionario = getFuncionario();
  if (!funcionario || funcionario.nivel !== "admin") {
    window.location.href = "index.html";
  }
  return funcionario;
}

const funcionario = verificarAdmin();

// ================= HEADER =================
const userNomeHeader = document.getElementById("userNomeHeader");
const userFotoHeader = document.getElementById("userFotoHeader");
const logoutBtn = document.getElementById("logoutBtn");

if(userNomeHeader) userNomeHeader.textContent = funcionario.nome;
if(userFotoHeader) userFotoHeader.src = funcionario.foto || "image/user.png";

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("funcionario");
  window.location.href = "index.html";
});

// ================= MENU LATERAL =================
const btnAdminToggle = document.getElementById("btnAdminToggle");
const menuAdmin = document.getElementById("menuAdmin");

btnAdminToggle?.addEventListener("click", () => menuAdmin?.classList.toggle("ativo"));
document.addEventListener("click", e => {
  if(menuAdmin?.classList.contains("ativo") &&
     !menuAdmin.contains(e.target) &&
     !btnAdminToggle.contains(e.target)) {
       menuAdmin.classList.remove("ativo");
     }
});

// Botão voltar para a loja
menuAdmin?.querySelector('[data-pagina="loja.html"]')?.addEventListener("click", () => {
  window.location.href = "loja.html";
});

// ================= ELEMENTOS DASHBOARD =================
const totalVendidoEl = document.getElementById("totalVendido");
const totalVendasEl = document.getElementById("totalVendas");
const ticketMedioEl = document.getElementById("ticketMedio");
const topFuncionarioEl = document.getElementById("topFuncionario");
const totalReceberEl = document.getElementById("totalReceber");
const rankingFuncionariosEl = document.getElementById("rankingFuncionarios");
const rankingProdutosEl = document.getElementById("rankingProdutos");
const cashbackChartEl = document.getElementById("graficoCashback");
const vendasChartEl = document.getElementById("graficoVendas");
const produtosChartEl = document.getElementById("graficoProdutos");
const filtroFuncionario = document.getElementById("filtroFuncionario");
const filtroPeriodo = document.getElementById("filtroPeriodo");

let chartVendas, chartProdutos, chartCashback;
let todasVendas = [];

// ================= FILTRO =================
function filtrarVendas() {
  let vendasFiltradas = [...todasVendas];

  // Filtra por funcionário
  if(filtroFuncionario?.value && filtroFuncionario.value !== "todos") {
    vendasFiltradas = vendasFiltradas.filter(v => v.funcionario === filtroFuncionario.value);
  }

  // Filtra por período
  const agora = new Date();
  if(filtroPeriodo?.value) {
    if(filtroPeriodo.value === "hoje") {
      vendasFiltradas = vendasFiltradas.filter(v => new Date(v.data).toDateString() === agora.toDateString());
    } else if(filtroPeriodo.value === "7dias") {
      const seteDias = new Date(); seteDias.setDate(agora.getDate() - 7);
      vendasFiltradas = vendasFiltradas.filter(v => new Date(v.data) >= seteDias);
    } else if(filtroPeriodo.value === "30dias") {
      const trintaDias = new Date(); trintaDias.setDate(agora.getDate() - 30);
      vendasFiltradas = vendasFiltradas.filter(v => new Date(v.data) >= trintaDias);
    }
  }

  atualizarDashboard(vendasFiltradas);
}

// ================= SNAPSHOT VENDAS =================
onSnapshot(collection(db, "venda"), snap => {
  todasVendas = snap.docs.map(doc => doc.data());

  // Popula filtro de funcionários
  if(filtroFuncionario) {
    const funcionarios = Array.from(new Set(todasVendas.map(v => v.funcionario)));
    filtroFuncionario.innerHTML = '<option value="todos">Todos</option>' + 
      funcionarios.map(f => `<option value="${f}">${f}</option>`).join("");
  }

  filtrarVendas();
});

// ================= FUNÇÃO PARA ATUALIZAR DASHBOARD =================
function atualizarDashboard(vendas) {
  let total = 0, qtd = 0, totalReceber = 0;
  const funcionariosTotais = {};
  const produtosTotais = {};
  const cashbackTotais = {};

  vendas.forEach(v => {
    total += v.total;
    qtd++;

    if(v.status === "pendente") totalReceber += v.total;

    funcionariosTotais[v.funcionario] = (funcionariosTotais[v.funcionario] || 0) + v.total;

    v.produto?.forEach(p => {
      produtosTotais[p.nome] = (produtosTotais[p.nome] || 0) + (p.qntd || 1);
    });

    if(v.cashback) cashbackTotais[v.funcionario] = (cashbackTotais[v.funcionario]||0) + v.cashback;
  });

  // Atualiza cards
  totalVendidoEl && (totalVendidoEl.textContent = `R$ ${total.toFixed(2)}`);
  totalVendasEl && (totalVendasEl.textContent = qtd);
  ticketMedioEl && (ticketMedioEl.textContent = `R$ ${qtd ? (total/qtd).toFixed(2) : "0.00"}`);
  totalReceberEl && (totalReceberEl.textContent = `R$ ${totalReceber.toFixed(2)}`);
  topFuncionarioEl && (() => {
    const topFunc = Object.entries(funcionariosTotais).sort((a,b)=>b[1]-a[1])[0];
    topFuncionarioEl.textContent = topFunc ? `${topFunc[0]} - R$ ${topFunc[1].toFixed(2)}` : "-";
  })();

  // Ranking Funcionários
  if(rankingFuncionariosEl) {
    rankingFuncionariosEl.innerHTML = "";
    Object.entries(funcionariosTotais).sort((a,b)=>b[1]-a[1]).forEach(([nome,total])=>{
      const div = document.createElement("div");
      div.className = "cardAdmin col";
      div.innerHTML = `<strong>${nome}</strong><p>R$ ${total.toFixed(2)}</p>`;
      rankingFuncionariosEl.appendChild(div);
    });
  }

  // Ranking Produtos
  if(rankingProdutosEl) {
    rankingProdutosEl.innerHTML = "";
    Object.entries(produtosTotais).sort((a,b)=>b[1]-a[1]).forEach(([nome,qtd])=>{
      const div = document.createElement("div");
      div.className = "cardAdmin col";
      div.innerHTML = `<strong>${nome}</strong><p>${qtd} vendidos</p>`;
      rankingProdutosEl.appendChild(div);
    });
  }

  // Gráfico Vendas
  if(vendasChartEl) {
    const vendasPorDia = {};
    vendas.forEach(v=> vendasPorDia[v.data] = (vendasPorDia[v.data]||0)+v.total );
    const labels = Object.keys(vendasPorDia);
    const data = Object.values(vendasPorDia);
    if(chartVendas) chartVendas.destroy();
    chartVendas = new Chart(vendasChartEl.getContext("2d"), {
      type:'line',
      data:{ labels, datasets:[{ label:"Vendas por Dia", data, borderColor:"#d62828", backgroundColor:"rgba(214,40,40,0.2)", tension:0.3 }]},
      options:{ responsive:true, plugins:{legend:{display:true}}}
    });
  }

  // Gráfico Produtos
  if(produtosChartEl) {
    const labels = Object.keys(produtosTotais);
    const data = Object.values(produtosTotais);
    if(chartProdutos) chartProdutos.destroy();
    chartProdutos = new Chart(produtosChartEl.getContext("2d"), {
      type:'bar',
      data:{ labels, datasets:[{ label:"Qtd Vendida", data, backgroundColor:"#1f1f1f" }] },
      options:{ responsive:true, plugins:{legend:{display:false}} }
    });
  }

  // Gráfico Cashback
  if(cashbackChartEl) {
    const labels = Object.keys(cashbackTotais);
    const data = Object.values(cashbackTotais);
    if(chartCashback) chartCashback.destroy();
    chartCashback = new Chart(cashbackChartEl.getContext("2d"), {
      type:'bar',
      data:{ labels, datasets:[{ label:"Cashback disponível", data, backgroundColor:"#ff9800" }] },
      options:{ responsive:true, plugins:{legend:{display:false}} }
    });
  }
}

// ================= EVENTOS FILTROS =================
filtroFuncionario?.addEventListener("change", filtrarVendas);
filtroPeriodo?.addEventListener("change", filtrarVendas);