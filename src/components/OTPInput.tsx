
import { useState, useRef, useEffect } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface OTPInputProps {
  digits: number;
  onComplete: (code: string) => void;
}

const OTPInput = ({ digits, onComplete }: OTPInputProps) => {
  const [value, setValue] = useState("");
  
  const handleComplete = (value: string) => {
    if (value.length === digits) {
      onComplete(value);
    }
  };
  
  return (
    <div className="flex justify-center">
      <InputOTP
        maxLength={digits}
        value={value}
        onChange={(value) => {
          setValue(value);
          if (value.length === digits) {
            handleComplete(value);
          }
        }}
        render={({ slots }) => (
          <InputOTPGroup>
            {slots.map((slot, index) => (
              <InputOTPSlot key={index} {...slot} index={index} />
            ))}
          </InputOTPGroup>
        )}
      />
    </div>
  );
};

export default OTPInput;
