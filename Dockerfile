# =============================================================================
# Dockerfile for OpenShift Deployment - ECMO Query Builder
# =============================================================================
# OpenShift compatible configuration with:
# - Port 8080 (OpenShift requirement, no ports < 1024)
# - Non-root user (UID 1001)
# - Proper permissions for nginx directories
# =============================================================================

# =============================================================================
# Build Stage
# =============================================================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application for production
RUN npm run build

# =============================================================================
# Runtime Stage - Nginx
# =============================================================================
FROM nginx:alpine

# =============================================================================
# OpenShift Compatibility
# =============================================================================
# OpenShift runs containers with arbitrary user IDs (non-root)
# We need to set proper permissions for nginx directories

# Create group and user for OpenShift compatibility
RUN addgroup -g 1001 -S nginx-openshift && \
    adduser -u 1001 -S nginx-openshift -G nginx-openshift

# Copy built Angular application
COPY --from=build /app/dist/ecmo-query-builder/browser /usr/share/nginx/html

# Copy nginx configuration (listens on port 8080)
COPY nginx.conf /etc/nginx/nginx.conf

# =============================================================================
# Permissions for OpenShift
# =============================================================================
# OpenShift requires that the user can write to certain directories

# Create directories for nginx with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp && \
    mkdir -p /var/run && \
    mkdir -p /var/log/nginx

# Change ownership of all necessary directories
# chown to UID 1001 and GID 0 (root group, OpenShift requirement)
# chmod to give group write permissions
RUN chown -R 1001:0 /var/cache/nginx && \
    chmod -R g+w /var/cache/nginx && \
    chown -R 1001:0 /var/run && \
    chmod -R g+w /var/run && \
    chown -R 1001:0 /var/log/nginx && \
    chmod -R g+w /var/log/nginx && \
    chown -R 1001:0 /usr/share/nginx/html && \
    chmod -R g+w /usr/share/nginx/html && \
    chown -R 1001:0 /etc/nginx && \
    chmod -R g+w /etc/nginx

# Create nginx.pid file with proper permissions
RUN touch /var/run/nginx.pid && \
    chown 1001:0 /var/run/nginx.pid && \
    chmod g+w /var/run/nginx.pid

# =============================================================================
# Configuration
# =============================================================================

# Expose port 8080 (OpenShift does not allow ports < 1024)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Run as non-root user (required by OpenShift)
USER 1001

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# =============================================================================
# Build Instructions
# =============================================================================
#
# Build locally:
#   docker build -t brighter-fe-taxonomy-prototype:latest .
#
# Test locally (simulate OpenShift):
#   docker run --rm -p 8080:8080 --user 1001:0 brighter-fe-taxonomy-prototype:latest
#
# Deploy on OpenShift:
#   oc apply -f openshift-buildconfig.yaml
#   oc start-build brighter-fe-taxonomy-prototype --follow
#
# =============================================================================
