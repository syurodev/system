## **Tài liệu Thiết kế: Các Hệ thống Lõi & Dữ liệu Chung**

### **1. Tổng quan & Mục tiêu**

Tài liệu này định nghĩa kiến trúc và chức năng của các hệ thống nền tảng, đóng vai trò là "lớp dịch vụ dùng chung" (
shared service layer) cho các phân hệ nội dung chuyên biệt (Novel, Manga, Anime).

**Mục tiêu chính:**

* **Đảm bảo tính nhất quán:** Cung cấp một nguồn dữ liệu chân lý duy nhất (Single Source of Truth) cho các thực thể được
  chia sẻ.
* **Tối ưu hóa và Tái sử dụng:** Tránh lặp lại logic và dữ liệu trên các phân hệ khác nhau.
* **Tạo ra một Hệ sinh thái Kết nối:** Cho phép người dùng khám phá và tương tác liền mạch giữa các loại nội dung khác
  nhau.

### **2. Các Hệ thống Lõi được Định nghĩa**

1. **Hệ thống Quản lý Người dùng (User Management)**
2. **Hệ thống Phân loại (Taxonomy - Genres & Tags)**
3. **Hệ thống Thanh toán (Payment Service)**
4. **Hệ thống "Nhóm Sáng tạo" (Creator Teams)**
5. **Hệ thống Tác giả & Họa sĩ (Creators & Artists)**
6. **Hệ thống Cơ sở dữ liệu Nhân vật (Character Database)**

---

### **3. Thiết kế Chi tiết**

#### **3.1. Hệ thống Quản lý Người dùng**

* **Mục tiêu:** Quản lý danh tính, xác thực, phân quyền và các gói thuê bao của người dùng.
* **Mô tả:** Đây là hệ thống lõi cơ bản nhất, xác định "ai" đang sử dụng nền tảng và họ "có thể làm gì" ở cấp độ cao
  nhất.
* **Tham chiếu:** Hệ thống này được định nghĩa chi tiết trong **`Tài liệu Thiết kế: Hệ thống Quản lý Người dùng`**.

#### **3.2. Hệ thống Phân loại (Taxonomy)**

