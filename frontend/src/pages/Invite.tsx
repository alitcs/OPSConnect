import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { InviteRecord } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InvitePage() {
  const { currentUser } = useAuth();
  const { notify } = useToast();
  const [emailInput, setEmailInput] = useState('');
  const [note, setNote] = useState('');
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  const inviteLink = `${window.location.origin}/?invite=OPS-${currentUser?.id ?? 1}`;
  const invitationMessage = `Hi! I've been using ConnectOPS to meet colleagues across the Ontario Public Service. Join me and let's connect: ${inviteLink}`;

  useEffect(() => {
    api.listInvites()
      .then(setInvites)
      .catch(() => notify('Could not load your invite history.', 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(successMessage, 'success');
    } catch {
      notify('Clipboard access was blocked by your browser.', 'error');
    }
  };

  const sendInvites = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;

    const emails = [...new Set(emailInput.split(/[;,\n]+/).map((email) => email.trim()).filter(Boolean))];
    if (!emails.length) {
      setFormError('Add at least one email address to continue.');
      return;
    }
    if (emails.some((email) => !EMAIL_RE.test(email))) {
      setFormError('Check the email addresses. Separate multiple addresses with a comma or new line.');
      return;
    }
    if (emails.length > 20) {
      setFormError('You can invite up to 20 people at a time.');
      return;
    }

    setFormError('');
    setSending(true);
    try {
      const created = await api.sendInvites(emails, note.trim());
      setInvites((existing) => [...created, ...existing]);
      setEmailInput('');
      setNote('');
      notify(`${created.length} demo invite${created.length === 1 ? '' : 's'} prepared. No email was sent.`, 'success');
    } catch {
      notify('Could not prepare those invites. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page invite-page">
      <div className="invite-page__inner">
        <header className="invite-header">
          <div>
            <span className="invite-eyebrow">GROW YOUR CIRCLE</span>
            <h1 className="page__title">Bring your people</h1>
            <p className="page__subtitle">
              Invite an OPS colleague to find their people, share what they know, and feel at home here.
            </p>
          </div>
          <span className="invite-demo-tag"><span /> Demo mode</span>
        </header>

        <section className="invite-hero" aria-label="Invite colleagues to ConnectOPS">
          <div className="invite-hero__copy">
            <span className="invite-hero__kicker">Good work travels through people</span>
            <h2>A familiar face makes a big place feel smaller.</h2>
            <p>Start with one colleague you would be glad to run into in the hallway.</p>
          </div>
          <div className="invite-hero__people" aria-hidden="true">
            <span className="invite-person invite-person--one">{currentUser?.name?.charAt(0) ?? 'Y'}</span>
            <span className="invite-person invite-person--two">?</span>
            <span className="invite-person invite-person--three"><Icon name="plus" size={18} /></span>
            <span className="invite-hero__orbit invite-hero__orbit--one" />
            <span className="invite-hero__orbit invite-hero__orbit--two" />
          </div>
        </section>

        <div className="invite-columns">
          <section className="invite-panel" aria-labelledby="invite-form-title">
            <div className="invite-panel__heading">
              <span className="invite-panel__number">01</span>
              <div>
                <h2 id="invite-form-title">Invite by email</h2>
                <p>For colleagues who would enjoy being part of the conversation.</p>
              </div>
            </div>

            <form className="invite-form" onSubmit={sendInvites} noValidate>
              <label htmlFor="invite-emails">Work email address</label>
              <textarea
                id="invite-emails"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                placeholder="name@ontario.ca"
                rows={3}
                aria-describedby={formError ? 'invite-error' : 'invite-email-hint'}
                aria-invalid={!!formError}
              />
              <span className="invite-form__hint" id="invite-email-hint">Add up to 20 addresses, separated by commas or new lines.</span>

              <label htmlFor="invite-note">Add a personal note <span>(optional)</span></label>
              <textarea
                id="invite-note"
                className="invite-form__note"
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 240))}
                placeholder="What made you think of them?"
                rows={2}
              />
              <div className="invite-form__bottom">
                <span className="invite-form__hint">{note.length}/240</span>
                <button className="btn btn--primary" type="submit" disabled={sending}>
                  <Icon name="send" size={15} />
                  {sending ? 'Preparing…' : 'Prepare invite'}
                </button>
              </div>
              {formError && <p className="invite-form__error" id="invite-error" role="alert">{formError}</p>}
              <p className="invite-form__disclaimer">
                <Icon name="info" size={14} /> Demo only. This will not send email or contact anyone.
              </p>
            </form>
          </section>

          <section className="invite-panel invite-link-panel" aria-labelledby="invite-link-title">
            <div className="invite-panel__heading">
              <span className="invite-panel__number">02</span>
              <div>
                <h2 id="invite-link-title">Share a note</h2>
                <p>Copy a ready-to-send message for Teams, chat, or wherever you talk.</p>
              </div>
            </div>
            <div className="invite-message">
              <p>{invitationMessage}</p>
            </div>
            <button
              type="button"
              className="btn invite-copy-btn"
              onClick={() => copyText(invitationMessage, 'Invite message copied.')}
            >
              <Icon name="copy" size={15} /> Copy invite message
            </button>
            <div className="invite-link-row">
              <div>
                <span className="invite-link-row__label">Personal invite link</span>
                <code>{inviteLink}</code>
              </div>
              <button
                type="button"
                className="icon-btn"
                title="Copy demo invite link"
                aria-label="Copy demo invite link"
                onClick={() => copyText(inviteLink, 'Demo invite link copied.')}
              >
                <Icon name="copy" size={16} />
              </button>
            </div>
            <p className="invite-link-panel__footnote">Demo link only. Sign-up and link redemption are not connected yet.</p>
          </section>
        </div>

        <section className="invite-history" aria-labelledby="invite-history-title">
          <div className="invite-history__header">
            <div>
              <span className="invite-eyebrow">YOUR OUTREACH</span>
              <h2 id="invite-history-title">Invite history</h2>
            </div>
            <span className="invite-history__count">{invites.length} {invites.length === 1 ? 'invite' : 'invites'}</span>
          </div>
          {loading ? (
            <p className="invite-history__empty">Loading invite history…</p>
          ) : invites.length ? (
            <ul className="invite-list">
              {invites.map((invite) => (
                <li className="invite-list__item" key={invite.id}>
                  <span className="invite-list__icon"><Icon name="mail" size={16} /></span>
                  <span className="invite-list__email">{invite.email}</span>
                  <span className="invite-list__status"><span /> Demo prepared</span>
                  <time dateTime={invite.createdAt}>{new Date(invite.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="invite-history__empty">Your prepared invites will appear here.</p>
          )}
        </section>
      </div>
    </div>
  );
}