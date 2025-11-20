'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ManageUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users', { params: { role: filter } });
      setUsers(data.users);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Users</h1>
      <div className="card">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input mb-4">
          <option value="">All Users</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
        </select>
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
                <td className="p-2">
                  <button
                    onClick={() => deleteUser(user._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
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
