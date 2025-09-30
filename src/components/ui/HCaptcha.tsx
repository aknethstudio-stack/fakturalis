'use client';

import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useRef, forwardRef, useImperativeHandle } from 'react';

interface HCaptchaComponentProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export interface HCaptchaRef {
  resetCaptcha: () => void;
  executeCaptcha: () => void;
}

const HCaptchaComponent = forwardRef<HCaptchaRef, HCaptchaComponentProps>(({ onVerify, onError, onExpire }, ref) => {
  const hcaptchaRef = useRef<HCaptcha>(null);
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  useImperativeHandle(ref, () => ({
    resetCaptcha: () => {
      hcaptchaRef.current?.resetCaptcha();
    },
    executeCaptcha: () => {
      hcaptchaRef.current?.execute();
    },
  }));

  if (!siteKey) {
    console.warn('hCaptcha site key not found in environment variables');
    return null;
  }

  return (
    <div className='flex justify-center'>
      <HCaptcha
        ref={hcaptchaRef}
        sitekey={siteKey}
        onVerify={onVerify}
        onError={onError || (() => {})}
        onExpire={onExpire || (() => {})}
        theme='light'
        size='normal'
      />
    </div>
  );
});

HCaptchaComponent.displayName = 'HCaptchaComponent';

export default HCaptchaComponent;
