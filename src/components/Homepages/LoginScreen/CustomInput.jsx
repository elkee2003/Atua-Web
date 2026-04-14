import { Controller } from "react-hook-form";
import { useState } from "react";

const CustomInput = ({
  control,
  name,
  rules = {},
  label,
  placeholder,
  isPassword,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="ci-field">
      {label && <label className="ci-label">{label}</label>}

      <Controller
        control={control}
        name={name}
        defaultValue=""
        rules={rules}
        render={({ field, fieldState: { error } }) => (
          <>
            <div className={`ci-box ${error ? "ci-box-error" : ""}`}>
              <input
                {...field}
                type={isPassword && !visible ? "password" : "text"}
                placeholder={placeholder}
                className="ci-input"
              />

              {isPassword && (
                <button
                  type="button"
                  className="ci-toggle"
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? "🙈" : "👁"}
                </button>
              )}
            </div>

            {error && <p className="ci-error">{error.message}</p>}
          </>
        )}
      />
    </div>
  );
};

export default CustomInput;