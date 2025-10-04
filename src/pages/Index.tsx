import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import LoginForm from '@/components/LoginForm';
import PollCard from '@/components/PollCard';
import CreatePollDialog from '@/components/CreatePollDialog';
import PollResults from '@/components/PollResults';
import AdminPanel from '@/components/AdminPanel';

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
  const [activeTab, setActiveTab] = useState('home');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ totalPolls: 0, totalVotes: 0, totalUsers: 0, activePolls: 0 });
  const [polls, setPolls] = useState<Poll[]>([]);

  const OWNER_EMAIL = 'snovi6423@gmail.com';
  const isOwner = userEmail === OWNER_EMAIL;

  const handleLogin = async (email: string) => {
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

  const handleCreatePoll = async (title: string, description: string, options: string[]) => {
    if (!userId || !isOwner) return;
    try {
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await fetch('https://functions.poehali.dev/234eeed8-4008-4098-8315-0f88761415ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          options,
          user_id: userId,
          end_date: endDate
        })
      });
      
      setIsDialogOpen(false);
      await loadPolls();
    } catch (error) {
      console.error('Create poll error:', error);
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
    return <LoginForm onLogin={handleLogin} />;
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
                <CreatePollDialog 
                  isOpen={isDialogOpen} 
                  onOpenChange={setIsDialogOpen} 
                  onCreate={handleCreatePoll}
                />
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {activePolls.map(poll => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  isOwner={isOwner}
                  votedPolls={votedPolls}
                  onVote={handleVote}
                  onToggleStatus={handleTogglePollStatus}
                  onDelete={handleDeletePoll}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="polls" className="space-y-6">
            <h2 className="text-2xl font-bold">Все голосования</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {activePolls.map(poll => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  isOwner={isOwner}
                  votedPolls={votedPolls}
                  onVote={handleVote}
                  showControls={false}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <PollResults 
              polls={polls} 
              isOwner={isOwner} 
              onExportToExcel={handleExportToExcel}
            />
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
              <AdminPanel
                polls={polls}
                stats={stats}
                onToggleStatus={handleTogglePollStatus}
                onDelete={handleDeletePoll}
                onExportToExcel={() => handleExportToExcel()}
                onNavigate={setActiveTab}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
