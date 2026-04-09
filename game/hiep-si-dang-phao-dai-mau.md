# Hiệp Sĩ Đăng: Pháo Đài Máu

## 1. Mô tả ngắn game
`Hiệp Sĩ Đăng: Pháo Đài Máu` là một game platformer 2D side-scrolling có thể chơi được trên web, thiên về cảm giác điện ảnh, kinh dị, máu me, u ám và bi thương. Người chơi điều khiển Hiệp sĩ Đăng vượt qua nghĩa địa, nhà nguyện đổ nát, hành lang tra tấn và phòng thí nghiệm thịt sống của Dr.Phieu, thu thập các mảnh linh hồn, kích hoạt checkpoint, sống sót qua bẫy tra tấn và đối đầu boss cuối trong một kết cục đã được định sẵn là thất bại.

## 2. Cốt truyện mở đầu
Vương quốc đã sụp đổ sau những thí nghiệm cấm kỵ của Dr.Phieu, kẻ từng là thái y và học giả được triều đình trọng vọng. Khi dịch bệnh quét qua thủ đô, nhà vua trao cho hắn toàn quyền “cứu chữa” bằng mổ xẻ, ghép xác và rút máu người sống lẫn người chết. Những thí nghiệm ấy không chữa được dân chúng, nhưng lại biến lâu đài thành một cơ thể khổng lồ biết thở, biết đau và biết đói.

Dân làng bị bẻ cong thành quái vật méo mó. Các hiệp sĩ khác đều đã chết, tự sát hoặc hóa điên sau khi nghe tiếng gọi của chính tên mình vọng ra từ tường đá. Hiệp sĩ Dư đã chiến đấu anh dũng ở cổng phía bắc, giữ được ba đêm trước khi gục ngã trong nhà nguyện, trở thành bằng chứng rõ nhất cho sự khốc liệt, bi ai và bất lực của cuộc chiến này.

Hiệp sĩ Đăng là người cuối cùng còn đủ tỉnh táo để tiến vào Pháo Đài Máu. Anh không đến như một anh hùng lạc quan đi cứu thế giới. Anh bước vào đó để chấm dứt cơn ác mộng, dù biết gần như chắc chắn mình sẽ chết và cái chết ấy có thể còn tệ hơn cái chết thông thường.

## 3. Hội thoại intro
### Nhân vật
- Hiệp sĩ Đăng
- Nữ tu hấp hối Nhi
- Dr.Phieu qua ảo ảnh / ma thuật vọng âm

### Intro dialogue đã được đưa vào game
1. `Nhi`: “Đừng kéo tấm khăn che mắt em xuống nữa... Em đã nghe đủ tiếng người trong tường rồi. Chỗ này không còn là lâu đài. Nó là một lò mổ biết thở.”
2. `Đăng`: “Ta đi qua nghĩa địa phía tây. Mộ bị đào từ bên trong. Xích kéo trên đá như có ai còn sống dưới đó.”
3. `Nhi`: “Dr.Phieu từng là thái y của vương quốc. Khi dịch bệnh quật ngã triều đình, hắn xin quyền mổ xẻ người hấp hối để chữa bệnh. Nhà vua gật đầu... rồi cả vương quốc bị đặt lên bàn giải phẫu.”
4. `Nhi`: “Máu đổ xuống hầm, thịt bị khâu vào đá, chuông nhà nguyện bị thay bằng tiếng rên. Dân làng méo thành quái vật. Các hiệp sĩ hoặc chết, hoặc phát điên vì nghe tên mình vọng ra từ tường.”
5. `Đăng`: “Hiệp sĩ Dư giữ cổng phía bắc ba đêm liền. Ta chỉ tìm thấy hắn trong nhà nguyện, tay còn siết gãy nửa cán giáo. Nếu Dư cũng gục... thì cơn ác mộng này đã ăn hết phần người còn sót lại.”
6. `Dr.Phieu`: “Ta chỉ cởi bỏ giới hạn yếu đuối của xác thịt. Lâu đài này đau đớn, nhưng nhờ đau đớn mà nó sống. Hãy bước vào đi, Hiệp sĩ Đăng. Ta cần một trái tim vẫn còn biết tuyệt vọng.”
7. `Nhi`: “Ngài không đến đây để cứu thế giới như những khúc ca cũ nữa. Ngài biết điều đó, đúng không?”
8. `Đăng`: “Ta đến để kết thúc cơn ác mộng này, dù gần như chắc chắn sẽ chết. Nếu số mệnh đã viết sẵn phần cuối, ít nhất ta sẽ bước vào nó bằng tên của mình.”

## 4. Thiết kế gameplay
### Gameplay bắt buộc đã có
- Di chuyển trái/phải
- Nhảy
- Double jump
- Dash ngắn
- Coin / mảnh linh hồn để thu thập
- Trap đa dạng
- 1 boss cuối map
- Thanh máu người chơi
- Thanh máu boss
- Checkpoint
- Pause
- Game over
- Faux victory rồi chuyển sang ending thất bại bắt buộc

### Cấu trúc màn chơi
- `Phần đầu`: nghĩa địa, cổng thành mục nát, sương mù dày, có chông bật, lưỡi cưa, sàn sập.
- `Phần giữa`: hành lang tra tấn, nhà nguyện đổ nát, phòng thí nghiệm xác ghép, có chông rơi, cột lửa, dây xích quét, axit và bình hóa chất nổ.
- `Phần cuối`: phòng ngai vàng thí nghiệm của Dr.Phieu, đỏ đen, tim đập, ánh lóe máu, trap pha hai.

