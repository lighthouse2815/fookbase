import { BloodFortressCanvas } from '@/features/bloodFortress/BloodFortressCanvas';
import '@/features/bloodFortress/bloodFortress.css';

const BloodFortressPage = () => {
  return (
    <div className="blood-fortress-page">
      <div className="blood-fortress-inner">
        <section className="blood-fortress-hero">
          <div className="blood-fortress-hero-card">
            <p className="blood-fortress-kicker">Playable Dark Platformer</p>
            <h1 className="blood-fortress-title">Hiệp Sĩ Đăng: Pháo Đài Máu</h1>
            <p className="blood-fortress-subtitle">
              Một bản platformer 2D side-scrolling mang cảm giác điện ảnh, kinh dị, u ám và bi
              thương. Bạn điều khiển Hiệp sĩ Đăng băng qua nghĩa địa, hành lang tra tấn, nhà
              nguyện đổ nát và phòng thí nghiệm sống của Dr.Phieu, để rồi nhận ra cái kết ngay từ
              đầu đã không dành cho người sống sót.
            </p>
          </div>
        </section>

        <section className="blood-fortress-stage">
          <div className="blood-fortress-stage-frame">
            <BloodFortressCanvas />
          </div>
        </section>

        <section className="blood-fortress-grid">
          <div className="blood-fortress-info-stack">
            <article className="blood-fortress-info-card">
              <h2>Điều khiển</h2>
              <ul>
                <li>`A/D` hoặc mũi tên để chạy.</li>
                <li>`Space` để nhảy, có thể double jump.</li>
                <li>`Shift` để dash ngắn xuyên áp lực.</li>
                <li>`J` để chém phản công boss.</li>
                <li>`Enter` hoặc `E` để đi tiếp các cutscene.</li>
                <li>`Esc` hoặc `P` để pause, `R` để chơi lại khi cần.</li>
              </ul>
            </article>

            <article className="blood-fortress-info-card">
              <h2>Tông game</h2>
              <p>
                Coin được diễn giải như mảnh linh hồn, đồng vàng nhuộm máu và mặt giả phát sáng.
                Thu đủ mốc cần thiết sẽ mở một đoạn lore ẩn về Hiệp sĩ Du, người đã chiến đấu tới
                mức bất lực và gục ngã, để chứng minh cuộc chiến này vốn đã tàn nhẫn từ trước khi
                Đăng bước qua cổng.
              </p>
            </article>

            <article className="blood-fortress-info-card">
              <h2>Tích hợp web</h2>
              <p>
                Game chạy bằng canvas TypeScript thuần trong React, không phụ thuộc engine ngoài
                nên có thể nhúng trực tiếp vào web hiện tại, chuyển sang route khác, modal, hoặc
                một container riêng mà không phải đổi gameplay core.
              </p>
            </article>
          </div>
        </section>

        <section className="blood-fortress-footer">
          Route đã được thêm theo hướng public để dễ tích hợp và test nhanh:
          <code> /games/hiep-si-dang-phao-dai-mau</code>. Core gameplay nằm trong
          <code> frontend/src/features/bloodFortress</code>, nên nếu sau này muốn nhét vào landing
          page, tab, hoặc iframe nội bộ thì cũng rất gọn.
        </section>
      </div>
    </div>
  );
};

export default BloodFortressPage;
