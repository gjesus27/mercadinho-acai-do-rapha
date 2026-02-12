// script.js
import { app, db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- INDEX (seleção de funcionário) ---
if (window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/")) {
  const lista = document.getElementById("listaFuncionarios");
  const senhaArea = document.getElementById("senhaArea");
  const nomeSelecionado = document.getElementById("nomeSelecionado");
  const senhaInput = document.getElementById("senhaInput");
  const btnEntrar = document.getElementById("btnEntrar");
  let funcionarioSelecionado = null;

  async function carregarFuncionarios() {
    const snap = await getDocs(collection(db, "funcionarios"));
    lista.innerHTML = "";
    snap.forEach(doc => {
      const f = doc.data();
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${f.foto}" class="foto" alt="${f.nome}">
        <p>${f.nome}</p>
      `;
      card.onclick = () => {
        funcionarioSelecionado = { id: doc.id, ...f };
        nomeSelecionado.textContent = f.nome;
        senhaArea.style.display = "block";
      };
      lista.appendChild(card);
    });
  }

  btnEntrar.onclick = () => {
    if (!funcionarioSelecionado) return;
    if (senhaInput.value === funcionarioSelecionado.senha) {
      localStorage.setItem("funcionario", JSON.stringify(funcionarioSelecionado));
      window.location.href = "loja.html";
    } else {
      alert("Senha incorreta!");
    }
  };

  carregarFuncionarios();
}

// --- LOJA (produtos e carrinho) ---
if (window.location.pathname.endsWith("loja.html")) {
  const grid = document.getElementById("produtosGrid");
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  const confirmarBtn = document.getElementById("confirmarBtn");
  const pagamentoArea = document.getElementById("pagamentoArea");
  const logoutBtn = document.getElementById("logoutBtn");
  const userLabel = document.getElementById("userLabel");
  const pagarDepoisBtn = document.getElementById("pagarDepoisBtn");
  let carrinho = [];

  const funcionario = JSON.parse(localStorage.getItem("funcionario"));
  if (!funcionario) window.location.href = "index.html";
  userLabel.textContent = funcionario.nome;

  async function carregarProdutos() {
    const snap = await getDocs(collection(db, "produtos"));
    grid.innerHTML = "";
    snap.forEach(doc => {
      const p = doc.data();
      const precoNum = parseFloat(p.preco); // ← converte pra número
      const div = document.createElement("div");
      div.className = "produto";
      div.innerHTML = `
        <img src="${p.foto}" alt="${p.nome}">
        <p class="nome">${p.nome}</p>
        <p class="preco">R$ ${precoNum.toFixed(2)}</p>
        <button class="btn" onclick="adicionarCarrinho('${p.nome}', ${precoNum})">Adicionar</button>
      `;
      grid.appendChild(div);
    });
  }

  window.adicionarCarrinho = (nome, preco) => {
    carrinho.push({ nome, preco });
    atualizarCarrinho();
  };

  function atualizarCarrinho() {
    cartItems.innerHTML = carrinho
      .map((i, idx) => `<div class='item-cart'>${i.nome} <span>R$ ${i.preco.toFixed(2)}</span></div>`)
      .join("");
    const total = carrinho.reduce((t, i) => t + i.preco, 0);
    cartTotal.textContent = total.toFixed(2);
    pagamentoArea.style.display = carrinho.length ? "block" : "none";
  }

  confirmarBtn.onclick = async () => {
    const total = carrinho.reduce((t, i) => t + i.preco, 0);
    await addDoc(collection(db, "vendas"), {
      funcionario: funcionario.nome,
      produtos: carrinho,
      total,
      status: "pendente",
      data: new Date().toISOString()
    });
    alert("Compra registrada! Pagamento pendente.");
    carrinho = [];
    atualizarCarrinho();
  };

  pagarDepoisBtn.onclick = async () => {
    const total = carrinho.reduce((t, i) => t + i.preco, 0);
    await addDoc(collection(db, "vendas"), {
      funcionario: funcionario.nome,
      produtos: carrinho,
      total,
      status: "pagar depois",
      data: new Date().toISOString()
    });
    alert("Compra registrada como 'Pagar Depois'!");
    carrinho = [];
    atualizarCarrinho();
  };

  logoutBtn.onclick = () => {
    localStorage.removeItem("funcionario");
    window.location.href = "index.html";
  };

  carregarProdutos();
}
