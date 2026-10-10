# Regsure VPS deployment

Create real environment files on the server; never commit them.

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo systemctl enable --now docker nginx
cp .env.production.example .env.production
cp work-agent/.env.production.example work-agent/.env.production
# Fill both files with production secrets.
docker compose -f docker-compose.production.yml up -d --build
```

For staging, create `.env.staging` and `work-agent/.env.staging` with the test domains and staging database, then run:

```bash
docker compose -f docker-compose.staging.yml up -d --build
```

Copy the Nginx files into `/etc/nginx/sites-available`, link them into `/etc/nginx/sites-enabled`, then run:

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d regsure.app -d www.regsure.app -d api.regsure.app -d eve.regsure.app
sudo certbot --nginx -d test.regsure.app -d test-api.regsure.app -d test-agent.regsure.app
```

The WhatsApp QR is printed by the worker logs:

```bash
docker compose -f docker-compose.production.yml logs -f whatsapp
```

Keep production and staging Zaileys session IDs and WhatsApp numbers separate.
