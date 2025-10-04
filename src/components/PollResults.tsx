import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

interface PollResultsProps {
  polls: Poll[];
  isOwner: boolean;
  onExportToExcel: (poll?: Poll) => void;
}

export default function PollResults({ polls, isOwner, onExportToExcel }: PollResultsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Результаты голосований</h2>
        {isOwner && polls.length > 0 && (
          <Button onClick={() => onExportToExcel()} className="gap-2">
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
                      onClick={() => onExportToExcel(poll)}
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
    </div>
  );
}
