import { CheckCircle, XCircle } from "lucide-react";

interface FeedbackMessageProps {
  isCorrect: boolean;
  explanation: string;
}

export default function FeedbackMessage({ isCorrect, explanation }: FeedbackMessageProps) {
  if (isCorrect) {
    return (
      <div className="bg-success-light border-l-4 !border-[#2e8b57] p-4 rounded-md mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 !text-[#1f5f43]" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium !text-[#1f5f43]">Correct!</p>
            <p className="mt-2 text-sm !text-[#1f5f43]">{explanation}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-error-light border-l-4 !border-[#b22222] p-4 rounded-md mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircle className="h-5 w-5 !text-[#b22222]" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium !text-[#b22222]">Incorrect</p>
          <p className="mt-2 text-sm !text-[#b22222]">{explanation}</p>
        </div>
      </div>
    </div>
  );
}