### Coin
- Coin được biểu diễn thành `đồng vàng nhuốm máu`, `mảnh linh hồn`, `mắt giả phát sáng`.
- Có bộ đếm coin trên UI.
- Thu đủ mốc lore sẽ mở đoạn ký ức ẩn của Hiệp sĩ Dư, nhấn mạnh sự bất lực và bi kịch của chiến tuyến trước đó.

### Cảm giác điều khiển
- Nhảy và rơi có coyote time / jump buffer để mượt hơn.
- Dash ngắn để vượt trap và tái định vị khi đấu boss.
- Đòn chém chỉ gây sát thương một lần mỗi nhịp swing để combat công bằng.

## 5. Thiết kế boss Dr.Phieu
### Ngoại hình
Dr.Phieu được dựng như một bác sĩ tà đạo kiêm học giả điên, áo choàng đẫm máu, mặt tái nhợt, cầm dao mổ và ống tiêm. Khi vào phase 2, hắn biến dạng thành thực thể nửa người nửa khối thịt, khiến arena có cảm giác như cả lâu đài đang co giật cùng cơ thể hắn.

### Giai đoạn 1
- `Syringe volley`: bắn chùm ống tiêm theo góc ngắm.
- `Corpse hands / flesh burst`: thịt và tay xác sống trồi từ sàn.
- `Scalpel rush`: lao cắt ngang arena.
- `Vial arc`: ném lọ độc theo quỹ đạo parabol.

### Giai đoạn 2
- `Blood slam`: nhảy nện xuống tạo shockwave.
- `Storm`: gọi tia điện / cột giật rơi dọc arena.
- `Flesh sweep`: quét thịt và va chạm diện rộng.
- `Arena change`: trap lửa boss arena được kích hoạt, ánh đỏ và heartbeat tăng mạnh.

## 6. Hội thoại trước boss
1. `Dr.Phieu`: “Ngươi không đến để cứu ai cả. Ngươi chỉ đến để chết đúng chỗ.”
2. `Đăng`: “Nếu ta phải chết, thì ít nhất bóng tối sẽ nhớ tên ta.”
3. `Dr.Phieu`: “Không, Đăng. Thứ còn lại của ngươi sẽ không phải là cái tên... mà là tiếng hét.”

## 7. Ending cutscene với kết cục Hiệp sĩ Đăng bị đánh bại
Game có một `faux victory`: người chơi có thể làm cạn thanh máu của Dr.Phieu, nhưng đó không phải chiến thắng thật.

### Diễn biến kết thúc
1. Dr.Phieu gục xuống, pháo đài im lặng trong khoảnh khắc ngắn.
2. Hắn đứng dậy hoặc lên tiếng từ lõi pháo đài, xác nhận Đăng chỉ là nguyên liệu cuối cùng.
3. Đăng nhận ra mình không hề kết thúc được cơn ác mộng, mà chỉ mở cửa cho nó hoàn thiện.
4. Lâu đài nuốt chửng Đăng, kéo máu và thân xác anh vào trong tường đá sống.
5. Màn cuối xác nhận truyền thuyết về Hiệp sĩ Đăng chỉ còn là tiếng kêu vang trong các bức tường.

### Ending dialogue đã viết vào game
- `Dr.Phieu`: “Tuyệt diệu. Máu của một hiệp sĩ còn tỉnh táo... chính là nguyên liệu ta thiếu để hoàn tất bộ não của pháo đài.”
- `Đăng`: “Vậy ra ta không giết được cơn ác mộng này... ta chỉ mở cửa cho nó.”
- `Dr.Phieu`: “Không. Ngươi là cánh cửa.”

## 8. Mã nguồn / cấu trúc code để game có thể chạy được
### Tích hợp hiện tại
- Route public: `frontend/src/routes/AppRoutes.tsx`
  - Path: `/games/hiep-si-dang-phao-dai-mau`
- Page chứa game: `frontend/src/pages/BloodFortressPage.tsx`
- Canvas component: `frontend/src/features/bloodFortress/BloodFortressCanvas.tsx`

### Core gameplay
- `frontend/src/features/bloodFortress/game/BloodFortressEngine.ts`
  - Game loop, state machine, scene transition, checkpoint, fake victory, ending
- `frontend/src/features/bloodFortress/game/render.ts`
  - Vẽ background, player, trap, coin, boss, UI, dialogue, pause, game over
- `frontend/src/features/bloodFortress/game/player.ts`
  - Movement, jump, double jump, dash, attack, hurt / respawn
- `frontend/src/features/bloodFortress/game/traps.ts`
  - Trap logic
- `frontend/src/features/bloodFortress/game/coins.ts`
  - Coin collection và particle
- `frontend/src/features/bloodFortress/game/boss.ts`
  - AI, pattern boss, phase change, contact damage
- `frontend/src/features/bloodFortress/game/content.ts`
  - Intro dialogue, lore của Dư, boss dialogue, ending cutscene
- `frontend/src/features/bloodFortress/game/levelData.ts`
  - Platform, trap, checkpoint, coin, decoration, spawn point
- `frontend/src/features/bloodFortress/game/audio.ts`
  - Ambient audio và SFX procedural bằng Web Audio

### Tại sao phù hợp để tích hợp vào web đang làm
- Không cần engine ngoài như Phaser hay Unity WebGL.
- Chạy trực tiếp trong React + canvas nên bundle gọn hơn.
- Có thể tái sử dụng thành:
  - route riêng
  - section nhúng trong page
  - modal / event page
  - landing page nội bộ
- Gameplay core đã tách khỏi page UI, nên việc re-skin hoặc embed tiếp theo sẽ dễ hơn.
