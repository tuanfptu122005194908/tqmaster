import React from 'react';

/** Nhận diện TQMaster: nón tốt nghiệp + đường nét công nghệ, rõ ở mọi kích thước. */
export const Logo: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className, alt = 'TQMaster', ...props }) => (
  <img
    src="/tqmaster-logo.svg"
    className={className}
    alt={alt}
    decoding="async"
    {...props}
  />
);

export default Logo;
