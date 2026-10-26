import React, { useEffect, useState } from 'react';
import { announcementApi } from '../../api/announcement.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Announcement } from '../../types/announcement';
import { Bell, Plus, Trash2, Calendar } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const AnnouncementsPage: React.FC = () => {
  const { role } = useAuth();
  const { success, error: toastError } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'NORMAL' as const,
    targetAudience: 'ALL' as const,
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await announcementApi.getAnnouncements();
      setAnnouncements(res.data);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await announcementApi.createAnnouncement(formData);
      success('Announcement published!');
      setIsModalOpen(false);
      setFormData({ title: '', message: '', priority: 'NORMAL', targetAudience: 'ALL' });
      fetchAnnouncements();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to publish.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await announcementApi.deleteAnnouncement(id);
      success('Announcement removed.');
      fetchAnnouncements();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Delete failed.');
    }
  };

  const canManage = role === 'ADMIN' || role === 'HR';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Company Announcements</h2>
          <p className="text-xs text-slate-500 mt-0.5">Stay updated with organization news, policy changes, and events</p>
        </div>

        {canManage && (
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsModalOpen(true)}>
            New Announcement
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title="No announcements published"
          description="Company announcements and official updates will appear here."
          actionLabel={canManage ? 'New Announcement' : undefined}
          onAction={canManage ? () => setIsModalOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <Card key={item._id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{item.title}</span>
                    <Badge variant={item.priority === 'HIGH' ? 'rejected' : 'neutral'} size="sm">
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mt-2">{item.message}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span>Audience: {item.targetAudience}</span>
                  </div>
                </div>

                {canManage && (
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Announcement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publish Announcement"
        description="Broadcast a message to company employees"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Title"
            required
            placeholder="e.g. Eid Holiday Schedule"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'NORMAL', label: 'Normal' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            />
            <Select
              label="Audience"
              options={[
                { value: 'ALL', label: 'All Employees' },
                { value: 'MANAGEMENT', label: 'Management' },
              ]}
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Message Content</label>
            <textarea
              className="w-full h-28 p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
              required
              placeholder="Write the full announcement text..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Publish Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
