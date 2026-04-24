import { motion, useAnimationControls } from 'framer-motion';
import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type TermsLanguage = 'vi' | 'en';

interface RegisterTermsModalProps {
  onClose: () => void;
}

interface TermsClauseText {
  title: string;
  content: string;
}

interface TermsClause {
  id: number;
  vi: TermsClauseText;
  en: TermsClauseText;
}

const TERMS_CLAUSES: TermsClause[] = [
  {
    id: 1,
    vi: {
      title: 'Phạm vi áp dụng',
      content:
        'Khi tạo tài khoản và sử dụng nền tảng, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ điều khoản này cùng các chính sách liên quan.',
    },
    en: {
      title: 'Scope of application',
      content:
        'By creating an account and using this platform, you confirm that you have read, understood, and agreed to comply with these terms and related policies.',
    },
  },
  {
    id: 2,
    vi: {
      title: 'Điều kiện đăng ký tài khoản',
      content:
        'Bạn cam kết cung cấp thông tin chính xác, đầy đủ và cập nhật. Một cá nhân chỉ nên sử dụng một tài khoản chính và không được giả mạo danh tính.',
    },
    en: {
      title: 'Account registration requirements',
      content:
        'You must provide accurate, complete, and up to date information. A person should maintain one primary account and must not impersonate others.',
    },
  },
  {
    id: 3,
    vi: {
      title: 'Bảo mật thông tin đăng nhập',
      content:
        'Bạn chịu trách nhiệm bảo vệ mật khẩu, mã OTP và các phiên đăng nhập. Mọi hoạt động phát sinh từ tài khoản của bạn được xem là do bạn thực hiện.',
    },
    en: {
      title: 'Login credential security',
      content:
        'You are responsible for protecting your password, OTP codes, and active sessions. Activities performed under your account are treated as your actions.',
    },
  },
  {
    id: 4,
    vi: {
      title: 'Nội dung do người dùng đăng tải',
      content:
        'Bạn giữ quyền sở hữu nội dung do mình tạo, nhưng cấp cho nền tảng quyền hiển thị, lưu trữ và xử lý nội dung đó để vận hành dịch vụ.',
    },
    en: {
      title: 'User generated content',
      content:
        'You retain ownership of content you create, but you grant the platform permission to display, store, and process that content for service operation.',
    },
  },
  {
    id: 5,
    vi: {
      title: 'Hành vi bị nghiêm cấm',
      content:
        'Không đăng tải nội dung vi phạm pháp luật, kích động thù hằn, lừa đảo, phát tán mã độc, thu thập trái phép dữ liệu hoặc can thiệp trái phép hệ thống.',
    },
    en: {
      title: 'Prohibited conduct',
      content:
        'You must not post illegal content, incite hatred, commit fraud, distribute malware, collect data unlawfully, or attempt unauthorized system interference.',
    },
  },
  {
    id: 6,
    vi: {
      title: 'Quyền của nền tảng',
      content:
        'Nền tảng có quyền cảnh báo, giới hạn chức năng, tạm khóa hoặc chấm dứt tài khoản nếu phát hiện dấu hiệu vi phạm điều khoản hoặc rủi ro bảo mật.',
    },
    en: {
      title: 'Platform rights',
      content:
        'The platform may issue warnings, limit features, suspend, or terminate an account when terms violations or security risks are detected.',
    },
  },
  {
    id: 7,
    vi: {
      title: 'Quyền riêng tư và dữ liệu',
      content:
        'Dữ liệu cá nhân được xử lý theo chính sách quyền riêng tư. Bạn đồng ý cho phép hệ thống lưu trữ dữ liệu cần thiết để xác thực, bảo mật và cải thiện dịch vụ.',
    },
    en: {
      title: 'Privacy and data handling',
      content:
        'Personal data is handled under the privacy policy. You agree that necessary data may be stored for authentication, security, and service improvement.',
    },
  },
  {
    id: 8,
    vi: {
      title: 'Dịch vụ trả phí (nếu có)',
      content:
        'Một số tính năng có thể yêu cầu thanh toán. Mức phí, chu kỳ gia hạn và điều kiện hoàn tiền sẽ được thông báo rõ tại thời điểm phát sinh giao dịch.',
    },
    en: {
      title: 'Paid services if applicable',
      content:
        'Some features may require payment. Fees, renewal cycles, and refund conditions will be clearly displayed at the time of transaction.',
    },
  },
  {
    id: 9,
    vi: {
      title: 'Giới hạn trách nhiệm',
      content:
        'Nền tảng nỗ lực duy trì dịch vụ ổn định nhưng không cam kết hoạt động liên tục tuyệt đối. Chúng tôi không chịu trách nhiệm cho thiệt hại gián tiếp ngoài phạm vi pháp luật cho phép.',
    },
    en: {
      title: 'Limitation of liability',
      content:
        'The platform aims to provide stable service but cannot guarantee uninterrupted operation. We are not liable for indirect damages beyond limits allowed by law.',
    },
  },
  {
    id: 10,
    vi: {
      title: 'Cập nhật điều khoản',
      content:
        'Điều khoản có thể được cập nhật theo thời gian. Phiên bản mới có hiệu lực sau khi công bố, và việc bạn tiếp tục sử dụng dịch vụ được hiểu là chấp nhận cập nhật đó.',
    },
    en: {
      title: 'Terms updates',
      content:
        'These terms may be updated over time. A new version takes effect after publication, and your continued use of the service indicates acceptance.',
    },
  },
];

