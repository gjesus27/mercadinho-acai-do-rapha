import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const paginaAtual = window.location.pathname.split("/").pop();

/* ================= FUNÇÕES GERAIS ================= */

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

/* ================= MENU GLOBAL ================= */

const btnAdminToggle = document.getElementById("btnAdminToggle");
const menuAdmin = document.getElementById("menuAdmin");

if (btnAdminToggle && menuAdmin) {
  btnAdminToggle.addEventListener("click", () => {
    menuAdmin.classList.toggle("ativo");
  });

  document.addEventListener("click", (e) => {
    if (
      menuAdmin.classList.contains("ativo") &&
      !menuAdmin.contains(e.target) &&
      !btnAdminToggle.contains(e.target)
    ) {
      menuAdmin.classList.remove("ativo");
    }
  });
}

/* ================= INDEX.HTML – FUNCIONÁRIOS ================= */

if (paginaAtual === "index.html") {
  const lista = document.getElementById("listaFuncionarios");
  const buscarFuncionario = document.getElementById("buscarFuncionario");
  const loadingLogin = document.getElementById("loadingLogin");
  const erroSenha = document.getElementById("erroSenha");
  const fecharErro = document.getElementById("fecharErro");

  let funcionarios = [];
  let funcionarioSelecionado = null;

  // Fecha mensagem de erro
  fecharErro?.addEventListener("click", () => erroSenha.classList.remove("ativo"));

  // Busca por nome
  buscarFuncionario?.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase();
    renderFuncionarios(funcionarios.filter(f => f.nome.toLowerCase().includes(termo)));
  });

  onSnapshot(collection(db, "funcionarios"), snap => {
    funcionarios = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderFuncionarios(funcionarios);
  });

  function renderFuncionarios(listaFuncionarios) {
    lista.innerHTML = "";

    listaFuncionarios.forEach(f => {
      const card = document.createElement("div");
      card.className = "cardFuncionario";
      card.innerHTML = `
        <img src="${f.foto || 'image/user.png'}" alt="${f.nome}">
        <strong>${f.nome}</strong>
        <span>${f.cargo || ''}</span>
        <div class="loginInterno" style="display:none;">
          <input type="password" placeholder="Senha" maxlength="4">
          <button class="btn btnEntrar">Entrar</button>
        </div>
      `;

      const areaLogin = card.querySelector(".loginInterno");
      const inputSenha = areaLogin.querySelector("input");
      const btnEntrar = areaLogin.querySelector(".btnEntrar");

      // Mostra input de senha ao clicar no card
      card.addEventListener("click", () => {
        document.querySelectorAll(".loginInterno").forEach(a => a.style.display = "none");
        areaLogin.style.display = "block";
        funcionarioSelecionado = f;
      });

      // Verifica senha
      btnEntrar.addEventListener("click", (e) => {
        e.stopPropagation();
        loadingLogin.classList.add("ativo");

        setTimeout(() => {
          loadingLogin.classList.remove("ativo");

          if (inputSenha.value === f.senha) {
            localStorage.setItem("funcionario", JSON.stringify(funcionarioSelecionado));
            window.location.href = "loja.html";
          } else {
            erroSenha.classList.add("ativo");
          }
        }, 500); // Simula carregamento
      });

      lista.appendChild(card);
    });
  }
}

/* ================= LOJA ================= */

// TODO: Aqui você mantém todo o código da loja, dashboard, produtos, funcionários admin e relatórios exatamente igual

/* ================= LOJA ================= */

