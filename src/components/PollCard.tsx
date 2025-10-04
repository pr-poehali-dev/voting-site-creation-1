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

interface PollCardProps {
  poll: Poll;
  isOwner: boolean;
  votedPolls: Set<string>;
  onVote: (pollId: string, optionId: string) => void;
  onToggleStatus?: (pollId: string, currentStatus: string) => void;
  onDelete?: (pollId: string) => void;
  showControls?: boolean;
}

export default function PollCard({ 
  poll, 
  isOwner, 
  votedPolls, 
  onVote, 
  onToggleStatus, 
  onDelete,
  showControls = true 
}: PollCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{poll.title}</CardTitle>
            <CardDescription className="mt-2">{poll.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="ml-2">{poll.status === 'active' ? 'Активно' : 'Завершено'}</Badge>
            {isOwner && showControls && (
              <>
                {onToggleStatus && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleStatus(poll.id, poll.status)}
                    title="Завершить голосование"
                  >
                    <Icon name="CheckCircle" size={16} />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(poll.id)}
                    title="Удалить голосование"
                  >
                    <Icon name="Trash2" size={16} />
                  </Button>
                )}
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
            onClick={() => onVote(poll.id, option.id)}
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
  );
}
