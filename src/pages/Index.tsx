import { useState } from 'react';
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

  const OWNER_EMAIL = 'snovi6423@gmail.com';
  const isOwner = userEmail === OWNER_EMAIL;

  const [polls, setPolls] = useState<Poll[]>([
    {
      id: '1',
      title: 'Выбор направления развития платформы',
      description: 'Какую функцию стоит добавить в первую очередь?',
      options: [
        { id: '1', text: 'Аналитика и отчёты', votes: 42 },
        { id: '2', text: 'Мобильное приложение', votes: 38 },
        { id: '3', text: 'API для интеграции', votes: 15 },
        { id: '4', text: 'Расширенная безопасность', votes: 28 }
      ],
      totalVotes: 123,
      status: 'active',
      endDate: '2025-10-15'
    },
    {
      id: '2',
      title: 'Оценка работы команды за квартал',
      description: 'Как вы оцениваете эффективность работы команды?',
      options: [
        { id: '1', text: 'Отлично', votes: 67 },
        { id: '2', text: 'Хорошо', votes: 45 },
        { id: '3', text: 'Удовлетворительно', votes: 12 },
        { id: '4', text: 'Требует улучшения', votes: 5 }
      ],
      totalVotes: 129,
      status: 'completed',
      endDate: '2025-09-30'
    }
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsAuthenticated(true);
      setUserEmail(email);
    }
  };

  const handleVote = (pollId: string, optionId: string) => {
    setPolls(polls.map(poll => {
      if (poll.id === pollId) {
        return {
          ...poll,
          options: poll.options.map(opt => 
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
          ),
          totalVotes: poll.totalVotes + 1
        };
      }
      return poll;
    }));
  };

  const handleCreatePoll = () => {
    if (newPollTitle && newPollOptions.filter(opt => opt.trim()).length >= 2) {
      const newPoll: Poll = {
        id: Date.now().toString(),
        title: newPollTitle,
        description: newPollDescription,
        options: newPollOptions
          .filter(opt => opt.trim())
          .map((text, idx) => ({ id: String(idx + 1), text, votes: 0 })),
        totalVotes: 0,
        status: 'active',
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      setPolls([newPoll, ...polls]);
      setNewPollTitle('');
      setNewPollDescription('');
      setNewPollOptions(['', '']);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2 text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4">
              <Icon name="Vote" className="text-primary-foreground" size={32} />
            </div>
            <CardTitle className="text-3xl font-bold">VOTING PLATFORM</CardTitle>
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
              <h1 className="text-xl font-bold">VOTING PLATFORM</h1>
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
          <TabsList className="grid w-full grid-cols-5 h-12">
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
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Активные голосования</h2>
                <p className="text-muted-foreground mt-1">Примите участие в текущих опросах</p>
              </div>
              {isOwner && (
                <Dialog>
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
                      <Badge className="ml-2">Активно</Badge>
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
            <h2 className="text-2xl font-bold">Результаты голосований</h2>
            <div className="grid gap-6">
              {polls.map(poll => (
                <Card key={poll.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{poll.title}</CardTitle>
                      <Badge variant={poll.status === 'active' ? 'default' : 'secondary'}>
                        {poll.status === 'active' ? 'Активно' : 'Завершено'}
                      </Badge>
                    </div>
                    <CardDescription>Всего голосов: {poll.totalVotes}</CardDescription>
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
        </Tabs>
      </main>
    </div>
  );
}