const TERMS_MODAL_COPY = {
  vi: {
    title: 'Điều khoản sử dụng',
    subtitle: 'Vui lòng đọc kỹ trước khi hoàn tất đăng ký.',
    languageViLabel: 'Tiếng Việt',
    languageEnLabel: 'English',
    overlayAriaLabel: 'Lớp phủ điều khoản sử dụng',
    closeButtonAriaLabel: 'Đóng điều khoản sử dụng',
    closeButtonHint: 'Đóng điều khoản sử dụng',
    scrollToBottomHint: 'Bạn cần cuộn hết nội dung xuống cuối để có thể đóng cửa sổ này.',
    readyToCloseText: 'Bạn đã cuộn đến cuối. Bây giờ bạn có thể nhấn dấu X để đóng.',
    lastUpdated: 'Ngày cập nhật: 24/04/2026',
  },
  en: {
    title: 'Terms of Use',
    subtitle: 'Please read carefully before completing registration.',
    languageViLabel: 'Vietnamese',
    languageEnLabel: 'English',
    overlayAriaLabel: 'Terms modal overlay',
    closeButtonAriaLabel: 'Close terms of use',
    closeButtonHint: 'Close terms of use',
    scrollToBottomHint: 'You must scroll to the end before closing this popup.',
    readyToCloseText: 'You reached the end. You can now press X to close.',
    lastUpdated: 'Last updated: 24/04/2026',
  },
} as const;

export const RegisterTermsModal = ({ onClose }: RegisterTermsModalProps) => {
  const [language, setLanguage] = useState<TermsLanguage>('vi');
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const shakeControls = useAnimationControls();

  const copy = TERMS_MODAL_COPY[language];
  const clauses = useMemo(
    () => TERMS_CLAUSES.map((clause) => ({ id: clause.id, ...clause[language] })),
    [language],
  );

  const evaluateScrollCompletion = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
    if (isAtBottom) {
      setHasReachedBottom(true);
    }
  }, []);

  const shakeModalOnce = useCallback(() => {
    void shakeControls.start({
      x: [0, -14, 12, -9, 7, -4, 0],
      transition: { duration: 0.35, ease: 'easeInOut' },
    });
  }, [shakeControls]);

  const handleTryClose = useCallback(() => {
    if (!hasReachedBottom) {
      shakeModalOnce();
      return;
    }

    onClose();
  }, [hasReachedBottom, onClose, shakeModalOnce]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frameId = window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) {
        return;
      }

      container.scrollTop = 0;

      if (container.scrollHeight <= container.clientHeight + 1) {
        setHasReachedBottom(true);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      handleTryClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleTryClose]);

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        onClick={handleTryClose}
        className="absolute inset-0 bg-slate-950/78 backdrop-blur-[2px]"
        aria-label={copy.overlayAriaLabel}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-terms-title"
        animate={shakeControls}
        initial={false}
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-indigo-100/20 bg-slate-950 text-slate-100 shadow-[0_36px_90px_-40px_rgba(15,23,42,0.95)]"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400" />

        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id="register-terms-title" className="text-base font-semibold sm:text-lg">
              {copy.title}
            </h2>
            <p className="mt-1 text-xs text-slate-300/80 sm:text-sm">{copy.subtitle}</p>
          </div>

          <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setLanguage('vi')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                language === 'vi'
                  ? 'bg-cyan-300/90 text-slate-900'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {copy.languageViLabel}
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                language === 'en'
                  ? 'bg-cyan-300/90 text-slate-900'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {copy.languageEnLabel}
            </button>
          </div>

          <button
            type="button"
            onClick={handleTryClose}
            aria-label={copy.closeButtonAriaLabel}
            title={hasReachedBottom ? copy.closeButtonHint : copy.scrollToBottomHint}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
              hasReachedBottom
                ? 'border-white/25 text-white hover:border-cyan-300/80 hover:text-cyan-100'
                : 'border-amber-200/30 text-amber-100/85 hover:border-amber-200/50'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={evaluateScrollCompletion}
          className="max-h-[62vh] space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
        >
          <p className="rounded-2xl border border-indigo-100/20 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100/90 sm:text-sm">
            {copy.lastUpdated}
          </p>

          {clauses.map((clause) => (
            <article key={clause.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-sm font-semibold text-cyan-100 sm:text-base">
                {clause.id}. {clause.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-200/90">{clause.content}</p>
            </article>
          ))}
        </div>

        <div
          className={`border-t px-4 py-3 text-xs sm:px-6 sm:text-sm ${
            hasReachedBottom
              ? 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100'
              : 'border-amber-300/25 bg-amber-500/10 text-amber-100'
          }`}
        >
          {hasReachedBottom ? copy.readyToCloseText : copy.scrollToBottomHint}
        </div>
      </motion.div>
    </div>
  );
};
