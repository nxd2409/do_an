# 🚀 Deploy Backend lên Fly.io + Frontend lên Vercel

## 📋 Backend: Fly.io

### Bước 1: Cài đặt Fly CLI
```bash
# Windows (PowerShell)
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

# hoặc dùng Chocolatey
choco install flyctl
```

### Bước 2: Login vào Fly.io
```bash
fly auth login
# Hoặc đăng ký tài khoản: fly auth signup
```

### Bước 3: Khởi tạo app
```bash
cd d:\Downloads\do_an
fly launch
```

**Khi được hỏi:**
- App name: `project-api` (hoặc tên khác)
- Region: `sgn` (Singapore)
- Database: `No` (dùng DB hiện tại)
- Redis: `No` (vì đã disable)

### Bước 4: Cấu hình Environment Variables

**Set secrets (mật khẩu, keys):**
```bash
fly secrets set DB_PASSWORD=your-db-password
fly secrets set JWT_KEY=your-32-char-secret-key-min
fly secrets set MINIO_ACCESS_KEY=your-minio-key
fly secrets set MINIO_SECRET_KEY=your-minio-secret
```

**Set environment variables (không mật):**
```bash
fly config set env DB_SERVER=103.249.158.25,1000
fly config set env DB_USER=sa
fly config set env MINIO_ENDPOINT=124.158.6.81:9090
fly config set env API_URL=https://project-api.fly.dev
fly config set env FRONTEND_URL=https://your-frontend.vercel.app
```

### Bước 5: Deploy
```bash
# Deploy từ Dockerfile
fly deploy

# Hoặc nếu muốn rebuild
fly deploy --build-only
fly deploy --strategy rolling
```

### Bước 6: Kiểm tra status
```bash
# Xem logs
fly logs

# Xem status
fly status

# SSH vào app (nếu cần debug)
fly ssh console

# Health check
curl https://project-api.fly.dev/health
```

### Bước 7: Setup Domain tùy chọn
```bash
# Nếu có domain riêng
fly certs add yourdomain.com
fly certs show yourdomain.com
```

---

## 🌐 Frontend: Vercel

### Bước 1: Chuẩn bị
```bash
# Đảm bảo code đã push lên GitHub
git push origin main
```

### Bước 2: Connect với Vercel
1. Truy cập https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import GitHub repo: `nxd2409/do_an`
4. **Root Directory:** `Project.Client`

### Bước 3: Environment Variables
```
NG_APP_API_URL=https://project-api.fly.dev/api
NG_APP_SIGNALR_URL=https://project-api.fly.dev/hubs
```

### Bước 4: Build Settings
- **Framework:** Angular
- **Build Command:** `npm run build`
- **Output Directory:** `dist/project.cli/browser`
- **Install Command:** `npm install`

### Bước 5: Deploy
- Click **"Deploy"**
- Chờ build complete
- Vercel sẽ tự động deploy mỗi khi push code

---

## 📊 So sánh Fly.io vs Render

| Feature | Fly.io | Render |
|---------|--------|--------|
| **Free Tier** | ✅ $5/month credit | ❌ Ngoài web service miễn phí |
| **Pricing** | $5/month (shared-cpu-1x) | $7/month |
| **Regions** | Rất nhiều (sgn có) | Có |
| **Database** | Tự quản lý | Cung cấp PostgreSQL |
| **SSL** | ✅ Tự động | ✅ Tự động |
| **CLI** | ✅ Tốt | ✅ Có |
| **Deployment** | Docker | Docker hoặc Git |

**Khuyến nghị:** Fly.io tốt hơn cho ASP.NET Core vì có SSL tự động, regions tốt, và giá rẻ.

---

## 🔄 Update & Redeploy

### Sau khi code changes:
```bash
# Local
git add .
git commit -m "Your changes"
git push origin main

# Deploy mới trên Fly.io
fly deploy

# Vercel sẽ tự động deploy khi phát hiện push
```

### Kiểm tra deployment:
```bash
fly logs --follow  # Real-time logs
fly status         # Status
fly apps list      # List all apps
```

---

## ⚠️ Troubleshooting

### 1. Build failed
```bash
# Xem chi tiết lỗi
fly logs

# Rebuild từ đầu
fly deploy --build-only
```

### 2. Database connection error
```bash
# Kiểm tra environment variables
fly config view

# Update biến
fly secrets set DB_PASSWORD=new-password
fly deploy
```

### 3. Health check failing
```bash
# Backend endpoint phải trả về 200
curl https://project-api.fly.dev/health

# Kiểm tra logs
fly logs | grep health
```

### 4. Cold start
- Fly.io sẽ suspend app nếu không có traffic 30 phút
- Cải thiện bằng cách upgrade machine hoặc setup keep-alive

---

## 🎯 Final Checklist

- [ ] Backend deployed trên Fly.io
- [ ] Frontend deployed trên Vercel
- [ ] Health endpoint hoạt động (`/health`)
- [ ] API endpoint hoạt động
- [ ] SignalR connection work
- [ ] Database connected
- [ ] MinIO working
- [ ] Logs monitor được
- [ ] Domain setup (tùy chọn)

---

## 📞 Support Links

- Fly.io Docs: https://fly.io/docs/
- Vercel Docs: https://vercel.com/docs
- ASP.NET Core Deployment: https://learn.microsoft.com/aspnet/core/host-and-deploy/

Bạn cần hỗ trợ bước nào không? 🚀
