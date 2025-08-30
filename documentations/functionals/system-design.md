## **Tài liệu Thiết kế: Kiến trúc Microservices Backend**

### **1. Tổng quan & Mục tiêu Kiến trúc**

Với quy mô và độ phức tạp của dự án, việc áp dụng kiến trúc Microservices là cần thiết để đạt được các mục tiêu sau:

* **Khả năng Mở rộng (Scalability):** Cho phép mở rộng quy mô từng phần của hệ thống một cách độc lập dựa trên tải lượng
  thực tế.
* **Dễ Bảo trì & Phát triển (Maintainability):** Các service nhỏ hơn, tập trung vào một lĩnh vực nghiệp vụ duy nhất sẽ
  dễ hiểu, dễ phát triển và dễ nâng cấp hơn.
* **Triển khai Độc lập (Independent Deployment):** Cho phép các nhóm phát triển có thể triển khai các bản cập nhật cho
  service của mình mà không ảnh hưởng đến toàn bộ hệ thống.
* **Linh hoạt về Công nghệ (Technology Flexibility):** Mặc dù ban đầu sẽ thống nhất một stack công nghệ, kiến trúc này
  cho phép trong tương lai có thể sử dụng công nghệ phù hợp nhất cho từng bài toán cụ thể.

### **2. Sơ đồ Kiến trúc Tổng thể**

```
                  +--------------------------------+
                  |  Next.js Frontend (Web/Admin)  |
                  +----------------+---------------+
                                   |
                                   v
                  +--------------------------------+
                  |          API Gateway           |  <--- Cổng giao tiếp duy nhất, xử lý
                  | (Routing, Auth, Rate Limiting) |       định tuyến, xác thực, giới hạn request
                  +----+-----------+-----------+---+
                       |           |           |   |
         +-------------+           |           |   +---------------------+
         |                         |           |                         |
         v                         v           v                         v
+------------------+   +------------------+   +------------------+   +------------------+
| 1. Identify      |   | 2. Catalog       |   | 3. Community     |   | 4. Payment       |
|    Service       |   |    Service       |   |    Service       |   |    Service       |
+------------------+   +------------------+   +------------------+   +------------------+
         ^                   |           |
         |                   v           | (Async Tasks)
         |        +----------------------+
         |        |     Message Queue    | <--- RabbitMQ / Redis PubSub
         |        | (Hàng đợi tin nhắn)  |
         |        +----------+-----------+
         |                   |
         +<------------------+ (Notifications)
                             v
                     +------------------+
                     | 5. Worker Service|
                     | (Xử lý tác vụ nền) |
                     +------------------+
```

### **3. Thiết kế Chi tiết từng Service**

#### **3.1. Account Service (Dịch vụ Tài khoản)**

* **Miền Trách nhiệm:** Quản lý danh tính, quyền hạn và các thực thể liên quan đến người dùng.
* **Chức năng Cốt lõi:**
    * Đăng ký, Đăng nhập, Xác thực (sử dụng `better-auth`).
    * Quản lý hồ sơ người dùng, các gói thuê bao (Free, Premium, VIP).
    * Quản lý Roles & Permissions (RBAC).
    * Quản lý Nhóm Sáng tạo và thành viên.
* **Sở hữu Dữ liệu:** `users`, `subscriptions`, `roles`, `permissions`, `teams`, `team_members`, ....
* **API Endpoints Chính:**
    * `POST /api/v1/accounts/register`
    * `POST /api/v1/accounts/login`
    * `GET /api/v1/accounts/me` (Lấy thông tin user hiện tại)
    * `PUT /api/v1/accounts/profile` (Cập nhật hồ sơ)
    * `GET /api/v1/teams/:teamId`

#### **3.2. Catalog Service (Dịch vụ Danh mục)**

* **Miền Trách nhiệm:** Là "thư viện" trung tâm, quản lý toàn bộ thông tin về các tác phẩm media và metadata liên quan.
* **Chức năng Cốt lõi:**
    * CRUD cho Novel, Manga, Anime và các thành phần con (Volume, Chapter, Episode, Page).
    * Quản lý CSDL Nhân vật, Tác giả/Họa sĩ, Thể loại/Tags.
    * Cung cấp API để tìm kiếm, lọc và truy xuất thông tin nội dung.
* **Sở hữu Dữ liệu:** `novels`, `mangas`, `animes`, `chapters`, `episodes`, `characters`, `creators`, `genres`, `tags`,
  và các bảng nối liên quan.
* **API Endpoints Chính:**
    * `GET /api/v1/catalog/mangas/:mangaId`
    * `GET /api/v1/catalog/mangas/:mangaId/chapters`
    * `GET /api/v1/catalog/characters/:characterId`
    * `GET /api/v1/catalog/search?q=...`

