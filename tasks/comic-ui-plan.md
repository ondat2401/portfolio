# Kế hoạch UI comic D — 2026-11-04

Đây là bản cập nhật cho kế hoạch portfolio hiện có. User đã chọn bản D và yêu cầu lập plan trước khi implementation. Các phương án thiết kế chưa chốt trong plan cũ được thay bằng quyết định dưới đây; ghi chú khảo sát/admin cũ tiếp tục được giữ.

## Thiết kế và scope
- Bản D: nền than chì, viền giấy ngà, mực đen, đỏ trầm nhấn ít. Game giữ màu gốc. Comic nằm ở nét vẽ, panel bất đối xứng, gutter, caption/bubble và halftone tiết chế.
- Tham chiếu: `C:/Users/ADMIN/.codex/generated_images/01a1a6fc-d6ff-7620-a0ef-70b677c1a10f/exec-561d23b9-389d-4637-b4f1-f1d1ecbd77a9.png`.
- Hero: tên, chuyên môn, mô tả thật từ profile, CTA Projects/CV + Rubik 3×3 comic tương tác. Sau hero là featured → project library → about/skills/experience → contact.
- Thumbnail/video gốc là nội dung chính của project. Video ngang giữ 16:9; video dọc có panel 9:16 riêng. Viền ngoài có thể lệch, vùng media giữ hình chữ nhật ổn định, không skew/crop mất gameplay.
- Mobile xếp một cột theo thứ tự đọc; panel dọc giới hạn chiều cao theo viewport. Không suy tỉ lệ video từ ảnh poster.
- Giữ schema JSON, hash link và thư mục media hiện tại. Admin/dashboard/Supabase/auth nằm ngoài đợt UI; giữ khảo sát cũ để làm riêng.

## Công nghệ
- Giữ HTML/CSS/JavaScript, tách ES modules theo feature khi thay phần đó. Chưa cần React/Vue.
- Đề xuất Vite cho dev server/build. Node.js dùng lúc phát triển/build; output vẫn là website tĩnh.
- Three.js scoped riêng cho Rubik: geometry đơn giản và material/outline comic. Dùng geometry/material chung cho 27 cubelet, setting tập trung.
- SVG/CSS cho outline, bubble, panel và motion 2D; chỉ thêm thư viện timeline nếu prototype chứng minh có nhu cầu.
- Tauri dùng đóng gói app desktop/mobile; hiện chưa có yêu cầu này nên không chọn.
- Trước khi thêm build tool, xác minh hosting. Build phải giữ đường dẫn data/projects/PDF/MP4 và playable HTML có asset nhúng; không biến đổi playable qua pipeline HTML của public site.
- Tài liệu tham chiếu: https://vite.dev/guide/ ; https://threejs.org/docs/ ; https://v2.tauri.app/start/ .

## Motion contract
- Outline/bubble có 3 biến thể nét SVG cùng viewBox và vùng nội dung. Luân phiên frame để tạo line boil: khởi điểm 8–12 fps, lệch nét khoảng 1–2px; điều chỉnh sau khi xem trên màn hình thật.
- Nét viền/texture đổi; chữ, hit area và video ổn định. Không chạy displacement lên phần tử chứa chữ/video.
- Hero/bubble có loop nhẹ; panel project kích hoạt ngắn khi hover/focus/enter viewport. Không làm toàn trang rung liên tục.
- Rubik idle xoay chậm theo pose rời, limited animation. Hover đúng khối: cubelet tách theo hướng từ tâm; rời chuột ráp lại, giới hạn trong vùng hero.
- State: assembled → exploding → exploded → assembling. Đảo hover giữa chừng nội suy từ pose hiện tại, không reset hoặc tạo loop mới.
- Touch và keyboard dùng nút “Tách khối / Ráp khối”, có focus rõ. Rubik là vật thể trang trí tương tác; chưa gồm luật chơi/scramble/solver.
- Reduced motion: tắt line boil/idle, đổi Rubik bằng pose tĩnh. Pause ngoài viewport/tab ẩn; WebGL lỗi có poster fallback và nội dung đọc được.

## Asset tách riêng
- Tạo trong `assets/comic/`, có nguồn chỉnh sửa và bản tối ưu cho web. Không gen nguyên trang rồi cắt làm UI.
- SVG rời: outline ngang/dọc, bubble speech/thought/burst, gạch chân và speed lines. Mỗi outline động có 3 trạng thái nét cùng bounds.
- Raster chỉ gen khi cần chất liệu: giấy than chì/ngà, brush/splatter alpha. Từng asset riêng, không chữ/nút/thumbnail; kiểm tra alpha/seam/contrast.
- Rubik dựng geometry thay vì gen model cho hình khối đơn giản; texture comic riêng nếu cần. Palette graphite/ngà/đỏ trầm.
- Inventory `assets/comic/README.md`: tên, nguồn, biến thể, kích thước, mục đích/cách dùng. Chỉ tạo asset thực sự dùng.

## Checklist thực thi

### D1 — Baseline và build contract
- [ ] Xác minh hosting, media ratio và baseline public flows.
- Acceptance: có video mẫu ngang/dọc, flow filter/pager/hash/modal/player/CV/theme, biết cách giữ URL sau build.
- Verify: browser hiện tại, metadata video, hosting config thực tế.
- Phụ thuộc: không. Files: tài liệu tasks. Scope: S.

