# Flowise Setup Guide

## 1. Prerequisites
-   Node.js v18+
-   Docker (Optional, recommended for production)
-   Git

## 2. Quick Start (Local)
We will run Flowise locally for development testing.

```bash
# Install Flowise globally
npm install -g flowise

# Start Flowise
npx flowise start
```
-   **UI**: Open `http://localhost:3000`
-   **API**: `http://localhost:3000/api/v1`

## 3. Production Setup (Docker)
For the final VieAgent platform, we will deploy Flowise via Docker.

**docker-compose.yml**
```yaml
version: '3.1'
services:
    flowise:
        image: flowiseai/flowise
        restart: always
        environment:
            - PORT=3000
            - FLOWISE_USERNAME=admin
            - FLOWISE_PASSWORD=your_secure_password
            - APIKEY_PATH=/root/.flowise
            - SECRETKEY_PATH=/root/.flowise
            - LOG_LEVEL=info
            - LOG_PATH=/root/.flowise/logs
        ports:
            - '3000:3000'
        volumes:
            - ~/.flowise:/root/.flowise
```

## 4. Integration with VieAgent
### Environment Variables
Add these to `Vieagent-rebuild/.env.local`:
```env
NEXT_PUBLIC_FLOWISE_API_HOST=http://localhost:3000
FLOWISE_API_KEY=your_secured_key_if_configured
```

### Verification
1.  Start Flowise.
2.  Create a simple "Hello World" Chatflow.
3.  Note the `Chatflow ID`.
4.  Test via Curl:
    ```bash
    curl http://localhost:3000/api/v1/prediction/<chatflow-id> \
      -X POST \
      -d '{"question": "Hello"}'
    ```
