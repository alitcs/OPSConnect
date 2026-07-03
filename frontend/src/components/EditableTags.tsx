import { useState } from 'react';
import Icon from './Icon';

// A small inline tag editor: shows existing tags with remove buttons and an input to add
// new ones. Used for the Tier B fields (skills, interests, etc.).
export default function EditableTags({
  values,
  placeholder,
  onChange,
}: {
  values: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    if (!value || values.includes(value)) {
      setDraft('');
      return;
    }
    onChange([...values, value]);
    setDraft('');
  };

  const remove = (value: string) => onChange(values.filter((v) => v !== value));

  return (
    <div className="editable-tags">
      {values.map((v) => (
        <span key={v} className="tag">
          {v}
          <button className="tag__remove" onClick={() => remove(v)} aria-label={`Remove ${v}`}>
            <Icon name="x" size={11} strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <input
        className="tag-input"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
      />
    </div>
  );
}
