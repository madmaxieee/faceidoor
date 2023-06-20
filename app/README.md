# Faceidoor server

## Instructions

You must have docker and node >= 18 installed to run this app.

1. create the .env file
```bash
cp .env.example .env
# fill in FEATURE_EXTRACTOR_URL (url of the feature extractor server)
# and AUTHENTICATOR_URL (url of the RPi server)
vim .env
```

2. start the database
```bash
cd ..
docker compose up -d
cd app
```

3. start the server
```bash
# enable pnpm
corepack enable
pnpm install
pnpm dev
```
