# ECMO Query Builder - Docker Setup

This document explains how to build and run the ECMO Query Builder application using Docker.

## Prerequisites

- Docker installed (version 20.10 or higher)
- Docker Compose installed (version 2.0 or higher)

## Quick Start

### Build and Run with Docker Compose

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at: **http://localhost:8080**

### Build Docker Image Manually

```bash
# Build the image
docker build -t ecmo-query-builder:latest .

# Run the container
docker run -d -p 8080:80 --name ecmo-query-builder ecmo-query-builder:latest

# Stop and remove the container
docker stop ecmo-query-builder
docker rm ecmo-query-builder
```

## Configuration

### Change Port

Edit `docker-compose.yml` to change the exposed port:

```yaml
ports:
  - "3000:80"  # Change 3000 to your desired port
```

### Environment Variables

You can add environment variables in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - API_URL=https://your-api.com
```

## Architecture

The Docker setup uses a **multi-stage build**:

1. **Build Stage**: Uses Node.js to build the Angular application
2. **Runtime Stage**: Uses Nginx Alpine to serve the built static files

This approach results in a small, optimized image (~50MB).

## Nginx Configuration

The nginx configuration (`nginx.conf`) includes:

- **SPA Routing**: All routes serve `index.html` for proper Angular routing
- **Gzip Compression**: Enabled for text assets
- **Static Asset Caching**: 1-year cache for images, CSS, JS
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Health Check**: Available at `/health`

## Health Check

The container includes a health check that can be monitored:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' ecmo-query-builder
```

## Production Deployment

For production deployment:

1. Update `nginx.conf` with your domain
2. Configure SSL/TLS (consider using a reverse proxy like Traefik or Nginx Proxy Manager)
3. Set appropriate resource limits in `docker-compose.yml`
4. Use Docker secrets for sensitive data

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs ecmo-query-builder

# Verify nginx configuration
docker run --rm -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf nginx:alpine nginx -t
```

### Port already in use

```bash
# Find what's using the port
lsof -i :8080

# Or change the port in docker-compose.yml
```

### Rebuild after code changes

```bash
# Rebuild and restart
docker-compose up -d --build
```

## File Structure

```
.
├── Dockerfile              # Multi-stage build definition
├── docker-compose.yml      # Docker Compose configuration
├── nginx.conf             # Nginx server configuration
├── .dockerignore          # Files to exclude from Docker build
└── README.Docker.md       # This file
```
