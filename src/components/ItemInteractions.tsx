import React, { useState } from 'react';
import { Heart, MessageCircle, Trash2, Send } from 'lucide-react';
import { GalleryItem, Like, Comment } from '../types';

interface ItemInteractionsProps {
  item: GalleryItem;
  userName: string;
  onUpdate: (updatedItem: GalleryItem) => void;
  variant: 'feed' | 'detail' | 'grid';
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

export default function ItemInteractions({ item, userName, onUpdate, variant }: ItemInteractionsProps) {
  const [showComments, setShowComments] = useState(variant !== 'grid');
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState(userName);
  const [showAllComments, setShowAllComments] = useState(false);

  const likes: Like[] = item.likes || [];
  const comments: Comment[] = item.comments || [];
  const todayLikes = likes.filter(l => l.userName === userName && isToday(l.createdAt));
  const hasLikedToday = todayLikes.length > 0;

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated: GalleryItem = hasLikedToday
      ? { ...item, likes: likes.filter(l => !(l.userName === userName && isToday(l.createdAt))) }
      : {
          ...item,
          likes: [
            ...likes,
            { id: Date.now().toString(), userName, createdAt: new Date().toISOString() },
          ],
        };
    onUpdate(updated);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const author = commentAuthor.trim() || userName;
    if (!commentText.trim()) return;
    const updated: GalleryItem = {
      ...item,
      comments: [
        ...comments,
        {
          id: Date.now().toString(),
          userName: author,
          content: commentText.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    };
    onUpdate(updated);
    setCommentText('');
    setShowComments(true);
  };

  const handleDeleteComment = (commentId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated: GalleryItem = {
      ...item,
      comments: comments.filter(c => c.id !== commentId),
    };
    onUpdate(updated);
  };

  const containerClass = variant === 'feed' ? 'px-14 pb-3' : variant === 'grid' ? 'px-4 pb-2 mt-3' : '';

  return (
    <div className={containerClass} onClick={e => e.stopPropagation()}>
      {/* Like & Comment count row */}
      <div className={`flex items-center gap-4 ${variant === 'grid' ? 'text-xs justify-end' : 'text-sm'}`}>
        <button
          onClick={handleToggleLike}
          className={`flex items-center gap-1.5 transition-colors ${
            hasLikedToday
              ? 'text-rose-500'
              : 'text-stone-400 hover:text-rose-500'
          }`}
        >
          <Heart size={variant === 'grid' ? 14 : 16} className={hasLikedToday ? 'fill-rose-500' : ''} />
          {likes.length > 0 && <span>{likes.length}</span>}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
          className={`flex items-center gap-1.5 text-stone-400 hover:text-indigo-500 transition-colors ${
            showComments ? 'text-indigo-500' : ''
          }`}
        >
          <MessageCircle size={variant === 'grid' ? 14 : 16} />
          {comments.length > 0 && <span>{comments.length}</span>}
        </button>
      </div>

      {/* Expanded comments section (feed/grid toggled, detail always shown) */}
      {showComments && (
        <div className="mt-3 space-y-3">
          {/* Comment input */}
          <form onSubmit={handleAddComment} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={commentAuthor}
                onChange={e => setCommentAuthor(e.target.value)}
                placeholder="评论人"
                className="w-20 px-2 py-1.5 text-xs border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shrink-0"
                onClick={e => e.stopPropagation()}
              />
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="写下评论..."
                className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                onClick={e => e.stopPropagation()}
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                onClick={e => e.stopPropagation()}
              >
                <Send size={16} />
              </button>
            </div>
          </form>

          {/* Comment list */}
          {comments.length > 0 && (() => {
            const reversed = [...comments].reverse();
            const shouldFold = variant === 'feed' && comments.length > 10;
            const visible = (shouldFold && !showAllComments) ? reversed.slice(0, 5) : reversed;
            return (
            <div className="space-y-2">
              {visible.map(c => (
                <div key={c.id} className="bg-stone-50 rounded-lg p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">
                      <span className="font-medium text-stone-700">{c.userName}</span>
                      <span className="text-stone-400 ml-2">{formatDateTime(c.createdAt)}</span>
                    </span>
                    <button
                      onClick={handleDeleteComment(c.id)}
                      className="p-0.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p className="text-sm text-stone-600 mt-1 whitespace-pre-wrap break-words">{c.content}</p>
                </div>
              ))}
              {shouldFold && !showAllComments && (
                <button onClick={(e) => { e.stopPropagation(); setShowAllComments(true); }}
                  className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">
                  展示全部评论 ({comments.length}条)
                </button>
              )}
            </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
