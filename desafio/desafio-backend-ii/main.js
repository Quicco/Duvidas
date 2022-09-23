const express = require("express");
const app = express();
const port = process.env.PORT ?? 3030;
app.use(express.json());

// Users and Errors

// Array de tokens
const tokens = [];

// Credenciais
const loginCredentials = [{}];

// Validacoes
function generateToken(email) {
  return email
    .split("")
    .map((e, i) => String.fromCharCode(e.charCodeAt(0) + ((i % 4) + 1) * 2))
    .join("");
}

function validateEmail(email) {
  // Esta expressão regular não garante que email existe, nem que é válido
  // No entanto deverá funcionar para a maior parte dos emails que seja necessário validar.
  const EMAIL_REGEX =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return EMAIL_REGEX.test(email);
}

function checkPasswordStrength(password) {
  if (password.length < 8) return 0;
  const regexes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[~!@#$%^&*)(+=._-]/];
  return regexes
    .map((re) => re.test(password))
    .reduce((score, t) => (t ? score + 1 : score), 0);
}

// Find all errors function
function findErrors({ email, password, passwordConfirmation, acceptsTerms }) {
  let errors = {};
  // Email errors
  if (email === undefined || email === "") {
    errors.email = "Por favor introduza o seu endereço de email.";
  } else if (!validateEmail(email)) {
    errors.email = "Por favor introduza um endereço de email válido.";
  } else if (
    loginCredentials.some((loginCredential) => loginCredential.email === email)
  ) {
    errors.email = "O endereço introduzido já está registado.";
  }
  // Password errors
  if (password === undefined || password === "") {
    errors.password = "Por favor introduza a sua password.";
  } else if (password.length < 8) {
    errors.password = "A sua password deve ter no mínimo 8 caracteres.";
  } else if (checkPasswordStrength(password) < 4) {
    errors.password =
      "A sua password deve ter pelo menos um número, uma mínuscula, uma maiúscula e um símbolo.";
  }
  // Password Confirmation errors
  if (passwordConfirmation === undefined || passwordConfirmation === "") {
    errors.passwordConfirmation =
      "Por favor introduza novamente a sua password.";
  } else if (passwordConfirmation != password) {
    errors.passwordConfirmation = "As passwords não coincidem.";
  } // Accepts Terms errors
  if (!acceptsTerms) {
    errors.acceptsTerms =
      "Tem de aceitar os termos e condições para criar a sua conta.";
  }

  return errors;
}
/* Object.keys(nomeDoObjeto).length */ // se length === 0 -> nao ha erros

// Signup Endpoit
app.post("/signup", (req, res) => {
  const mensagensErro = findErrors(req.body);

  const {
    email,
    password,
    passwordConfirmation,
    acceptsTerms,
    acceptsCommunications,
  } = req.body;

  // Se passar, adicionar aos loginCredentials
  if (Object.keys(mensagensErro).length === 0) {
    loginCredentials.push(req.body);
    res.status(201).json({
      message: "Utilizador Criado com Sucesso!",
    });
  } else
    res.status(400).json({
      message: "Os dados introduzidos não são válidos.",
      errors: mensagensErro,
    });
});

// Login Endpoint
app.post("/login", (req, res) => {
  //O corpo recebe um email e uma password
  const { email, password } = req.body;
  if (
    loginCredentials.some(
      (loginCredential) =>
        loginCredential.email === email && loginCredential.password === password
    )
  ) {
    tokens.push({ token: generateToken(email), email });
    res.status(200).json({ token: `${generateToken(email)}` }); // Sucess
  } else if (
    loginCredentials.some((loginCredential) => loginCredential.email === email)
  ) {
    // Error 401
    res.status(401).json({
      message: "A password introduzida é inválida!",
    });
  } else {
    // Error 404
    res.status(404).json({
      message: "O utilizador não foi encontrado!",
    });
  }
});

// User Endpoint
app.get("/user", (req, res) => {
  const token = req.header("Authorization");
  //Erro 401
  if (!token) {
    return res.status(401).json({
      message: "Não foi enviado o token de autenticação!",
    });
  }
  const sessao = tokens.find((t) => t.token === token);
  if (sessao) {
    const user = loginCredentials.find((u) => u.email === sessao.email);
    // Success
    res.status(200).json({
      email: user.email,
      acceptsTerms: user.acceptsTerms,
      acceptsCommunications: user.acceptsCommunications,
    });
  } else {
    // Erro 403
    return res.status(403).json({
      message: "Não existe nenhuma sessão com o token indicado!",
    });
  }
});

app.listen(port, () => {
  console.log(`À escuta em http://localhost:${port}`);
});
