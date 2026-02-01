# Chi tiết Tính năng - VieAgent.vn v2

## 🎯 Tổng quan Hệ thống

VieAgent.vn là marketplace cho AI agents với 3 loại người dùng:
- **Customer**: Mua và sử dụng AI agents
- **Developer**: Tạo và bán AI agents (kiếm 70%)
- **Admin**: Quản lý toàn bộ hệ thống

---

# 🔵 CUSTOMER FEATURES (Chi tiết)

## 1. Marketplace - Khám phá Agents

### Mô tả:
Trang chính nơi customers tìm kiếm và khám phá AI agents.

### Chức năng chi tiết:
| Chức năng | Mô tả |
|-----------|-------|
| **Search** | Tìm kiếm agents theo tên, mô tả |
| **Filter by Category** | Lọc theo: Automation, Data, Communication, Analytics, Productivity, Marketing, Sales, Support, Development |
| **Filter by Price** | Khoảng giá min-max |
| **Filter by Rating** | 4+ stars, 3+ stars, etc. |
| **Sort** | Popular, Newest, Highest Rated, Price Low-High, Price High-Low |
| **Pagination** | 20 items/page, infinite scroll hoặc pagination |
| **Featured Agents** | Banner carousel cho agents nổi bật |
| **Trending** | Agents đang hot dựa trên sales gần đây |

### API cần thiết:
```
GET /api/agents?category=&search=&price_min=&price_max=&rating=&sort=&page=
```

### Components:
- `MarketplaceHeader` - Search bar + filters
- `AgentGrid` - Grid hiển thị agents
- `AgentCard` - Card cho mỗi agent
- `FilterPanel` - Panel filters bên trái
- `CategoryTabs` - Tabs category

---

## 2. Agent Detail - Xem chi tiết Agent

### Mô tả:
Trang chi tiết của 1 agent với đầy đủ thông tin.

### Chức năng chi tiết:
| Section | Nội dung |
|---------|----------|
| **Hero** | Tên, mô tả ngắn, rating, price, developer info |
| **Description** | Mô tả đầy đủ, use cases |
| **Features** | Danh sách capabilities |
| **Requirements** | Integrations cần connect trước |
| **Pricing** | One-time vs Monthly, so sánh |
| **Reviews** | Reviews từ users đã mua |
| **Similar Agents** | Agents liên quan |
| **Actions** | Nút Buy Now, Try Demo (nếu có) |

### API cần thiết:
```
GET /api/agents/:id
GET /api/agents/:id/reviews
GET /api/agents/:id/similar
```

---

## 3. Checkout - Thanh toán

### Mô tả:
Flow thanh toán qua Stripe.

### Chức năng chi tiết:
| Bước | Mô tả |
|------|-------|
| 1. Select Plan | Chọn One-time hoặc Monthly |
| 2. Review | Xem lại order summary |
| 3. Payment | Nhập credit card via Stripe Elements |
| 4. Confirmation | Order success + receipt |

### API cần thiết:
```
POST /api/stripe/checkout - Tạo checkout session
POST /api/stripe/webhooks - Xử lý webhook từ Stripe
GET /api/purchases - Lấy lịch sử mua
```

---

## 4. Run Agent - Chạy Agent

### Mô tả:
Form động để chạy agent đã mua.

### Chức năng chi tiết:
| Chức năng | Mô tả |
|-----------|-------|
| **Dynamic Form** | Form tự sinh từ agent's input_schema |
| **Field Types** | text, number, email, url, textarea, select, date, file |
| **Validation** | Client-side + server-side validation |
| **Templates** | Lưu lại input để dùng lại |
| **Real-time Status** | Hiển thị status: pending → running → completed/failed |
| **Output Display** | Hiển thị kết quả (text, JSON, file download) |
| **Error Handling** | Hiển thị error message rõ ràng |

### API cần thiết:
```
POST /api/execute-agent - Chạy agent
GET /api/executions/:id - Lấy status
GET /api/execution-templates - Lấy templates đã lưu
POST /api/execution-templates - Lưu template mới
```

---

## 5. Execution History - Lịch sử chạy

### Mô tả:
Danh sách tất cả lần chạy agents.

### Chức năng chi tiết:
| Chức năng | Mô tả |
|-----------|-------|
| **List View** | Bảng với: Agent name, Input summary, Status, Time, Duration |
| **Filter by Status** | Pending, Running, Completed, Failed |
| **Filter by Agent** | Chọn agent cụ thể |
| **Date Range** | Lọc theo ngày |
| **Detail Modal** | Xem chi tiết input/output của 1 execution |
| **Re-run** | Chạy lại với cùng input |
| **Export** | Download kết quả (JSON, CSV) |

