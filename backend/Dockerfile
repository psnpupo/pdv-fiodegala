# Dockerfile para o backend Node.js
FROM node:18-alpine

# Instalar dependências do sistema necessárias para compilar pacotes nativos
RUN apk add --no-cache python3 make g++ linux-headers

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências sem pacotes USB problemáticos
RUN npm install --ignore-scripts

# Copiar código fonte
COPY . .

# Expor porta 4000
EXPOSE 4000

# Comando para iniciar a aplicação
CMD ["npm", "start"] 