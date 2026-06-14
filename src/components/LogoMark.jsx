import './LogoMark.css';

const LogoMark = ({ className = '' }) => (
  <svg
    className={`logo-mark ${className}`.trim()}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    role="img"
    aria-label="Trackeando"
  >
    <circle cx="16" cy="16" r="16" fill="#061A3F" />
    <circle
      cx="16"
      cy="16"
      r="12.5"
      fill="none"
      stroke="rgba(241, 242, 241, 0.18)"
      strokeWidth="2.5"
    />
    <circle
      cx="16"
      cy="16"
      r="12.5"
      fill="none"
      stroke="#0BC0EF"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray="59 19.5"
    />
    <text
      x="16"
      y="20.5"
      textAnchor="middle"
      fontFamily="'Bebas Neue', sans-serif"
      fontSize="13"
      fill="#F1F2F1"
    >
      T
    </text>
  </svg>
);

export default LogoMark;
