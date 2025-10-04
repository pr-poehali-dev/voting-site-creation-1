import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Poll {
  id: string;
  title: string;
  description: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  status: 'active' | 'completed';
  endDate: string;
}

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [userEmail, setUserEmail] = useState('');
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollDescription, setNewPollDescription] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [userId, setUserId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ totalPolls: 0, totalVotes: 0, totalUsers: 0, activePolls: 0 });

  const OWNER_EMAIL = 'snovi6423@gmail.com';
  const isOwner = userEmail === OWNER_EMAIL;

  const [polls, setPolls] = useState<Poll[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      try {
        const response = await fetch('https://functions.poehali.dev/6483391f-16e3-4131-b805-2b0113ea7a06', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        setUserId(data.user_id);
        setIsAuthenticated(true);
        setUserEmail(email);
      } catch (error) {
        console.error('Login error:', error);
      }
    }
  };

  const loadPolls = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/234eeed8-4008-4098-8315-0f88761415ad');
      const data = await response.json();
      setPolls(data.polls || []);
      
      if (data.polls) {
        const totalVotes = data.polls.reduce((sum: number, p: Poll) => sum + p.totalVotes, 0);
        const activeCount = data.polls.filter((p: Poll) => p.status === 'active').length;
        setStats({
          totalPolls: data.polls.length,
          totalVotes,
          totalUsers: 0,
          activePolls: activeCount
        });
      }
    } catch (error) {
      console.error('Load polls error:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPolls();
    }
  }, [isAuthenticated]);

  const handleVote = async (pollId: string, optionId: string) => {
    if (!userId || votedPolls.has(pollId)) return;
    
    try {
      const response = await fetch('https://functions.poehali.dev/234eeed8-4008-4098-8315-0f88761415ad', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, poll_id: pollId, option_id: optionId })
      });
      
      if (response.ok) {
        setVotedPolls(prev => new Set(prev).add(pollId));
        await loadPolls();
      } else {
        const error = await response.json();
        if (error.error === 'Already voted') {
          setVotedPolls(prev => new Set(prev).add(pollId));
        }
      }
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  const handleCreatePoll = async () => {
    if (!userId || !isOwner) return;
    if (newPollTitle && newPollOptions.filter(opt => opt.trim()).length >= 2) {
      try {
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        await fetch('https://functions.poehali.dev/234eeed8-4008-4098-8315-0f88761415ad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newPollTitle,
            description: newPollDescription,
            options: newPollOptions.filter(opt => opt.trim()),
            user_id: userId,
            end_date: endDate
          })
        });
        
        setNewPollTitle('');
        setNewPollDescription('');
        setNewPollOptions(['', '']);
        setIsDialogOpen(false);
        await loadPolls();
      } catch (error) {
        console.error('Create poll error:', error);
      }
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!isOwner) return;
    if (confirm('Вы уверены, что хотите удалить это голосование?')) {
      try {
        await fetch('https://functions.poehali.dev/234eeed8-4008-4098-8315-0f88761415ad', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ poll_id: pollId })
        });
        await loadPolls();
      } catch (error) {
        console.error('Delete poll error:', error);
      }
    }
  };

  const handleTogglePollStatus = async (pollId: string, currentStatus: string) => {
    if (!isOwner) return;
    const newStatus = currentStatus === 'active' ? 'completed' : 'active';
    try {
      await fetch('https://functions.poehali.dev/234eeed8-4008-4098-8315-0f88761415ad', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: pollId, status: newStatus })
      });
      await loadPolls();
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  const handleExportToExcel = (poll?: Poll) => {
    const pollsToExport = poll ? [poll] : polls;
    
    const data = pollsToExport.flatMap(p => 
      p.options.map(opt => ({
        'Голосование': p.title,
        'Описание': p.description,
        'Статус': p.status === 'active' ? 'Активно' : 'Завершено',
        'Дата окончания': new Date(p.endDate).toLocaleDateString('ru-RU'),
        'Вариант ответа': opt.text,
        'Количество голосов': opt.votes,
        'Процент': p.totalVotes > 0 ? `${((opt.votes / p.totalVotes) * 100).toFixed(1)}%` : '0%'
      }))
    );
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Результаты');
    
    const fileName = poll 
      ? `${poll.title.replace(/[^a-zа-яё0-9]/gi, '_')}_${new Date().toLocaleDateString('ru-RU')}.xlsx`
      : `Все_голосования_${new Date().toLocaleDateString('ru-RU')}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2 text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4">
              <Icon name="Vote" className="text-primary-foreground" size={32} />
            </div>
            <CardTitle className="text-3xl font-bold">ГОЛОСОВАНИЕ.РУ</CardTitle>
            <CardDescription className="text-base">
              Платформа для серьёзных голосований
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11 font-semibold">
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activePolls = polls.filter(p => p.status === 'active');
  const completedPolls = polls.filter(p => p.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Vote" className="text-primary-foreground" size={20} />
              </div>
              <h1 className="text-xl font-bold">ГОЛОСОВАНИЕ.РУ</h1>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-2">
                <Icon name="User" size={14} />
                {userEmail}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setIsAuthenticated(false)}>
                <Icon name="LogOut" size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full h-12 ${isOwner ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="home" className="gap-2">
              <Icon name="Home" size={16} />
              <span className="hidden sm:inline">Главная</span>
            </TabsTrigger>
            <TabsTrigger value="polls" className="gap-2">
              <Icon name="Vote" size={16} />
              <span className="hidden sm:inline">Голосования</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <Icon name="BarChart3" size={16} />
              <span className="hidden sm:inline">Результаты</span>
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-2">
              <Icon name="Archive" size={16} />
              <span className="hidden sm:inline">Архив</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <Icon name="UserCircle" size={16} />
              <span className="hidden sm:inline">Профиль</span>
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="admin" className="gap-2">
                <Icon name="Settings" size={16} />
                <span className="hidden sm:inline">Админ</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Активные голосования</h2>
                <p className="text-muted-foreground mt-1">Примите участие в текущих опросах</p>
              </div>
              {isOwner && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Icon name="Plus" size={16} />
                      Создать голосование
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Новое голосование</DialogTitle>
                      <DialogDescription>
                        Создайте новое голосование для участников платформы
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Название голосования</Label>
                        <Input
                          value={newPollTitle}
                          onChange={(e) => setNewPollTitle(e.target.value)}
                          placeholder="Введите название"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Описание</Label>
                        <Textarea
                          value={newPollDescription}
                          onChange={(e) => setNewPollDescription(e.target.value)}
                          placeholder="Опишите цель голосования"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Варианты ответов</Label>
                        {newPollOptions.map((option, idx) => (
                          <Input
                            key={idx}
                            value={option}
                            onChange={(e) => {
                              const updated = [...newPollOptions];
                              updated[idx] = e.target.value;
                              setNewPollOptions(updated);
                            }}
                            placeholder={`Вариант ${idx + 1}`}
                          />
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNewPollOptions([...newPollOptions, ''])}
                          className="gap-2"
                        >
                          <Icon name="Plus" size={14} />
                          Добавить вариант
                        </Button>
                      </div>
                      <Button onClick={handleCreatePoll} className="w-full">
                        Создать голосование
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {activePolls.map(poll => (
                <Card key={poll.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{poll.title}</CardTitle>
                        <CardDescription className="mt-2">{poll.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="ml-2">Активно</Badge>
                        {isOwner && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTogglePollStatus(poll.id, poll.status)}
                              title="Завершить голосование"
                            >
                              <Icon name="CheckCircle" size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePoll(poll.id)}
                              title="Удалить голосование"
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                      <span className="flex items-center gap-1">
                        <Icon name="Users" size={14} />
                        {poll.totalVotes} голосов
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Calendar" size={14} />
                        до {new Date(poll.endDate).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {poll.options.map(option => (
                      <Button
                        key={option.id}
                        variant="outline"
                        className="w-full justify-start h-auto py-3 px-4 hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleVote(poll.id, option.id)}
                        disabled={votedPolls.has(poll.id) || poll.status === 'completed'}
                      >
                        <div className="w-full text-left">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{option.text}</span>
                            <span className="text-sm">{option.votes} голосов</span>
                          </div>
                          <Progress 
                            value={poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0} 
                            className="h-2"
                          />
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="polls" className="space-y-6">
            <h2 className="text-2xl font-bold">Все голосования</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {polls.filter(p => p.status === 'active').map(poll => (
                <Card key={poll.id}>
                  <CardHeader>
                    <CardTitle>{poll.title}</CardTitle>
                    <CardDescription>{poll.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {poll.options.map(option => (
                      <Button
                        key={option.id}
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => handleVote(poll.id, option.id)}
                      >
                        {option.text}
                        <Badge variant="secondary">{option.votes}</Badge>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Результаты голосований</h2>
              {isOwner && polls.length > 0 && (
                <Button onClick={() => handleExportToExcel()} className="gap-2">
                  <Icon name="Download" size={16} />
                  Экспорт в Excel
                </Button>
              )}
            </div>
            <div className="grid gap-6">
              {polls.map(poll => (
                <Card key={poll.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle>{poll.title}</CardTitle>
                        <CardDescription className="mt-2">Всего голосов: {poll.totalVotes}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={poll.status === 'active' ? 'default' : 'secondary'}>
                          {poll.status === 'active' ? 'Активно' : 'Завершено'}
                        </Badge>
                        {isOwner && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportToExcel(poll)}
                            className="gap-1"
                          >
                            <Icon name="Download" size={14} />
                            Excel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {poll.options.map(option => {
                      const percentage = poll.totalVotes > 0 
                        ? ((option.votes / poll.totalVotes) * 100).toFixed(1) 
                        : '0';
                      return (
                        <div key={option.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{option.text}</span>
                            <span className="text-muted-foreground">
                              {option.votes} ({percentage}%)
                            </span>
                          </div>
                          <Progress value={parseFloat(percentage)} className="h-3" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="archive" className="space-y-6">
            <h2 className="text-2xl font-bold">Архив голосований</h2>
            <div className="grid gap-6">
              {completedPolls.map(poll => (
                <Card key={poll.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Archive" size={20} />
                      {poll.title}
                    </CardTitle>
                    <CardDescription>
                      Завершено {new Date(poll.endDate).toLocaleDateString('ru-RU')} • {poll.totalVotes} голосов
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {poll.options.map(option => {
                      const percentage = poll.totalVotes > 0 
                        ? ((option.votes / poll.totalVotes) * 100).toFixed(1) 
                        : '0';
                      return (
                        <div key={option.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span>{option.text}</span>
                            <Badge variant="outline">{percentage}%</Badge>
                          </div>
                          <Progress value={parseFloat(percentage)} />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Профиль пользователя</CardTitle>
                <CardDescription>Информация о вашем аккаунте</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                    <Icon name="User" className="text-primary-foreground" size={36} />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{userEmail}</p>
                    {isOwner && (
                      <Badge className="mt-2 gap-1">
                        <Icon name="Shield" size={12} />
                        Владелец
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Участие в голосованиях</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Дата регистрации</span>
                    <span className="font-semibold">{new Date().toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isOwner && (
            <TabsContent value="admin" className="space-y-6">
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
                        <Button onClick={() => handleExportToExcel()} variant="outline" className="gap-2">
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
                              onClick={() => handleTogglePollStatus(poll.id, poll.status)}
                            >
                              <Icon name={poll.status === 'active' ? 'Pause' : 'Play'} size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveTab('results');
                              }}
                            >
                              <Icon name="BarChart3" size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePoll(poll.id)}
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
                          <Button className="mt-4 gap-2" onClick={() => setActiveTab('home')}>
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
                    <Button variant="outline" className="justify-start h-auto py-4" onClick={() => setActiveTab('home')}>
                      <div className="text-left w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon name="Plus" size={16} />
                          <span className="font-semibold">Создать голосование</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Новый опрос для участников</p>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="justify-start h-auto py-4" onClick={() => setActiveTab('results')}>
                      <div className="text-left w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon name="BarChart3" size={16} />
                          <span className="font-semibold">Посмотреть результаты</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Статистика всех голосований</p>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="justify-start h-auto py-4" onClick={() => setActiveTab('archive')}>
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
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}