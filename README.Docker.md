# Docker Setup for Simple Blog

## Prerequisites
- Docker Desktop installed and running
- Supabase project credentials (URL + Anon Key)

## Quick Start

### 1. Build Docker Image
```bash
cd c:\simple-blog

# Build the image
docker build -t simple-blog:latest .
```

### 2. Run with Docker Compose (Recommended)

#### Setup Environment Variables
```bash
# Copy template
cp .env.docker .env.docker.local

# Edit with your Supabase credentials
# Windows PowerShell:
# notepad .env.docker.local
```

#### Update docker-compose.yml with Environment
Edit `docker-compose.yml` and replace:
```yaml
environment:
  - NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Start Services
```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### 3. Run Single Container
```bash
# Build
docker build -t simple-blog:latest .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  simple-blog:latest
```

## Access Application
- Web: http://localhost:3000
- Health Check: http://localhost:3000/api/health (if implemented)

## Development Mode

For development with hot reload:
```bash
docker run -p 3000:3000 \
  -v ${PWD}:/app \
  -v /app/node_modules \
  -e NODE_ENV=development \
  node:18-alpine \
  npm run dev
```

## Docker Commands Reference

```bash
# List images
docker images

# List running containers
docker ps

# View container logs
docker logs <container-id>

# Stop container
docker stop <container-id>

# Remove image
docker rmi simple-blog:latest

# Rebuild without cache
docker build --no-cache -t simple-blog:latest .
```

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

Optional:
- `NODE_ENV` - Set to `production` (default) or `development`
- `PORT` - Port to listen on (default: 3000)

## Troubleshooting

### Port 3000 already in use
```bash
# Use different port
docker run -p 3001:3000 simple-blog:latest

# Or kill process on port
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows
```

### Build fails
```bash
# Clear Docker cache
docker system prune -a

# Rebuild
docker build --no-cache -t simple-blog:latest .
```

### Container exits immediately
```bash
# Check logs
docker logs <container-id>

# Run with interactive terminal
docker run -it simple-blog:latest /bin/sh
```

## Production Deployment

For production, consider:

1. **Use specific Node version tag** (instead of `latest`)
   ```dockerfile
   FROM node:18.17.1-alpine
   ```

2. **Add security scanning**
   ```bash
   docker scan simple-blog:latest
   ```

3. **Push to registry**
   ```bash
   docker tag simple-blog:latest your-registry/simple-blog:1.0.0
   docker push your-registry/simple-blog:1.0.0
   ```

4. **Use secrets for sensitive data**
   - Store Supabase keys in Docker secrets or environment variables
   - Never commit `.env.local` files

## Docker Compose with Additional Services

To add database or cache:

```yaml
services:
  app:
    # ... existing config

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - blog-network

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: password
    networks:
      - blog-network
```

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment/docker)
- [Supabase Documentation](https://supabase.com/docs)
