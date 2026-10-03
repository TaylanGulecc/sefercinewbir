FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Testler Appium'a (BrowserStack veya erişilebilir bir Appium sunucusu) bağlanır;
# tarayıcı kurulumu gerekmez. Rapor: /app/playwright-report
CMD ["npm", "test"]