### D2 — Prototype hero + Rubik riêng
- [ ] Setup Vite vanilla rồi dựng `prototypes/comic/` với thông tin thật và Rubik.
- Acceptance: idle/hover tách–ráp, đảo motion giữa chừng, tap/keyboard, reduced motion và fallback.
- Verify: dev/build/preview; desktop/mobile; đo frame time trên thiết bị thật.
- Phụ thuộc: D1. Files: package/lock/build config và prototype hero; chia setup và hero thành hai slice nhỏ, tối đa khoảng 5 file/slice.

### D3 — Line boil + video hỗn hợp
- [ ] Thêm bubble/outline 3 frame và hai panel video ngang/dọc thật.
- Acceptance: nét sống nhưng text/video ổn định; 9:16 đủ gameplay; chỉ preview tương tác phát.
- Verify: hover/focus/scroll/resize/media error; review motion cùng user.
- Phụ thuộc: D2. Files: prototype CSS/JS, SVG mẫu, asset README. Scope: M.

### Checkpoint prototype
- [ ] Review hero, Rubik, comic motion và mixed-aspect trước khi áp lên trang chính.

### D4 — Asset kit rời
- [ ] Hoàn thiện SVG/texture theo kết quả prototype; gen từng raster cần thiết.
- Acceptance: nguồn sửa được, alpha đúng, frame cùng bounds, inventory rõ.
- Verify: nền tối/sáng, resize, alpha/dung lượng. Phụ thuộc: D3 + checkpoint. Scope: S/M mỗi nhóm asset.

### D5 — Hero/featured public
- [ ] Tách hero/rubik module, nối entry và áp design D.
- Acceptance: dùng data hiện có, CTA/CV/preview đúng; thay CSS theo feature thay vì chồng override toàn trang.
- Verify: build/preview, responsive, reduced motion và baseline.
- Phụ thuộc: D4. Files: index.html, main.js, hero module/CSS. Scope: M.

### D6 — Library/detail/player
- [ ] Áp panel mixed aspect, giữ filter/pager/hash/Back; tách projects và player trong flow cần thay.
- Acceptance: ratio/variant/reload/close hoạt động; đóng dừng iframe/audio; media gốc giữ đường dẫn.
- Verify: project dọc/ngang, deep link, keyboard/focus, mở lại player.
- Phụ thuộc: D5. Files: main.js, projects module/CSS, playable module, index.html; chia library và player thành hai slice khi thực hiện. Scope: M mỗi slice.

### D7 — Profile và QA
- [ ] Áp comic cho about/skills/timeline/footer, hoàn thiện responsive và kiểm tra tổng thể.
- Acceptance: nội dung dễ đọc, không tạo thành tích/contact giả; public flows không regression đã biết.
- Verify: 320/390/768/1024/1440px, keyboard/touch/reduced motion/WebGL fallback, media lỗi, console/network, CV và playable. Đo frame time/heap/layout shift trước–sau cùng điều kiện.
- Phụ thuộc: D6. Files: profile module/CSS, entry/HTML; tách visual và QA thành các slice nhỏ. Scope: M.

## Rủi ro và trạng thái
- WebGL cộng nhiều video gây tải: giới hạn pixel ratio, reuse resources, pause ngoài màn hình; chỉ load/play media theo tương tác. Chốt mức chất lượng sau đo trên thiết bị thực.
- Nét rung khó đọc: chỉ áp lên border/decor, giới hạn loop và có reduced motion.
- Tách CSS/module có thể ảnh hưởng cascade/global state: chuyển từng flow, kiểm tra baseline trước/sau. Không refactor toàn repo hoặc đổi API/data ngoài scope.
- Kế hoạch chưa triển khai runtime/asset; chưa chạy build, test hay benchmark. Không còn câu hỏi chặn lập plan; hosting/media ratio được xác minh ở D1.

## Tiến độ điều chỉnh prototype
- Hero đã bổ sung headline trên nền giấy, panel Rubik, bubble SVG rời, speed lines, caption và outline 3 frame.
- Rubik đã có chuỗi xoay tầng và chuỗi đảo ngược để ráp lại; hover tách khối tạm dừng lượt xoay và tiếp tục khi ráp về.
- Theo yêu cầu user: agent chỉ code, user kiểm tra giao diện/motion. Chưa đánh dấu các bước verification là hoàn tất.


## Tiếp tục prototype — 2026-11-05
- Đã code filter danh mục, case study, playable iframe với nút ratio/reload và cleanup khi đóng.
- About/skills/experience đọc từ profile JSON, giữ scope prototype.
- Preview có cơ chế hủy request play cũ và chỉ phát một video; dừng khi filter, mở detail, tab ẩn hoặc panel ngoài viewport.
- Theo yêu cầu user, chưa chạy kiểm thử/build/browser cho đợt này; user thực hiện kiểm tra.


## Áp public UI — 2026-11-05
- Trang chính đã nối hero comic và Rubik chung qua assets/js/features; prototype dùng cùng module.
- Thêm comic.css và comic-hero.css cho palette, panel, typography, modal, timeline và mobile; giữ renderer/filter/pager/hash/player hiện có.
- Media ratio lấy từ video metadata; build config gồm trang chính/prototype và copy classic scripts/media/admin đúng đường dẫn.
- Chưa chạy build/browser/test theo yêu cầu user tự kiểm tra.


## Comic spreads — 2026-11-05
- Layout project theo cụm bất đối xứng, ưu tiên cặp portrait/landscape 4+8; landscape 7+5/5+7; ba portrait chia ba panel.
- Dùng metadata video để nhận portrait, áp lại sau đổi trang/filter. Prototype và public dùng chung layoutComicPanels.
- Highlights có bố cục đứng riêng; media giữ chữ nhật và không transform gameplay.
- Chưa chạy test/browser theo yêu cầu user tự kiểm tra.
