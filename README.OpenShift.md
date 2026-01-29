# ECMO Query Builder - OpenShift Deployment

This document explains how to deploy the ECMO Query Builder (brighter-fe-taxonomy-prototype) on OpenShift.

## Prerequisites

- OpenShift CLI (`oc`) installed and configured
- Access to the `brighter` namespace
- Container image pushed to registry accessible by OpenShift

## Project Configuration

- **Project Name**: `brighter-fe-taxonomy-prototype`
- **Namespace**: `brighter`
- **Hostname**: `brighter-fe-taxonomy-prototype-brighter.apps.ocbmt.jrc.cec.eu.int`
- **Port**: 80 (HTTP inside cluster)
- **TLS**: Edge termination with insecure traffic allowed

## Quick Deployment

### Option 1: Deploy All Resources at Once

```bash
# Login to OpenShift
oc login <your-openshift-cluster>

# Switch to brighter namespace
oc project brighter

# Deploy all resources
oc apply -f openshift-all.yaml
```

### Option 2: Deploy Resources Individually

```bash
# Deploy Service
oc apply -f openshift-service.yaml

# Deploy Deployment
oc apply -f openshift-deployment.yaml

# Deploy Route
oc apply -f openshift-route.yaml
```

## Before Deployment

### 1. Build and Push Docker Image

```bash
# Build the image
docker build -t <YOUR_REGISTRY>/brighter-fe-taxonomy-prototype:latest .

# Push to registry
docker push <YOUR_REGISTRY>/brighter-fe-taxonomy-prototype:latest
```

### 2. Update Image Reference

Edit `openshift-deployment.yaml` or `openshift-all.yaml` and replace `<YOUR_REGISTRY>` with your actual registry:

```yaml
image: registry.example.com/brighter/brighter-fe-taxonomy-prototype:latest
```

## Deployment Configuration

### Resources

The deployment includes resource requests and limits:

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### Replicas

Default: **2 replicas** for high availability

To scale:
```bash
oc scale deployment/brighter-fe-taxonomy-prototype --replicas=3
```

### Health Checks

- **Liveness Probe**: HTTP GET on `/health` (port 80)
  - Initial delay: 30s
  - Period: 10s

- **Readiness Probe**: HTTP GET on `/health` (port 80)
  - Initial delay: 10s
  - Period: 5s

## Route Configuration

The route includes:

- **TLS Termination**: Edge (SSL handled by router)
- **Load Balancing**: Least connections (`leastconn`)
- **Timeout**: 300 seconds
- **Insecure Traffic**: Allowed (redirects to HTTPS)

## Verify Deployment

```bash
# Check deployment status
oc get deployment brighter-fe-taxonomy-prototype

# Check pods
oc get pods -l app=brighter-fe-taxonomy-prototype

# Check service
oc get svc brighter-fe-taxonomy-prototype

# Check route
oc get route brighter-fe-taxonomy-prototype

# View logs
oc logs -f deployment/brighter-fe-taxonomy-prototype
```

## Access Application

Once deployed, the application will be available at:

**https://brighter-fe-taxonomy-prototype-brighter.apps.ocbmt.jrc.cec.eu.int**

## Update Deployment

### Update Image

```bash
# Set new image
oc set image deployment/brighter-fe-taxonomy-prototype \
  brighter-fe-taxonomy-prototype=<YOUR_REGISTRY>/brighter-fe-taxonomy-prototype:new-tag

# Or trigger rollout with same tag (force pull)
oc rollout restart deployment/brighter-fe-taxonomy-prototype
```

### Update Configuration

```bash
# Edit deployment
oc edit deployment brighter-fe-taxonomy-prototype

# Or apply updated YAML
oc apply -f openshift-deployment.yaml
```

## Rollback

```bash
# View rollout history
oc rollout history deployment/brighter-fe-taxonomy-prototype

# Rollback to previous version
oc rollout undo deployment/brighter-fe-taxonomy-prototype

# Rollback to specific revision
oc rollout undo deployment/brighter-fe-taxonomy-prototype --to-revision=2
```

## Monitoring

```bash
# Watch deployment status
oc rollout status deployment/brighter-fe-taxonomy-prototype

# Get pod metrics (if metrics-server is installed)
oc adm top pods -l app=brighter-fe-taxonomy-prototype

# Stream logs from all pods
oc logs -f -l app=brighter-fe-taxonomy-prototype
```

## Troubleshooting

### Pods not starting

```bash
# Describe deployment
oc describe deployment brighter-fe-taxonomy-prototype

# Describe pod
oc describe pod <pod-name>

# Check events
oc get events --sort-by='.lastTimestamp'
```

### Image pull errors

```bash
# Check image pull secrets
oc get secrets

# Create image pull secret if needed
oc create secret docker-registry regcred \
  --docker-server=<your-registry> \
  --docker-username=<username> \
  --docker-password=<password>

# Link secret to service account
oc secrets link default regcred --for=pull
```

### Route not accessible

```bash
# Check route
oc describe route brighter-fe-taxonomy-prototype

# Test from within cluster
oc run test --image=curlimages/curl --rm -it -- \
  curl http://brighter-fe-taxonomy-prototype/health
```

## Clean Up

```bash
# Delete all resources
oc delete -f openshift-all.yaml

# Or delete individually
oc delete route brighter-fe-taxonomy-prototype
oc delete deployment brighter-fe-taxonomy-prototype
oc delete service brighter-fe-taxonomy-prototype
```

## File Structure

```
.
├── openshift-all.yaml          # All resources in one file
├── openshift-deployment.yaml   # Deployment manifest
├── openshift-service.yaml      # Service manifest
├── openshift-route.yaml        # Route manifest
└── README.OpenShift.md        # This file
```

## CI/CD Integration

For automated deployment, you can use these commands in your pipeline:

```bash
# Build and push
docker build -t ${REGISTRY}/brighter-fe-taxonomy-prototype:${TAG} .
docker push ${REGISTRY}/brighter-fe-taxonomy-prototype:${TAG}

# Update image in OpenShift
oc set image deployment/brighter-fe-taxonomy-prototype \
  brighter-fe-taxonomy-prototype=${REGISTRY}/brighter-fe-taxonomy-prototype:${TAG}

# Wait for rollout
oc rollout status deployment/brighter-fe-taxonomy-prototype
```
