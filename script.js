import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/* ============================================================
LOGIN
============================================================ */

if (
  window.location.pathname.endsWith("index.html") ||
  window.location.pathname.endsWith("/")
) {

  const lista = document.getElementById("listaFuncionarios");
  const buscarInput = document.getElementById("buscarFuncionario");

  const loading = document.getElementById("loadingLogin");
  const loadingTexto = document.getElementById("loadingTexto");

  const erroSenha = document.getElementById("erroSenha");
  const fecharErro = document.getElementById("fecharErro");

  let funcionarioSelecionado = null;

  async function carregarFuncionarios(filtro = "") {

    const snap = await getDocs(collection(db, "funcionarios"));
    lista.innerHTML = "";

    snap.forEach(doc => {

      const f = doc.data();
      if (!f.nome) return;

      if (!f.nome.toLowerCase().includes(filtro.toLowerCase())) return;

      const card = document.createElement("div");
      card.className = "cardFuncionario";

      card.innerHTML = `
        <img src="${f.foto || "image/user.png"}">
        <strong>${f.nome}</strong>
        <span>${f.cargo || ""}</span>

        <div class="loginInterno">
          <input type="password" placeholder="Senha" maxlength="4">

          <div style="display:flex; gap:6px;">
            <button class="btn btnEntrar">Entrar</button>
            <button class="btn btnCancelar">Cancelar</button>
          </div>

        </div>
      `;

      const areaLogin = card.querySelector(".loginInterno");
      const inputSenha = areaLogin.querySelector("input");
      const btnEntrar = areaLogin.querySelector(".btnEntrar");
      const btnCancelar = areaLogin.querySelector(".btnCancelar");

      /* ABRIR LOGIN */

      card.onclick = () => {

        document.querySelectorAll(".loginInterno")
          .forEach(a => a.style.display = "none");

        document.querySelectorAll(".cardFuncionario")
          .forEach(c => c.classList.remove("ativo"));

        card.classList.add("ativo");
        areaLogin.style.display = "block";

        inputSenha.value = "";
        inputSenha.focus();

        funcionarioSelecionado = { id: doc.id, ...f };
      };

      /* LOGIN */

      function fazerLogin() {

        if (!funcionarioSelecionado) return;

        loadingTexto.innerText =
          `Bem-vindo(a) ${funcionarioSelecionado.nome}`;

        loading.classList.add("ativo");

        setTimeout(() => {

          if (inputSenha.value === funcionarioSelecionado.senha) {

            localStorage.setItem(
              "funcionario",
              JSON.stringify(funcionarioSelecionado)
            );

            window.location.href = "loja.html";

          } else {

            loading.classList.remove("ativo");
            erroSenha.classList.add("ativo");

            inputSenha.value = "";
            inputSenha.focus();
          }

        }, 1200);
      }

      btnEntrar.onclick = (e) => {
        e.stopPropagation();
        fazerLogin();
      };

      /* ENTER FAZ LOGIN */

      inputSenha.addEventListener("keypress", e => {
        if (e.key === "Enter") {
          fazerLogin();
        }
      });

      /* CANCELAR */

      btnCancelar.onclick = (e) => {

        e.stopPropagation();

        areaLogin.style.display = "none";
        card.classList.remove("ativo");
        funcionarioSelecionado = null;
      };

      lista.appendChild(card);
    });
  }

  fecharErro.onclick = () => {
    erroSenha.classList.remove("ativo");
  };

  buscarInput?.addEventListener("input", e => {
    carregarFuncionarios(e.target.value);
  });

  carregarFuncionarios();
}


/* ============================================================
LOJA
============================================================ */

if (window.location.pathname.endsWith("loja.html")) {

  const funcionario = JSON.parse(localStorage.getItem("funcionario"));

  if (!funcionario) {
    window.location.href = "index.html";
  }

  document.getElementById("userNome").textContent = funcionario.nome;
  document.getElementById("userFoto").src =
    funcionario.foto || "image/user.png";

  if (funcionario.nivel === "admin") {

    const menuAdmin = document.getElementById("menuAdmin");

    if (menuAdmin) menuAdmin.style.display = "block";

    document.body.classList.add("adminAtivo");
  }

  const grid = document.getElementById("produtosGrid");
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  const confirmarBtn = document.getElementById("confirmarBtn");
  const pagamentoArea = document.getElementById("pagamentoArea");
  const logoutBtn = document.getElementById("logoutBtn");
  const pagarDepoisBtn = document.getElementById("pagarDepoisBtn");

  let carrinho = [];

  async function carregarProdutos() {

    const snap = await getDocs(collection(db, "produtos"));
    grid.innerHTML = "";

    snap.forEach(doc => {

      const p = doc.data();
      const preco = parseFloat(p.preco || 0);

      const div = document.createElement("div");
      div.className = "produto";

      div.innerHTML = `
        <img src="${p.imagem || ""}">
        <p class="nome">${p.nome}</p>
        <p class="preco">R$ ${preco.toFixed(2)}</p>
        <button class="btn">Adicionar</button>
      `;

      div.querySelector("button").onclick = () => {

        carrinho.push({
          nome: p.nome,
          preco
        });

        atualizarCarrinho();
      };

      grid.appendChild(div);
    });
  }

  function atualizarCarrinho() {

    cartItems.innerHTML = carrinho.map(i => `
      <div class="item-cart">
        ${i.nome}
        <span>R$ ${i.preco.toFixed(2)}</span>
      </div>
    `).join("");

    const total = carrinho.reduce((t, i) => t + i.preco, 0);

    cartTotal.textContent = total.toFixed(2);
    pagamentoArea.style.display =
      carrinho.length ? "block" : "none";
  }

  async function registrarVenda(status) {

    if (!carrinho.length) return;

    const total = carrinho.reduce((t, i) => t + i.preco, 0);

    await addDoc(collection(db, "vendas"), {
      funcionario: funcionario.nome,
      funcionarioId: funcionario.id,
      itens: carrinho,
      total,
      status,
      data: new Date().toISOString()
    });

    carrinho = [];
    atualizarCarrinho();

    alert("Venda registrada com sucesso!");
  }

  confirmarBtn.onclick = () => registrarVenda("pago");
  pagarDepoisBtn.onclick = () => registrarVenda("pagar depois");

  logoutBtn.onclick = () => {

    localStorage.removeItem("funcionario");
    window.location.href = "index.html";
  };

  carregarProdutos();
}
