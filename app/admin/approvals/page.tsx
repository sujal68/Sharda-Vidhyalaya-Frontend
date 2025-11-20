'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Approvals() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const { data } = await api.get('/admin/pending-approvals');
      setUsers(data.users);
    } catch (error) {
      toast.error('Failed to fetch pending approvals');
    }
  };

  const handleApproval = async (userId: string, approved: boolean) => {
    try {
      await api.post(`/admin/approve/${userId}`, { approved });
      toast.success(approved ? 'User approved' : 'User rejected');
      fetchPendingUsers();
    } catch (error) {
      toast.error('Failed to process approval');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pending Approvals</h1>
      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b dark:border-gray-700">
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{user.role}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => handleApproval(user._id, true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproval(user._id, false)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
