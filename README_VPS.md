# 🛠️ VPS Deployment & Memory Constraints

## ⚠️ Important Information

The production VPS for this application (root@165.232.86.194) is a limited environment with **512MB RAM**.

### ❗ Known Issues

- **Build Memory Crash**: Running `npm run build` directly on the server WILL cause a memory allocation error (`ENOMEM`) and crash the application.
- **Node.js Memory Limit**: The server cannot handle high-memory tasks like image processing or complex builds.

### ✅ Solution: CI/CD Pipeline

We have implemented a **GitHub Actions** workflow (`.github/workflows/deploy.yml`) to solve this:

1. **Build in CI**: Next.js builds are performed on GitHub's infrastructure (where there is plenty of memory).
2. **Rsync Artifacts**: The built `.next/` directory is then securely transferred to the VPS.
3. **Graceful Reload**: PM2 is used on the server to reload the process after the new build is transferred.

### 🚀 To Deploy

Pushes to the `main` or `development` branch will now automatically trigger this pipeline. **Do not attempt to run `npm run build` on the server manually.**

### 🖼️ Image Optimization

All images in `public/images` have been pre-compressed to **WebP** to reduce server bandwidth and memory usage by ~90%.
