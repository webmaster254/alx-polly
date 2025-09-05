"use client";

import { useState } from "react";
import { createPoll } from "@/app/lib/actions/poll-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * PollCreateForm Component
 * 
 * Interactive form component for creating new polls with dynamic option management.
 * 
 * Features:
 * - Dynamic option management (add/remove options with minimum of 2)
 * - Real-time client-side validation and UI feedback
 * - Form submission using Next.js Server Actions
 * - Error handling and success state management
 * - Automatic redirect to polls page after successful creation
 * 
 * State management:
 * - `options`: Array of option strings, initialized with 2 empty options
 * - `error`: Error message from server validation or submission
 * - `success`: Success state for user feedback and redirect trigger
 * 
 * Security considerations:
 * - Client-side validation is supplemented by server-side validation
 * - Uses Server Actions for secure form submission
 * - Error messages are sanitized by the server action
 */
export default function PollCreateForm() {
  // Initialize with minimum required options (2)
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Updates a specific option's value in the options array
   * @param idx - Index of the option to update
   * @param value - New value for the option
   */
  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
  };

  /**
   * Adds a new empty option to the options array
   * Maximum options are limited by server-side validation
   */
  const addOption = () => setOptions((opts) => [...opts, ""]);
  
  /**
   * Removes an option from the options array
   * Prevents removal if only 2 options remain (minimum requirement)
   * @param idx - Index of the option to remove
   */
  const removeOption = (idx: number) => {
    if (options.length > 2) {
      setOptions((opts) => opts.filter((_, i) => i !== idx));
    }
  };

  return (
    <form
      action={async (formData) => {
        // Reset UI state before submission
        setError(null);
        setSuccess(false);
        
        // Submit form data to server action
        const res = await createPoll(formData);
        if (res?.error) {
          setError(res.error);
        } else {
          setSuccess(true);
          // Auto-redirect after showing success message
          setTimeout(() => {
            window.location.href = "/polls";
          }, 1200);
        }
      }}
      className="space-y-6 max-w-md mx-auto"
    >
      {/* Poll Question Input */}
      <div>
        <Label htmlFor="question">Poll Question</Label>
        <Input name="question" id="question" required />
      </div>
      
      {/* Dynamic Options Section */}
      <div>
        <Label>Options</Label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            {/* Option input with controlled value */}
            <Input
              name="options"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              required
            />
            {/* Remove button (hidden for first 2 options) */}
            {options.length > 2 && (
              <Button type="button" variant="destructive" onClick={() => removeOption(idx)}>
                Remove
              </Button>
            )}
          </div>
        ))}
        {/* Add new option button */}
        <Button type="button" onClick={addOption} variant="secondary">
          Add Option
        </Button>
      </div>
      
      {/* Error and Success Messages */}
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">Poll created! Redirecting...</div>}
      
      {/* Submit Button */}
      <Button type="submit">Create Poll</Button>
    </form>
  );
} 