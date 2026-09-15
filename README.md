# Competitive Programming Lab

Laboratorio simples para praticar programacao competitiva, inicialmente com foco em problemas do Beecrowd usando JavaScript e C++.

A ideia e manter cada solucao perto do formato que seria submetido ao juiz online, mas com espaco para testar a funcao principal quando isso ajudar.

Cada pasta dentro de `beecrowd/` representa um problema. Dentro dela, `js/` e `cpp/` guardam as implementacoes.

## input.txt

Cada problema pode ter um `input.txt` proprio:

```text
beecrowd/1001/input.txt
```

---

## Comandos

Comando correto:

```bash
npm run lab:run 1001
npm run lab:test 1001
npm run cpp:run 1001
npm run cpp:test 1001
```

`lab.js` roda JavaScript e tambem compila/executa C++.

## Testes

JavaScript usa Mocha + Chai:

```bash
npm test
npm run lab:test 1001
```

## Progresso

| Problem | Topic | JS | C++ |
|---------|-------|----|-----|
| 1001 | I/O, arithmetic | yes | yes |
