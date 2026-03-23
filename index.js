import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";

const app = express();
const HOST = "0.0.0.0";
const PORTA = 3000;

var listaProdutos = [];

app.use(session({
    secret: 'M1nhaCh4v3S3cr3t4',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 15
    }
}));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

function layoutPagina(titulo, conteudo) {
    return `
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>

<style>
*{
margin:0;
padding:0;
box-sizing:border-box;
font-family: Arial, Helvetica, sans-serif;
}
.conteudo{
max-width:700px;
margin:50px auto;
padding: 35px;
}

body{
background: linear-gradient(120deg,#efe6ff,#d6c7ff);
min-height:100vh;
}

header{
background:#5a3ea6;
padding:15px;
display:flex;
justify-content:center;
align-items:center;
gap:25px;
}

header a{
color:white;
text-decoration:none;
font-weight:bold;
padding:8px 14px;
border-radius:6px;
transition:0.3s;
}

header a:hover{
background:#7a5ad9;
}

h1,h2,h3{
margin-bottom:20px;
color:#5a3ea6;
text-align:center;
background: #5a3ea6;
border-radius:6px;
color:white;
padding:10px;
}

form{
display:flex;
flex-direction:column;
gap:12px;
}

.formcad{
display:grid;
grid-template-columns:1fr 1fr;
gap:15px;
}

.formcad div{
display:flex;
flex-direction:column;
}

.formcad button{
grid-column:span 2;
}

label{
font-weight:bold;
font-size:14px;
}

input{
padding:10px;
border:1px solid #ccc;
border-radius:6px;
font-size:14px;
}

input:focus{
outline:none;
border-color:#5a3ea6;
}

button{
margin-top:10px;
padding:10px;
border:none;
background:#5a3ea6;
color:white;
font-weight:bold;
border-radius:6px;
cursor:pointer;
transition:0.3s;
}

button:hover{
background:#7a5ad9;
}

table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}

th, td{
padding:10px;
border:1px solid #ddd;
text-align:left;
font-size:14px;
}

th{
background:#5a3ea6;
color:white;
}

tr:nth-child(even){
background:#f5f3ff;
}

.error{
display:inline-block;
margin-top:15px;
color:white;
background:#8e44ad;
padding:8px 14px;
border-radius:6px;
text-decoration:none;
}

.error:hover{
background:#a569bd;
}
</style>
</head>
<body>
<header>
<a href="/">Início</a>
<a href="/cadastro">Cadastrar Produto</a>
<a href="/produtos">Produtos Cadastrados</a>
<a href="/login">Login</a>
<a href="/logout">Logout</a>
</header>

<div class="conteudo"> ${conteudo} </div>

</body>
</html>
`;
}

function estAutenticado(req, res, next) {
    if (req.session?.logado) {
        next();
    }
    else {
        res.send(
            layoutPagina(
                "Acesso negado",
                `
<h2>Você precisa estar logado para acessar esta página.</h2>

<a href="/login">
<button>Ir para login</button>
</a>
`
            )
        );
    }
}

app.get("/", estAutenticado, (req, res) => {
    res.send(
        layoutPagina(
            "Home",
            `<h1>Sistema de Cadastro de Produtos</h1>
             <p>Usuário logado: ${req.session.usuario}</p>`
        )
    );
});

app.get("/login", (req, res) => {

    const ultimoAcesso = req.cookies?.ultimoAcesso || "Nunca acessou";

    res.send(
        layoutPagina(
            "Login",
            `
<h2>Acesso ao sistema</h2>

<form method="POST" action="/login">

<label for="email">Email</label>
<input type="email" name="email" id="email" placeholder="Digite seu email">

<label for="senha">Senha</label>
<input type="password" name="senha" id="senha" placeholder="Digite sua senha">

<p>Último acesso: ${ultimoAcesso}</p>

<button>Entrar</button>

</form>
`
        )
    );
});

app.post("/login", (req, res) => {

    const email = req.body.email;
    const senha = req.body.senha;

    if (email == "admin@teste.com" && senha == "123456") {

        req.session.logado = true;
        req.session.usuario = email; 

        const dataUltimoAcesso = new Date();
        res.cookie("ultimoAcesso", dataUltimoAcesso.toLocaleString(), {
            maxAge: 1000*60*60*24*30,
            httpOnly: true
        });

        res.redirect("/");

    } else {
        res.send(
            layoutPagina(
                "Erro no login",
                `
<h2>Erro no login</h2>
<p>Email ou senha inválidos.</p>

<a href="/login">
<button>Tentar novamente</button>
</a>
`
            )
        );
    }
});