### API cần thiết:
```
GET /api/executions?agent_id=&status=&from=&to=&page=
GET /api/executions/:id/logs
```

---

## 6. Credentials - Quản lý API Keys

### Mô tả:
Quản lý API keys và OAuth connections cho các integrations.

### Chức năng chi tiết:
| Chức năng | Mô tả |
|-----------|-------|
| **Add API Key** | Nhập tên + value → encrypt và lưu |
| **OAuth Connect** | Click to connect (Google, Slack, etc.) |
| **Test Connection** | Kiểm tra xem credential còn valid |
| **Refresh Token** | Refresh OAuth token |
| **Delete** | Xóa credential |
| **Expiry Warning** | Cảnh báo khi token sắp hết hạn |

### API cần thiết:
```
GET /api/credentials
POST /api/credentials
PUT /api/credentials/:id
DELETE /api/credentials/:id
POST /api/credentials/:id/test
GET /api/oauth/:provider/authorize
GET /api/oauth/:provider/callback
```

---

## 7. Billing - Quản lý Thanh toán

### Mô tả:
Xem và quản lý subscriptions, invoices.

### Chức năng chi tiết:
| Section | Mô tả |
|---------|-------|
| **Current Plan** | Plan hiện tại, ngày renew |
| **Usage** | Credits đã dùng / limit |
| **Invoices** | Danh sách hóa đơn, download PDF |
| **Payment Methods** | Thêm/xóa credit cards |
| **Change Plan** | Upgrade/downgrade plan |
| **Cancel** | Hủy subscription |

### API cần thiết:
```
GET /api/billing/subscription
GET /api/billing/usage
GET /api/billing/invoices
GET /api/billing/payment-methods
POST /api/billing/payment-methods
DELETE /api/billing/payment-methods/:id
POST /api/billing/change-plan
POST /api/billing/cancel
```

---

## 8. Reviews - Đánh giá Agents

### Mô tả:
Đánh giá và review agents đã mua.

### Chức năng chi tiết:
| Chức năng | Mô tả |
|-----------|-------|
| **Star Rating** | 1-5 stars |
| **Written Review** | Title + body text |
| **Pros/Cons** | Danh sách điểm tốt/chưa tốt |
| **Edit Review** | Sửa review đã viết |
| **Delete Review** | Xóa review |
| **Developer Response** | Xem phản hồi từ developer |
| **Helpful Vote** | Đánh dấu review hữu ích |

### API cần thiết:
```
GET /api/agents/:id/reviews
POST /api/agents/:id/reviews
PUT /api/reviews/:id
DELETE /api/reviews/:id
POST /api/reviews/:id/helpful
```

---

# 🟢 DEVELOPER FEATURES (Chi tiết)

## 1. Agent Creation Wizard - Tạo Agent

### Mô tả:
Wizard 5 bước để tạo agent mới.

### Các bước:
| Bước | Nội dung | Validation |
|------|----------|------------|
| 1. Basic Info | Name, Description, Category, Tags | Name 3-100 chars, Desc required |
| 2. Integrations | Required integrations for agent | At least 1 recommended |
| 3. Pricing | One-time price, Monthly price | Min 0, Max 10000 |
| 4. Webhook | Webhook URL + test | URL valid, test pass |
| 5. Input Schema | Define input fields | At least 1 field |
| Review | Final review trước submit | All steps complete |

### Input Schema Builder:
| Field Type | Options |
|------------|---------|
| text | label, placeholder, required, minLength, maxLength |
| number | label, min, max, required |
| email | label, required |
| url | label, required |
| textarea | label, placeholder, maxLength |
| select | label, options[], required |
| date | label, minDate, maxDate |
| file | label, accept[], maxSize |

### API cần thiết:
```
POST /api/agents - Create draft
PUT /api/agents/:id - Update
POST /api/agents/:id/test-webhook - Test webhook
POST /api/agents/:id/submit - Submit for review
```

---

## 2. Developer Dashboard - Tổng quan

### Mô tả:
Dashboard overview cho developers.

### Metrics hiển thị:
| Metric | Mô tả |
|--------|-------|
| Total Revenue | Tổng doanh thu all-time |
| Monthly Revenue | Doanh thu tháng này |
| Total Sales | Tổng số lần bán |
| Active Subscribers | Số subscribers hiện tại |
| Average Rating | Rating trung bình của agents |
| Top Agent | Agent bán chạy nhất |

### Charts:
| Chart | Mô tả |
|-------|-------|
| Revenue Over Time | Line chart 30 ngày |
| Sales by Agent | Bar chart so sánh agents |
| Rating Distribution | Pie chart 1-5 stars |

