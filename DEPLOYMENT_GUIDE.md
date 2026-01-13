# 🚀 Hướng Dẫn Deploy Render + Vercel

## 📌 Chuẩn Bị Trước Deploy

### 1. **Tạo GitHub Repository** (nếu chưa có)
```bash
git init
git add .
git commit -m "Initial commit - ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/do_an.git
git push -u origin main
```

---

## 🔌 PHẦN 1: Deploy Backend lên Render

### Bước 1: Tạo Tài Khoản & Dự Án trên Render
1. Truy cập [render.com](https://render.com)
2. Đăng nhập bằng GitHub account
3. Click **"New"** → **"Web Service"**
4. Kết nối GitHub repo: `your-username/do_an`
5. Chọn **Public** repository

### Bước 2: Cấu Hình Render Service

**Build Configuration:**
- **Environment:** Docker
- **Dockerfile path:** `./Dockerfile`
- **Start command:** (để trống - Dockerfile sẽ xử lý)
- **Instance Type:** Free
- **Auto-deploy:** Enabled

**Environment Variables** (thêm trong Dashboard Render):
```
DB_SERVER=          # Sẽ được cung cấp bởi Render Database
DB_USER=sa          # Tuỳ chọn
DB_PASSWORD=        # Sinh mật khẩu mạnh
DB_NAME=DO_AN
DB_HANGFIRE_NAME=DO_AN_HANGFIRE

REDIS_URL=          # Sẽ được cung cấp bởi Render Redis
JWT_KEY=your-secret-jwt-key-here-min-32-characters
API_URL=https://your-api-name.onrender.com
FRONTEND_URL=https://your-frontend-name.vercel.app
MINIO_ENDPOINT=your-minio-server.com
MINIO_ACCESS_KEY=your-minio-access-key
MINIO_SECRET_KEY=your-minio-secret-key
ASPNETCORE_ENVIRONMENT=Production
```

### Bước 3: Tạo PostgreSQL Database (miễn phí)

⚠️ **Lưu ý:** Render có PostgreSQL miễn phí, nhưng dự án của bạn dùng SQL Server. Có 2 cách:

**Cách 1 (Khuyên dùng):** Chuyển sang PostgreSQL
```bash
# Cài đặt EF Core tools
dotnet tool install --global dotnet-ef

# Tạo migration cho PostgreSQL
dotnet ef migrations add InitialPostgres -p Project.Core -s Project.Api
```

Cập nhật `Program.cs`:
```csharp
// Thay cho SQL Server
options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
```

**Cách 2:** Dùng SQL Server trên Render (trả phí)
- Sử dụng SQL Server được tạo sẵn ở `103.249.158.25:1000`
- Chi phí: ~$15/tháng

### Bước 4: Tạo Redis Cache (miễn phí)
1. Trên Dashboard Render, click **"New"** → **"Redis"**
2. Region: **Singapore**
3. Tier: **Free**
4. Copy connection string từ "Connections" section

### Bước 5: Deploy
1. Push code lên GitHub
2. Render sẽ tự động build và deploy
3. Theo dõi logs trong "Logs" tab

**Sau khi deploy thành công:**
- Backend URL: `https://your-api-name.onrender.com`
- Cập nhật `FRONTEND_URL` environment variable

---

## 🌐 PHẦN 2: Deploy Frontend lên Vercel

### Bước 1: Tạo Tài Khoản & Dự Án
1. Truy cập [vercel.com](https://vercel.com)
2. Đăng nhập bằng GitHub account
3. Click **"Add New"** → **"Project"**
4. Import GitHub repo: `your-username/do_an`
5. Chọn **Root Directory:** `Project.Client`

### Bước 2: Cấu Hình Build Settings

**Framework Preset:** Angular
**Build Command:** `npm run build`
**Output Directory:** `dist/project.cli/browser`
**Install Command:** `npm install`

### Bước 3: Environment Variables (Vercel)

Thêm trong **Settings** → **Environment Variables:**
```
NG_APP_API_URL=https://your-api-name.onrender.com/api
NG_APP_SIGNALR_URL=https://your-api-name.onrender.com/hubs
```

### Bước 4: Cập Nhật Angular Environment Config

Chỉnh sửa `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: process.env['NG_APP_API_URL'] || 'https://your-api-name.onrender.com/api',
  signalrUrl: process.env['NG_APP_SIGNALR_URL'] || 'https://your-api-name.onrender.com/hubs'
};
```

### Bước 5: Deploy
1. Điều chỉnh `angular.json` cho Vercel:
```json
{
  "projects": {
    "PROJECT.CLI": {
      "architect": {
        "build": {
          "options": {
            "outputPath": "dist/project.cli"
          }
        }
      }
    }
  }
}
```

2. Push code lên GitHub
3. Vercel sẽ tự động deploy

**Sau khi deploy thành công:**
- Frontend URL: `https://your-project-name.vercel.app`

---

## 🔗 BƯỚC CUỐI CÙNG: Kết Nối Frontend ↔ Backend

### 1. Cập Nhật CORS trong Backend
Chỉnh sửa `Program.cs`:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://your-project-name.vercel.app")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

app.UseCors("AllowFrontend");
```

### 2. Cập Nhật SignalR Connection
Trong `Program.cs`:
```csharp
app.MapHub<NotificationHub>("/hubs/notifications", options =>
{
    options.Transports = HttpTransportType.WebSockets | HttpTransportType.LongPolling;
});
```

### 3. Cập Nhật JWT Issuer
```json
{
  "JWT": {
    "Issuer": "https://your-api-name.onrender.com"
  }
}
```

---

## ✅ Kiểm Tra Deployment

### Backend:
```bash
# Kiểm tra health
curl https://your-api-name.onrender.com/health

# Kiểm tra API
curl https://your-api-name.onrender.com/api/your-endpoint
```

### Frontend:
```bash
# Kiểm tra loads và console logs
# Truy cập: https://your-project-name.vercel.app
# Mở DevTools (F12) kiểm tra Network & Console
```

---

## ⚠️ Lưu Ý Quan Trọng

### Database:
- **SQL Server** (hiện tại): Có thể giữ nguyên server cũ hoặc chuyển sang PostgreSQL
- **PostgreSQL** (khuyên dùng): Miễn phí trên Render, cần migrate

### MinIO:
- Cần setup MinIO server riêng (VPS hoặc cloud)
- Hoặc sử dụng AWS S3, Azure Blob Storage

### Redis:
- Render cung cấp Redis miễn phí (limited)
- Vân động high, cân nhắc upgrade

### Rate Limiting:
- Render free tier: 1 project, shared CPU
- Có thể slow nếu traffic cao
- Upgrade lên **Pro** khi cần (~$7/tháng)

### Cold Starts:
- Free tier Render có cold start (~30s)
- Cải thiện bằng upgrade hoặc keep-alive scripts

---

## 🎯 Tóm Tắt Link Deploy

| Service | Link |
|---------|------|
| Render Dashboard | https://dashboard.render.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| GitHub | https://github.com/settings/tokens |
| Backend | https://your-api-name.onrender.com |
| Frontend | https://your-project-name.vercel.app |

---

## 📝 Next Steps

1. ✅ Push code lên GitHub
2. ✅ Tạo Render service + database + redis
3. ✅ Tạo Vercel project
4. ✅ Cấu hình environment variables
5. ✅ Test API connectivity
6. ✅ Test frontend features

Bạn cần hỗ trợ bước nào không?