app.get("/logout", (req, res) => {

    req.session.destroy();

    res.send(
        layoutPagina(
            "Logout",
            `
<h2>Você foi desconectado com sucesso.</h2>
<p>Para acessar o sistema novamente, faça login.</p>

<a href="/login">
    <button>Ir para login</button>
</a>
`
        )
    );
});

app.get("/cadastro", estAutenticado, (req, res) => {

    res.send(
        layoutPagina(
            "Cadastro",
            `
<h3>Cadastro de Produto</h3>

<form class="formcad" method="POST" action="/cadastro">

<div>
<label>Código de Barras</label>
<input type="text" name="codigo" placeholder="Ex: 7891234567890">
</div>

<div>
<label>Descrição do Produto</label>
<input type="text" name="descricao" placeholder="Ex: Refrigerante 2L">
</div>

<div>
<label>Preço de Custo</label>
<input type="text" name="precoCusto" placeholder="Ex: 5.50">
</div>

<div>
<label>Preço de Venda</label>
<input type="text" name="precoVenda" placeholder="Ex: 8.99">
</div>

<div>
<label>Data de Validade</label>
<input type="text" name="validade" placeholder="Ex: 31/12/2026">
</div>

<div>
<label>Quantidade em Estoque</label>
<input type="text" name="estoque" placeholder="Ex: 100">
</div>

<div>
<label>Nome do Fabricante</label>
<input type="text" name="fabricante" placeholder="Ex: Coca-Cola">
</div>

<button>Cadastrar</button>

</form>
`
        )
    );
});

app.get("/produtos", estAutenticado, (req, res) => {

    let tabela = "";

    if (listaProdutos.length > 0) {

        for (let i = 0; i < listaProdutos.length; i++) {
            let f = listaProdutos[i];

            tabela += `
<tr>
<td>${f.codigo}</td>
<td>${f.descricao}</td>
<td>${f.precoCusto}</td>
<td>${f.precoVenda}</td>
<td>${f.validade}</td>
<td>${f.estoque}</td>
<td>${f.fabricante}</td>
</tr>
`;
        }

    } else {
        tabela = `<tr><td colspan="7">Nenhum produto cadastrado</td></tr>`;
    }

    res.send(
        layoutPagina(
            "Produtos",
            `
<h2>Produtos Cadastrados</h2>

<p>Último acesso: ${req.cookies?.ultimoAcesso || "Nunca acessou"}</p>

<table>

<tr>
<th>Código</th>
<th>Descrição</th>
<th>Custo</th>
<th>Venda</th>
<th>Validade</th>
<th>Estoque</th>
<th>Fabricante</th>
</tr>

${tabela}

</table>

<br>

<a href="/cadastro">
<button>Cadastrar novo produto</button>
</a>
`
        )
    );

});

app.post("/cadastro", estAutenticado, (req, res) => {

    const { codigo, descricao, precoCusto, precoVenda, validade, estoque, fabricante } = req.body;

    let erros = [];

    if (!codigo) erros.push("Código não informado");
    if (!descricao) erros.push("Descrição não informada");
    if (!precoCusto) erros.push("Preço de custo não informado");
    if (!precoVenda) erros.push("Preço de venda não informado");
    if (!validade) erros.push("Validade não informada");
    if (!estoque) erros.push("Estoque não informado");
    if (!fabricante) erros.push("Fabricante não informado");

    if (erros.length > 0) {

        let lista = "";
        for (let i = 0; i < erros.length; i++) {
            lista += `<li>${erros[i]}</li>`;
        }

        res.send(
            layoutPagina(
                "Erro",
                `
<h2>Erro no cadastro</h2>

<ul>
${lista}
</ul>

<a class="error" href="/cadastro">Voltar</a>
`
            )
        );

    }
    else {

        listaProdutos.push({
            codigo,
            descricao,
            precoCusto,
            precoVenda,
            validade,
            estoque,
            fabricante
        });

        res.redirect("/produtos");
    }

});

app.listen(PORTA, HOST, () => {
    console.log(`Servidor iniciado em http://localhost:${PORTA}`);
});