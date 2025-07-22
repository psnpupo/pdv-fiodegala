# Dockerfile para o backend Node.js
FROM node:18-alpine

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Expor porta 4000
EXPOSE 4000

# Comando para iniciar a aplicação
CMD ["npm", "start"] 