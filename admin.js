// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 Config do Firebase (mantém a tua)
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ====== ELEMENTOS ======
const prodNome = document.getElementById("prodNome");
const prodPreco = document.getElementById("prodPreco");
const prodImg = document.getElementById("prodImg");
const btnAddProd = document.getElementById("btnAddProd");
const prodTableBody = document.querySelector("#prodTable tbody");

const pixUrl = document.getElementById("pixUrl");
const btnSavePix = document.getElementById("btnSavePix");

const salesTableBody = document.querySelector("#salesTable tbody");
const btnFilter = document.getElementById("btnFilter");
const btnExport = document.getElementById("btnExport");

// ====== PRODUTOS ======
async function carregarProdutos() {
  prodTableBody.innerHTML = "";
  const snapshot = await getDocs(collection(db, "produtos"));
  snapshot.forEach((docSnap) => {
    const p = docSnap.data();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.nome}</td>
      <td>R$ ${Number(p.preco).toFixed(2)}</td>
      <td><img src="${p.imagem}" width="50" height="50" style="object-fit:cover;border-radius:4px"></td>
      <td>
        <button class="btn-ghost" data-edit="${docSnap.id}">Editar</button>
        <button class="btn-ghost" data-del="${docSnap.id}">Excluir</button>
      </td>`;
    prodTableBody.appendChild(row);
  });

  // Ações
  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = async () => editarProduto(btn.dataset.edit);
  });
  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = async () => deletarProduto(btn.dataset.del);
  });
}

async function adicionarProduto() {
  const nome = prodNome.value.trim();
  const preco = parseFloat(prodPreco.value);
  const imagem = prodImg.value.trim();

  if (!nome || !preco || !imagem) return alert("Preencha todos os campos!");

  await addDoc(collection(db, "produtos"), { nome, preco, imagem });
  alert("Produto salvo!");
  prodNome.value = "";
  prodPreco.value = "";
  prodImg.value = "";
  carregarProdutos();
}

async function editarProduto(id) {
  const ref = doc(db, "produtos", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return alert("Produto não encontrado!");
  const p = snap.data();

  prodNome.value = p.nome;
  prodPreco.value = p.preco;
  prodImg.value = p.imagem;

  btnAddProd.textContent = "Atualizar";
  btnAddProd.onclick = async () => {
    await updateDoc(ref, {
      nome: prodNome.value.trim(),
      preco: parseFloat(prodPreco.value),
      imagem: prodImg.value.trim(),
    });
    alert("Produto atualizado!");
    btnAddProd.textContent = "Salvar produto";
    btnAddProd.onclick = adicionarProduto;
    carregarProdutos();
  };
}

async function deletarProduto(id) {
  if (!confirm("Deseja realmente excluir este produto?")) return;
  await deleteDoc(doc(db, "produtos", id));
  carregarProdutos();
}

btnAddProd.addEventListener("click", adicionarProduto);
carregarProdutos();

// ====== PIX ======
async function carregarPix() {
  const docRef = doc(db, "config", "pix");
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    pixUrl.value = snap.data().url || "";
  }
}

async function salvarPix() {
  const url = pixUrl.value.trim();
  if (!url) return alert("Informe a URL do QR Code Pix!");
  await setDoc(doc(db, "config", "pix"), { url });
  alert("QR Code Pix salvo!");
}

btnSavePix.addEventListener("click", salvarPix);
carregarPix();

// ====== RELATÓRIO DE VENDAS ======
async function carregarVendas(filtroDe, filtroAte) {
  salesTableBody.innerHTML = "";
  let q = collection(db, "vendas");

  const vendasSnap = await getDocs(q);
  vendasSnap.forEach((docSnap) => {
    const v = docSnap.data();
    const dataVenda = v.data ? v.data.toDate ? v.data.toDate() : new Date(v.data) : new Date();

    if (filtroDe && filtroAte) {
      if (dataVenda < filtroDe || dataVenda > filtroAte) return;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${dataVenda.toLocaleDateString()}</td>
      <td>${v.funcionario || "—"}</td>
      <td>${(v.itens || []).map(i => i.nome).join(", ")}</td>
      <td>R$ ${Number(v.total || 0).toFixed(2)}</td>`;
    salesTableBody.appendChild(row);
  });
}

btnFilter.addEventListener("click", () => {
  const d1 = document.getElementById("dateFrom").valueAsDate;
  const d2 = document.getElementById("dateTo").valueAsDate;
  carregarVendas(d1, d2);
});

btnExport.addEventListener("click", async () => {
  const rows = [["Data", "Funcionário", "Itens", "Valor"]];
  const trs = salesTableBody.querySelectorAll("tr");
  trs.forEach(tr => {
    const tds = tr.querySelectorAll("td");
    rows.push([...tds].map(td => td.textContent));
  });
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "relatorio_vendas.csv";
  a.click();
});

carregarVendas();