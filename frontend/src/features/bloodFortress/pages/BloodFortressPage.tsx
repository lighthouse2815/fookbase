import { BloodFortressCanvas } from '@/features/bloodFortress/BloodFortressCanvas';
import '@/features/bloodFortress/bloodFortress.css';

const BloodFortressPage = () => {
  return (
    <div className="blood-fortress-page">
      <div className="blood-fortress-inner">
        <section className="blood-fortress-hero">
          <div className="blood-fortress-hero-card">
            <p className="blood-fortress-kicker">Playable Dark Platformer</p>
            <h1 className="blood-fortress-title">Hiep Si Dang: Phao Dai Mau</h1>
            <p className="blood-fortress-subtitle">
              Mot ban platformer 2D side-scrolling mang cam giac dien anh, kinh di, u am va bi
              thuong. Ban dieu khien Hiep si Dang bang qua nghia dia, hanh lang tra tan, nha
              nguyen do nat va phong thi nghiem song cua Dr.Phieu, de roi nhan ra cai ket ngay tu
              dau da khong danh cho nguoi song sot.
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
              <h2>Dieu khien</h2>
              <ul>
                <li>`A/D` hoac mui ten de chay.</li>
                <li>`Space` de nhay, co the double jump.</li>
                <li>`Shift` de dash ngan xuyen ap luc.</li>
                <li>`J` de chem phan cong boss.</li>
                <li>`Enter` hoac `E` de di tiep cac cutscene.</li>
                <li>`Esc` hoac `P` de pause, `R` de choi lai khi can.</li>
              </ul>
            </article>

            <article className="blood-fortress-info-card">
              <h2>Tong game</h2>
              <p>
                Coin duoc dien giai nhu manh linh hon, dong vang nhuom mau va mat gia phat sang.
                Thu du moc can thiet se mo mot doan lore an ve Hiep si Du, nguoi da chien dau toi
                muc bat luc va guc nga, de chung minh cuoc chien nay von da tan nhan tu truoc khi
                Dang buoc qua cong.
              </p>
            </article>

            <article className="blood-fortress-info-card">
              <h2>Tich hop web</h2>
              <p>
                Game chay bang canvas TypeScript thuan trong React, khong phu thuoc engine ngoai
                nen co the nhung truc tiep vao web hien tai, chuyen sang route khac, modal, hoac
                mot container rieng ma khong phai doi gameplay core.
              </p>
            </article>
          </div>
        </section>

        <section className="blood-fortress-footer">
          Route da duoc them theo huong public de de tich hop va test nhanh:
          <code> /games/hiep-si-dang-phao-dai-mau</code>. Core gameplay nam trong
          <code> frontend/src/features/bloodFortress</code>, nen neu sau nay muon nhet vao landing
          page, tab, hoac iframe noi bo thi cung rat gon.
        </section>
      </div>
    </div>
  );
};

export default BloodFortressPage;
