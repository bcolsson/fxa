import React from 'react';
import { ReactComponent as HeartsBroken } from './graphic_hearts_broken.svg';
import { ReactComponent as HeartsVerified } from './graphic_hearts_verified.svg';
import { ReactComponent as RecoveryCodes } from './graphic_recovery_codes.svg';
import { ReactComponent as TwoFactorAuth } from './graphic_two_factor_auth.svg';
import { ReactComponent as Mail } from './graphic_mail.svg';
import { FtlMsg } from 'fxa-react/lib/utils';

// Use this component to add your image into the collection of images exported below.
// If the component is not being reused across directories, it should remain in the directory
// where it is being used. If you are introducing an image which was previously shared and
// had localized alt-text, or a localized aria-label, please add the existing ftl id to spare
// translating it again. Don't forget to add new FTL strings into the `en.ftl` file!

interface PreparedImageBaseProps {
  className?: string;
  Image: React.ElementType;
}

interface PreparedImageAriaHiddenProps extends PreparedImageBaseProps {
  ariaHidden: true;
}

interface PreparedImageAriaVisibleProps extends PreparedImageBaseProps {
  ariaHidden?: false;
  ariaLabel: string;
  ariaLabelFtlId: string;
}

type PreparedImageProps =
  | PreparedImageAriaHiddenProps
  | PreparedImageAriaVisibleProps;

export const PreparedImage = (props: PreparedImageProps) => {
  const { className = 'w-3/5 mx-auto', ariaHidden, Image } = props;
  const showAriaLabel =
    !ariaHidden && props?.ariaLabel && props?.ariaLabelFtlId;

  return (
    <>
      {showAriaLabel ? (
        <FtlMsg id={props.ariaLabelFtlId} attrs={{ariaLabel:true}}>
          <Image role="img" aria-label={props.ariaLabel} {...{ className }} />
        </FtlMsg>
      ) : (
        <Image
          className={className}
          aria-hidden={true}
          data-testid="aria-hidden-image"
        />
      )}
    </>
  );
};

export type ImageProps = {
  className?: string;
  ariaHidden?: boolean;
};

export const HeartsBrokenImage = ({ className, ariaHidden }: ImageProps) => (
  <PreparedImage
    ariaLabel="A computer and a mobile phone an image of a broken heart on each"
    ariaLabelFtlId="hearts-broken-image-aria-label"
    Image={HeartsBroken}
    {...{ className, ariaHidden }}
  />
);

export const HeartsVerifiedImage = ({ className, ariaHidden }: ImageProps) => (
  <PreparedImage
    ariaLabel="A computer and a mobile phone and a tablet with a pulsing heart on each"
    ariaLabelFtlId="hearts-verified-image-aria-label"
    Image={HeartsVerified}
    {...{ className, ariaHidden }}
  />
);

export const RecoveryCodesImage = ({ className, ariaHidden }: ImageProps) => (
  <PreparedImage
    ariaLabel="Document that contains hidden text."
    ariaLabelFtlId="signin-recovery-code-image-description"
    Image={RecoveryCodes}
    {...{ className, ariaHidden }}
  />
);

export const TwoFactorAuthImage = ({ className, ariaHidden }: ImageProps) => (
  <PreparedImage
    ariaLabel="A device with a hidden 6-digit code."
    ariaLabelFtlId="signin-totp-code-image-label"
    Image={TwoFactorAuth}
    {...{ className, ariaHidden }}
  />
);

export const MailImage = ({ className, ariaHidden }: ImageProps) => (
  <PreparedImage
    ariaLabel="An envelope containing a link"
    ariaLabelFtlId="confirm-signup-aria-label"
    Image={Mail}
    {...{ className, ariaHidden }}
  />
);
