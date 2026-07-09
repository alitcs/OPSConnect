import { useRef, useState } from 'react';
import Icon from './Icon';

export default function ChatInput({
  onSend,
  disabled,
  placeholder = 'Ask Copilot to find people, teams, or skills…',
  ariaLabel = 'Ask Copilot about people, teams, or skills',
  hint = 'Enter to send · Shift+Enter for new line',
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  hint?: string;
}) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div className="chat__input">
      <div className="chat__input-inner">
        <textarea
          ref={textareaRef}
          rows={1}
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value);
            autoGrow(e.target);
          }}
          onKeyDown={onKeyDown}
        />
        <button
          className="chat__send"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send"
        >
          <Icon name="send" size={18} />
        </button>
      </div>
      <p className="chat__input-hint">
        {hint}
      </p>
    </div>
  );
}
