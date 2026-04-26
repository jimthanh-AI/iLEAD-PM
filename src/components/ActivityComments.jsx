import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import './ActivityComments.css';

const fmtDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.round((now - d) / 60000);
  if (diffMin < 1)  return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffMin < 1440) return `${Math.round(diffMin / 60)} giờ trước`;
  return d.toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
};

const initials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

// ─────────────────────────────────────────────────────────────
const ActivityComments = ({ activityId }) => {
  const author = localStorage.getItem('ilead_author_name') || 'Unknown';

  const [comments, setComments]   = useState([]);
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState(null);
  const bottomRef                 = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────
  const load = async () => {
    const { data, error: err } = await supabase
      .from('comments')
      .select('*')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true });
    if (err) setError('Chưa có bảng comments. Chạy schema_sprint4.sql trên Supabase trước.');
    else { setComments(data || []); setError(null); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [activityId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Realtime subscription ──────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`comments_${activityId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'comments',
        filter: `activity_id=eq.${activityId}`,
      }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [activityId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when new comment arrives
  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length, loading]);

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const { error: err } = await supabase.from('comments').insert({
      activity_id: activityId,
      author,
      text: text.trim(),
    });
    if (err) setError('Không thể gửi bình luận. ' + err.message);
    else setText('');
    setSubmitting(false);
  };

  // ── Delete own comment ─────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bình luận này?')) return;
    await supabase.from('comments').delete().eq('id', id);
  };

  // ── Colors per author (consistent hashing) ─────────────────
  const authorColor = (name) => {
    const palette = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#0891b2','#dc2626','#059669'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  };

  return (
    <div className="cmt-wrap glass-card">
      <div className="cmt-hdr">
        💬 Thảo luận
        <span className="cmt-count">{comments.length}</span>
      </div>

      {/* Error state */}
      {error && <div className="cmt-error">{error}</div>}

      {/* Loading */}
      {loading && !error && <div className="cmt-loading">Đang tải...</div>}

      {/* Comment list */}
      {!loading && !error && (
        <div className="cmt-list">
          {comments.length === 0 && (
            <div className="cmt-empty">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
          )}

          {comments.map(c => {
            const isMine = c.author === author;
            const color  = authorColor(c.author || '');
            return (
              <div key={c.id} className={`cmt-item${isMine ? ' cmt-mine' : ''}`}>
                <div className="cmt-avatar" style={{ background: color }}>
                  {initials(c.author)}
                </div>
                <div className="cmt-body">
                  <div className="cmt-meta">
                    <span className="cmt-author" style={{ color }}>{c.author}</span>
                    <span className="cmt-time">{fmtDateTime(c.created_at)}</span>
                    {isMine && (
                      <button className="cmt-del-btn" onClick={() => handleDelete(c.id)} title="Xóa">✕</button>
                    )}
                  </div>
                  <div className="cmt-text">{c.text}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input form */}
      {!error && (
        <form className="cmt-form" onSubmit={handleSubmit}>
          <div className="cmt-avatar cmt-self-avatar" style={{ background: authorColor(author) }}>
            {initials(author)}
          </div>
          <textarea
            className="cmt-input"
            placeholder="Viết bình luận... (Enter gửi, Shift+Enter xuống dòng)"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
            }}
            rows={2}
          />
          <button
            type="submit"
            className="cmt-submit-btn"
            disabled={!text.trim() || submitting}
          >
            {submitting ? '⏳' : '↑'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ActivityComments;
