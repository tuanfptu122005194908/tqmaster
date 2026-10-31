import React from 'react';

/**
 * Nhận diện TQMaster: Linh vật Cóc Vàng Học Bá FPT (Mascot)
 * Đội mũ cử nhân tốt nghiệp, đeo kính tri thức công nghệ, nụ cười tự tin.
 */
export const Logo: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({
  className,
  alt = 'TQMaster Mascot',
  style,
  ...props
}) => (
  <img
    src="/tqmaster-logo.svg"
    className={className}
    alt={alt}
    decoding="async"
    style={{
      objectFit: 'contain',
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style,
    }}
    {...props}
  />
);

export default Logo;
