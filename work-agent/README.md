# Regsure WhatsApp assistant

The agent calls the Regsure backend through `REGSURE_API_URL`. Never hardcode the backend URL in tools or channels.

## Local setup

```powershell
copy .env.example .env
npm install
npm run typecheck
npm run dev
```

The Zaileys + Chat SDK packages are installed separately when the WhatsApp provider is selected:

```powershell
npm install zaileys chat chat-adapter-zaileys
```

Configure Zaileys provider credentials and session storage before enabling production WhatsApp. Pairing is provider-specific; for WhatsApp Web, start the adapter and open the generated QR/pairing URL. For WhatsApp Cloud, configure Meta webhook credentials instead of QR pairing.