---

## 3. Analytics - Phân tích Chi tiết

### Mô tả:
Analytics chi tiết cho developers.

### Sections:
| Section | Metrics |
|---------|---------|
| Revenue | Daily/Weekly/Monthly revenue, YoY growth |
| Users | New users, Active users, Churn rate |
| Executions | Total runs, Success rate, Avg duration |
| Geographic | Users by country |
| Conversion | Funnel: View → Purchase → Active |

---

## 4. Earnings - Doanh thu

### Mô tả:
Chi tiết doanh thu và payouts.

### Sections:
| Section | Mô tả |
|---------|-------|
| Balance | Số tiền available for payout |
| Pending | Đang xử lý |
| Paid Out | Đã thanh toán |
| Transaction History | Từng giao dịch |
| Payout Settings | Bank account, threshold |
| Request Payout | Yêu cầu rút tiền |

---

# 🔴 ADMIN FEATURES (Chi tiết)

## 1. User Management

| Chức năng | Mô tả |
|-----------|-------|
| List Users | Bảng users với search, filter by role |
| User Detail | Xem chi tiết: profile, purchases, executions |
| Edit User | Thay đổi role, plan |
| Block/Unblock | Block user vi phạm |
| Delete User | Xóa vĩnh viễn (soft delete) |

---

## 2. Agent Approvals

| Chức năng | Mô tả |
|-----------|-------|
| Pending Queue | Danh sách agents chờ duyệt |
| Review Agent | Xem chi tiết agent submitted |
| Approve | Approve và publish |
| Reject | Reject với lý do |
| Request Changes | Yêu cầu sửa đổi |

---

## 3. Support Tickets

| Chức năng | Mô tả |
|-----------|-------|
| Ticket List | Filter by status, priority |
| Assign | Assign ticket cho staff |
| Respond | Gửi response cho user |
| Templates | Response templates |
| Escalate | Chuyển ticket lên cấp cao |
| Resolve | Đánh dấu resolved |

---

## 4. Billing Management

| Chức năng | Mô tả |
|-----------|-------|
| Transactions | Tất cả transactions |
| Refund Requests | Xử lý refund |
| Developer Payouts | Xử lý payout cho developers |
| Revenue Reports | Báo cáo doanh thu |

---

## 5. Fraud Detection

| Chức năng | Mô tả |
|-----------|-------|
| Alerts | Danh sách fraud alerts |
| Severity | Critical, High, Medium, Low |
| Investigate | Xem chi tiết suspicious activity |
| Take Action | Block user, reverse transactions |
| False Positive | Đánh dấu false alarm |

---

## 6. System Monitoring

| Chức năng | Mô tả |
|-----------|-------|
| Health Check | Status của services |
| Error Logs | Recent errors |
| Performance | CPU, Memory, Response time |
| Alerts | Threshold alerts |
| Reports | Export system reports |

---

## 7. Branding (White Label)

| Chức năng | Mô tả |
|-----------|-------|
| Logo | Upload logo |
| Colors | Primary, Secondary, Accent colors |
| Fonts | Custom fonts |
| Domain | Custom domain settings |
| Email Templates | Customize email templates |

---

# 📊 DATABASE SUMMARY

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| users | User accounts | id, email, role, plan |
| agents | AI agents | id, developer_id, name, webhook_url, status |
| purchases | Purchase history | id, user_id, agent_id, amount |
| executions | Run history | id, user_id, agent_id, status, input, output |
| credentials | API keys/tokens | id, user_id, integration_id, encrypted_value |
| integrations | Available services | id, service_name, auth_method |
| ratings | Star ratings | id, agent_id, user_id, score |
| reviews | Written reviews | id, rating_id, title, content |
| support_tickets | Support tickets | id, user_id, subject, status, priority |
| developer_payouts | Payout records | id, developer_id, amount, status |
| fraud_alerts | Fraud detection | id, user_id, alert_type, severity |

---

# 🔌 INTEGRATIONS LIST

| Category | Services |
|----------|----------|
| Email | Gmail, Outlook, SendGrid, Mailchimp |
| Communication | Slack, Discord, Telegram, Twilio |
| CRM | Salesforce, HubSpot, Pipedrive |
| Payment | Stripe, PayPal |
| Storage | Google Drive, Dropbox, AWS S3 |
| Productivity | Notion, Airtable, Google Sheets |
| Social | Twitter, LinkedIn, Facebook |
| Development | GitHub, GitLab, Jira |
| AI | OpenAI, Anthropic, Google AI |
| Database | Supabase, Firebase, MongoDB |