if (paginaAtual === "loja.html") {

  const funcionario = getFuncionario();
  if (!funcionario) window.location.href = "index.html";

  document.getElementById("userNome").textContent = funcionario.nome;
  document.getElementById("userFoto").src =
    funcionario.foto || "image/user.png";

  const grid = document.getElementById("produtosGrid");
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  const pagamentoArea = document.getElementById("pagamentoArea");

  const confirmarBtn = document.getElementById("confirmarBtn");
  const pagarDepoisBtn = document.getElementById("pagarDepoisBtn");
  const limparCarrinhoBtn = document.getElementById("limparCarrinhoBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  let carrinho = [];

  onSnapshot(collection(db, "produtos"), (snap) => {
    grid.innerHTML = "";

    snap.forEach(docSnap => {
      const p = docSnap.data();
      const preco = parseFloat(p.preco || 0);
      const estoque = p.estoque || 0;

      const div = document.createElement("div");
      div.className = "produto";

      div.innerHTML = `
        <img src="${p.imagem || ""}">
        <p class="nome">${p.nome}</p>
        <p class="preco">R$ ${preco.toFixed(2)}</p>
        <p>Estoque: ${estoque}</p>
        <button ${estoque <= 0 ? "disabled" : ""}>
          ${estoque <= 0 ? "Sem estoque" : "Adicionar"}
        </button>
      `;

      div.querySelector("button").onclick = () => {
        if (estoque <= 0) return;

        carrinho.push({
          id: docSnap.id,
          nome: p.nome,
          preco
        });

        atualizarCarrinho();
      };

      grid.appendChild(div);
    });
  });

  function atualizarCarrinho() {

    cartItems.innerHTML = carrinho.map(i => `
      <div class="item-cart">
        ${i.nome}
        <span>R$ ${i.preco.toFixed(2)}</span>
      </div>
    `).join("");

    const total = carrinho.reduce((t, i) => t + i.preco, 0);
    cartTotal.textContent = total.toFixed(2);

    pagamentoArea.style.display = carrinho.length ? "block" : "none";
  }

  async function registrarVenda(status, formaPagamento) {

    if (!carrinho.length) return;

    const total = carrinho.reduce((t, i) => t + i.preco, 0);

    await addDoc(collection(db, "venda"), {
      funcionario: funcionario.nome,
      funcionarioId: funcionario.id,
      itens: carrinho,
      total,
      status,
      formaPagamento,
      data: new Date().toISOString()
    });

    for (let item of carrinho) {
      const ref = doc(db, "produtos", item.id);
      const snap = await getDoc(ref);
      const estoqueAtual = snap.data().estoque || 0;

      await updateDoc(ref, {
        estoque: estoqueAtual - 1
      });
    }

    carrinho = [];
    atualizarCarrinho();

    alert("Venda registrada com sucesso!");
  }

  confirmarBtn?.addEventListener("click", () =>
    registrarVenda("pago", "dinheiro")
  );

  pagarDepoisBtn?.addEventListener("click", () =>
    registrarVenda("pendente", "pagar_depois")
  );

  limparCarrinhoBtn?.addEventListener("click", () => {
    carrinho = [];
    atualizarCarrinho();
  });

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("funcionario");
    window.location.href = "index.html";
  });
}

/* ================= DASHBOARD ================= */

if (paginaAtual === "dashboard.html") {

  verificarAdmin();

  const conteudo = document.querySelector(".conteudoAdmin");

  onSnapshot(collection(db, "venda"), (snap) => {

    let total = 0;
    let qtd = 0;
    let funcionarios = {};

    snap.forEach(docSnap => {
      const v = docSnap.data();
      total += v.total;
      qtd++;

      funcionarios[v.funcionario] =
        (funcionarios[v.funcionario] || 0) + v.total;
    });

    const top = Object.entries(funcionarios)
      .sort((a, b) => b[1] - a[1])[0];

    conteudo.innerHTML = `
      <h2>📊 Dados em tempo real</h2>
      <p><strong>Total Vendido:</strong> R$ ${total.toFixed(2)}</p>
      <p><strong>Total de Vendas:</strong> ${qtd}</p>
      <p><strong>Ticket Médio:</strong> R$ ${qtd ? (total/qtd).toFixed(2) : "0.00"}</p>
      <p><strong>Top Funcionário:</strong> ${top ? top[0] : "-"}</p>
    `;
  });
}

/* ================= PRODUTOS ADMIN ================= */

if (paginaAtual === "produtos.html") {

  verificarAdmin();

  const conteudo = document.querySelector(".conteudoAdmin");

  onSnapshot(collection(db, "produtos"), (snap) => {

    let html = "<h2>📦 Produtos</h2>";

    snap.forEach(docSnap => {
      const p = docSnap.data();
      html += `
        <p>${p.nome} — R$ ${parseFloat(p.preco).toFixed(2)} — Estoque: ${p.estoque || 0}</p>
      `;
    });

    conteudo.innerHTML = html;
  });
}

/* ================= FUNCIONÁRIOS ADMIN ================= */

if (paginaAtual === "funcionarios.html") {

  verificarAdmin();

  const conteudo = document.querySelector(".conteudoAdmin");

  onSnapshot(collection(db, "funcionarios"), (snap) => {

    let html = "<h2>👥 Funcionários</h2>";

    snap.forEach(docSnap => {
      const f = docSnap.data();
      html += `
        <p>${f.nome} — ${f.cargo || "-"} — ${f.nivel || "user"}</p>
      `;
    });

    conteudo.innerHTML = html;
  });
}

/* ================= RELATÓRIOS ================= */

if (paginaAtual === "relatorios.html") {

  verificarAdmin();

  const conteudo = document.querySelector(".conteudoAdmin");

  onSnapshot(collection(db, "venda"), (snap) => {

    let html = "<h2>📈 Relatórios</h2>";

    snap.forEach(docSnap => {
      const v = docSnap.data();
      html += `
        <p>${new Date(v.data).toLocaleDateString()} —
        ${v.funcionario} —
        R$ ${v.total.toFixed(2)} —
        ${v.status}</p>
      `;
    });

    conteudo.innerHTML = html;
  });
}