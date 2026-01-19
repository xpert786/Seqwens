import React from 'react';

const SlideSwitch = ({ value, onChange, disabled = false, id }) => {
    const isChecked = value === true || value === 'yes';

    const handleToggle = () => {
        if (disabled) return;
        // Return 'yes'/'no' if input was string, otherwise boolean
        const newValue = (value === 'yes' || value === 'no')
            ? (isChecked ? 'no' : 'yes')
            : !isChecked;
        onChange(newValue);
    };

    return (
        <div className="flex items-center gap-3 mt-2">
            <span
                className={`text-sm font-medium transition-colors font-[BasisGrotesquePro] cursor-pointer ${!isChecked ? 'text-[#3B4A66] font-bold' : 'text-gray-400'}`}
                onClick={() => !isChecked && handleToggle()}
            >
                No
            </span>

            <button
                type="button"
                role="switch"
                aria-checked={isChecked}
                id={id}
                disabled={disabled}
                onClick={handleToggle}
                className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#F56D2D] focus:ring-offset-2
          ${isChecked ? 'bg-[#F56D2D]' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
                style={{ borderRadius: "9999px" }}
            >
                <span
                    aria-hidden="true"
                    className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${isChecked ? 'translate-x-5' : 'translate-x-0'}
          `}
                />
            </button>

            <span
                className={`text-sm font-medium transition-colors font-[BasisGrotesquePro] cursor-pointer ${isChecked ? 'text-[#3B4A66] font-bold' : 'text-gray-400'}`}
                onClick={() => !isChecked && handleToggle()}
            >
                Yes
            </span>
        </div>
    );
};

export default SlideSwitch;
