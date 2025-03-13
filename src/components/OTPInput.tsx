
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface OTPInputProps {
  digits: number;
  onComplete: (code: string) => void;
}

const OTPInput = ({ digits, onComplete }: OTPInputProps) => {
  return (
    <div className="flex justify-center">
      <InputOTP
        maxLength={digits}
        onChange={(value) => {
          if (value.length === digits) {
            onComplete(value);
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
