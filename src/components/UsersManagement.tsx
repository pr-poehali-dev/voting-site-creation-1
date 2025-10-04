import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: number;
  email: string;
  role: string;
  isOwner: boolean;
  createdAt: string;
}

interface UsersManagementProps {
  currentUserEmail: string;
}

export default function UsersManagement({ currentUserEmail }: UsersManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/cf4b14c6-467d-4cf5-a098-069320f9d42c');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const response = await fetch('https://functions.poehali.dev/cf4b14c6-467d-4cf5-a098-069320f9d42c', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole })
      });

      if (response.ok) {
        await loadUsers();
      }
    } catch (error) {
      console.error('Update role error:', error);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Shield';
      case 'moderator':
        return 'ShieldCheck';
      default:
        return 'User';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Управление пользователями</h2>
        <p className="text-muted-foreground mt-1">
          Управляйте ролями и правами доступа пользователей
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Всего пользователей</CardDescription>
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="Users" size={14} />
              <span>Зарегистрировано</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Администраторы</CardDescription>
            <CardTitle className="text-3xl">
              {users.filter(u => u.role === 'admin').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="Shield" size={14} />
              <span>С правами админа</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Модераторы</CardDescription>
            <CardTitle className="text-3xl">
              {users.filter(u => u.role === 'moderator').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="ShieldCheck" size={14} />
              <span>С правами модератора</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
          <CardDescription>Все зарегистрированные пользователи платформы</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon name={getRoleIcon(user.role)} size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{user.email}</p>
                      {user.isOwner && (
                        <Badge variant="default" className="gap-1">
                          <Icon name="Crown" size={12} />
                          Владелец
                        </Badge>
                      )}
                      {user.email === currentUserEmail && (
                        <Badge variant="outline">Вы</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Зарегистрирован: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                    <Icon name={getRoleIcon(user.role)} size={12} />
                    {user.role === 'admin' ? 'Администратор' : user.role === 'moderator' ? 'Модератор' : 'Пользователь'}
                  </Badge>

                  {!user.isOwner && (
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <Icon name="User" size={14} />
                            Пользователь
                          </div>
                        </SelectItem>
                        <SelectItem value="moderator">
                          <div className="flex items-center gap-2">
                            <Icon name="ShieldCheck" size={14} />
                            Модератор
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Icon name="Shield" size={14} />
                            Администратор
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {user.isOwner && (
                    <div className="w-[180px] text-center text-sm text-muted-foreground">
                      Роль защищена
                    </div>
                  )}
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Пока нет пользователей</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Роли и права доступа</CardTitle>
          <CardDescription>Описание ролей в системе</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="User" size={20} className="text-muted-foreground" />
                <h3 className="font-semibold">Пользователь</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Может участвовать в голосованиях и просматривать результаты
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="ShieldCheck" size={20} className="text-primary" />
                <h3 className="font-semibold">Модератор</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Может создавать голосования и управлять ими
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Shield" size={20} className="text-primary" />
                <h3 className="font-semibold">Администратор</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Полный доступ ко всем функциям платформы
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
