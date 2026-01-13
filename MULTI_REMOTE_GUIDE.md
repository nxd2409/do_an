# 🔀 Hướng Dẫn Làm Việc Với Multiple Git Remotes

## 📋 Tình Huống
- **GitLab**: Repo gốc (upstream) - lấy updates từ đây
- **GitHub**: Repo của bạn (origin) - push code lên đây

---

## 🚀 CÁCH SETUP (Hiện Tại)

### Bước 1: Kiểm tra remotes hiện tại
```bash
cd d:\Downloads\do_an
git remote -v
```

Output hiện tại sẽ là:
```
origin  https://gitlab.com/original-owner/do_an.git (fetch)
origin  https://gitlab.com/original-owner/do_an.git (push)
```

### Bước 2: Đổi tên remote GitLab thành `upstream`
```bash
git remote rename origin upstream
```

### Bước 3: Thêm GitHub repo làm remote `origin`
```bash
git remote add origin https://github.com/YOUR_USERNAME/do_an.git
```

### Bước 4: Xác nhận cấu hình mới
```bash
git remote -v
```

Kết quả sẽ hiển thị:
```
origin      https://github.com/YOUR_USERNAME/do_an.git (fetch)
origin      https://github.com/YOUR_USERNAME/do_an.git (push)
upstream    https://gitlab.com/original-owner/do_an.git (fetch)
upstream    https://gitlab.com/original-owner/do_an.git (push)
```

### Bước 5: Push code lên GitHub
```bash
git branch -M main
git push -u origin main
```

---

## 📥 CÁCH LẤY UPDATES TỪ GITLAB (Hàng Ngày)

### Cách 1: Pull từ GitLab vào local (Đơn giản nhất)
```bash
# Lấy updates từ GitLab upstream
git fetch upstream

# Merge vào branch main của bạn
git merge upstream/main

# Hoặc rebase (giữ history sạch hơn)
git rebase upstream/main

# Push lên GitHub
git push origin main
```

### Cách 2: Pull Rebase (Recommended - Lịch sử sạch)
```bash
git fetch upstream
git rebase upstream/main
git push origin main --force-with-lease
```

### Cách 3: Tạo shell script tự động
Tạo file `sync-from-upstream.sh`:
```bash
#!/bin/bash

echo "📥 Fetching updates from GitLab..."
git fetch upstream

echo "🔄 Rebasing on upstream/main..."
git rebase upstream/main

echo "📤 Pushing to GitHub..."
git push origin main

echo "✅ Sync complete!"
```

Chạy script:
```bash
bash sync-from-upstream.sh
```

---

## ⚠️ TRƯỜNG HỢP CÓ CONFLICT (Xung Đột)

Nếu có xung đột khi merge/rebase:

```bash
# 1. Xem conflicts
git status

# 2. Sửa conflicts theo ý bạn trong editor

# 3. Mark as resolved
git add .

# 4. Tiếp tục rebase
git rebase --continue

# Hoặc hủy nếu không muốn
git rebase --abort
```

---

## 🔄 WORKFLOW CHI TIẾT - NGÀY NGÀY

### 1️⃣ Lấy updates từ GitLab
```bash
git fetch upstream
git rebase upstream/main
```

### 2️⃣ Làm việc và commit
```bash
# Thay đổi code
git add .
git commit -m "Your changes"
```

### 3️⃣ Push lên GitHub
```bash
git push origin main
```

### 📋 Tất cả trong 1 lệnh
```bash
git fetch upstream && git rebase upstream/main && git push origin main
```

---

## 📊 So sánh: Merge vs Rebase

| Aspect | Merge | Rebase |
|--------|-------|--------|
| **History** | Có "merge commits" | Linear, sạch |
| **Độ phức tạp** | Dễ, an toàn | Hơi phức tạp |
| **Conflicts** | Xử lý 1 lần | Từng commit |
| **Recommended** | Team collaboration | Personal sync |

**Khuyến Nghị**: Dùng **rebase** cho việc sync từ upstream

---

## 🛡️ BEST PRACTICES

### 1. Tạo branch tách biệt trước khi sync
```bash
git checkout -b feature/new-feature
# ... làm việc ...
git push origin feature/new-feature
```

### 2. Sync main trước khi rebase
```bash
git checkout main
git fetch upstream
git rebase upstream/main
git push origin main
```

### 3. Rebase feature branch vào main
```bash
git checkout feature/new-feature
git rebase main
git push origin feature/new-feature --force-with-lease
```

### 4. Đừng force push trên shared branches
```bash
# ❌ Tránh
git push origin main --force

# ✅ Dùng cái này thay vào (an toàn hơn)
git push origin main --force-with-lease
```

---

## 🔧 TROUBLESHOOTING

### Nếu push bị reject
```bash
# Lấy latest từ upstream trước
git fetch upstream
git rebase upstream/main
git push origin main --force-with-lease
```

### Nếu bị merge conflict phức tạp
```bash
# Hủy rebase
git rebase --abort

# Hoặc reset về state trước
git reset --hard upstream/main
```

### Xem history
```bash
git log --oneline --graph --all
```

---

## 📌 SUMMARY

### Setup (1 lần)
```bash
git remote rename origin upstream
git remote add origin https://github.com/YOUR_USERNAME/do_an.git
git push -u origin main
```

### Hàng ngày (sync)
```bash
git fetch upstream
git rebase upstream/main
git push origin main
```

### Tạo Pull Request
1. Tạo feature branch từ GitHub
2. Làm việc và push
3. Tạo PR trên GitHub
4. Merge & delete branch

---

## 🎯 CÁC SCENARIO

### Scenario 1: GitLab có update, bạn không có changes
```bash
git fetch upstream
git rebase upstream/main
git push origin main
```

### Scenario 2: GitLab có update, bạn có local changes
```bash
git fetch upstream
git rebase upstream/main  # Rebase your changes lên latest
# Resolve conflicts nếu có
git push origin main
```

### Scenario 3: Bạn muốn contribute về upstream (GitLab)
```bash
git fetch upstream
git checkout -b feature/contribute
# Làm việc
git push upstream feature/contribute
# Tạo Merge Request trên GitLab
```

---

Cần hỗ trợ bước nào không? 🚀
