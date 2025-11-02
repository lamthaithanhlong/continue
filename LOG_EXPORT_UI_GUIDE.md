# 🎨 Log Export UI - User Guide

## 📚 Overview

Tính năng **Export Logs** đã được tích hợp vào VS Code extension với UI command dễ sử dụng!

Bạn có thể export logs chỉ với vài click chuột, không cần viết code.

---

## 🚀 Cách Sử Dụng

### Cách 1: Command Palette (Khuyến Nghị)

**Bước 1**: Mở Command Palette

- **macOS**: `Cmd + Shift + P`
- **Windows/Linux**: `Ctrl + Shift + P`

**Bước 2**: Gõ "Continue: Export Logs"

```
> Continue: Export Logs for Debugging
```

**Bước 3**: Chọn command và nhấn Enter

**Bước 4**: Đợi export hoàn tất (vài giây)

**Bước 5**: Chọn action:

- **Open File** - Mở file logs trong VS Code
- **Copy Path** - Copy đường dẫn file vào clipboard
- **Show in Folder** - Mở folder chứa file trong Finder/Explorer

---

### Cách 2: Keyboard Shortcut (Tùy Chọn)

Bạn có thể tạo keyboard shortcut cho command này:

**Bước 1**: Mở Keyboard Shortcuts

- **macOS**: `Cmd + K, Cmd + S`
- **Windows/Linux**: `Ctrl + K, Ctrl + S`

**Bước 2**: Tìm "Continue: Export Logs"

**Bước 3**: Click vào icon "+" để add keybinding

**Bước 4**: Nhấn phím tổ hợp bạn muốn (ví dụ: `Cmd + Shift + E`)

**Bước 5**: Lưu lại

Từ giờ bạn có thể export logs bằng keyboard shortcut!

---

## 💡 Demo Workflow

### Khi Gặp Lỗi:

**1. Lỗi xảy ra trong Continue.dev**

```
❌ Error: Failed to retrieve context
```

**2. Export logs**

- Mở Command Palette (`Cmd + Shift + P`)
- Gõ "Continue: Export Logs"
- Nhấn Enter

**3. Notification hiển thị**

```
✅ Logs exported successfully! (42 entries, 12 KB)
   [Open File]  [Copy Path]  [Show in Folder]
```

**4. Chọn "Copy Path"**

```
✅ File path copied to clipboard!
```

**5. Gửi cho AI**

```
Bạn: "Tôi gặp lỗi này, đây là logs: ~/.continue/logs/continue-logs-2025-11-02T21-30-45-123Z.json"
```

**6. AI analyze và giúp debug**

```
AI: "Tôi thấy lỗi ECONNREFUSED. Database chưa start..."
```

---

## 📊 UI Features

### Progress Notification

Khi export, bạn sẽ thấy progress notification:

```
⏳ Exporting logs...
   ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 50%
   Collecting logs...
```

### Success Notification

Khi export thành công:

```
✅ Logs exported successfully! (42 entries, 12 KB)
   [Open File]  [Copy Path]  [Show in Folder]
```

**Actions**:

- **Open File**: Mở file trong VS Code để xem nội dung
- **Copy Path**: Copy đường dẫn file vào clipboard
- **Show in Folder**: Mở folder chứa file trong Finder/Explorer

### Error Notification

Nếu có lỗi:

```
❌ Failed to export logs: Permission denied
```

---

## 📂 File Location

Logs được export vào:

```
~/.continue/logs/continue-logs-<timestamp>.json
```

**Example**:

```
~/.continue/logs/continue-logs-2025-11-02T21-30-45-123Z.json
```

**Trên macOS**:

```
/Users/yourusername/.continue/logs/continue-logs-2025-11-02T21-30-45-123Z.json
```

**Trên Windows**:

```
C:\Users\yourusername\.continue\logs\continue-logs-2025-11-02T21-30-45-123Z.json
```

**Trên Linux**:

```
/home/yourusername/.continue/logs/continue-logs-2025-11-02T21-30-45-123Z.json
```

---

## 📝 Export Format

Logs được export dưới dạng **JSON** với cấu trúc:

```json
{
  "exportedAt": "2025-11-02T21:30:45.123Z",
  "entriesCount": 42,
  "systemInfo": {
    "platform": "darwin",
    "arch": "arm64",
    "nodeVersion": "v18.20.8",
    "continueVersion": "1.3.23",
    "workspacePath": "/Users/user/project"
  },
  "logs": [
    {
      "timestamp": 1762117997669,
      "level": "error",
      "source": "retrieval",
      "message": "Failed to retrieve context",
      "data": {
        "query": "implement authentication",
        "error": "Timeout"
      },
      "error": {
        "message": "Request timeout",
        "stack": "Error: Request timeout\n    at ...",
        "code": "ETIMEDOUT"
      }
    }
  ]
}
```

