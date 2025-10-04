import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Poll {
  id: string;
  title: string;
  description: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  status: 'active' | 'completed';
  endDate: string;
}

interface Stats {
  totalPolls: number;
  totalVotes: number;
  totalUsers: number;
  activePolls: number;
}

interface AdminPanelProps {
  polls: Poll[];
  stats: Stats;
  onToggleStatus: (pollId: string, currentStatus: string) => void;
  onDelete: (pollId: string) => void;
  onExportToExcel: () => void;
  onNavigate: (tab: string) => void;
}

export default function AdminPanel({ 
  polls, 
  stats, 
  onToggleStatus, 
  onDelete, 
  onExportToExcel,
  onNavigate 
}: AdminPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Панель администратора</h2>
        <p className="text-muted-foreground mt-1">Управление платформой и статистика</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Всего голосований</CardDescription>
            <CardTitle className="text-3xl">{stats.totalPolls}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="TrendingUp" size={14} />
              <span>{stats.activePolls} активных</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Всего голосов</CardDescription>
            <CardTitle className="text-3xl">{stats.totalVotes}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="Users" size={14} />
              <span>От пользователей</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Активные голосования</CardDescription>
            <CardTitle className="text-3xl">{stats.activePolls}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="CheckCircle" size={14} />
              <span>Сейчас доступны</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Завершённые</CardDescription>
            <CardTitle className="text-3xl">{stats.totalPolls - stats.activePolls}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="Archive" size={14} />
              <span>В архиве</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управление голосованиями</CardTitle>
              <CardDescription>Все голосования с возможностью управления</CardDescription>
            </div>
            {polls.length > 0 && (
              <Button onClick={onExportToExcel} variant="outline" className="gap-2">
                <Icon name="Download" size={16} />
                Экспорт всех
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {polls.map(poll => (
              <div key={poll.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{poll.title}</h3>
                    <Badge variant={poll.status === 'active' ? 'default' : 'secondary'}>
                      {poll.status === 'active' ? 'Активно' : 'Завершено'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{poll.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon name="Users" size={12} />
                      {poll.totalVotes} голосов
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="ListChecks" size={12} />
                      {poll.options.length} вариантов
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Calendar" size={12} />
                      до {new Date(poll.endDate).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={poll.status === 'active' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => onToggleStatus(poll.id, poll.status)}
                  >
                    <Icon name={poll.status === 'active' ? 'Pause' : 'Play'} size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('results')}
                  >
                    <Icon name="BarChart3" size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(poll.id)}
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </div>
            ))}
            
            {polls.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Пока нет голосований</p>
                <Button className="mt-4 gap-2" onClick={() => onNavigate('home')}>
                  <Icon name="Plus" size={16} />
                  Создать первое голосование
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
          <CardDescription>Часто используемые функции</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Button variant="outline" className="justify-start h-auto py-4" onClick={() => onNavigate('home')}>
            <div className="text-left w-full">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Plus" size={16} />
                <span className="font-semibold">Создать голосование</span>
              </div>
              <p className="text-xs text-muted-foreground">Новый опрос для участников</p>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto py-4" onClick={() => onNavigate('results')}>
            <div className="text-left w-full">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="BarChart3" size={16} />
                <span className="font-semibold">Посмотреть результаты</span>
              </div>
              <p className="text-xs text-muted-foreground">Статистика всех голосований</p>
            </div>
          </Button>
          
          <Button variant="outline" className="justify-start h-auto py-4" onClick={() => onNavigate('archive')}>
            <div className="text-left w-full">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Archive" size={16} />
                <span className="font-semibold">Открыть архив</span>
              </div>
              <p className="text-xs text-muted-foreground">Завершённые голосования</p>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
