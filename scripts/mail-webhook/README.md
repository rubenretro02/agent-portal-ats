# Mail Server Webhook
Webhook para crear buzones de correo via docker-mailserver.
## Instalación en tu servidor (172.86.89.39)
### 1. Instalar Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```
### 2. Copiar el script
```bash
mkdir -p /opt/mailserver/webhook
# Copia server.js a /opt/mailserver/webhook/
```
### 3. Crear servicio systemd
```bash
cat > /etc/systemd/system/mail-webhook.service << 'EOF'
[Unit]
Description=Mail Webhook Server
After=network.target docker.service
[Service]
Type=simple
User=root
WorkingDirectory=/opt/mailserver/webhook
Environment=MAIL_WEBHOOK_API_KEY=TuClaveSecretaAqui123
Environment=SETUP_PATH=/opt/mailserver
ExecStart=/usr/bin/node server.js
Restart=on-failure
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable mail-webhook
systemctl start mail-webhook
```
### 4. Verificar
```bash
curl -X POST http://localhost:3333 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: TuClaveSecretaAqui123" \
  -d '{"action": "list", "email": "test"}'
```
## Configuración en Vercel
Agrega estas variables de entorno:
```
MAIL_SERVER_API_URL=http://172.86.89.39:3333
MAIL_SERVER_API_KEY=TuClaveSecretaAqui123
```
