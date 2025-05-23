import { CheckCircle, XCircle } from "lucide-react";

interface FeedbackMessageProps {
  isCorrect: boolean;
  explanation: string;
}

export default function FeedbackMessage({ isCorrect, explanation }: FeedbackMessageProps) {
  if (isCorrect) {
    return (
      <div className="bg-success-light border-l-4 border-success p-4 rounded-md mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-success">Correct!</p>
            <p className="mt-2 text-sm text-neutral-700">{explanation}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-error-light border-l-4 border-error p-4 rounded-md mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircle className="h-5 w-5 text-error" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-error">Incorrect</p>
          <p className="mt-2 text-sm text-neutral-700">{explanation}</p>
        </div>
      </div>
    </div>
  );
}