#### **3.3. Community Service (Dịch vụ Cộng đồng)**

* **Miền Trách nhiệm:** Quản lý tất cả các tương tác xã hội và nội dung do người dùng tạo ra.
* **Chức năng Cốt lõi:**
    * Quản lý hệ thống Bình luận và Đánh giá (Review).
    * Quản lý Danh sách Theo dõi Cá nhân (Personal Watchlist) của người dùng.
    * Xử lý logic real-time cho tính năng Xem Chung (Watch Party), bao gồm cả kết nối WebSocket và WebRTC.
* **Sở hữu Dữ liệu:** `comments`, `reviews`, `user_watchlists`.
* **Công nghệ Đặc thù:** ElysiaJS với các plugin WebSocket, tích hợp thư viện WebRTC.
* **API Endpoints Chính:**
    * `GET /api/v1/community/chapters/:chapterId/comments`
    * `POST /api/v1/community/reviews`
    * `POST /api/v1/community/watchlist` (Thêm/cập nhật trạng thái)
    * `WS /api/v1/community/watch-party/:roomId` (WebSocket endpoint)

#### **3.4. Payment Service (Dịch vụ Thanh toán)**

* **Miền Trách nhiệm:** Xử lý mọi nghiệp vụ liên quan đến tài chính, được cô lập để đảm bảo an ninh tối đa.
* **Chức năng Cốt lõi:**
    * Quản lý Ví tiền ảo ("Coin") của người dùng.
    * Tích hợp với API của cổng thanh toán bên thứ ba (Stripe, MoMo) để nạp tiền.
    * Xử lý các giao dịch mua/thuê nội dung.
    * Lưu trữ lịch sử giao dịch và quyền sở hữu nội dung.
* **Sở hữu Dữ liệu:** `user_wallets`, `payment_transactions`, `content_purchases`, `content_rentals`, ....
* **API Endpoints Chính:**
    * `GET /api/v1/payment/wallet/balance`
    * `POST /api/v1/payment/wallet/deposit`
    * `POST /api/v1/payment/orders/purchase`

#### **3.5. Worker Service (Dịch vụ Xử lý Nền)**

* **Miền Trách nhiệm:** Thực thi các tác vụ nặng, tốn thời gian một cách bất đồng bộ để không làm ảnh hưởng đến trải
  nghiệm người dùng.
* **Chức năng Cốt lõi:**
    * **Xử lý hình ảnh:** Nhận lệnh từ `Catalog Service` để nén và chuyển đổi định dạng ảnh manga.
    * **Gửi email/Thông báo:** Nhận lệnh từ các service khác (ví dụ: `Account Service` yêu cầu gửi mail xác thực) để gửi
      đi.
    * **Xử lý video (Tương lai):** Chuyển mã video anime sang nhiều độ phân giải.
* **Cách hoạt động:** Service này không có API công khai. Nó lắng nghe các công việc được đẩy vào Message Queue và xử lý
  chúng.

### **4. Giao tiếp giữa các Service**

* **Đồng bộ (Synchronous):**
    * **API Gateway -> Services:** Tất cả request từ client sẽ đi qua API Gateway, sau đó được định tuyến đến service
      tương ứng. Gateway cũng sẽ chịu trách nhiệm xác thực token người dùng bằng cách gọi đến `Account Service`.
    * **Service -> Service:** Trong một số trường hợp, các service có thể gọi trực tiếp lẫn nhau qua REST API nội bộ (ví
      dụ: `Payment Service` gọi `Catalog Service` để lấy giá). Cần có cơ chế timeout và retry (ví dụ: Polly,
      retry-axios) để xử lý lỗi.
* **Bất đồng bộ (Asynchronous):**
    * **Message Queue (RabbitMQ / Redis Pub/Sub):** Được sử dụng để giao tiếp khi không cần phản hồi ngay lập tức. Ví
      dụ: `Catalog Service` đẩy message "Process Image Job" vào queue, `Worker Service` nhận và xử lý. `Account Service`
      đẩy message "User Registered Event", `Worker Service` nhận và gửi email chào mừng.

### **5. Công nghệ Đề xuất**

* **Ngôn ngữ & Runtime:** Bun + TypeScript.
* **Framework:** ElysiaJS (cho hiệu năng cao).
* **Database:** PostgreSQL (Mỗi service sẽ có schema hoặc database riêng - **Database per Service Pattern**).
* **Caching:** Redis.
* **Message Queue:** RabbitMQ (mạnh mẽ) hoặc Redis Pub/Sub (đơn giản hơn).
* **API Gateway:** Kong, Traefik, hoặc tự xây dựng bằng ElysiaJS.