* **Mục tiêu:** Cung cấp một bộ Thể loại (Genres) và Thẻ (Tags) nhất quán để phân loại tất cả các loại nội dung.
* **Các Thực thể Cốt lõi (CSDL):**
    * `genres` (`id`, `name`, `slug`, `description`)
    * `tags` (`id`, `name`, `slug`)
    * `classifications` (Bảng nối đa hình): `classification_id`, `content_id`, `content_type` ('Novel', 'Manga', '
      Anime').
* **Chức năng chính:**
    * Admin quản lý danh sách Genres và Tags tập trung.
    * Nhóm Sáng tạo có thể gán Genres/Tags cho tác phẩm của họ.
    * Người dùng có thể bấm vào một Genre/Tag để xem trang tổng hợp tất cả Novel, Manga, và Anime thuộc phân loại đó.

#### **3.3. Hệ thống Thanh toán (Payment Service)**

* **Mục tiêu:** Quản lý toàn bộ vòng đời giao dịch tài chính trên nền tảng, từ nạp tiền đến chi tiêu, revenue sharing và compliance.
* **Các Thực thể Cốt lõi (CSDL):**
    * **Wallet System:** `user_wallets`, `wallet_transactions` - Quản lý số dư và lịch sử giao dịch immutable
    * **Payment Processing:** `payment_transactions`, `user_payment_methods` - Tích hợp Stripe, lưu trữ payment methods
    * **Content Monetization:** `content_purchases`, `content_rentals` - Mua vĩnh viễn và thuê có thời hạn
    * **Revenue Sharing:** `creator_revenue_shares`, `revenue_transactions`, `payout_batches` - Chia sẻ doanh thu với creators
    * **Pricing & Discounts:** `pricing_rules`, `coupon_codes`, `coupon_usage` - Dynamic pricing và coupon system
    * **Compliance:** `tax_calculations`, `daily_spending_limits`, `fraud_alerts` - Audit và fraud detection
    * **Auto-renewal:** `rental_auto_renewals` - Grace period và auto-renewal cho rentals
* **Chức năng chính:**
    * **Wallet Management:**
        * Nạp tiền qua Stripe với webhook validation
        * Immutable transaction history cho compliance
        * Daily spending limits và fraud detection
    * **Content Monetization:**
        * **Permanent Purchases:** Sở hữu vĩnh viễn content
        * **Time-limited Rentals:** Thuê với grace period 24h và auto-renewal option
        * **Dynamic Pricing:** VIP discounts, coupon codes, bundle deals
        * **Free Trial Support:** 3 chapters/episodes đầu miễn phí
    * **Revenue Sharing (Commission-based):**
        * **Platform:** 25% commission rate
        * **Creators:** 75% revenue share
        * **Real-time calculation** tại thời điểm transaction
        * **Weekly/Monthly payouts** với minimum threshold 500K VND
    * **Grace Period & Auto-renewal:**
        * **24h grace period** sau khi rental expire
        * **Auto-renewal system** với 3 retry attempts
        * **Smart notifications** trước 24h và 1h
        * **User control** để enable/disable auto-renewal
    * **Audit & Compliance:**
        * **10% VAT** cho VN users, tax reporting
        * **Fraud detection:** Spending pattern analysis, daily limits
        * **Audit trails:** Complete transaction history với metadata
        * **Webhook security:** Stripe signature verification
* **Công nghệ Đặc thù:**
    * **Multi-currency support:** VND primary, USD future expansion
    * **Stripe Integration:** Primary payment gateway với comprehensive webhook handling
    * **PostgreSQL:** DECIMAL precision cho financial data, constraint validation
    * **Real-time Processing:** Revenue calculation và payout scheduling
    * **Security Features:** Encrypted payment method storage, fraud detection algorithms
* **Tích hợp Cross-Service:**
    * **Account Service:** User authentication, subscription level validation
    * **Catalog Service:** Content pricing, metadata validation
    * **Community Service:** VIP feature access control
    * **Worker Service:** Email notifications, payout processing

#### **3.4. Hệ thống "Nhóm Sáng tạo" (Creator Teams)**

* **Mục tiêu:** Quản lý các nhóm hoặc cá nhân cung cấp nội dung cho nền tảng.
* **Các Thực thể Cốt lõi (CSDL):**
    * `teams` (`id`, `name`, `slug`, `logo_url`, `description`, `owner_user_id`)
    * `team_members` (`team_id`, `user_id`, `role`) - Vai trò trong nhóm: 'Owner', 'Uploader', 'Editor'.
* **Chức năng chính:**
    * Cho phép người dùng tạo và quản lý một Nhóm.
    * Mời/xóa thành viên và phân quyền nội bộ.
    * Mỗi Novel, Manga, Anime sẽ có một khóa ngoại `team_id` bắt buộc, liên kết nội dung với chủ sở hữu của nó.

#### **3.5. Hệ thống Tác giả & Họa sĩ (Creators & Artists)**

* **Mục tiêu:** Xây dựng một cơ sở dữ liệu trung tâm cho các cá nhân sáng tạo (tác giả, họa sĩ), cho phép khám phá chéo
  các tác phẩm của họ.
* **Các Thực thể Cốt lõi (CSDL):**
    * `creators` (`id`, `name`, `bio`, `avatar_url`)
    * `content_creators` (Bảng nối): `content_id`, `content_type`, `creator_id`, `role` ('Tác giả', 'Họa sĩ minh họa', '
      Đạo diễn').
* **Chức năng chính:**
    * Hiển thị tên tác giả/họa sĩ trên trang chi tiết nội dung.
    * Khi bấm vào tên, người dùng được dẫn đến một trang riêng liệt kê tất cả các tác phẩm của người đó trên nền tảng.

#### **3.6. Hệ thống Cơ sở dữ liệu Nhân vật (Character Database)**

* **Mục tiêu:** Tạo ra một "wiki" nhân vật tích hợp, kết nối các phiên bản khác nhau của một nhân vật qua các loại nội
  dung.
* **Các Thực thể Cốt lõi (CSDL):**
    * `characters` (`id`, `name`, `description`, `main_image_url`)
    * `character_appearances` (Bảng nối): `character_id`, `content_id`, `content_type`, `role` ('Nhân vật chính', '
      Phụ'), `contextual_image_url`.
* **Chức năng chính:**
    * Trang chi tiết Nhân vật hiển thị thông tin chung và danh sách tất cả các Anime, Manga, Novel mà họ xuất hiện.
    * Xử lý **Spoiler:** Phần mô tả trong `characters` sẽ không chứa spoiler. Các chi tiết sâu hơn, tiết lộ nội dung sẽ
      được quản lý ở cấp độ `character_appearances` và được ẩn đi theo mặc định.
    * Cho phép khám phá chéo: Từ một nhân vật trong anime, người dùng có thể dễ dàng tìm thấy manga gốc.

#### **3.7. Hệ thống Cộng đồng (Community System)**

* **Mục tiêu:** Quản lý tất cả các tương tác xã hội và nội dung do người dùng tạo ra, tạo nên một cộng đồng sôi động.
* **Các Thực thể Cốt lõi (CSDL):**
    * **Comments System:** `comments`, `comment_likes` - Hệ thống bình luận 3-cấp với hỗ trợ đa loại content
    * **Reviews & Ratings:** `reviews`, `ratings`, `review_likes` - Đánh giá chi tiết và nhanh
    * **Watchlist System:** `user_watchlists`, `custom_lists`, `reading_progress` - Theo dõi cá nhân và danh sách tùy
      chỉnh
    * **Watch Party:** `watch_party_rooms`, `watch_party_participants`, `watch_party_messages` - Xem chung real-time
    * **Notifications:** `notifications`, `notification_preferences` - Thông báo real-time
* **Chức năng chính:**
    * **Bình luận đa cấp độ:**
        * Novel: Bình luận ở cấp độ novel + chapter + dòng text (tích hợp Plate Editor)
        * Manga: Bình luận ở cấp độ chapter + page (hỗ trợ bookmark theo page)
        * Anime: Bình luận ở cấp độ anime + episode
        * Hỗ trợ 3 cấp nesting: Root → Reply → Reply to Reply
    * **Review & Rating System:**
        * Detailed Reviews: Bài viết dài + rating 1-5 sao
        * Quick Ratings: Chỉ số sao (không text)
        * Review Voting: Helpful/Unhelpful cho reviews
    * **Personal Watchlist (MAL-style):**
        * Trạng thái: Plan to Read/Watch, Reading/Watching, Completed, On Hold, Dropped
        * Personal ratings, notes, start/finish dates
        * Public/Private visibility
        * Custom Lists: "Top 10 anime thư giãn", etc.
    * **Reading/Viewing Progress:**
        * Novel: Track đến dòng text cụ thể (Plate Editor integration)
        * Manga: Track đến page cụ thể (bookmark support)
        * Anime: Track đến timestamp cụ thể
        * **Không sync liên tục** - chỉ lưu khi có thay đổi đáng kể
    * **Watch Party (VIP Feature):**
        * **Chỉ VIP mới tạo được phòng** - Temporary rooms với password protection
        * Real-time video sync (pause/play) cho tất cả participants
        * **Text Chat:** Cho tất cả users tham gia
        * **Voice Chat:** Push-to-Talk chỉ dành cho VIP users
        * Room management: Host controls, participant limits
    * **Real-time Notifications:**
        * Comment replies, review likes, new chapters/episodes
        * In-app và Push notification support
        * Granular user preferences
* **Công nghệ Đặc thù:**
    * **ElysiaJS + WebSocket** cho real-time features
    * **WebRTC** cho Voice Chat trong Watch Party
    * **TimescaleDB Integration** (thay vì PostgreSQL thường):
        * **Hypertables** cho time-series data: comment_events, watch_party_events, notification_events,
          user_activity_events
        * **Continuous Aggregates** cho real-time analytics (hourly stats)
        * **Automatic compression** và retention policies
        * **pg_notify triggers** cho instant real-time notifications
        * **Data retention**: Comment events (1 năm), Watch party (6 tháng), Notifications (3 tháng)
    * **Redis Caching Strategy:**
        * Hot comments, recent comments cache
        * User watchlist cache
        * Review aggregations cache
        * **TTL: 1 giờ**, invalidate khi có thay đổi dữ liệu
        * Real-time notification delivery
    * **Real-time Analytics Capabilities:**
        * Live comment activity tracking
        * Watch party engagement metrics
        * Notification delivery rates và response times
        * User engagement patterns và device usage
        * Trending content detection
* **Tích hợp Cross-Service:**
    * **Account Service:** User authentication, VIP status checking
    * **Catalog Service:** Content metadata, chapter/page/episode information
    * **Payment Service:** VIP subscription validation
    * **Worker Service:** Push notification delivery, cache warming

---

### **4. Sơ đồ Tương quan giữa các Hệ thống**

```
[User Management] -> Quản lý Users & Subscriptions

    |
    v

[Creator Teams] -> Quản lý bởi [Users]
    |
    +-----> [Novel]
    |
    +-----> [Manga]
    |
    +-----> [Anime]


[Content (Novel, Manga, Anime)]
    |
    +--- liên kết với ---> [Taxonomy (Genres, Tags)]
    |
    +--- liên kết với ---> [Creators & Artists]
    |
    +--- liên kết với ---> [Character Database]
    |
    +--- được mua/thuê bởi [Users] thông qua ---> [Payment Service]
    |
    +--- được tương tác bởi [Users] thông qua ---> [Community System]


[Community System] -> Quản lý tương tác xã hội
    |
    +--- Comments (3-level) trên [Content]
    |
    +--- Reviews & Ratings cho [Content]
    |
    +--- Watchlists của [Users]
    |
    +--- Watch Party (VIP) cho [Anime Episodes]
    |
    +--- Real-time Notifications cho [Users]
    |
    +--- Redis Caching cho performance
    |
    +--- TimescaleDB cho time-series analytics
    |
    +--- WebSocket/WebRTC cho real-time features
    |
    +--- pg_notify triggers cho instant updates


[Payment Service] -> Quản lý tài chính và monetization
    |
    +--- Wallet Management: Nạp tiền, spending limits, fraud detection
    |
    +--- Content Monetization: Purchase/rental với grace period
    |
    +--- Revenue Sharing (25%/75%): Real-time calculation, weekly payouts
    |
    +--- Dynamic Pricing: VIP discounts, coupon codes, bundle deals
    |
    +--- Auto-renewal: Grace period 24h, smart notifications
    |
    +--- Compliance & Audit: VAT calculation, transaction history
    |
    +--- Stripe Integration: Webhook validation, payment methods
    |
    +--- Fraud Detection: Pattern analysis, daily limits

```