---

## 🔒 Privacy & Security

### Automatic Data Sanitization

Logs tự động sanitize sensitive data:

**Sensitive keys được redact**:

- `apiKey`, `api_key`
- `token`
- `password`
- `secret`
- `authorization`, `auth`

**Example**:

**Before sanitization**:

```json
{
  "apiKey": "sk-1234567890",
  "token": "bearer-xyz",
  "userId": "user-123"
}
```

**After sanitization**:

```json
{
  "apiKey": "[REDACTED]",
  "token": "[REDACTED]",
  "userId": "user-123"
}
```

### Local Storage Only

- ✅ Logs được lưu **local** trên máy bạn
- ✅ **Không upload** lên cloud
- ✅ **Không share** với bất kỳ ai
- ✅ Bạn **hoàn toàn kiểm soát** logs của mình

---

## 🎯 Use Cases

### 1. Debug Lỗi

Khi gặp lỗi:

1. Export logs (`Cmd + Shift + P` → "Continue: Export Logs")
2. Copy path
3. Gửi cho AI hoặc support team

### 2. Report Bug

Khi report bug:

1. Export logs
2. Attach file vào bug report
3. Team có thể analyze và fix nhanh hơn

### 3. Performance Analysis

Khi app chạy chậm:

1. Export logs
2. Mở file và search "performance"
3. Tìm operations chậm

### 4. Share với Team

Khi cần help từ team:

1. Export logs
2. Show in folder
3. Share file qua Slack/Email

---

## 💡 Tips & Tricks

### Tip 1: Keyboard Shortcut

Tạo keyboard shortcut để export nhanh:

- Mở Keyboard Shortcuts (`Cmd + K, Cmd + S`)
- Tìm "Continue: Export Logs"
- Add keybinding: `Cmd + Shift + E`

### Tip 2: Quick Copy

Sau khi export, chọn "Copy Path" để copy nhanh:

```
✅ File path copied to clipboard!
```

Paste vào chat với AI:

```
Bạn: "Logs: ~/.continue/logs/continue-logs-2025-11-02T21-30-45-123Z.json"
```

### Tip 3: Open in VS Code

Chọn "Open File" để xem logs ngay trong VS Code:

- Syntax highlighting
- Search với `Cmd + F`
- Easy navigation

### Tip 4: Clean Up Old Logs

Logs cũ được lưu trong `~/.continue/logs/`. Bạn có thể xóa logs cũ để tiết kiệm dung lượng:

```bash
# macOS/Linux
rm ~/.continue/logs/continue-logs-*.json

# Windows PowerShell
Remove-Item $env:USERPROFILE\.continue\logs\continue-logs-*.json
```

---

## 🧪 Testing

### Test Command

**Bước 1**: Mở Command Palette (`Cmd + Shift + P`)

**Bước 2**: Gõ "Continue: Export Logs"

**Bước 3**: Nhấn Enter

**Bước 4**: Verify notification:

```
✅ Logs exported successfully! (X entries, Y KB)
```

**Bước 5**: Chọn "Open File" để xem logs

**Bước 6**: Verify file content có format đúng

---

## 🚀 Next Steps

### Tích Hợp Vào Workflow

**1. Add vào Error Handler**

Khi gặp lỗi, tự động suggest export logs:

```typescript
try {
  // Your code
} catch (error) {
  vscode.window
    .showErrorMessage("An error occurred. Export logs?", "Export Logs")
    .then((action) => {
      if (action === "Export Logs") {
        vscode.commands.executeCommand("continue.exportLogs");
      }
    });
}
```

**2. Add vào Status Bar**

Thêm button "Export Logs" vào status bar để access nhanh.

**3. Add Context Menu**

Right-click trong Continue chat → "Export Logs"

---

## 📞 Support

### Khi Cần Help

**1. Export logs**:

```
Cmd + Shift + P → Continue: Export Logs
```

**2. Copy path**:

```
Click "Copy Path"
```

**3. Gửi cho AI**:

```
"Tôi gặp lỗi này, đây là logs: <paste path>"
```

**4. AI sẽ analyze và giúp debug**

---

## 🎉 Summary

**Log Export UI Features**:

- ✅ Easy access via Command Palette
- ✅ Progress notification
- ✅ Success notification with actions
- ✅ Open file, copy path, show in folder
- ✅ Automatic data sanitization
- ✅ Local storage only
- ✅ JSON format with system info

**Workflow**:

```
Lỗi xảy ra → Cmd+Shift+P → "Export Logs" → Copy Path → Gửi AI → Debug
```

**Sẵn sàng sử dụng!** 🚀

---

**Version**: 1.0.0  
**Status**: ✅ Ready to Use  
**Last Updated**: 2025-11-02
