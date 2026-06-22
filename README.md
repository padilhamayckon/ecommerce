# Ecommerce

Sistema de e-commerce desenvolvido com Node.js, Express, Handlebars e MySQL.

## Requisitos

- Node.js 18+
- MySQL 8+
- npm

## Funcionalidades

- Cadastro de usuários
- Login
- Recuperação de senha
- Catálogo de produtos
- Carrinho de compras
- Reserva temporária de estoque
- Área administrativa

## Instalação

Clone o projeto:

```bash
git clone https://github.com/padilhamayckon/ecommerce.git
cd ecommerce
```

Instale as dependências:

```bash
npm install
```

## Configuração do Banco de Dados

Execute o script SQL localizado em:

```text
database/schema.sql
```

Pelo terminal:

```bash
mysql -u root -p < database/schema.sql
```

Ou abra o arquivo no MySQL Workbench/phpMyAdmin e execute-o.

## Configuração do Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

No Windows:

```cmd
copy .env.example .env
```

Edite o arquivo `.env` com suas configurações.

## Executando o projeto

Modo desenvolvimento:

```bash
npm run dev
```

Modo produção:

```bash
npm start
```

Acesse:

```text
http://localhost:3000
```