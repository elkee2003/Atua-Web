const CustomButton = ({
  text,
  onClick,
  loading,
  type = "button",
  variant = "primary",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`cb-btn cb-${variant} ${loading ? "cb-loading" : ""}`}
    >
      {loading ? "Please wait..." : text}
    </button>
  );
};

export default CustomButton;