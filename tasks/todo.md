# Checklist refactor portfolio

Các task triển khai đều đang chờ duyệt kế hoạch; chưa sửa runtime.

## 1. Chốt định hướng
- [ ] Xác nhận đối tượng, phong cách, 3 dự án chính và việc giữ CMS.
- Acceptance: ghi được lựa chọn và phạm vi cụ thể trong plan.
- Verification: user duyệt định hướng.
- Dependencies: không. Files: tasks/plan.md. Scope: S.

## 2. Prototype riêng
- [ ] Làm hero, featured, filter, detail/demo với dữ liệu thật.
- Acceptance: có luồng project → detail → demo/CV; không ghi backend/analytics.
- Verification: browser desktop/mobile, keyboard, đóng iframe; user duyệt trước khi áp dụng.
- Dependencies: 1. Files: prototypes/showcase/{index.html,style.css,main.js}. Scope: M.

## 3. Baseline và slice projects
- [ ] Ghi baseline filter, pagination, modal, hash; tách project feature với UI cũ.
- Acceptance: route và dữ liệu cũ còn dùng được; entry gọi API feature rõ ràng.
- Verification: chạy các luồng baseline và test tập trung cho lookup/route khi thay logic.
- Dependencies: 2. Files: index.html, assets/js/main.js, assets/js/features/projects.js, file test tập trung nếu cần. Scope: M.

## 4. Playable lifecycle
- [ ] Tách player qua API open/close rõ ràng.
- Acceptance: ratio/reload/variant hoạt động; đóng player dừng iframe/audio.
- Verification: browser với demo đơn và nhiều biến thể; keyboard Escape và mở lại.
- Dependencies: 3. Files: index.html, assets/js/main.js, assets/js/features/projects.js, assets/js/features/playable.js. Scope: M.

## Checkpoint A
- [ ] Hành vi cũ pass sau khi tách feature; prototype đã duyệt.

## 5. Hero và featured
- [ ] Áp thiết kế đã duyệt cho đầu trang.
- Acceptance: CTA rõ; dùng nội dung thật; không chặn đọc bằng loading giả.
- Verification: desktop/mobile và reduced motion.
- Dependencies: 4. Files: index.html, assets/js/main.js, assets/js/features/profile.js, assets/css/style.css, assets/css/home.css. Scope: M.

## 6. Library và detail
- [ ] Áp giao diện danh sách và case study.
- Acceptance: filter, pagination, hash và player tiếp tục hoạt động; không đổi schema dữ liệu chưa duyệt.
- Verification: desktop/mobile, keyboard/focus, direct link và Back.
- Dependencies: 5. Files: index.html, assets/js/features/projects.js, assets/css/style.css, assets/css/projects.css. Scope: M.

## 7. Profile và contact
- [ ] Hoàn thiện kinh nghiệm, năng lực, CV và liên hệ.
- Acceptance: nội dung placeholder được thay bằng thông tin user xác nhận; link hợp lệ.
- Verification: click links/CV, kiểm tra responsive và heading.
- Dependencies: 6. Files: assets/js/features/profile.js, data/profile.json, data/site.json, assets/css/home.css. Scope: M.

## Checkpoint B
- [ ] Duyệt toàn bộ public site trước khi chuyển sang admin.

## 8. CMS và admin: khảo sát contract
- [ ] Xác nhận luồng Supabase → export JSON → publish; khảo sát auth/policy thực tế nếu có quyền truy cập.
- Acceptance: tài liệu nguồn dữ liệu và quyền rõ ràng; chia task triển khai nhỏ sau khi biết phạm vi.
- Verification: đối chiếu caller public/admin/dashboard và SQL; không giả định SQL local phản ánh production.
- Dependencies: 1; implementation sau checkpoint B và duyệt phạm vi riêng.
- Files: tasks/plan.md, tasks/todo.md. Scope: S.

## 9. QA và bàn giao
- [ ] Kiểm tra public flows, media, lỗi console/network, metadata và liên kết.
- Acceptance: không regression đã biết; liệt kê rõ phần chưa verify.
- Verification: browser desktop/mobile, direct link, demo, theme, reduced motion; so sánh hiệu năng cùng điều kiện với baseline.
- Dependencies: 7; phần admin phụ thuộc task triển khai phát sinh từ 8.
- Files: tasks/plan.md, tasks/todo.md, data/site.json, index.html. Scope: M.

## Checklist hiện hành: Comic D + Rubik
- [x] Chốt bản D và ghi plan design/motion/asset/stack.
- [ ] Thực hiện D1-D7 và checkpoint trong [comic-ui-plan.md](comic-ui-plan.md). Checklist này thay thứ tự triển khai public UI trước đó; scope admin giữ riêng.
