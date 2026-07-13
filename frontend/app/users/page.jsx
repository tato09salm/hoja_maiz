'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import api from '@/utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Edit, 
  Trash2, 
  Plus, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Shield
} from 'lucide-react';
import { useState } from 'react';

export default function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    is_active: true,
    password: '',
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit.id);
    setEditFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      is_active: userToEdit.is_active,
      password: '',
    });
  };

  const handleSaveEdit = () => {
    const dataToSend = { ...editFormData };
    if (!dataToSend.password) {
      delete dataToSend.password;
    }
    updateUserMutation.mutate({ id: editingUser, data: dataToSend });
  };

  const handleDelete = (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  if (!user?.is_admin) {
    return (
      <ProtectedLayout>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Shield size={64} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Acceso Denegado</h2>
            <p className="text-gray-500 mt-2">No tienes permisos para acceder a esta sección</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-2">Administra los usuarios del sistema</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Estado</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Rol</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((dbUser) => (
                    <tr key={dbUser.id} className="border-b border-gray-100 hover:bg-gray-50">
                      {editingUser === dbUser.id ? (
                        <>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editFormData.name}
                              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="email"
                              value={editFormData.email}
                              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={editFormData.is_active}
                              onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === 'true' })}
                              className="px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              <option value="true">Activo</option>
                              <option value="false">Inactivo</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              dbUser.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {dbUser.is_admin ? 'Administrador' : 'Usuario'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={handleSaveEdit}
                                disabled={updateUserMutation.isPending}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                              >
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-700 font-semibold">{dbUser.name[0]}</span>
                              </div>
                              <span className="font-medium text-gray-800">{dbUser.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{dbUser.email}</td>
                          <td className="py-3 px-4">
                            <span className={`flex items-center gap-1 ${dbUser.is_active ? 'text-green-600' : 'text-red-600'}`}>
                              {dbUser.is_active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                              {dbUser.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              dbUser.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {dbUser.is_admin ? 'Administrador' : 'Usuario'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(dbUser)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </button>
                              {dbUser.id !== user.id && (
                                <button
                                  onClick={() => handleDelete(dbUser.id)}
                                  disabled={deleteUserMutation.isPending}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Eliminar"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}