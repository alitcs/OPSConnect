import type { CSSProperties } from 'react';
import type { SurfacedProject } from '../types';
import MiniProfileCard from './MiniProfileCard';
import Icon from './Icon';

// Slugify a status/priority into a stable CSS token (e.g. "In Progress" -> "in-progress").
const token = (s: string) => s.toLowerCase().replace(/\s+/g, '-');

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  });
}

// A project/ticket surfaced inline in chat. Reads like a compact card from a ticketing tool:
// status + priority at a glance, a timeline, the skills the work calls for, and the internal
// people whose skills map to those needs — closing the loop from "what" to "who".
export default function ProjectCard({
  surfaced,
  style,
}: {
  surfaced: SurfacedProject;
  style?: CSSProperties;
}) {
  const { project, suggestedPeople, coveredSkills, gapSkills } = surfaced;
  const covered = new Set(coveredSkills.map((s) => s.toLowerCase()));

  return (
    <div className="project-card" style={style}>
      <div className="project-card__head">
        <span className="project-card__source">
          <Icon name="ticket" size={12} />
          {project.source}
        </span>
        <span className="project-card__id">{project.id}</span>
        <span className="project-card__type">
          <Icon name="layers" size={11} />
          {project.type}
        </span>
      </div>

      <div className="project-card__title">{project.title}</div>

      <div className="project-card__pills">
        <span className={`project-pill project-pill--status is-${token(project.status)}`}>
          {project.status}
        </span>
        <span className={`project-pill project-pill--priority is-${token(project.priority)}`}>
          <Icon name="flag" size={11} />
          {project.priority}
        </span>
        <span className="project-card__team">
          {project.team} · {project.ministry}
        </span>
      </div>

      <p className="project-card__summary">{project.summary}</p>

      <div className="project-card__progress">
        <div className="project-card__progress-head">
          <span>{project.progress}% complete</span>
          <span className="project-card__due">
            <Icon name="calendar" size={12} />
            Due {fmtDate(project.dueDate)}
          </span>
        </div>
        <div className="project-card__bar" role="progressbar" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="project-card__timeline">
        {project.milestones.map((m) => (
          <div
            key={m.label}
            className={`project-milestone ${m.done ? 'is-done' : ''}`}
          >
            <span className="project-milestone__dot" aria-hidden="true">
              {m.done ? <Icon name="check" size={10} strokeWidth={3} /> : <Icon name="clock" size={11} />}
            </span>
            <span className="project-milestone__label">{m.label}</span>
            <span className="project-milestone__date">{fmtDate(m.date)}</span>
          </div>
        ))}
      </div>

      <div className="project-card__section-label">Skills this work needs</div>
      <div className="project-card__skills">
        {project.requiredSkills.map((s) => (
          <span
            key={s}
            className={`project-skill ${covered.has(s.toLowerCase()) ? 'is-covered' : 'is-gap'}`}
          >
            {covered.has(s.toLowerCase()) && <Icon name="check" size={10} strokeWidth={3} />}
            {s}
          </span>
        ))}
      </div>

      {suggestedPeople.length > 0 && (
        <div className="project-card__people">
          <div className="project-card__section-label">
            Who could work on this
            <span className="project-card__people-count">{suggestedPeople.length}</span>
          </div>
          {suggestedPeople.map((p) => (
            <MiniProfileCard
              key={p.user.id}
              person={p.user}
              rationale={p.rationale}
              matchStrength={p.matchStrength}
            />
          ))}
        </div>
      )}

      {gapSkills.length > 0 && (
        <div className="project-card__gap">
          <Icon name="info" size={13} />
          No internal match surfaced for {gapSkills.join(', ')} — a potential staffing gap to
          flag.
        </div>
      )}
    </div>
  );
}
